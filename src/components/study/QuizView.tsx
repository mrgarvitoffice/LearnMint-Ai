
"use client";

import React, { useState, useEffect, useCallback, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import { Card, CardContent, CardHeader, CardTitle, CardFooter, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { CheckCircle, XCircle, Lightbulb, RotateCcw, Loader2 } from 'lucide-react';
import { useSound } from '@/hooks/useSound';
import { useTTS } from '@/hooks/useTTS';
import { cn } from '@/lib/utils';
import type { QuizQuestion as QuizQuestionType } from '@/lib/types';

interface QuizViewProps {
  questions: QuizQuestionType[] | null;
  topic: string;
  difficulty?: 'easy' | 'medium' | 'hard';
}

const QuizView: React.FC<QuizViewProps> = ({ questions, topic, difficulty = 'medium' }) => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<Array<string | undefined>>([]);
  const [isAnswerFinalized, setIsAnswerFinalized] = useState<boolean>(false); // Feedback shown for current question
  const [quizFinished, setQuizFinished] = useState(false);
  const [score, setScore] = useState(0);
  const [shortAnswerValue, setShortAnswerValue] = useState('');
  const [selectedMcqOption, setSelectedMcqOption] = useState<string | null>(null);
  
  const { playSound: playCorrectSound } = useSound('/sounds/correct-answer.mp3', 0.5);
  const { playSound: playIncorrectSound } = useSound('/sounds/incorrect-answer.mp3', 0.5);
  const { playSound: playClickSound } = useSound('/sounds/ting.mp3', 0.3);
  const { speak, selectedVoice, isSpeaking, isPaused, setVoicePreference, supportedVoices, voicePreference } = useTTS();
  
  const voicePreferenceWasSetRef = useRef(false);

  useEffect(() => {
    if (supportedVoices.length > 0 && !voicePreferenceWasSetRef.current) {
      voicePreferenceWasSetRef.current = true;
    }
  }, [supportedVoices, setVoicePreference]);

  useEffect(() => {
    if (questions && questions.length > 0) {
      setUserAnswers(Array(questions.length).fill(undefined));
      setIsAnswerFinalized(false);
      setQuizFinished(false);
      setScore(0);
      setCurrentQuestionIndex(0);
      setShortAnswerValue('');
      setSelectedMcqOption(null);
    }
  }, [questions]);

  const currentQuestion = questions ? questions[currentQuestionIndex] : null;

  const finalizeAnswer = useCallback((answerGiven: string) => {
    if (!currentQuestion || isAnswerFinalized) return;

    const isCorrect = answerGiven.toLowerCase().trim() === currentQuestion.answer.toLowerCase().trim();
    const newAnswers = [...userAnswers];
    newAnswers[currentQuestionIndex] = answerGiven;
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
    setIsAnswerFinalized(true);
  }, [currentQuestion, isAnswerFinalized, userAnswers, currentQuestionIndex, playCorrectSound, playIncorrectSound, speak, selectedVoice, isSpeaking, isPaused]);


  const handleMcqOptionClick = useCallback((optionValue: string) => {
    if (isAnswerFinalized || !currentQuestion || currentQuestion.type !== 'multiple-choice') return;
    playClickSound();
    setSelectedMcqOption(optionValue);
    finalizeAnswer(optionValue);
  }, [isAnswerFinalized, currentQuestion, finalizeAnswer, playClickSound, setSelectedMcqOption]);

  const handleShortAnswerSubmit = useCallback(() => {
    if (isAnswerFinalized || !currentQuestion || !shortAnswerValue.trim()) return;
    // This check ensures it only submits if it's effectively a short answer question
    const isEffectivelyShortAnswer = currentQuestion.type === 'short-answer' || 
                                 (currentQuestion.type === 'multiple-choice' && (!currentQuestion.options || currentQuestion.options.length === 0));
    if (!isEffectivelyShortAnswer) return;

    playClickSound();
    finalizeAnswer(shortAnswerValue);
  }, [isAnswerFinalized, currentQuestion, shortAnswerValue, finalizeAnswer, playClickSound]);

  const handleNextQuestion = () => {
    playClickSound();
    if (!questions || currentQuestionIndex >= questions.length - 1) {
      if (!quizFinished) handleViewResults(); 
      return;
    }
    const nextIndex = currentQuestionIndex + 1;
    setCurrentQuestionIndex(nextIndex);
    
    const nextQuestionData = questions[nextIndex];
    const nextUserAnswer = userAnswers[nextIndex];

    setIsAnswerFinalized(!!nextUserAnswer); 
    setSelectedMcqOption(nextQuestionData?.type === 'multiple-choice' && nextUserAnswer ? nextUserAnswer : null);
    setShortAnswerValue(nextUserAnswer || ''); 
  };

  const handlePrevQuestion = () => {
    playClickSound();
    if (currentQuestionIndex <= 0) return;
    const prevIndex = currentQuestionIndex - 1;
    setCurrentQuestionIndex(prevIndex);
    
    const prevQuestionData = questions?.[prevIndex];
    const prevUserAnswer = userAnswers[prevIndex];

    setIsAnswerFinalized(!!prevUserAnswer);
    setSelectedMcqOption(prevQuestionData?.type === 'multiple-choice' && prevUserAnswer ? prevUserAnswer : null);
    setShortAnswerValue(prevUserAnswer || ''); 
  };

  const handleViewResults = () => {
    playClickSound();
    if (!questions) return;
    setQuizFinished(true);
    const totalPossibleScore = questions.length * 4;
    const finalScoreMessage = `Quiz finished! Your final score is ${score} out of ${totalPossibleScore}.`;
    if (selectedVoice && !isSpeaking && !isPaused) speak(finalScoreMessage);
  };
  
  const handleRestartQuiz = () => {
    playClickSound();
    if (questions) {
        setUserAnswers(Array(questions.length).fill(undefined));
    }
    setQuizFinished(false);
    setScore(0);
    setCurrentQuestionIndex(0);
    setIsAnswerFinalized(false);
    setShortAnswerValue('');
    setSelectedMcqOption(null);
    if (selectedVoice && !isSpeaking && !isPaused) speak("Quiz restarted.");
  };

  if (!questions || questions.length === 0) {
    return (
      <Card className="mt-0 shadow-lg flex-1 flex flex-col min-h-0">
        <CardHeader><CardTitle className="text-lg md:text-xl text-primary font-semibold">Quiz on: {topic}</CardTitle></CardHeader>
        <CardContent className="flex-1 flex items-center justify-center"><p className="text-muted-foreground">No quiz questions available.</p></CardContent>
      </Card>
    );
  }
  
  if (quizFinished) {
    const totalPossibleScore = questions.length * 4;
    return (
      <Card className="mt-0 shadow-lg flex-1 flex flex-col min-h-0">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-primary">Quiz Results</CardTitle>
          <CardDescription>Topic: {topic} (Difficulty: {difficulty})</CardDescription>
          <p className="text-3xl font-bold mt-2">Your Score: {score} / {totalPossibleScore}</p>
          <Progress value={((score / (totalPossibleScore || 1)) * 100)} className="w-3/4 mx-auto mt-3 h-3" />
        </CardHeader>
        <CardContent className="space-y-3 flex-1 overflow-y-auto p-4">
          {questions.map((q, index) => {
            const userAnswer = userAnswers[index];
            const isCorrect = userAnswer && userAnswer.toLowerCase().trim() === q.answer.toLowerCase().trim();
            return (
              <Card key={index} className={cn("p-3", isCorrect ? "border-green-500 bg-green-500/10" : userAnswer !== undefined ? "border-destructive bg-destructive/10" : "border-border")}>
                <p className="font-semibold text-sm mb-1">Q{index + 1}: <ReactMarkdown className="prose prose-sm dark:prose-invert max-w-none inline">{q.question}</ReactMarkdown></p>
                <p className="text-xs">Your answer: <span className={cn("font-medium", isCorrect ? "text-green-700 dark:text-green-400" : "text-destructive")}>{userAnswer || "Not answered"}</span></p>
                {!isCorrect && <p className="text-xs">Correct answer: <span className="font-medium text-green-700 dark:text-green-500">{q.answer}</span></p>}
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

  if (!currentQuestion) return <div className="p-4 text-center"><Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" /><p className="text-muted-foreground mt-2">Loading question...</p></div>;

  const isCurrentAnswerCorrect = isAnswerFinalized && userAnswers[currentQuestionIndex]?.toLowerCase().trim() === currentQuestion.answer.toLowerCase().trim();

  // Determine effective type for rendering
  const isEffectivelyMultipleChoice = currentQuestion.type === 'multiple-choice' && 
                                      currentQuestion.options && currentQuestion.options.length > 0;
  const isEffectivelyShortAnswer = currentQuestion.type === 'short-answer' || 
                                   (currentQuestion.type === 'multiple-choice' && (!currentQuestion.options || currentQuestion.options.length === 0));


  return (
    <Card className="mt-0 shadow-lg flex-1 flex flex-col min-h-0"> 
      <CardHeader>
        <CardTitle className="text-lg md:text-xl text-primary font-semibold">Quiz on: {topic}</CardTitle>
        <CardDescription>Question {currentQuestionIndex + 1} of {questions.length} (Difficulty: {difficulty})</CardDescription>
        <Progress value={((currentQuestionIndex + 1) / questions.length) * 100} className="w-full mt-2 h-2.5" />
      </CardHeader>
      <CardContent className="space-y-4 flex-1 p-4 sm:p-6">
        <div className="text-base sm:text-lg font-semibold mb-4"><ReactMarkdown className="prose dark:prose-invert max-w-none">{currentQuestion.question}</ReactMarkdown></div>

        {isEffectivelyMultipleChoice && currentQuestion.options && (
          <RadioGroup 
            value={selectedMcqOption || undefined} 
            className="space-y-2"
          >
            {currentQuestion.options.map((option, i) => {
              const isThisOptionSelected = selectedMcqOption === option;
              const isCorrectAnswer = option === currentQuestion.answer;
              return (
                <Label key={i} htmlFor={`option-${i}-${currentQuestionIndex}`}
                  onClick={() => handleMcqOptionClick(option)}
                  className={cn(
                    "flex items-center space-x-3 p-3 border rounded-md transition-all",
                    isAnswerFinalized && isThisOptionSelected && isCorrectAnswer && "bg-green-500/20 border-green-600 text-green-700 dark:text-green-400 ring-2 ring-green-500",
                    isAnswerFinalized && isThisOptionSelected && !isCorrectAnswer && "bg-destructive/20 border-destructive text-destructive-foreground ring-2 ring-destructive",
                    isAnswerFinalized && !isThisOptionSelected && isCorrectAnswer && "border-green-600 bg-green-500/10", 
                    !isAnswerFinalized && "hover:bg-muted cursor-pointer",
                    isAnswerFinalized && "cursor-default"
                  )}>
                  <RadioGroupItem 
                    value={option} 
                    id={`option-${i}-${currentQuestionIndex}`} 
                    disabled={isAnswerFinalized} 
                    checked={selectedMcqOption === option} 
                    className="sr-only" 
                  />
                  <div className={cn(
                      "w-4 h-4 rounded-full border border-primary flex items-center justify-center shrink-0",
                      isAnswerFinalized && isThisOptionSelected && isCorrectAnswer && "bg-green-600 border-green-700",
                      isAnswerFinalized && isThisOptionSelected && !isCorrectAnswer && "bg-destructive border-destructive",
                      selectedMcqOption === option && !isAnswerFinalized && "bg-primary/20"
                  )}>
                      {(isAnswerFinalized && isThisOptionSelected && isCorrectAnswer) && <CheckCircle className="h-3 w-3 text-white" />}
                      {(isAnswerFinalized && isThisOptionSelected && !isCorrectAnswer) && <XCircle className="h-3 w-3 text-white" />}
                      {(selectedMcqOption === option && !isAnswerFinalized) && <div className="w-2 h-2 bg-primary rounded-full" />}
                  </div>
                  <span className="text-sm sm:text-base">{option}</span>
                </Label>
              );
            })}
          </RadioGroup>
        )}

        {isEffectivelyShortAnswer && (
          <div className="space-y-2">
            <Input type="text" placeholder="Type your answer here..." value={shortAnswerValue}
              onChange={(e) => setShortAnswerValue(e.target.value)}
              disabled={isAnswerFinalized} className="text-sm sm:text-base"
              onKeyDown={(e) => { if (e.key === 'Enter' && !isAnswerFinalized && shortAnswerValue.trim()) handleShortAnswerSubmit(); }}
            />
            {!isAnswerFinalized && (
              <Button onClick={handleShortAnswerSubmit} disabled={!shortAnswerValue.trim()} className="mt-2">Submit Answer</Button>
            )}
          </div>
        )}

        {!isEffectivelyMultipleChoice && !isEffectivelyShortAnswer && currentQuestion && (
             <Alert variant="destructive" className="mt-4">
                <AlertTriangle className="h-5 w-5"/>
                <AlertTitle>Question Format Error</AlertTitle>
                <AlertDescription className="text-xs">
                This question is not in a recognizable format (e.g., multiple-choice with missing options, or an unknown type). Please check the AI generation source or skip this question.
                </AlertDescription>
            </Alert>
        )}


        {isAnswerFinalized && (
          <Alert variant={isCurrentAnswerCorrect ? 'default' : 'destructive'} className={cn("mt-4", isCurrentAnswerCorrect ? "bg-green-500/10 border-green-500/50" : "bg-destructive/10 border-destructive/50")}>
            {isCurrentAnswerCorrect ? <CheckCircle className="h-5 w-5 text-green-600"/> : <XCircle className="h-5 w-5 text-destructive"/>}
            <AlertTitle>{isCurrentAnswerCorrect ? "Correct!" : "Incorrect!"}</AlertTitle>
            <AlertDescription className="text-xs">
              {!isCurrentAnswerCorrect && <p>Correct answer: <span className="font-semibold text-green-700 dark:text-green-500">{currentQuestion.answer}</span></p>}
              {currentQuestion.explanation && <div className="mt-1 prose prose-xs dark:prose-invert max-w-none"><ReactMarkdown>{currentQuestion.explanation}</ReactMarkdown></div>}
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
      <CardFooter className="flex justify-between p-4 sm:p-6 border-t">
        <Button variant="outline" onClick={handlePrevQuestion} disabled={currentQuestionIndex === 0}>Previous</Button>
        {currentQuestionIndex < questions.length - 1 ? (
          <Button onClick={handleNextQuestion} disabled={!isAnswerFinalized}>Next Question</Button>
        ) : (
          <Button onClick={handleViewResults} variant="default" disabled={!isAnswerFinalized}>Finish & View Results</Button>
        )}
      </CardFooter>
    </Card>
  );
};

export default QuizView;
