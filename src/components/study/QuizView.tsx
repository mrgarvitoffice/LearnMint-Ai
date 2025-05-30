
"use client";

import React, { useState, useEffect, useCallback } from 'react'; // Added useEffect
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
import type { QuizQuestion as QuizQuestionTypeFromDoc } from '@/lib/types';

// Use the more detailed QuizQuestionType from lib/types if it includes 'type' and 'explanation'
interface QuizQuestion extends QuizQuestionTypeFromDoc {}


interface QuizViewProps {
  questions: QuizQuestion[] | null; // Can be null if error or no data
  topic: string;
}

const QuizView: React.FC<QuizViewProps> = ({ questions, topic }) => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<Array<string | undefined>>([]);
  const [quizFinished, setQuizFinished] = useState(false);
  const [score, setScore] = useState(0);
  const [shortAnswerValue, setShortAnswerValue] = useState('');

  const { playSound: playCorrectSound } = useSound('correct');
  const { playSound: playIncorrectSound } = useSound('incorrect');
  const { playSound: playClickSound } = useSound('/sounds/ting.mp3');
  const { speak, isSpeaking, selectedVoice, setVoicePreference, supportedVoices } = useTTS();
  const voicePreferenceWasSetRef = React.useRef(false);


  useEffect(() => {
    if (supportedVoices.length > 0 && !voicePreferenceWasSetRef.current) {
      setVoicePreference('female'); 
      voicePreferenceWasSetRef.current = true;
    }
  }, [supportedVoices, setVoicePreference]);


  const currentQuestion = questions ? questions[currentQuestionIndex] : null;

  useEffect(() => {
    if (questions) {
      setUserAnswers(Array(questions.length).fill(undefined));
      setQuizFinished(false);
      setScore(0);
      setCurrentQuestionIndex(0);
      setShortAnswerValue('');
    }
  }, [questions]);

  const handleAnswerSelect = (answer: string) => {
    playClickSound();
    if (!questions || quizFinished) return;
    const newAnswers = [...userAnswers];
    newAnswers[currentQuestionIndex] = answer;
    setUserAnswers(newAnswers);
    if (currentQuestion?.type === 'short-answer') {
      setShortAnswerValue(answer);
    }
  };
  
  const handleSubmitAnswer = useCallback(() => {
    if (!currentQuestion || !questions) return;
    playClickSound();
    
    let answerToSubmit = userAnswers[currentQuestionIndex];
    if (currentQuestion.type === 'short-answer') {
      answerToSubmit = shortAnswerValue;
    }

    if (answerToSubmit === undefined || answerToSubmit.trim() === "") {
      return; 
    }

    const isCorrect = answerToSubmit.toLowerCase().trim() === currentQuestion.answer.toLowerCase().trim();
    
    if (isCorrect) {
      if(selectedVoice && !isSpeaking) speak("Correct!");
      playCorrectSound();
    } else {
      if(selectedVoice && !isSpeaking) speak("Incorrect.");
      playIncorrectSound();
    }
    
  }, [currentQuestion, questions, userAnswers, shortAnswerValue, playClickSound, playCorrectSound, playIncorrectSound, speak, selectedVoice, isSpeaking]);


  const handleNextQuestion = () => {
    playClickSound();
    if (!questions || currentQuestionIndex >= questions.length - 1) return;
    setCurrentQuestionIndex(prev => prev + 1);
    setShortAnswerValue(userAnswers[currentQuestionIndex + 1] || ''); 
  };

  const handlePrevQuestion = () => {
    playClickSound();
    if (currentQuestionIndex <= 0) return;
    setCurrentQuestionIndex(prev => prev - 1);
    setShortAnswerValue(userAnswers[currentQuestionIndex - 1] || ''); 
  };

  const handleViewResults = () => {
    playClickSound();
    if (!questions) return;
    let currentScore = 0;
    questions.forEach((q, index) => {
      const userAnswer = userAnswers[index];
      if (userAnswer && userAnswer.toLowerCase().trim() === q.answer.toLowerCase().trim()) {
        currentScore++;
      }
    });
    setScore(currentScore);
    setQuizFinished(true);
    if(selectedVoice && !isSpeaking) speak(`Quiz finished! Your score is ${currentScore} out of ${questions.length}.`);
  };
  
  const handleRestartQuiz = () => {
    playClickSound();
    if (questions) {
        setUserAnswers(Array(questions.length).fill(undefined));
    }
    setQuizFinished(false);
    setScore(0);
    setCurrentQuestionIndex(0);
    setShortAnswerValue('');
    if(selectedVoice && !isSpeaking) speak("Quiz restarted.");
  };

  if (!questions || questions.length === 0) {
    return (
      <Card className="mt-6 shadow-lg flex-1 flex flex-col">
        <CardHeader>
          <CardTitle className="text-lg md:text-xl text-primary font-semibold">Quiz on: {topic}</CardTitle>
        </CardHeader>
        <CardContent className="flex-1 flex items-center justify-center">
          <p className="text-muted-foreground">No quiz questions available for this topic, or an error occurred.</p>
        </CardContent>
      </Card>
    );
  }
  
  if (quizFinished) {
    return (
      <Card className="mt-6 shadow-lg flex-1 flex flex-col min-h-0">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-primary">Quiz Results</CardTitle>
          <CardDescription>Topic: {topic}</CardDescription>
          <p className="text-3xl font-bold mt-2">Score: {score} / {questions.length}</p>
          <Progress value={(score / questions.length) * 100} className="w-3/4 mx-auto mt-3 h-3" />
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
                    <AlertDescription className="prose prose-xs dark:prose-invert max-w-none text-muted-foreground">
                      <ReactMarkdown>{q.explanation}</ReactMarkdown>
                    </AlertDescription>
                  </Alert>
                )}
              </Card>
            );
          })}
        </CardContent>
        <CardFooter className="justify-center p-4 border-t">
          <Button onClick={handleRestartQuiz} variant="outline"><RotateCcw className="mr-2 h-4 w-4"/>Restart Quiz</Button>
        </CardFooter>
      </Card>
    );
  }


  if (!currentQuestion) {
    return <p className="text-center text-muted-foreground p-4">Loading question...</p>;
  }

  return (
    <Card className="mt-6 shadow-lg flex-1 flex flex-col min-h-0">
      <CardHeader>
        <CardTitle className="text-lg md:text-xl text-primary font-semibold">Quiz on: {topic}</CardTitle>
        <CardDescription>Question {currentQuestionIndex + 1} of {questions.length}</CardDescription>
        <Progress value={((currentQuestionIndex + 1) / questions.length) * 100} className="w-full mt-2 h-2.5" />
      </CardHeader>
      <CardContent className="space-y-4 flex-1 p-4 sm:p-6">
        <div className="text-base sm:text-lg font-semibold mb-4">
          <ReactMarkdown className="prose dark:prose-invert max-w-none">{currentQuestion.question}</ReactMarkdown>
        </div>

        {currentQuestion.type === 'multiple-choice' && currentQuestion.options && (
          <RadioGroup
            value={userAnswers[currentQuestionIndex]}
            onValueChange={(value) => handleAnswerSelect(value)}
            className="space-y-2"
          >
            {currentQuestion.options.map((option, i) => (
              <Label key={i} htmlFor={`option-${i}-${currentQuestionIndex}`} className="flex items-center space-x-2 p-3 border rounded-md hover:bg-muted has-[:checked]:bg-primary/10 has-[:checked]:border-primary cursor-pointer">
                <RadioGroupItem value={option} id={`option-${i}-${currentQuestionIndex}`} />
                <span className="text-sm sm:text-base">{option}</span>
              </Label>
            ))}
          </RadioGroup>
        )}

        {currentQuestion.type === 'short-answer' && (
          <Input
            type="text"
            placeholder="Type your answer here..."
            value={shortAnswerValue}
            onChange={(e) => { setShortAnswerValue(e.target.value); }} // Store short answer immediately
            onBlur={() => handleAnswerSelect(shortAnswerValue)} // Finalize answer on blur
            className="text-sm sm:text-base"
          />
        )}
         {/* Optional: Button to submit answer for immediate feedback per question */}
         {/* Temporarily removed to simplify to single "View Results" path first */}
         {/* 
         <Button 
            onClick={handleSubmitAnswer} 
            disabled={currentQuestion.type === 'short-answer' ? !shortAnswerValue.trim() : !userAnswers[currentQuestionIndex]}
            className="mt-4"
          >
           Check Answer
         </Button> 
         */}
      </CardContent>
      <CardFooter className="flex justify-between p-4 sm:p-6 border-t">
        <Button variant="outline" onClick={handlePrevQuestion} disabled={currentQuestionIndex === 0}>Previous</Button>
        {currentQuestionIndex < questions.length - 1 ? (
          <Button onClick={handleNextQuestion}>Next</Button>
        ) : (
          <Button onClick={handleViewResults} variant="default">View Results</Button>
        )}
      </CardFooter>
    </Card>
  );
};

export default QuizView;
