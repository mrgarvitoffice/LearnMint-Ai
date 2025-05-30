
"use client";

import React, { useState, useEffect, useCallback } from 'react';
import ReactMarkdown from 'react-markdown';
import { Card, CardContent, CardHeader, CardTitle, CardFooter, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { CheckCircle, XCircle, Lightbulb, RotateCcw } from 'lucide-react';
import { useSound } from '@/hooks/useSound';
import { useTTS } from '@/hooks/useTTS';
import { cn } from '@/lib/utils';
import type { QuizQuestion as QuizQuestionType } from '@/lib/types';

interface QuizViewProps {
  questions: QuizQuestionType[] | null;
  topic: string;
}

const QuizView: React.FC<QuizViewProps> = ({ questions, topic }) => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<Array<string | undefined>>([]);
  const [isAnswerSubmittedForCurrent, setIsAnswerSubmittedForCurrent] = useState<boolean>(false);
  const [quizFinished, setQuizFinished] = useState(false);
  const [score, setScore] = useState(0);
  const [shortAnswerValue, setShortAnswerValue] = useState('');
  
  const { playSound: playCorrectSound } = useSound('correct');
  const { playSound: playIncorrectSound } = useSound('incorrect');
  const { playSound: playClickSound } = useSound('/sounds/ting.mp3');
  const { speak, isSpeaking, isPaused, selectedVoice, setVoicePreference, supportedVoices } = useTTS();
  const voicePreferenceWasSetRef = React.useRef(false);

  useEffect(() => {
    if (supportedVoices.length > 0 && !voicePreferenceWasSetRef.current) {
      setVoicePreference('zia'); 
      voicePreferenceWasSetRef.current = true;
    }
  }, [supportedVoices, setVoicePreference]);

  const currentQuestion = questions ? questions[currentQuestionIndex] : null;

  useEffect(() => {
    if (questions && questions.length > 0) {
      setUserAnswers(Array(questions.length).fill(undefined));
      setIsAnswerSubmittedForCurrent(false);
      setQuizFinished(false);
      setScore(0);
      setCurrentQuestionIndex(0);
      setShortAnswerValue('');
    }
  }, [questions]);

  const processAnswer = useCallback((answerToSubmit: string) => {
    if (!currentQuestion || !questions) return;

    const isCorrect = answerToSubmit.toLowerCase().trim() === currentQuestion.answer.toLowerCase().trim();
    const newAnswers = [...userAnswers];
    newAnswers[currentQuestionIndex] = answerToSubmit;
    setUserAnswers(newAnswers);

    if (isCorrect) {
      setScore(prev => prev + 4);
      if (selectedVoice && !isSpeaking && !isPaused) speak("Correct!");
      playCorrectSound();
    } else {
      setScore(prev => prev - 1);
      if (selectedVoice && !isSpeaking && !isPaused) speak("Incorrect.");
      playIncorrectSound();
    }
    setIsAnswerSubmittedForCurrent(true);
  }, [currentQuestion, questions, userAnswers, playCorrectSound, playIncorrectSound, speak, selectedVoice, isSpeaking, isPaused]);


  const handleMcqOptionClick = useCallback((optionValue: string) => {
    if (isAnswerSubmittedForCurrent || !currentQuestion || currentQuestion.type !== 'multiple-choice') return;
    playClickSound();
    processAnswer(optionValue);
  }, [isAnswerSubmittedForCurrent, currentQuestion, processAnswer, playClickSound]);

  const handleShortAnswerSubmit = useCallback(() => {
    if (isAnswerSubmittedForCurrent || !currentQuestion || currentQuestion.type !== 'short-answer' || !shortAnswerValue.trim()) return;
    playClickSound();
    processAnswer(shortAnswerValue);
  }, [isAnswerSubmittedForCurrent, currentQuestion, shortAnswerValue, processAnswer, playClickSound]);


  const handleNextQuestion = () => {
    playClickSound();
    if (!questions || currentQuestionIndex >= questions.length - 1) return;
    setCurrentQuestionIndex(prev => prev + 1);
    setIsAnswerSubmittedForCurrent(false);
    setShortAnswerValue(userAnswers[currentQuestionIndex + 1] || ''); 
  };

  const handlePrevQuestion = () => {
    playClickSound();
    if (currentQuestionIndex <= 0) return;
    setCurrentQuestionIndex(prev => prev - 1);
    setIsAnswerSubmittedForCurrent(userAnswers[currentQuestionIndex -1] !== undefined); // Check if prev was answered
    setShortAnswerValue(userAnswers[currentQuestionIndex - 1] || ''); 
  };

  const handleViewResults = () => {
    playClickSound();
    if (!questions) return;
    // Score is calculated cumulatively, just set finished state
    setQuizFinished(true);
    if (selectedVoice && !isSpeaking && !isPaused) speak(`Quiz finished! Your final score is ${score} out of ${questions.length * 4}.`);
  };
  
  const handleRestartQuiz = () => {
    playClickSound();
    if (questions) {
        setUserAnswers(Array(questions.length).fill(undefined));
    }
    setQuizFinished(false);
    setScore(0);
    setCurrentQuestionIndex(0);
    setIsAnswerSubmittedForCurrent(false);
    setShortAnswerValue('');
    if (selectedVoice && !isSpeaking && !isPaused) speak("Quiz restarted.");
  };

  if (!questions || questions.length === 0) {
    return (
      <Card className="mt-6 shadow-lg flex-1 flex flex-col">
        <CardHeader><CardTitle className="text-lg md:text-xl text-primary font-semibold">Quiz on: {topic}</CardTitle></CardHeader>
        <CardContent className="flex-1 flex items-center justify-center"><p className="text-muted-foreground">No quiz questions available.</p></CardContent>
      </Card>
    );
  }
  
  if (quizFinished) {
    return (
      <Card className="mt-6 shadow-lg flex-1 flex flex-col min-h-0">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-primary">Quiz Results</CardTitle>
          <CardDescription>Topic: {topic} (Difficulty: Medium)</CardDescription>
          <p className="text-3xl font-bold mt-2">Your Score: {score} / {questions.length * 4}</p>
          <Progress value={(score / (questions.length * 4 || 1)) * 100} className="w-3/4 mx-auto mt-3 h-3" />
        </CardHeader>
        <CardContent className="space-y-3 flex-1 overflow-y-auto p-4">
          {questions.map((q, index) => {
            const userAnswer = userAnswers[index];
            const isCorrect = userAnswer && userAnswer.toLowerCase().trim() === q.answer.toLowerCase().trim();
            return (
              <Card key={index} className={cn("p-3", isCorrect ? "border-green-500 bg-green-500/10" : userAnswer !== undefined ? "border-destructive bg-destructive/10" : "border-border")}>
                <p className="font-semibold text-sm mb-1">Q{index + 1}: <ReactMarkdown className="prose prose-sm dark:prose-invert max-w-none inline">{q.question}</ReactMarkdown></p>
                <p className="text-xs">Your answer: <span className={cn("font-medium", isCorrect ? "text-green-700 dark:text-green-400" : "text-destructive")}>{userAnswer || "Not answered"}</span></p>
                {!isCorrect && <p className="text-xs">Correct answer: <span className="font-medium text-green-700 dark:text-green-400">{q.answer}</span></p>}
                {q.explanation && (
                  <Alert variant="default" className="mt-1.5 p-2 text-xs bg-accent/20 border-accent/30">
                    <Lightbulb className="h-3.5 w-3.5 text-accent-foreground/80" />
                    <AlertTitle className="text-xs font-semibold text-accent-foreground/90">Explanation</AlertTitle>
                    <AlertDescription className="prose prose-xs dark:prose-invert max-w-none text-muted-foreground"><ReactMarkdown>{q.explanation}</ReactMarkdown></AlertDescription>
                  </Alert>
                )}
              </Card>
            );
          })}
        </CardContent>
        <CardFooter className="justify-center p-4 border-t"><Button onClick={handleRestartQuiz} variant="outline"><RotateCcw className="mr-2 h-4 w-4"/>Restart Quiz</Button></CardFooter>
      </Card>
    );
  }

  if (!currentQuestion) return <p className="text-center text-muted-foreground p-4">Loading question...</p>;

  const currentSelectedAnswer = userAnswers[currentQuestionIndex];
  const isMcqCorrect = isAnswerSubmittedForCurrent && currentQuestion.type === 'multiple-choice' && currentSelectedAnswer?.toLowerCase().trim() === currentQuestion.answer.toLowerCase().trim();
  const isShortAnswerCorrect = isAnswerSubmittedForCurrent && currentQuestion.type === 'short-answer' && currentSelectedAnswer?.toLowerCase().trim() === currentQuestion.answer.toLowerCase().trim();
  const isCorrect = isMcqCorrect || isShortAnswerCorrect;

  return (
    <Card className="mt-6 shadow-lg flex-1 flex flex-col min-h-0">
      <CardHeader>
        <CardTitle className="text-lg md:text-xl text-primary font-semibold">Quiz on: {topic}</CardTitle>
        <CardDescription>Question {currentQuestionIndex + 1} of {questions.length} (Difficulty: Medium)</CardDescription>
        <Progress value={((currentQuestionIndex + 1) / questions.length) * 100} className="w-full mt-2 h-2.5" />
      </CardHeader>
      <CardContent className="space-y-4 flex-1 p-4 sm:p-6">
        <div className="text-base sm:text-lg font-semibold mb-4"><ReactMarkdown className="prose dark:prose-invert max-w-none">{currentQuestion.question}</ReactMarkdown></div>

        {currentQuestion.type === 'multiple-choice' && currentQuestion.options && (
          <RadioGroup value={currentSelectedAnswer} onValueChange={handleMcqOptionClick} className="space-y-2">
            {currentQuestion.options.map((option, i) => {
              const isSelected = currentSelectedAnswer === option;
              const isTheCorrectAnswer = option === currentQuestion.answer;
              return (
                <Label key={i} htmlFor={`option-${i}-${currentQuestionIndex}`}
                  className={cn(
                    "flex items-center space-x-2 p-3 border rounded-md transition-all",
                    isAnswerSubmittedForCurrent && isSelected && isCorrect && "bg-green-500/20 border-green-600 text-green-700 dark:text-green-400",
                    isAnswerSubmittedForCurrent && isSelected && !isCorrect && "bg-destructive/20 border-destructive text-destructive-foreground",
                    isAnswerSubmittedForCurrent && !isSelected && isTheCorrectAnswer && "border-green-600 ring-1 ring-green-500",
                    !isAnswerSubmittedForCurrent && "hover:bg-muted cursor-pointer has-[:checked]:bg-primary/10 has-[:checked]:border-primary"
                  )}>
                  <RadioGroupItem value={option} id={`option-${i}-${currentQuestionIndex}`} disabled={isAnswerSubmittedForCurrent}/>
                  <span className="text-sm sm:text-base">{option}</span>
                </Label>
              );
            })}
          </RadioGroup>
        )}

        {currentQuestion.type === 'short-answer' && (
          <div className="space-y-2">
            <Input type="text" placeholder="Type your answer here..." value={shortAnswerValue}
              onChange={(e) => setShortAnswerValue(e.target.value)}
              disabled={isAnswerSubmittedForCurrent} className="text-sm sm:text-base"
            />
            {!isAnswerSubmittedForCurrent && (
              <Button onClick={handleShortAnswerSubmit} disabled={!shortAnswerValue.trim()} className="mt-2">Submit Answer</Button>
            )}
          </div>
        )}

        {isAnswerSubmittedForCurrent && (
          <Alert variant={isCorrect ? 'default' : 'destructive'} className={cn("mt-4", isCorrect ? "bg-green-500/10 border-green-500/50" : "bg-destructive/10 border-destructive/50")}>
            {isCorrect ? <CheckCircle className="h-5 w-5 text-green-600"/> : <XCircle className="h-5 w-5 text-destructive"/>}
            <AlertTitle>{isCorrect ? "Correct!" : "Incorrect!"}</AlertTitle>
            <AlertDescription className="text-xs">
              {!isCorrect && <p>Correct answer: <span className="font-semibold text-green-700 dark:text-green-500">{currentQuestion.answer}</span></p>}
              {currentQuestion.explanation && <div className="mt-1 prose prose-xs dark:prose-invert max-w-none"><ReactMarkdown>{currentQuestion.explanation}</ReactMarkdown></div>}
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
      <CardFooter className="flex justify-between p-4 sm:p-6 border-t">
        <Button variant="outline" onClick={handlePrevQuestion} disabled={currentQuestionIndex === 0}>Previous</Button>
        {currentQuestionIndex < questions.length - 1 ? (
          <Button onClick={handleNextQuestion} disabled={!isAnswerSubmittedForCurrent}>Next Question</Button>
        ) : (
          <Button onClick={handleViewResults} variant="default" disabled={!isAnswerSubmittedForCurrent}>Finish & View Results</Button>
        )}
      </CardFooter>
    </Card>
  );
};

export default QuizView;
