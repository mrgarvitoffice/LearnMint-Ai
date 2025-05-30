"use client";

import { useState, useEffect } from 'react';
import { useForm, Controller, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { generateQuiz, type GenerateQuizOutput } from '@/ai/flows/generate-quiz'; // Reusing quiz generator for now
import type { TestSettings, TestQuestion, TestResult } from '@/lib/types';
import { Loader2, TestTubeDiagonal, CheckCircle, XCircle, RotateCcw, Clock } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

const formSchema = z.object({
  sourceType: z.enum(['topic', 'notes']).default('topic'),
  topics: z.string().min(3, 'Topic(s) must be at least 3 characters.').optional(),
  notes: z.string().min(50, 'Notes must be at least 50 characters.').optional(),
  difficulty: z.enum(['easy', 'medium', 'hard']).default('medium'),
  numQuestions: z.coerce.number().min(1, 'Min 1 question').max(20, 'Max 20 questions').default(5),
  timer: z.coerce.number().min(0, 'Timer cannot be negative').default(0), // 0 for no timer
}).superRefine((data, ctx) => {
  if (data.sourceType === 'topic' && !data.topics) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Topics are required when source type is 'topic'.",
      path: ['topics'],
    });
  }
  if (data.sourceType === 'notes' && !data.notes) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Notes are required when source type is 'notes'.",
      path: ['notes'],
    });
  }
});

type FormData = z.infer<typeof formSchema>;

interface CustomTestState {
  settings: TestSettings;
  questions: TestQuestion[];
  userAnswers: (string | undefined)[];
  currentQuestionIndex: number;
  showResults: boolean;
  score: number;
  timeLeft?: number; // in seconds
  timerId?: NodeJS.Timeout;
}

export default function CustomTestPage() {
  const [testState, setTestState] = useState<CustomTestState | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const { register, handleSubmit, control, watch, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(formSchema),
  });

  const sourceType = watch('sourceType');

  useEffect(() => {
    if (testState?.timerId && testState.timeLeft === 0) {
      clearInterval(testState.timerId);
      handleSubmitTest(true); // Force submit if time runs out
      toast({ title: "Time's Up!", description: "Your test has been submitted automatically.", variant: "default" });
    }
    return () => {
      if (testState?.timerId) clearInterval(testState.timerId);
    };
  }, [testState]);

  const startTimer = (durationMinutes: number) => {
    if (durationMinutes <= 0) return;
    setTestState(prev => prev ? {...prev, timeLeft: durationMinutes * 60} : null);
    const timerId = setInterval(() => {
      setTestState(prev => {
        if (prev && prev.timeLeft && prev.timeLeft > 0) {
          return {...prev, timeLeft: prev.timeLeft - 1};
        }
        if (prev && prev.timerId) clearInterval(prev.timerId);
        return prev;
      });
    }, 1000);
    setTestState(prev => prev ? {...prev, timerId} : null);
  };

  const onSubmit: SubmitHandler<FormData> = async (data) => {
    setIsLoading(true);
    setTestState(null);
    try {
      let topicForAI = data.topics || "general knowledge";
      if (data.sourceType === 'notes' && data.notes) {
        // For now, we use a simplified approach. Ideally, a different AI flow would process notes.
        // We'll use the first few words of notes as a "topic" for the existing quiz generator.
        topicForAI = data.notes.split(' ').slice(0, 5).join(' ') + ` (based on provided notes, difficulty: ${data.difficulty})`;
      } else if (data.topics) {
        topicForAI = `${data.topics} (difficulty: ${data.difficulty})`;
      }
      
      const result: GenerateQuizOutput = await generateQuiz({ topic: topicForAI, numQuestions: data.numQuestions });
      
      if (result.quiz && result.quiz.length > 0) {
        const testSettings: TestSettings = {
          topics: data.topics ? data.topics.split(',').map(t => t.trim()) : [],
          notes: data.notes,
          difficulty: data.difficulty,
          numQuestions: result.quiz.length, // Use actual number of questions returned
          timer: data.timer,
        };
        setTestState({
          settings: testSettings,
          questions: result.quiz.map(q => ({ ...q, userAnswer: undefined, isCorrect: undefined })),
          userAnswers: Array(result.quiz.length).fill(undefined),
          currentQuestionIndex: 0,
          showResults: false,
          score: 0,
        });
        if (data.timer && data.timer > 0) {
          startTimer(data.timer);
        }
        toast({ title: 'Test Generated!', description: 'Your custom test is ready.' });
      } else {
        toast({ title: 'No Test Data', description: 'The AI returned no questions.', variant: 'destructive' });
      }
    } catch (error) {
      console.error('Error generating test:', error);
      toast({ title: 'Error', description: 'Failed to generate test. Please try again.', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleAnswerSelect = (answer: string) => {
    if (!testState || testState.showResults) return;
    const newUserAnswers = [...testState.userAnswers];
    newUserAnswers[testState.currentQuestionIndex] = answer;
    setTestState({ ...testState, userAnswers: newUserAnswers });
  };

  const handleNextQuestion = () => {
    if (!testState || testState.currentQuestionIndex >= testState.questions.length - 1) return;
    setTestState({ ...testState, currentQuestionIndex: testState.currentQuestionIndex + 1 });
  };

  const handlePrevQuestion = () => {
    if (!testState || testState.currentQuestionIndex <= 0) return;
    setTestState({ ...testState, currentQuestionIndex: testState.currentQuestionIndex - 1 });
  };

  const handleSubmitTest = (autoSubmitted = false) => {
    if (!testState) return;
    if (testState.timerId) clearInterval(testState.timerId);

    let score = 0;
    const updatedQuestions = testState.questions.map((q, index) => {
      const userAnswer = testState.userAnswers[index];
      const isCorrect = userAnswer === q.answer;
      if (isCorrect) {
        score += 4;
      } else if (userAnswer !== undefined) { // Incorrect and answered
        score -= 1;
      }
      return { ...q, userAnswer, isCorrect };
    });
    setTestState({ ...testState, questions: updatedQuestions, score, showResults: true, timerId: undefined });
    if(!autoSubmitted) toast({ title: "Test Submitted!", description: `Your score is ${score}.`});
  };
  
  const handleRetakeTest = () => {
     if (!testState) return;
     setTestState(prev => {
       if (!prev) return null;
       const newState = {
        ...prev,
        questions: prev.questions.map(q => ({...q, userAnswer: undefined, isCorrect: undefined })),
        userAnswers: Array(prev.questions.length).fill(undefined),
        currentQuestionIndex: 0,
        showResults: false,
        score: 0,
        timeLeft: prev.settings.timer ? prev.settings.timer * 60 : undefined,
        timerId: undefined,
       };
       if (newState.settings.timer && newState.settings.timer > 0) {
         startTimer(newState.settings.timer);
       }
       return newState;
     });
  }
  
  const handleNewTest = () => {
    if (testState?.timerId) clearInterval(testState.timerId);
    setTestState(null);
  }

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const currentQuestionData = testState?.questions[testState.currentQuestionIndex];

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="w-12 h-12 animate-spin text-primary" />
        <p className="ml-4 text-lg">Generating your custom test...</p>
      </div>
    );
  }

  if (!testState) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-2xl">
            <TestTubeDiagonal className="w-7 h-7 text-primary" />
            Custom Test Creator
          </CardTitle>
          <CardDescription>Configure your test parameters and generate a custom assessment.</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit(onSubmit)}>
          <CardContent className="space-y-6">
            <div>
              <Label>Test Source</Label>
              <Controller
                name="sourceType"
                control={control}
                render={({ field }) => (
                  <RadioGroup onValueChange={field.onChange} defaultValue={field.value} className="flex gap-4 mt-2">
                    <Label htmlFor="sourceTopic" className="flex items-center gap-2 border p-3 rounded-md has-[:checked]:bg-primary/10 has-[:checked]:border-primary cursor-pointer">
                      <RadioGroupItem value="topic" id="sourceTopic" /> Topic(s)
                    </Label>
                    <Label htmlFor="sourceNotes" className="flex items-center gap-2 border p-3 rounded-md has-[:checked]:bg-primary/10 has-[:checked]:border-primary cursor-pointer">
                      <RadioGroupItem value="notes" id="sourceNotes" /> My Notes
                    </Label>
                  </RadioGroup>
                )}
              />
            </div>

            {sourceType === 'topic' && (
              <div className="space-y-2">
                <Label htmlFor="topics">Topic(s)</Label>
                <Input id="topics" placeholder="e.g., Calculus, World History (comma-separated for multiple)" {...register('topics')} />
                {errors.topics && <p className="text-sm text-destructive">{errors.topics.message}</p>}
              </div>
            )}
            {sourceType === 'notes' && (
              <div className="space-y-2">
                <Label htmlFor="notes">Your Notes</Label>
                <Textarea id="notes" placeholder="Paste your study notes here..." {...register('notes')} rows={6} />
                {errors.notes && <p className="text-sm text-destructive">{errors.notes.message}</p>}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="difficulty">Difficulty</Label>
                <Controller
                  name="difficulty"
                  control={control}
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <SelectTrigger id="difficulty"><SelectValue placeholder="Select difficulty" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="easy">Easy</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="hard">Hard</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="numQuestions">Number of Questions (1-20)</Label>
                <Input id="numQuestions" type="number" {...register('numQuestions')} />
                {errors.numQuestions && <p className="text-sm text-destructive">{errors.numQuestions.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="timer">Timer (minutes, 0 for none)</Label>
                <Input id="timer" type="number" {...register('timer')} />
                {errors.timer && <p className="text-sm text-destructive">{errors.timer.message}</p>}
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit">Generate Test</Button>
          </CardFooter>
        </form>
      </Card>
    );
  }
  
  if (!testState.showResults && currentQuestionData) {
     return (
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Custom Test: Question {testState.currentQuestionIndex + 1} of {testState.questions.length}</CardTitle>
              {testState.settings.timer && testState.settings.timer > 0 && typeof testState.timeLeft === 'number' && (
                <div className="flex items-center gap-2 text-lg font-medium text-primary">
                  <Clock className="w-5 h-5" />
                  <span>{formatTime(testState.timeLeft)}</span>
                </div>
              )}
            </div>
            <Progress value={((testState.currentQuestionIndex + 1) / testState.questions.length) * 100} className="w-full mt-2" />
          </CardHeader>
          <CardContent className="space-y-6">
            <p className="text-lg font-semibold">{currentQuestionData.question}</p>
             <RadioGroup
                onValueChange={(value) => handleAnswerSelect(value)}
                value={testState.userAnswers[testState.currentQuestionIndex]}
                className="space-y-2"
              >
                {currentQuestionData.options.map((option, i) => (
                  <Label key={i} htmlFor={`option-${i}`} className="flex items-center space-x-2 p-3 border rounded-md hover:bg-muted has-[:checked]:bg-primary/20 has-[:checked]:border-primary cursor-pointer">
                    <RadioGroupItem value={option} id={`option-${i}`} />
                    <span>{option}</span>
                  </Label>
                ))}
              </RadioGroup>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button variant="outline" onClick={handlePrevQuestion} disabled={testState.currentQuestionIndex === 0}>Previous</Button>
            {testState.currentQuestionIndex < testState.questions.length - 1 ? (
              <Button onClick={handleNextQuestion}>Next</Button>
            ) : (
              <Button onClick={() => handleSubmitTest(false)} variant="default">Submit Test</Button>
            )}
          </CardFooter>
        </Card>
     );
  }

  if (testState.showResults) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Test Results</CardTitle>
          <CardDescription>
            You scored {testState.score} out of {testState.questions.length * 4} (Correct: +4, Incorrect: -1).
            {testState.settings.timer && testState.settings.timer > 0 && testState.timeLeft !== undefined && (
                <span> Time taken: {formatTime(testState.settings.timer * 60 - testState.timeLeft)}.</span>
            )}
          </CardDescription>
          <Progress value={(testState.score / (testState.questions.length * 4)) * 100} className="w-full mt-2" />
        </CardHeader>
        <CardContent className="space-y-4">
          {testState.questions.map((q, index) => (
            <Card key={index} className={q.isCorrect ? 'border-green-500 bg-green-500/10' : 'border-destructive bg-destructive/10'}>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                   {q.isCorrect ? <CheckCircle className="w-5 h-5 text-green-600" /> : <XCircle className="w-5 h-5 text-destructive" />}
                  Question {index + 1}: {q.question}
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm">
                <p>Your answer: <span className="font-medium">{q.userAnswer || 'Not answered'}</span></p>
                <p>Correct answer: <span className="font-medium">{q.answer}</span></p>
              </CardContent>
            </Card>
          ))}
        </CardContent>
        <CardFooter className="flex gap-2">
            <Button onClick={handleRetakeTest}><RotateCcw className="w-4 h-4 mr-2"/>Retake Test</Button>
            <Button variant="outline" onClick={handleNewTest}>Create New Test</Button>
        </CardFooter>
      </Card>
    );
  }

  return (
    <Alert variant="destructive">
      <AlertTitle>Test Error</AlertTitle>
      <AlertDescription>Something went wrong. Please try generating a new test.</AlertDescription>
    </Alert>
  );
}
