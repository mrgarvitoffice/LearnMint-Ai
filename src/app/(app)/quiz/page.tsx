"use client";

import { useState, useEffect } from 'react';
import { useForm, type SubmitHandler, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useToast } from '@/hooks/use-toast';
import { generateQuiz, type GenerateQuizOutput, type GenerateQuizInput } from '@/ai/flows/generate-quiz';
import { Loader2, HelpCircle, CheckCircle, XCircle, RotateCcw } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

const formSchema = z.object({
  topic: z.string().min(3, { message: 'Topic must be at least 3 characters.' }),
  numQuestions: z.coerce.number().min(1, { message: 'Must be at least 1 question.' }).max(10, { message: 'Maximum 10 questions.' }),
});
type FormData = z.infer<typeof formSchema>;

interface QuizState extends GenerateQuizOutput {
  userAnswers: (string | undefined)[];
  currentQuestionIndex: number;
  showResults: boolean;
  score: number;
}

export default function QuizPage() {
  const [quizState, setQuizState] = useState<QuizState | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const { register, handleSubmit, control, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      numQuestions: 5,
    }
  });

  const onSubmit: SubmitHandler<FormData> = async (data) => {
    setIsLoading(true);
    setQuizState(null);
    try {
      const result = await generateQuiz(data);
      if (result.quiz && result.quiz.length > 0) {
        setQuizState({
          ...result,
          userAnswers: Array(result.quiz.length).fill(undefined),
          currentQuestionIndex: 0,
          showResults: false,
          score: 0,
        });
        toast({ title: 'Quiz Generated!', description: 'Your quiz is ready to start.' });
      } else {
        toast({ title: 'No Quiz Data', description: 'The AI returned no questions for this topic.', variant: 'destructive' });
      }
    } catch (error) {
      console.error('Error generating quiz:', error);
      toast({ title: 'Error', description: 'Failed to generate quiz. Please try again.', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAnswerSelect = (answer: string) => {
    if (!quizState || quizState.showResults) return;
    const newUserAnswers = [...quizState.userAnswers];
    newUserAnswers[quizState.currentQuestionIndex] = answer;
    setQuizState({ ...quizState, userAnswers: newUserAnswers });
  };

  const handleNextQuestion = () => {
    if (!quizState || quizState.currentQuestionIndex >= quizState.quiz.length - 1) return;
    setQuizState({ ...quizState, currentQuestionIndex: quizState.currentQuestionIndex + 1 });
  };

  const handlePrevQuestion = () => {
    if (!quizState || quizState.currentQuestionIndex <= 0) return;
    setQuizState({ ...quizState, currentQuestionIndex: quizState.currentQuestionIndex - 1 });
  };

  const handleSubmitQuiz = () => {
    if (!quizState) return;
    let score = 0;
    quizState.quiz.forEach((q, index) => {
      if (quizState.userAnswers[index] === q.answer) {
        score++;
      }
    });
    setQuizState({ ...quizState, score, showResults: true });
  };

  const handleRetakeQuiz = () => {
    if (!quizState) return;
     setQuizState({
      ...quizState,
      userAnswers: Array(quizState.quiz.length).fill(undefined),
      currentQuestionIndex: 0,
      showResults: false,
      score: 0,
    });
  }
  
  const handleNewQuiz = () => {
    setQuizState(null);
  }

  const currentQuestionData = quizState?.quiz[quizState.currentQuestionIndex];

  return (
    <div className="space-y-8">
      {!quizState ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-2xl">
              <HelpCircle className="w-7 h-7 text-primary" />
              AI Quiz Creator
            </CardTitle>
            <CardDescription>Enter a topic and number of questions to generate a quiz.</CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit(onSubmit)}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="topic">Topic</Label>
                <Input id="topic" placeholder="e.g., Solar System, World War II" {...register('topic')} />
                {errors.topic && <p className="text-sm text-destructive">{errors.topic.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="numQuestions">Number of Questions (1-10)</Label>
                <Input id="numQuestions" type="number" {...register('numQuestions')} />
                {errors.numQuestions && <p className="text-sm text-destructive">{errors.numQuestions.message}</p>}
              </div>
            </CardContent>
            <CardFooter>
              <Button type="submit" disabled={isLoading}>
                {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Generate Quiz
              </Button>
            </CardFooter>
          </form>
        </Card>
      ) : !quizState.showResults && currentQuestionData ? (
        <Card>
          <CardHeader>
            <CardTitle>Quiz: {quizState.quiz.length > 0 ? `Question ${quizState.currentQuestionIndex + 1} of ${quizState.quiz.length}` : "Quiz"}</CardTitle>
            <Progress value={((quizState.currentQuestionIndex + 1) / quizState.quiz.length) * 100} className="w-full mt-2" />
          </CardHeader>
          <CardContent className="space-y-6">
            <p className="text-lg font-semibold">{currentQuestionData.question}</p>
            <Controller
              name={`userAnswers.${quizState.currentQuestionIndex}` as any} // Controller name needs to be unique per question for RHF state if used
              control={control}
              render={({ field }) => (
                <RadioGroup
                  onValueChange={(value) => handleAnswerSelect(value)}
                  value={quizState.userAnswers[quizState.currentQuestionIndex]}
                  className="space-y-2"
                >
                  {currentQuestionData.options.map((option, i) => (
                    <Label key={i} htmlFor={`option-${i}`} className="flex items-center space-x-2 p-3 border rounded-md hover:bg-muted has-[:checked]:bg-primary/20 has-[:checked]:border-primary cursor-pointer">
                      <RadioGroupItem value={option} id={`option-${i}`} />
                      <span>{option}</span>
                    </Label>
                  ))}
                </RadioGroup>
              )}
            />
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button variant="outline" onClick={handlePrevQuestion} disabled={quizState.currentQuestionIndex === 0}>Previous</Button>
            {quizState.currentQuestionIndex < quizState.quiz.length - 1 ? (
              <Button onClick={handleNextQuestion}>Next</Button>
            ) : (
              <Button onClick={handleSubmitQuiz} variant="default">Submit Quiz</Button>
            )}
          </CardFooter>
        </Card>
      ) : quizState.showResults ? (
         <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Quiz Results</CardTitle>
            <CardDescription>You scored {quizState.score} out of {quizState.quiz.length}!</CardDescription>
             <Progress value={(quizState.score / quizState.quiz.length) * 100} className="w-full mt-2" />
          </CardHeader>
          <CardContent className="space-y-4">
            {quizState.quiz.map((q, index) => (
              <Card key={index} className={quizState.userAnswers[index] === q.answer ? 'border-green-500 bg-green-500/10' : 'border-destructive bg-destructive/10'}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                     {quizState.userAnswers[index] === q.answer ? <CheckCircle className="w-5 h-5 text-green-600" /> : <XCircle className="w-5 h-5 text-destructive" />}
                    Question {index + 1}: {q.question}
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-sm">
                  <p>Your answer: <span className="font-medium">{quizState.userAnswers[index] || 'Not answered'}</span></p>
                  <p>Correct answer: <span className="font-medium">{q.answer}</span></p>
                </CardContent>
              </Card>
            ))}
          </CardContent>
          <CardFooter className="flex gap-2">
            <Button onClick={handleRetakeQuiz}><RotateCcw className="w-4 h-4 mr-2"/>Retake Quiz</Button>
            <Button variant="outline" onClick={handleNewQuiz}>Create New Quiz</Button>
          </CardFooter>
        </Card>
      ) : (
        <Alert variant="destructive">
          <AlertTitle>Quiz Error</AlertTitle>
          <AlertDescription>Something went wrong with loading the quiz. Please try generating a new one.</AlertDescription>
        </Alert>
      )}
    </div>
  );
}
