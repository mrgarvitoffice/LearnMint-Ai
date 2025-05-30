
"use client";

import { useState, useEffect, useCallback, useRef } from 'react';
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
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { generateQuiz, type GenerateQuizOutput } from '@/ai/flows/generate-quiz';
import type { TestSettings, TestQuestion } from '@/lib/types';
import { Loader2, TestTubeDiagonal, CheckCircle, XCircle, RotateCcw, Clock, Lightbulb, AlertTriangle, Mic, FileText, BookOpen } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import ReactMarkdown from 'react-markdown';
import { cn } from '@/lib/utils';
import { useSound } from '@/hooks/useSound';
import { useTTS } from '@/hooks/useTTS';
import { useVoiceRecognition } from '@/hooks/useVoiceRecognition';

const MAX_RECENT_TOPICS_DISPLAY = 10;
const MAX_RECENT_TOPICS_SELECT = 3;

const formSchema = z.object({
  sourceType: z.enum(['topic', 'notes', 'recent']).default('topic'),
  topics: z.string().optional(),
  notes: z.string().optional(),
  selectedRecentTopics: z.array(z.string()).optional(),
  difficulty: z.enum(['easy', 'medium', 'hard']).default('medium'),
  numQuestions: z.coerce.number().min(1, 'Min 1 question').max(20, 'Max 20 questions').default(5),
  timer: z.coerce.number().min(0, 'Timer cannot be negative').default(0), // 0 for no timer
}).superRefine((data, ctx) => {
  if (data.sourceType === 'topic' && (!data.topics || data.topics.trim().length < 3)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Topic(s) must be at least 3 characters.",
      path: ['topics'],
    });
  }
  if (data.sourceType === 'notes' && (!data.notes || data.notes.trim().length < 50)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Notes must be at least 50 characters.",
      path: ['notes'],
    });
  }
  if (data.sourceType === 'recent' && (!data.selectedRecentTopics || data.selectedRecentTopics.length === 0)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Please select at least one recent topic.",
      path: ['selectedRecentTopics'],
    });
  }
  if (data.sourceType === 'recent' && data.selectedRecentTopics && data.selectedRecentTopics.length > MAX_RECENT_TOPICS_SELECT) {
    ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `You can select a maximum of ${MAX_RECENT_TOPICS_SELECT} recent topics.`,
        path: ['selectedRecentTopics'],
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
  isAutoSubmitting?: boolean;
}

export default function CustomTestPage() {
  const [testState, setTestState] = useState<CustomTestState | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [recentTopics, setRecentTopics] = useState<string[]>([]);
  const { toast } = useToast();
  const { playSound: playCorrectSound } = useSound('correct'); 
  const { playSound: playIncorrectSound } = useSound('incorrect'); 
  const { playSound: playClickSound } = useSound('/sounds/ting.mp3', 0.3);
  const { speak, isSpeaking: isTTSSpeaking, supportedVoices, setVoicePreference, selectedVoice } = useTTS();
  const voicePreferenceWasSetRef = useRef(false);

  const { isListening, transcript, startListening, stopListening, browserSupportsSpeechRecognition, error: voiceError } = useVoiceRecognition();


  const { register, handleSubmit, control, watch, setValue, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      sourceType: 'topic',
      difficulty: 'medium',
      numQuestions: 5,
      timer: 0,
      selectedRecentTopics: [],
    }
  });

  const sourceType = watch('sourceType');
  const selectedRecentTopics = watch('selectedRecentTopics');

  useEffect(() => {
    if (supportedVoices.length > 0 && !voicePreferenceWasSetRef.current) {
      setVoicePreference('female'); // Default to female for announcements
      voicePreferenceWasSetRef.current = true;
    }
  }, [supportedVoices, setVoicePreference]);
  
  useEffect(() => {
    if (transcript) {
      setValue('topics', transcript);
    }
  }, [transcript, setValue]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedTopics = localStorage.getItem('learnmint-recent-topics');
      if (storedTopics) {
        try {
            setRecentTopics(JSON.parse(storedTopics).slice(0, MAX_RECENT_TOPICS_DISPLAY));
        } catch (e) {
            console.error("Failed to parse recent topics from localStorage", e);
            localStorage.removeItem('learnmint-recent-topics');
        }
      }
    }
  }, []);

  useEffect(() => {
    let currentTimerId: NodeJS.Timeout | undefined;
    if (testState?.timerId) {
      currentTimerId = testState.timerId;
    }
    if (testState?.timeLeft === 0 && !testState.isAutoSubmitting && !testState.showResults) {
      setTestState(prev => prev ? { ...prev, isAutoSubmitting: true } : null);
      toast({ title: "Time's Up!", description: "Your test is being submitted automatically.", variant: "default" });
      handleSubmitTest(true); 
    }
    return () => {
      if (currentTimerId) clearInterval(currentTimerId);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [testState?.timeLeft, testState?.isAutoSubmitting, testState?.showResults, testState?.timerId]);


  const startTimer = (durationMinutes: number) => {
    if (durationMinutes <= 0) return;
    
    setTestState(prev => {
      if (!prev) return null;
      if (prev.timerId) clearInterval(prev.timerId);

      const newTimerId = setInterval(() => {
        setTestState(currentTestState => {
          if (currentTestState && currentTestState.timeLeft && currentTestState.timeLeft > 0 && !currentTestState.showResults && !currentTestState.isAutoSubmitting) {
            return {...currentTestState, timeLeft: currentTestState.timeLeft - 1};
          }
          if (currentTestState?.timerId && (currentTestState.timeLeft === 0 || currentTestState.showResults || currentTestState.isAutoSubmitting)) {
             clearInterval(currentTestState.timerId);
             return {...currentTestState, timerId: undefined}; 
          }
          return currentTestState;
        });
      }, 1000);
      return {...prev, timeLeft: durationMinutes * 60, timerId: newTimerId, isAutoSubmitting: false };
    });
  };

  const onSubmit: SubmitHandler<FormData> = async (data) => {
    playClickSound();
    setIsLoading(true);
    setTestState(null); 
    if (selectedVoice && !isTTSSpeaking) {
        speak("Creating custom test. Please wait.");
    }

    try {
      let topicForAI = "general knowledge";
      let sourceTopicsForSettings: string[] = [];
      let notesForSettings: string | undefined = undefined;
      let selectedRecentTopicsForSettings: string[] | undefined = undefined;


      if (data.sourceType === 'topic' && data.topics) {
        topicForAI = `${data.topics} (difficulty: ${data.difficulty})`;
        sourceTopicsForSettings = data.topics.split(',').map(t => t.trim());
         // Add to recent topics if not already there and is a valid topic
        if (data.topics.trim().length >= 3) {
            const newTopic = data.topics.trim();
            setRecentTopics(prev => {
                const updated = [newTopic, ...prev.filter(t => t !== newTopic)].slice(0, MAX_RECENT_TOPICS_DISPLAY);
                if (typeof window !== 'undefined') {
                    localStorage.setItem('learnmint-recent-topics', JSON.stringify(updated));
                }
                return updated;
            });
        }
      } else if (data.sourceType === 'notes' && data.notes) {
        // For AI, pass first N words + indicator + difficulty. For settings, store all notes.
        topicForAI = data.notes.split(' ').slice(0, 15).join(' ') + `... (based on provided notes, difficulty: ${data.difficulty})`;
        sourceTopicsForSettings = ["Custom Notes Provided"];
        notesForSettings = data.notes;
      } else if (data.sourceType === 'recent' && data.selectedRecentTopics && data.selectedRecentTopics.length > 0) {
        topicForAI = `${data.selectedRecentTopics.join(', ')} (difficulty: ${data.difficulty})`;
        sourceTopicsForSettings = data.selectedRecentTopics;
        selectedRecentTopicsForSettings = data.selectedRecentTopics;
      }
      
      const result: GenerateQuizOutput = await generateQuiz({ topic: topicForAI, numQuestions: data.numQuestions });
      
      if (result.quiz && result.quiz.length > 0) {
        const testSettings: TestSettings = {
          topics: sourceTopicsForSettings,
          notes: notesForSettings,
          sourceType: data.sourceType,
          selectedRecentTopics: selectedRecentTopicsForSettings,
          difficulty: data.difficulty,
          numQuestions: result.quiz.length,
          timer: data.timer,
        };
        setTestState({
          settings: testSettings,
          questions: result.quiz.map(q => ({ ...q, userAnswer: undefined, isCorrect: undefined, explanation: q.explanation || "No explanation provided." })),
          userAnswers: Array(result.quiz.length).fill(undefined),
          currentQuestionIndex: 0,
          showResults: false,
          score: 0,
          timeLeft: data.timer && data.timer > 0 ? data.timer * 60 : undefined,
          timerId: undefined,
          isAutoSubmitting: false,
        });
        if (data.timer && data.timer > 0) {
          startTimer(data.timer);
        }
        toast({ title: 'Test Generated!', description: 'Your custom test is ready.' });
      } else {
        toast({ title: 'No Test Data', description: 'The AI returned no questions. Try a different topic or reduce complexity.', variant: 'destructive' });
      }
    } catch (error) {
      console.error('Error generating test:', error);
      toast({ title: 'Error', description: 'Failed to generate test. Please try again.', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleAnswerSelect = (answer: string) => {
    playClickSound();
    if (!testState || testState.showResults || testState.isAutoSubmitting) return;
    const newUserAnswers = [...testState.userAnswers];
    newUserAnswers[testState.currentQuestionIndex] = answer;
    setTestState({ ...testState, userAnswers: newUserAnswers });
  };

  const handleNextQuestion = () => {
    playClickSound();
    if (!testState || testState.currentQuestionIndex >= testState.questions.length - 1 || testState.isAutoSubmitting) return;
    setTestState({ ...testState, currentQuestionIndex: testState.currentQuestionIndex + 1 });
  };

  const handlePrevQuestion = () => {
    playClickSound();
    if (!testState || testState.currentQuestionIndex <= 0 || testState.isAutoSubmitting) return;
    setTestState({ ...testState, currentQuestionIndex: testState.currentQuestionIndex - 1 });
  };

  const handleSubmitTest = useCallback((autoSubmitted = false) => {
    playClickSound();
    setTestState(prevTestState => {
      if (!prevTestState || prevTestState.showResults) return prevTestState;
      if (prevTestState.timerId) {
        clearInterval(prevTestState.timerId);
      }

      let score = 0;
      const updatedQuestions = prevTestState.questions.map((q, index) => {
        const userAnswer = prevTestState.userAnswers[index];
        const isCorrect = userAnswer === q.answer;
        if (isCorrect) {
          score += 4;
          playCorrectSound();
        } else if (userAnswer !== undefined) { 
          score -= 1;
          playIncorrectSound();
        }
        return { ...q, userAnswer, isCorrect };
      });
      
      const resultMessage = `Your score is ${score}. Review your answers below.`;
      if (!autoSubmitted || (autoSubmitted && !prevTestState.showResults)) {
         toast({ title: autoSubmitted ? "Test Auto-Submitted!" : "Test Submitted!", description: resultMessage});
         if (selectedVoice && !isTTSSpeaking) {
           speak(autoSubmitted ? "Test auto-submitted! Please review your answers." : "Test submitted! Please review your answers.");
         }
      }
      
      return { 
        ...prevTestState, 
        questions: updatedQuestions, 
        score, 
        showResults: true, 
        timerId: undefined, 
        isAutoSubmitting: autoSubmitted,
        timeLeft: autoSubmitted ? 0 : prevTestState.timeLeft 
      };
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [toast, playCorrectSound, playIncorrectSound, playClickSound, speak, selectedVoice, isTTSSpeaking]); 
  
  const handleRetakeTest = () => {
     playClickSound();
     if (!testState) return;
     setIsLoading(true); 
     onSubmit({ 
        sourceType: testState.settings.sourceType || 'topic',
        topics: testState.settings.sourceType === 'topic' ? testState.settings.topics.join(',') : undefined,
        notes: testState.settings.sourceType === 'notes' ? testState.settings.notes : undefined,
        selectedRecentTopics: testState.settings.sourceType === 'recent' ? testState.settings.selectedRecentTopics : undefined,
        difficulty: testState.settings.difficulty,
        numQuestions: testState.settings.numQuestions,
        timer: testState.settings.timer || 0,
     }).finally(() => setIsLoading(false));
  }
  
  const handleNewTest = () => {
    playClickSound();
    if (testState?.timerId) clearInterval(testState.timerId);
    setTestState(null);
    setValue('topics', '');
    setValue('notes', '');
    setValue('selectedRecentTopics', []);
    setValue('sourceType', 'topic');
  }

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleMicClick = () => {
    playClickSound();
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };


  const currentQuestionData = testState?.questions[testState.currentQuestionIndex];

  if (isLoading && !testState) { 
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
                  <RadioGroup onValueChange={(value) => { playClickSound(); field.onChange(value); setValue('topics', ''); setValue('notes', ''); setValue('selectedRecentTopics', []); }} defaultValue={field.value} className="flex flex-wrap gap-2 md:gap-4 mt-2">
                    <Label htmlFor="sourceTopicChoice" className="flex items-center gap-2 border p-3 rounded-md has-[:checked]:bg-primary/10 has-[:checked]:border-primary cursor-pointer text-sm md:text-base">
                      <RadioGroupItem value="topic" id="sourceTopicChoice" /> <FileText className="w-4 h-4 mr-1"/> Topic(s)
                    </Label>
                    <Label htmlFor="sourceNotesChoice" className="flex items-center gap-2 border p-3 rounded-md has-[:checked]:bg-primary/10 has-[:checked]:border-primary cursor-pointer text-sm md:text-base">
                      <RadioGroupItem value="notes" id="sourceNotesChoice" /> <BookOpen className="w-4 h-4 mr-1"/> My Notes
                    </Label>
                    {recentTopics.length > 0 && (
                        <Label htmlFor="sourceRecentChoice" className="flex items-center gap-2 border p-3 rounded-md has-[:checked]:bg-primary/10 has-[:checked]:border-primary cursor-pointer text-sm md:text-base">
                        <RadioGroupItem value="recent" id="sourceRecentChoice" /> <RotateCcw className="w-4 h-4 mr-1"/> Recent Topics
                        </Label>
                    )}
                  </RadioGroup>
                )}
              />
            </div>

            {sourceType === 'topic' && (
              <div className="space-y-2">
                <Label htmlFor="topics">Topic(s)</Label>
                 <div className="flex gap-2">
                    <Input 
                        id="topics" 
                        placeholder="e.g., Calculus, World History (comma-separated)" 
                        {...register('topics')} 
                        className={cn(errors.topics ? 'border-destructive' : '', "transition-colors duration-200 ease-in-out")}
                    />
                    {browserSupportsSpeechRecognition && (
                    <Button type="button" variant="outline" size="icon" onClick={handleMicClick} disabled={isLoading}>
                        <Mic className={`w-5 h-5 ${isListening ? 'text-destructive animate-pulse' : ''}`} />
                    </Button>
                    )}
                </div>
                {voiceError && <p className="text-sm text-destructive">Voice input error: {voiceError}</p>}
                {errors.topics && <p className="text-sm text-destructive">{errors.topics.message}</p>}
              </div>
            )}
            {sourceType === 'notes' && (
              <div className="space-y-2">
                <Label htmlFor="notes">Your Notes</Label>
                <Textarea id="notes" placeholder="Paste your study notes here..." {...register('notes')} rows={6} className={cn(errors.notes ? 'border-destructive' : '', "transition-colors duration-200 ease-in-out")}/>
                {errors.notes && <p className="text-sm text-destructive">{errors.notes.message}</p>}
              </div>
            )}
            {sourceType === 'recent' && (
              <div className="space-y-2">
                <Label>Select Recent Topics (up to {MAX_RECENT_TOPICS_SELECT})</Label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 p-2 border rounded-md max-h-60 overflow-y-auto">
                  {recentTopics.length > 0 ? recentTopics.map(topic => (
                    <Label key={topic} htmlFor={`recent-${topic}`} className="flex items-center gap-2 p-2 border rounded-md hover:bg-muted has-[:checked]:bg-primary/10 has-[:checked]:border-primary cursor-pointer">
                      <Controller
                        name="selectedRecentTopics"
                        control={control}
                        render={({ field }) => (
                          <Checkbox
                            id={`recent-${topic}`}
                            checked={field.value?.includes(topic)}
                            onCheckedChange={(checked) => {
                              playClickSound();
                              const currentSelection = field.value || [];
                              if (checked) {
                                if (currentSelection.length < MAX_RECENT_TOPICS_SELECT) {
                                  field.onChange([...currentSelection, topic]);
                                } else {
                                  toast({ title: "Limit Reached", description: `You can only select up to ${MAX_RECENT_TOPICS_SELECT} topics.`, variant: "destructive"});
                                  return false; 
                                }
                              } else {
                                field.onChange(currentSelection.filter(t => t !== topic));
                              }
                            }}
                          />
                        )}
                      />
                      <span className="truncate" title={topic}>{topic}</span>
                    </Label>
                  )) : <p className="text-sm text-muted-foreground p-2">No recent topics found. Generate some notes first!</p>}
                </div>
                {errors.selectedRecentTopics && <p className="text-sm text-destructive">{errors.selectedRecentTopics.message}</p>}
              </div>
            )}


            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="difficulty">Difficulty</Label>
                <Controller
                  name="difficulty"
                  control={control}
                  render={({ field }) => (
                    <Select onValueChange={(value) => { playClickSound(); field.onChange(value);}} defaultValue={field.value}>
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
                <Input id="numQuestions" type="number" {...register('numQuestions')} className="transition-colors duration-200 ease-in-out" />
                {errors.numQuestions && <p className="text-sm text-destructive">{errors.numQuestions.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="timer">Timer (minutes, 0 for none)</Label>
                <Input id="timer" type="number" {...register('timer')} className="transition-colors duration-200 ease-in-out" />
                {errors.timer && <p className="text-sm text-destructive">{errors.timer.message}</p>}
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Generate Test
            </Button>
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
                <div className={`flex items-center gap-2 text-lg font-medium ${testState.timeLeft <= 60 ? 'text-destructive animate-pulse' : 'text-primary'}`}>
                  <Clock className="w-5 h-5" />
                  <span>{formatTime(testState.timeLeft)}</span>
                </div>
              )}
            </div>
            <Progress value={((testState.currentQuestionIndex + 1) / testState.questions.length) * 100} className="w-full mt-2" />
             {testState.isAutoSubmitting && (
                <Alert variant="destructive" className="mt-2">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>Submitting...</AlertTitle>
                    <AlertDescription>Time ran out. Your test is being submitted.</AlertDescription>
                </Alert>
            )}
          </CardHeader>
          <CardContent className="space-y-6">
            <ReactMarkdown className="text-lg font-semibold prose dark:prose-invert max-w-none">{currentQuestionData.question}</ReactMarkdown>
             <RadioGroup
                onValueChange={(value) => handleAnswerSelect(value)}
                value={testState.userAnswers[testState.currentQuestionIndex]}
                className="space-y-2"
                disabled={testState.isAutoSubmitting}
              >
                {currentQuestionData.options.map((option, i) => (
                  <Label key={i} htmlFor={`option-${i}`} className={cn("flex items-center space-x-2 p-3 border rounded-md hover:bg-muted has-[:checked]:bg-primary/20 has-[:checked]:border-primary", testState.isAutoSubmitting ? "cursor-not-allowed opacity-70" : "cursor-pointer")}>
                    <RadioGroupItem value={option} id={`option-${i}`} disabled={testState.isAutoSubmitting}/>
                    <span>{option}</span>
                  </Label>
                ))}
              </RadioGroup>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button variant="outline" onClick={handlePrevQuestion} disabled={testState.currentQuestionIndex === 0 || !!testState.isAutoSubmitting}>Previous</Button>
            {testState.currentQuestionIndex < testState.questions.length - 1 ? (
              <Button onClick={handleNextQuestion} disabled={!!testState.isAutoSubmitting}>Next</Button>
            ) : (
              <Button onClick={() => handleSubmitTest(false)} variant="default" disabled={!!testState.isAutoSubmitting}>
                {isLoading && testState.isAutoSubmitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                Submit Test
              </Button>
            )}
          </CardFooter>
        </Card>
     );
  }

  if (testState.showResults) {
    const totalPossibleScore = testState.questions.length * 4;
    const percentage = totalPossibleScore > 0 ? Math.max(0, (testState.score / totalPossibleScore) * 100) : 0;

    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Test Results</CardTitle>
          <CardDescription>
            You scored {testState.score} out of {totalPossibleScore} ({percentage.toFixed(1)}%).
            {testState.settings.timer && testState.settings.timer > 0 && testState.timeLeft !== undefined && (
                <span> Time taken: {formatTime(testState.settings.timer * 60 - (testState.timeLeft > 0 ? testState.timeLeft : 0))}.</span>
            )}
          </CardDescription>
          <Progress value={percentage} className="w-full mt-2" />
        </CardHeader>
        <CardContent className="space-y-4">
          {testState.questions.map((q, index) => (
            <Card key={index} className={q.isCorrect === undefined ? '' : q.isCorrect ? 'border-green-500 bg-green-500/10' : 'border-destructive bg-destructive/10'}>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                   {q.isCorrect === undefined ? null : q.isCorrect ? <CheckCircle className="w-5 h-5 text-green-600" /> : <XCircle className="w-5 h-5 text-destructive" />}
                  Question {index + 1}: <ReactMarkdown className="prose prose-sm dark:prose-invert max-w-none inline">{q.question}</ReactMarkdown>
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm space-y-1">
                <p>Your answer: <span className="font-medium">{q.userAnswer || 'Not answered'}</span></p>
                <p>Correct answer: <span className="font-medium">{q.answer}</span></p>
                {q.explanation && (
                  <Alert variant="default" className="mt-2 bg-blue-500/10 border-blue-500/30">
                    <Lightbulb className="h-4 w-4 text-blue-600" />
                    <AlertTitle className="text-blue-700 dark:text-blue-400">Explanation</AlertTitle>
                    <AlertDescription className="prose prose-sm dark:prose-invert max-w-none text-muted-foreground">
                       <ReactMarkdown>{q.explanation}</ReactMarkdown>
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>
          ))}
        </CardContent>
        <CardFooter className="flex gap-2">
            <Button onClick={handleRetakeTest} disabled={isLoading}><RotateCcw className="w-4 h-4 mr-2"/>Retake Test</Button>
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
