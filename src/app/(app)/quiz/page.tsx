
"use client";

import { useState, useEffect, useRef } from 'react';
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
import { Loader2, HelpCircle, CheckCircle, XCircle, RotateCcw, Lightbulb, GraduationCap, Mic, Sparkles, BookOpenText, Brain, Layers, Download, Volume2, PlayCircle, PauseCircle, StopCircle, AlertTriangle } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import ReactMarkdown from 'react-markdown';
import { useSound } from '@/hooks/useSound';
import { cn } from '@/lib/utils';
import { useTTS } from '@/hooks/useTTS';

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

const PAGE_TITLE = "AI Powered Quiz Creator";

export default function QuizPage() {
  const [quizState, setQuizState] = useState<QuizState | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { playSound: playCorrectSound } = useSound('correct'); 
  const { playSound: playIncorrectSound } = useSound('incorrect'); 
  const { playSound: playClickSound } = useSound('/sounds/ting.mp3', 0.3);
  
  const { speak, isSpeaking: isTTSSpeaking, selectedVoice, setVoicePreference, supportedVoices, cancelTTS } = useTTS();
  const pageTitleSpokenRef = useRef(false);
  const voicePreferenceWasSetRef = useRef(false);
  const generatingMessageSpokenRef = useRef(false);

  const { register, handleSubmit, control, formState: { errors }, watch } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      numQuestions: 5,
    }
  });
  const topicValue = watch('topic'); // To display in the results card

  useEffect(() => {
    if (supportedVoices.length > 0 && !voicePreferenceWasSetRef.current) {
      setVoicePreference('zia'); 
      voicePreferenceWasSetRef.current = true;
    }
  }, [supportedVoices, setVoicePreference]);

  useEffect(() => {
    let isMounted = true;
    if (isMounted && selectedVoice && !isTTSSpeaking && !pageTitleSpokenRef.current && !isLoading && !quizState) {
      speak(PAGE_TITLE);
      pageTitleSpokenRef.current = true;
    }
    return () => {
      isMounted = false;
      // Optional: cancelTTS if it was specifically this page's title speaking
    };
  }, [selectedVoice, isTTSSpeaking, speak, isLoading, quizState]);

  useEffect(() => {
    if (isLoading && !generatingMessageSpokenRef.current && selectedVoice && !isTTSSpeaking) {
      speak("Generating quiz. Please wait.");
      generatingMessageSpokenRef.current = true;
    }
    if (!isLoading && generatingMessageSpokenRef.current) { 
      generatingMessageSpokenRef.current = false; 
    }
  }, [isLoading, selectedVoice, isTTSSpeaking, speak]);

  const onSubmit: SubmitHandler<FormData> = async (data) => {
    playClickSound();
    setIsLoading(true);
    setQuizState(null); // Reset previous quiz state
    pageTitleSpokenRef.current = true; // Prevent title from re-announcing if form is submitted quickly

    if (selectedVoice && !isTTSSpeaking && !generatingMessageSpokenRef.current) {
      speak("Generating quiz. Please wait.");
      generatingMessageSpokenRef.current = true;
    }

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
        if (selectedVoice && !isTTSSpeaking) speak("Quiz ready!");
      } else {
        toast({ title: 'No Quiz Data', description: 'The AI returned no questions for this topic.', variant: 'destructive' });
         if (selectedVoice && !isTTSSpeaking) speak("Sorry, no quiz data was returned for this topic.");
      }
    } catch (error) {
      console.error('Error generating quiz:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to generate quiz. Please try again.';
      toast({ title: 'Error', description: errorMessage, variant: 'destructive' });
      if (selectedVoice && !isTTSSpeaking) speak("Sorry, there was an error generating the quiz.");
    } finally {
      setIsLoading(false);
      generatingMessageSpokenRef.current = false;
    }
  };

  const handleAnswerSelect = (answer: string) => {
    playClickSound();
    if (!quizState || quizState.showResults) return;
    const newUserAnswers = [...quizState.userAnswers];
    newUserAnswers[quizState.currentQuestionIndex] = answer;
    setQuizState({ ...quizState, userAnswers: newUserAnswers });
  };

  const handleNextQuestion = () => {
    playClickSound();
    if (!quizState || quizState.currentQuestionIndex >= quizState.quiz.length - 1) return;
    setQuizState({ ...quizState, currentQuestionIndex: quizState.currentQuestionIndex + 1 });
  };

  const handlePrevQuestion = () => {
    playClickSound();
    if (!quizState || quizState.currentQuestionIndex <= 0) return;
    setQuizState({ ...quizState, currentQuestionIndex: quizState.currentQuestionIndex - 1 });
  };

  const handleSubmitQuiz = () => {
    playClickSound();
    if (!quizState) return;
    let score = 0;
    quizState.quiz.forEach((q, index) => {
      if (quizState.userAnswers[index] === q.answer) {
        score++;
        playCorrectSound();
      } else if (quizState.userAnswers[index] !== undefined) { 
        playIncorrectSound();
      }
    });
    setQuizState({ ...quizState, score, showResults: true });
    const resultMessage = `Quiz Submitted! Your score is ${score} out of ${quizState.quiz.length}.`;
    toast({ title: "Quiz Submitted!", description: resultMessage});
    if(selectedVoice && !isTTSSpeaking) speak(resultMessage);
  };

  const handleRetakeQuiz = () => {
    playClickSound();
    if (!quizState || !topicValue) return; // Ensure topicValue exists
    const originalSettings = {
        topic: topicValue,
        numQuestions: quizState.quiz.length
    }
     onSubmit(originalSettings as FormData); 
  }
  
  const handleNewQuiz = () => {
    playClickSound();
    setQuizState(null);
    pageTitleSpokenRef.current = false; // Allow title to be spoken again
  }

  const currentQuestionData = quizState?.quiz[quizState.currentQuestionIndex];

  return (
    <div className="container mx-auto max-w-2xl px-4 py-8 flex flex-col items-center justify-center min-h-[calc(100vh-12rem)] space-y-8">
      {!quizState ? (
        <Card className="w-full shadow-xl bg-card/90 backdrop-blur-sm">
          <CardHeader className="text-center">
            <div className="flex items-center justify-center mb-4">
              <HelpCircle className="h-12 w-12 text-primary" />
            </div>
            <CardTitle className="text-2xl sm:text-3xl font-bold text-primary">{PAGE_TITLE}</CardTitle>
            <CardDescription className="text-sm sm:text-base text-muted-foreground px-2">
              Enter a topic and number of questions to generate an interactive quiz.
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit(onSubmit)}>
            <CardContent className="space-y-6 p-6">
              <div className="space-y-2">
                <Label htmlFor="topic">Topic</Label>
                <Input id="topic" placeholder="e.g., Solar System, World War II" {...register('topic')} className="transition-colors duration-200 ease-in-out text-base" />
                {errors.topic && <p className="text-sm text-destructive">{errors.topic.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="numQuestions">Number of Questions (1-10)</Label>
                <Input id="numQuestions" type="number" {...register('numQuestions')} className="transition-colors duration-200 ease-in-out text-base" />
                {errors.numQuestions && <p className="text-sm text-destructive">{errors.numQuestions.message}</p>}
              </div>
            </CardContent>
            <CardFooter className="justify-center p-6">
              <Button type="submit" disabled={isLoading} size="lg" className="min-w-[200px]">
                {isLoading ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : <Sparkles className="w-5 h-5 mr-2" /> }
                Generate Quiz
              </Button>
            </CardFooter>
          </form>
        </Card>
      ) : !quizState.showResults && currentQuestionData ? (
        <Card className="w-full shadow-xl">
          <CardHeader>
            <CardTitle className="text-primary">Quiz on: {topicValue || "Selected Topic"}</CardTitle>
            <CardDescription>Question {quizState.currentQuestionIndex + 1} of {quizState.quiz.length}</CardDescription>
            <Progress value={((quizState.currentQuestionIndex + 1) / quizState.quiz.length) * 100} className="w-full mt-2 h-2.5" />
          </CardHeader>
          <CardContent className="space-y-6 p-6">
            <ReactMarkdown className="text-lg font-semibold prose dark:prose-invert max-w-none">{currentQuestionData.question}</ReactMarkdown>
            <Controller
              name={`userAnswers.${quizState.currentQuestionIndex}` as any} 
              control={control}
              render={({ field }) => (
                <RadioGroup
                  onValueChange={(value) => handleAnswerSelect(value)}
                  value={quizState.userAnswers[quizState.currentQuestionIndex]}
                  className="space-y-3"
                >
                  {currentQuestionData.options.map((option, i) => (
                    <Label key={i} htmlFor={`option-${i}-${quizState.currentQuestionIndex}`} className="flex items-center space-x-3 p-4 border rounded-lg hover:bg-muted has-[:checked]:bg-primary/20 has-[:checked]:border-primary cursor-pointer transition-all">
                      <RadioGroupItem value={option} id={`option-${i}-${quizState.currentQuestionIndex}`} />
                      <span className="text-base">{option}</span>
                    </Label>
                  ))}
                </RadioGroup>
              )}
            />
          </CardContent>
          <CardFooter className="flex justify-between p-6 border-t">
            <Button variant="outline" onClick={handlePrevQuestion} disabled={quizState.currentQuestionIndex === 0}>Previous</Button>
            {quizState.currentQuestionIndex < quizState.quiz.length - 1 ? (
              <Button onClick={handleNextQuestion}>Next</Button>
            ) : (
              <Button onClick={handleSubmitQuiz} variant="default">Submit Quiz</Button>
            )}
          </CardFooter>
        </Card>
      ) : quizState.showResults ? (
         <Card className="w-full shadow-xl">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold text-primary">Quiz Results</CardTitle>
            <CardDescription className="text-lg">Topic: {topicValue || "Selected Topic"}</CardDescription>
            <p className="text-3xl font-bold mt-2">You scored {quizState.score} out of {quizState.quiz.length}!</p>
             <Progress value={(quizState.score / quizState.quiz.length) * 100} className="w-3/4 mx-auto mt-3 h-3" />
          </CardHeader>
          <CardContent className="space-y-4 p-6 max-h-[50vh] overflow-y-auto">
            {quizState.quiz.map((q, index) => (
              <Card key={index} className={cn("overflow-hidden", quizState.userAnswers[index] === q.answer ? 'border-green-500/70 bg-green-500/10' : 'border-destructive/70 bg-destructive/10')}>
                <CardHeader className="pb-3 pt-4 px-4">
                  <CardTitle className="text-base flex items-start gap-2">
                     {quizState.userAnswers[index] === q.answer ? <CheckCircle className="w-5 h-5 text-green-600 shrink-0 mt-0.5" /> : <XCircle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />}
                     <span className="font-normal text-sm text-muted-foreground mr-1">Q{index + 1}:</span>
                     <ReactMarkdown className="prose prose-sm dark:prose-invert max-w-none inline leading-tight">{q.question}</ReactMarkdown>
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-sm space-y-1 px-4 pb-4">
                  <p>Your answer: <span className="font-medium">{quizState.userAnswers[index] || 'Not answered'}</span></p>
                  <p>Correct answer: <span className="font-medium text-green-600 dark:text-green-500">{q.answer}</span></p>
                  {q.explanation && (
                     <Alert variant="default" className="mt-2 bg-accent/10 border-accent/30">
                        <Lightbulb className="h-4 w-4 text-accent-foreground/80" />
                        <AlertTitle className="text-accent-foreground/90 text-sm">Explanation</AlertTitle>
                        <AlertDescription className="prose prose-sm dark:prose-invert max-w-none text-muted-foreground">
                           <ReactMarkdown>{q.explanation}</ReactMarkdown>
                        </AlertDescription>
                      </Alert>
                  )}
                </CardContent>
              </Card>
            ))}
          </CardContent>
          <CardFooter className="flex flex-col sm:flex-row justify-center gap-3 p-6 border-t">
            <Button onClick={handleRetakeQuiz} disabled={isLoading} size="lg"><RotateCcw className="w-4 h-4 mr-2"/>Retake Quiz</Button>
            <Button variant="outline" onClick={handleNewQuiz} size="lg">Create New Quiz</Button>
          </CardFooter>
        </Card>
      ) : (
        <Card className="w-full shadow-xl">
          <CardHeader>
            <AlertTriangle className="w-12 h-12 mx-auto text-destructive mb-4" />
            <AlertTitle className="text-xl font-semibold text-center">Quiz Error</AlertTitle>
          </CardHeader>
          <CardContent className="text-center">
            <AlertDescription className="text-muted-foreground">
              Something went wrong with loading the quiz, or no questions were generated. Please try configuring a new one.
            </AlertDescription>
            <Button variant="outline" onClick={handleNewQuiz} className="mt-6">Create New Quiz</Button>
          </CardContent>
        </Card