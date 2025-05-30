
"use client";

import { useState, useEffect, useRef, useCallback } from 'react';
import { useForm, type SubmitHandler, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useToast } from '@/hooks/use-toast';
import { generateQuizAction } from '@/lib/actions'; // Using the renamed server action
import type { GenerateQuizQuestionsOutput, GenerateQuizQuestionsInput, QuizQuestion } from '@/lib/types'; // Updated types
import { Loader2, HelpCircle, CheckCircle, XCircle, RotateCcw, Lightbulb, Sparkles } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import ReactMarkdown from 'react-markdown';
import { useSound } from '@/hooks/useSound';
import { cn } from '@/lib/utils';
import { useTTS } from '@/hooks/useTTS';

const formSchema = z.object({
  topic: z.string().min(3, { message: 'Topic must be at least 3 characters.' }),
  numQuestions: z.coerce.number().min(1, { message: 'Must be at least 1 question.' }).max(10, { message: 'Maximum 10 questions for quick quiz.' }), // Reduced for quick quiz
  difficulty: z.enum(['easy', 'medium', 'hard']).default('medium'),
});
type FormData = z.infer<typeof formSchema>;

interface QuizState {
  quiz: QuizQuestion[]; // Using the enhanced QuizQuestion type
  userAnswers: (string | undefined)[];
  currentQuestionIndex: number;
  isAnswerSubmitted: boolean[]; // Track if answer for each question is submitted
  showResults: boolean;
  score: number;
  difficulty: 'easy' | 'medium' | 'hard';
}

const PAGE_TITLE = "AI Powered Quiz Creator";

export default function QuizPage() {
  const [quizState, setQuizState] = useState<QuizState | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { playSound: playCorrectSound } = useSound('correct'); 
  const { playSound: playIncorrectSound } = useSound('incorrect'); 
  const { playSound: playClickSound } = useSound('/sounds/ting.mp3', 0.3);
  
  const { speak, isSpeaking, isPaused, selectedVoice, setVoicePreference, supportedVoices, cancelTTS } = useTTS();
  const pageTitleSpokenRef = useRef(false);
  const voicePreferenceWasSetRef = useRef(false);
  const generatingMessageSpokenRef = useRef(false);

  const { register, handleSubmit, control, formState: { errors }, watch } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      numQuestions: 5,
      difficulty: 'medium',
    }
  });
  const topicValue = watch('topic');
  const difficultyValue = watch('difficulty');

  useEffect(() => {
    if (supportedVoices.length > 0 && !voicePreferenceWasSetRef.current) {
      setVoicePreference('zia');
      voicePreferenceWasSetRef.current = true;
    }
  }, [supportedVoices, setVoicePreference]);

  useEffect(() => {
    let isMounted = true;
    if (isMounted && selectedVoice && !isSpeaking && !isPaused && !pageTitleSpokenRef.current && !isLoading && !quizState) {
      speak(PAGE_TITLE);
      pageTitleSpokenRef.current = true;
    }
    return () => { isMounted = false; };
  }, [selectedVoice, isSpeaking, isPaused, speak, isLoading, quizState]);

  useEffect(() => {
    if (isLoading && !generatingMessageSpokenRef.current && selectedVoice && !isSpeaking && !isPaused) {
      speak("Generating quiz. Please wait.");
      generatingMessageSpokenRef.current = true;
    }
    if (!isLoading && generatingMessageSpokenRef.current) { 
      generatingMessageSpokenRef.current = false; 
    }
  }, [isLoading, selectedVoice, isSpeaking, isPaused, speak]);

  const onSubmit: SubmitHandler<FormData> = async (data) => {
    playClickSound();
    setIsLoading(true);
    setQuizState(null);
    pageTitleSpokenRef.current = true; 

    if (selectedVoice && !isSpeaking && !isPaused && !generatingMessageSpokenRef.current) {
      speak("Generating quiz. Please wait.");
      generatingMessageSpokenRef.current = true;
    }

    try {
      const result: GenerateQuizQuestionsOutput = await generateQuizAction({ 
        topic: data.topic, 
        numQuestions: data.numQuestions,
        difficulty: data.difficulty 
      });
      if (result.questions && result.questions.length > 0) {
        setQuizState({
          quiz: result.questions,
          userAnswers: Array(result.questions.length).fill(undefined),
          isAnswerSubmitted: Array(result.questions.length).fill(false),
          currentQuestionIndex: 0,
          showResults: false,
          score: 0,
          difficulty: data.difficulty,
        });
        toast({ title: 'Quiz Generated!', description: 'Your quiz is ready to start.' });
        if (selectedVoice && !isSpeaking && !isPaused) speak("Quiz ready!");
      } else {
        toast({ title: 'No Quiz Data', description: 'The AI returned no questions for this topic.', variant: 'destructive' });
         if (selectedVoice && !isSpeaking && !isPaused) speak("Sorry, no quiz data was returned for this topic.");
      }
    } catch (error) {
      console.error('Error generating quiz:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to generate quiz. Please try again.';
      toast({ title: 'Error', description: errorMessage, variant: 'destructive' });
      if (selectedVoice && !isSpeaking && !isPaused) speak("Sorry, there was an error generating the quiz.");
    } finally {
      setIsLoading(false);
      generatingMessageSpokenRef.current = false;
    }
  };

  const handleAnswerSelect = (answer: string) => {
    playClickSound();
    if (!quizState || quizState.showResults || quizState.isAnswerSubmitted[quizState.currentQuestionIndex]) return;
    
    const newUserAnswers = [...quizState.userAnswers];
    newUserAnswers[quizState.currentQuestionIndex] = answer;
    setQuizState(prev => prev ? { ...prev, userAnswers: newUserAnswers } : null);
  };
  
  const handleSubmitAnswer = () => {
    playClickSound();
    if (!quizState || !quizState.quiz[quizState.currentQuestionIndex] || quizState.isAnswerSubmitted[quizState.currentQuestionIndex]) return;

    const currentQ = quizState.quiz[quizState.currentQuestionIndex];
    const userAnswer = quizState.userAnswers[quizState.currentQuestionIndex];
    let newScore = quizState.score;

    if (userAnswer && userAnswer.toLowerCase().trim() === currentQ.answer.toLowerCase().trim()) {
      newScore += 4;
      if (selectedVoice && !isSpeaking && !isPaused) speak("Correct!");
      playCorrectSound();
    } else if (userAnswer !== undefined) {
      newScore -=1;
      if (selectedVoice && !isSpeaking && !isPaused) speak("Incorrect.");
      playIncorrectSound();
    }
    
    const newIsAnswerSubmitted = [...quizState.isAnswerSubmitted];
    newIsAnswerSubmitted[quizState.currentQuestionIndex] = true;

    setQuizState(prev => prev ? { ...prev, score: newScore, isAnswerSubmitted: newIsAnswerSubmitted } : null);
  };


  const handleNextQuestion = () => {
    playClickSound();
    if (!quizState || quizState.currentQuestionIndex >= quizState.quiz.length - 1) return;
    setQuizState(prev => prev ? {...prev, currentQuestionIndex: prev.currentQuestionIndex + 1} : null);
  };

  const handlePrevQuestion = () => {
    playClickSound();
    if (!quizState || quizState.currentQuestionIndex <= 0) return;
    setQuizState(prev => prev ? { ...prev, currentQuestionIndex: prev.currentQuestionIndex - 1 } : null);
  };

  const handleSubmitQuiz = () => {
    playClickSound();
    if (!quizState) return;
    // Ensure all unanswered questions are implicitly "submitted" if user hits finish early
    // or just finalize based on already submitted answers.
    // The score is updated per question, so this just transitions to results view.
    setQuizState(prev => prev ? { ...prev, showResults: true } : null);
    const resultMessage = `Quiz Finished! Your score is ${quizState.score} out of ${quizState.quiz.length * 4}.`;
    toast({ title: "Quiz Finished!", description: resultMessage});
    if(selectedVoice && !isSpeaking && !isPaused) speak(resultMessage);
  };

  const handleRetakeQuiz = () => {
    playClickSound();
    if (!quizState || !topicValue) return; 
    const originalSettings = {
        topic: topicValue,
        numQuestions: quizState.quiz.length,
        difficulty: quizState.difficulty,
    }
     onSubmit(originalSettings as FormData); 
  }
  
  const handleNewQuiz = () => {
    playClickSound();
    setQuizState(null);
    pageTitleSpokenRef.current = false;
  }

  const currentQuestionData = quizState?.quiz[quizState.currentQuestionIndex];
  const isCurrentAnswerSubmitted = quizState?.isAnswerSubmitted[quizState.currentQuestionIndex];

  if (!quizState) {
    return (
      <div className="container mx-auto max-w-2xl px-4 py-8 flex flex-col items-center justify-center min-h-[calc(100vh-12rem)] space-y-8">
        <Card className="w-full shadow-xl bg-card/90 backdrop-blur-sm">
          <CardHeader className="text-center">
            <div className="flex items-center justify-center mb-4">
              <HelpCircle className="h-12 w-12 text-primary" />
            </div>
            <CardTitle className="text-2xl sm:text-3xl font-bold text-primary">{PAGE_TITLE}</CardTitle>
            <CardDescription className="text-sm sm:text-base text-muted-foreground px-2">
              Enter a topic, number of questions, and difficulty to generate an interactive quiz.
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit(onSubmit)}>
            <CardContent className="space-y-6 p-6">
              <div className="space-y-2">
                <Label htmlFor="topic">Topic</Label>
                <Input id="topic" placeholder="e.g., Solar System, World War II" {...register('topic')} className="transition-colors duration-200 ease-in-out text-base" />
                {errors.topic && <p className="text-sm text-destructive">{errors.topic.message}</p>}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="numQuestions">Number of Questions (1-10)</Label>
                  <Input id="numQuestions" type="number" {...register('numQuestions')} className="transition-colors duration-200 ease-in-out text-base" />
                  {errors.numQuestions && <p className="text-sm text-destructive">{errors.numQuestions.message}</p>}
                </div>
                <div className="space-y-2">
                    <Label htmlFor="difficulty">Difficulty</Label>
                     <Controller
                        name="difficulty"
                        control={control}
                        render={({ field }) => (
                        <Select onValueChange={field.onChange} value={field.value}>
                            <SelectTrigger id="difficulty" className="text-base"><SelectValue placeholder="Select difficulty" /></SelectTrigger>
                            <SelectContent>
                            <SelectItem value="easy">Easy</SelectItem>
                            <SelectItem value="medium">Medium</SelectItem>
                            <SelectItem value="hard">Hard</SelectItem>
                            </SelectContent>
                        </Select>
                        )}
                    />
                </div>
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
      </div>
    );
  }
  
  if (quizState.showResults) {
     return (
         <div className="container mx-auto max-w-2xl px-4 py-8 flex flex-col items-center min-h-[calc(100vh-12rem)] space-y-8">
            <Card className="w-full shadow-xl">
            <CardHeader className="text-center">
                <CardTitle className="text-2xl font-bold text-primary">Quiz Results</CardTitle>
                <CardDescription className="text-lg">Topic: {topicValue || "Selected Topic"} (Difficulty: {quizState.difficulty})</CardDescription>
                <p className="text-3xl font-bold mt-2">You scored {quizState.score} out of {quizState.quiz.length * 4}!</p>
                <Progress value={(quizState.score / (quizState.quiz.length * 4 || 1)) * 100} className="w-3/4 mx-auto mt-3 h-3" />
            </CardHeader>
            <CardContent className="space-y-4 p-6 max-h-[50vh] overflow-y-auto">
                {quizState.quiz.map((q, index) => {
                const userAnswer = quizState.userAnswers[index];
                const isCorrect = userAnswer && userAnswer.toLowerCase().trim() === q.answer.toLowerCase().trim();
                return (
                    <Card key={index} className={cn("overflow-hidden", isCorrect ? 'border-green-500/70 bg-green-500/10' : userAnswer !== undefined ? 'border-destructive/70 bg-destructive/10' : 'border-border')}>
                    <CardHeader className="pb-3 pt-4 px-4">
                        <CardTitle className="text-base flex items-start gap-2">
                        {isCorrect ? <CheckCircle className="w-5 h-5 text-green-600 shrink-0 mt-0.5" /> : userAnswer !== undefined ? <XCircle className="w-5 h-5 text-destructive shrink-0 mt-0.5" /> : <HelpCircle className="w-5 h-5 text-muted-foreground shrink-0 mt-0.5"/>}
                        <span className="font-normal text-sm text-muted-foreground mr-1">Q{index + 1}:</span>
                        <ReactMarkdown className="prose prose-sm dark:prose-invert max-w-none inline leading-tight">{q.question}</ReactMarkdown>
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="text-sm space-y-1 px-4 pb-4">
                        <p>Your answer: <span className={cn("font-medium", isCorrect ? "text-green-600 dark:text-green-500" : "text-destructive")}>{userAnswer || 'Not answered'}</span></p>
                        {!isCorrect && <p>Correct answer: <span className="font-medium text-green-600 dark:text-green-500">{q.answer}</span></p>}
                        {q.explanation && (
                        <Alert variant="default" className="mt-2 bg-accent/10 border-accent/30 p-2">
                            <Lightbulb className="h-4 w-4 text-accent-foreground/80" />
                            <AlertTitle className="text-accent-foreground/90 text-xs font-semibold">Explanation</AlertTitle>
                            <AlertDescription className="prose prose-xs dark:prose-invert max-w-none text-muted-foreground">
                            <ReactMarkdown>{q.explanation}</ReactMarkdown>
                            </AlertDescription>
                            </Alert>
                        )}
                    </CardContent>
                    </Card>
                );
                })}
            </CardContent>
            <CardFooter className="flex flex-col sm:flex-row justify-center gap-3 p-6 border-t">
                <Button onClick={handleRetakeQuiz} disabled={isLoading} size="lg"><RotateCcw className="w-4 h-4 mr-2"/>Retake Quiz</Button>
                <Button variant="outline" onClick={handleNewQuiz} size="lg">Create New Quiz</Button>
            </CardFooter>
            </Card>
        </div>
      );
  }

  if (!currentQuestionData) {
    return (
        <div className="container mx-auto max-w-2xl px-4 py-8 flex flex-col items-center justify-center min-h-[calc(100vh-12rem)]">
            <Loader2 className="w-12 h-12 animate-spin text-primary"/>
            <p className="mt-4 text-lg text-muted-foreground">Loading quiz question...</p>
        </div>
    );
  }

  const isMcqCorrect = isCurrentAnswerSubmitted && quizState.userAnswers[quizState.currentQuestionIndex]?.toLowerCase().trim() === currentQuestionData.answer.toLowerCase().trim();
  const isMcqIncorrect = isCurrentAnswerSubmitted && quizState.userAnswers[quizState.currentQuestionIndex] !== undefined && !isMcqCorrect;


  return (
    <div className="container mx-auto max-w-2xl px-4 py-8 flex flex-col items-center min-h-[calc(100vh-12rem)] space-y-8">
        <Card className="w-full shadow-xl">
        <CardHeader>
            <CardTitle className="text-primary">Quiz on: {topicValue || "Selected Topic"} (Difficulty: {quizState.difficulty})</CardTitle>
            <CardDescription>Question {quizState.currentQuestionIndex + 1} of {quizState.quiz.length}</CardDescription>
            <Progress value={((quizState.currentQuestionIndex + 1) / quizState.quiz.length) * 100} className="w-full mt-2 h-2.5" />
        </CardHeader>
        <CardContent className="space-y-4 p-6">
            <ReactMarkdown className="text-lg font-semibold prose dark:prose-invert max-w-none">{currentQuestionData.question}</ReactMarkdown>
            
            {currentQuestionData.type === 'multiple-choice' && currentQuestionData.options && (
            <RadioGroup
                value={quizState.userAnswers[quizState.currentQuestionIndex]}
                onValueChange={(value) => {
                    if (!isCurrentAnswerSubmitted) { // Only allow selection if not yet finalized
                        handleAnswerSelect(value);
                        // For MCQs, submit/finalize immediately on click
                        handleSubmitAnswer(); 
                    }
                }}
                className="space-y-3"
            >
                {currentQuestionData.options.map((option, i) => {
                    const isSelected = quizState.userAnswers[quizState.currentQuestionIndex] === option;
                    const isCorrectAnswer = option === currentQuestionData.answer;
                    return (
                        <Label 
                            key={i} 
                            htmlFor={`option-${i}-${quizState.currentQuestionIndex}`} 
                            className={cn(
                                "flex items-center space-x-3 p-4 border rounded-lg transition-all",
                                isCurrentAnswerSubmitted && isSelected && isMcqCorrect && "bg-green-500/20 border-green-600 text-green-700 dark:text-green-400",
                                isCurrentAnswerSubmitted && isSelected && isMcqIncorrect && "bg-destructive/20 border-destructive text-destructive-foreground",
                                isCurrentAnswerSubmitted && !isSelected && isCorrectAnswer && "border-green-600 ring-2 ring-green-500", // Highlight correct if wrong was chosen
                                !isCurrentAnswerSubmitted && "hover:bg-muted cursor-pointer has-[:checked]:bg-primary/10 has-[:checked]:border-primary"
                            )}
                        >
                        <RadioGroupItem 
                            value={option} 
                            id={`option-${i}-${quizState.currentQuestionIndex}`} 
                            disabled={isCurrentAnswerSubmitted}
                        />
                        <span className="text-base">{option}</span>
                        </Label>
                    );
                })}
            </RadioGroup>
            )}

            {currentQuestionData.type === 'short-answer' && (
            <div className="space-y-2">
                <Input 
                    type="text" 
                    placeholder="Type your answer here..."
                    value={quizState.userAnswers[quizState.currentQuestionIndex] || ''}
                    onChange={(e) => handleAnswerSelect(e.target.value)}
                    disabled={isCurrentAnswerSubmitted}
                    className="text-base"
                />
                {!isCurrentAnswerSubmitted && (
                     <Button onClick={handleSubmitAnswer} disabled={!quizState.userAnswers[quizState.currentQuestionIndex]?.trim()}>Submit Answer</Button>
                )}
            </div>
            )}

            {isCurrentAnswerSubmitted && (
                <Alert variant={isMcqCorrect || (currentQuestionData.type === 'short-answer' && quizState.userAnswers[quizState.currentQuestionIndex]?.toLowerCase().trim() === currentQuestionData.answer.toLowerCase().trim()) ? 'default' : 'destructive'} className={cn(isMcqCorrect ? "bg-green-500/10 border-green-500/50" : "bg-destructive/10 border-destructive/50")}>
                     {isMcqCorrect || (currentQuestionData.type === 'short-answer' && quizState.userAnswers[quizState.currentQuestionIndex]?.toLowerCase().trim() === currentQuestionData.answer.toLowerCase().trim()) ? <CheckCircle className="h-5 w-5 text-green-600"/> : <XCircle className="h-5 w-5 text-destructive"/>}
                    <AlertTitle>{isMcqCorrect || (currentQuestionData.type === 'short-answer' && quizState.userAnswers[quizState.currentQuestionIndex]?.toLowerCase().trim() === currentQuestionData.answer.toLowerCase().trim()) ? "Correct!" : "Incorrect!"}</AlertTitle>
                    <AlertDescription>
                        {!isMcqCorrect && !(currentQuestionData.type === 'short-answer' && quizState.userAnswers[quizState.currentQuestionIndex]?.toLowerCase().trim() === currentQuestionData.answer.toLowerCase().trim()) && (
                            <p>Correct answer: <span className="font-semibold text-green-700 dark:text-green-500">{currentQuestionData.answer}</span></p>
                        )}
                        {currentQuestionData.explanation && <div className="mt-1 text-xs prose prose-xs dark:prose-invert max-w-none"><ReactMarkdown>{currentQuestionData.explanation}</ReactMarkdown></div>}
                    </AlertDescription>
                </Alert>
            )}

        </CardContent>
        <CardFooter className="flex justify-between p-6 border-t">
            <Button variant="outline" onClick={handlePrevQuestion} disabled={quizState.currentQuestionIndex === 0}>Previous</Button>
            {quizState.currentQuestionIndex < quizState.quiz.length - 1 ? (
            <Button onClick={handleNextQuestion} disabled={!isCurrentAnswerSubmitted && currentQuestionData.type === 'multiple-choice'}>Next</Button>
            ) : (
            <Button onClick={handleSubmitQuiz} variant="default" disabled={!isCurrentAnswerSubmitted && currentQuestionData.type === 'multiple-choice'}>Finish & View Results</Button>
            )}
        </CardFooter>
        </Card>
    </div>
  );
}

