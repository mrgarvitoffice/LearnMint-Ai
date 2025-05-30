
"use client";

import React, { useState, useCallback } from 'react';
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
import type { QuizQuestion as QuizQuestionTypeFromDoc } from '@/lib/types'; // Assuming this is more detailed

// Use the more detailed QuizQuestionType from lib/types if it includes 'type' and 'explanation'
// interface QuizQuestion extends QuizQuestionTypeFromDoc {}

// If GenerateQuizQuestionsOutput from the flow is { questions: QuizQuestionType[] }
// we use QuizQuestionType directly.
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
  const { speak } = useTTS(); // Assuming default voice preference is fine here

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
  
  const handleSubmitAnswer = () => {
    if (!currentQuestion || !questions) return;
    playClickSound();
    
    let answerToSubmit = userAnswers[currentQuestionIndex];
    if (currentQuestion.type === 'short-answer') {
      answerToSubmit = shortAnswerValue;
    }

    if (answerToSubmit === undefined || answerToSubmit.trim() === "") {
      // Consider if no answer should be treated as incorrect or just skipped for immediate feedback
      return; 
    }

    const isCorrect = answerToSubmit.toLowerCase().trim() === currentQuestion.answer.toLowerCase().trim();
    
    if (isCorrect) {
      speak("Correct!");
      playCorrectSound();
    } else {
      speak("Incorrect.");
      playIncorrectSound();
    }
    // Mark answer as submitted for immediate feedback display (optional for this view)
    // For now, feedback is mainly vocal and upon final results
    
    // Auto-advance or wait for next button for now
    if (currentQuestionIndex < questions.length - 1) {
        // For immediate feedback per question, you'd update some state here to show correct/incorrect
        // Then, maybe auto-advance or enable a "Next" button.
        // For this version, let's just allow navigation.
    } else {
        // Last question answered - potentially enable "View Results"
    }
  };


  const handleNextQuestion = () => {
    playClickSound();
    if (!questions || currentQuestionIndex >= questions.length - 1) return;
    setCurrentQuestionIndex(prev => prev + 1);
    setShortAnswerValue(userAnswers[currentQuestionIndex + 1] || ''); // Load next answer if already given
  };

  const handlePrevQuestion = () => {
    playClickSound();
    if (currentQuestionIndex <= 0) return;
    setCurrentQuestionIndex(prev => prev - 1);
    setShortAnswerValue(userAnswers[currentQuestionIndex - 1] || ''); // Load prev answer
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
    speak(`Quiz finished! Your score is ${currentScore} out of ${questions.length}.`);
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
    speak("Quiz restarted.");
  };

  if (!questions || questions.length === 0) {
    return (
      <Card className="mt-6 shadow-lg">
        <CardHeader>
          <CardTitle className="text-lg md:text-xl text-primary font-semibold">Quiz on: {topic}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">No quiz questions available for this topic, or an error occurred.</p>
        </CardContent>
      </Card>
    );
  }
  
  if (quizFinished) {
    return (
      <Card className="mt-6 shadow-lg">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-primary">Quiz Results</CardTitle>
          <CardDescription>Topic: {topic}</CardDescription>
          <p className="text-3xl font-bold mt-2">Score: {score} / {questions.length}</p>
          <Progress value={(score / questions.length) * 100} className="w-3/4 mx-auto mt-3 h-3" />
        </CardHeader>
        <CardContent className="space-y-3 max-h-[calc(100vh-30rem)] overflow-y-auto p-4">
          {questions.map((q, index) => {
            const userAnswer = userAnswers[index];
            const isCorrect = userAnswer && userAnswer.toLowerCase().trim() === q.answer.toLowerCase().trim();
            return (
              <Card key={index} className={cn("p-3", isCorrect ? "border-green-500 bg-green-500/10" : "border-destructive bg-destructive/10")}>
                <p className="font-semibold text-sm mb-1">Q{index + 1}: {q.question}</p>
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
        <CardFooter className="justify-center">
          <Button onClick={handleRestartQuiz} variant="outline"><RotateCcw className="mr-2 h-4 w-4"/>Restart Quiz</Button>
        </CardFooter>
      </Card>
    );
  }


  if (!currentQuestion) {
    return <p className="text-center text-muted-foreground p-4">Loading question...</p>;
  }

  return (
    <Card className="mt-6 shadow-lg flex-1 flex flex-col">
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
              <Label key={i} htmlFor={`option-${i}`} className="flex items-center space-x-2 p-3 border rounded-md hover:bg-muted has-[:checked]:bg-primary/10 has-[:checked]:border-primary cursor-pointer">
                <RadioGroupItem value={option} id={`option-${i}`} />
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
            onChange={(e) => { setShortAnswerValue(e.target.value); handleAnswerSelect(e.target.value);}}
            className="text-sm sm:text-base"
          />
        )}
        {/* Optional: Button to submit answer for immediate feedback per question (not in current doc spec fully) */}
        {/* <Button onClick={handleSubmitAnswer} disabled={!userAnswers[currentQuestionIndex] && currentQuestion.type === 'multiple-choice'}>Submit Answer</Button> */}
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
