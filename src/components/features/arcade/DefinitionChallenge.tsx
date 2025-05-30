
"use client";

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { DEFINITION_CHALLENGE_WORDS } from '@/lib/constants';
import type { DefinitionChallengeWord } from '@/lib/types';
import { Lightbulb, CheckCircle, XCircle, Zap, RotateCcw } from 'lucide-react';
import { useSound } from '@/hooks/useSound';

export function DefinitionChallenge() {
  const [words, setWords] = useState<DefinitionChallengeWord[]>([]);
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [guess, setGuess] = useState('');
  const [feedback, setFeedback] = useState('');
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [hintsUsed, setHintsUsed] = useState(0);
  const [showHint, setShowHint] = useState(false);
  const [streak, setStreak] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  
  const { playSound: playCorrectSound } = useSound('/sounds/correct-answer.mp3', 0.5); 
  const { playSound: playIncorrectSound } = useSound('/sounds/incorrect-answer.mp3', 0.4); 
  const { playSound: playClickSound } = useSound('/sounds/ting.mp3', 0.3);

  const shuffleArray = (array: DefinitionChallengeWord[]) => {
    const newArray = [...array];
    for (let i = newArray.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    return newArray;
  };
  
  const initializeGame = useCallback(() => {
    playClickSound(); // Sound for new game / reset
    setWords(shuffleArray(DEFINITION_CHALLENGE_WORDS));
    setCurrentWordIndex(0);
    setGuess('');
    setFeedback('');
    setIsCorrect(null);
    setHintsUsed(0);
    setShowHint(false);
    setGameOver(false);
    // Streak is intentionally not reset here for "New Game", but is for "Reset Streak"
  }, [playClickSound]);

  const handleResetGameAndStreak = () => {
    playClickSound();
    setStreak(0); // Reset streak
    initializeGame(); // Then initialize a new game
  }

  useEffect(() => {
    initializeGame();
  }, [initializeGame]);

  const currentWord = words[currentWordIndex];

  const handleGuessSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    playClickSound();
    if (!currentWord || gameOver) return;

    if (guess.trim().toLowerCase() === currentWord.term.toLowerCase()) {
      setFeedback('Correct!');
      setIsCorrect(true);
      setStreak(prev => prev + 1);
      playCorrectSound();
      setTimeout(nextWord, 1500);
    } else {
      setFeedback('Incorrect. Try again or use a hint!');
      setIsCorrect(false);
      setStreak(0); 
      playIncorrectSound();
    }
  };

  const nextWord = () => {
    if (currentWordIndex < words.length - 1) {
      setCurrentWordIndex(prev => prev + 1);
      setGuess('');
      setFeedback('');
      setIsCorrect(null);
      setHintsUsed(0);
      setShowHint(false);
    } else {
      setGameOver(true);
      setFeedback(`Game Over! You completed all words. Your final streak: ${streak}.`);
    }
  };

  const handleUseHint = () => {
    playClickSound();
    if (!currentWord || hintsUsed >= 2 || gameOver) return; 
    setShowHint(true);
    setHintsUsed(prev => prev + 1);
    if (hintsUsed === 0) {
      setFeedback(`Hint: ${currentWord.hint}`);
    } else if (hintsUsed === 1) {
      const lettersToShow = Math.ceil(currentWord.term.length / 3);
      setFeedback(`Hint: Starts with "${currentWord.term.substring(0, lettersToShow)}..."`);
    }
  };
  
  if (!currentWord && !gameOver) {
    return (
      <div className="flex justify-center items-center h-40">
        <Zap className="w-8 h-8 animate-spin text-primary" />
        <p className="ml-3 text-lg">Loading Definition Challenge...</p>
      </div>
    );
  }


  return (
    <Card className="w-full max-w-lg mx-auto">
      <CardHeader>
        <CardTitle className="text-xl">Definition Challenge</CardTitle>
        <CardDescription>Guess the term based on its definition. Good luck!</CardDescription>
        <div className="flex justify-between text-sm text-muted-foreground mt-2">
          <span>Word: {currentWordIndex + 1} / {words.length}</span>
          <span>Streak: {streak} <Zap className="inline h-4 w-4 text-yellow-500" /></span>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {gameOver ? (
          <Alert variant="default" className="bg-green-500/10 border-green-500">
            <CheckCircle className="h-5 w-5 text-green-600" />
            <AlertTitle>Challenge Complete!</AlertTitle>
            <AlertDescription>{feedback}</AlertDescription>
          </Alert>
        ) : currentWord ? (
          <>
            <div className="p-4 bg-muted rounded-md min-h-[6rem]">
              <p className="text-md">{currentWord.definition}</p>
            </div>
            {showHint && feedback.startsWith("Hint:") && (
              <Alert variant="default" className="bg-primary/10 border-primary/30">
                <Lightbulb className="h-5 w-5 text-primary" />
                <AlertTitle>Hint</AlertTitle>
                <AlertDescription>{feedback.replace("Hint: ", "")}</AlertDescription>
              </Alert>
            )}
            <form onSubmit={handleGuessSubmit} className="space-y-3">
              <div>
                <Label htmlFor="guess">Your Guess</Label>
                <Input
                  id="guess"
                  value={guess}
                  onChange={(e) => setGuess(e.target.value)}
                  disabled={isCorrect === true || gameOver}
                  className={isCorrect === false ? 'border-destructive' : ''}
                />
              </div>
              <Button type="submit" className="w-full" disabled={isCorrect === true || gameOver}>
                Submit Guess
              </Button>
            </form>
            {isCorrect === true && (
              <Alert variant="default" className="bg-green-500/10 border-green-500">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <AlertTitle>Correct!</AlertTitle>
              </Alert>
            )}
            {isCorrect === false && feedback && !feedback.startsWith("Hint:") && (
              <Alert variant="destructive">
                <XCircle className="h-5 w-5" />
                <AlertTitle>Incorrect</AlertTitle>
                <AlertDescription>{feedback}</AlertDescription>
              </Alert>
            )}
          </>
        ) : null }
      </CardContent>
      <CardFooter className="flex flex-col sm:flex-row justify-between gap-2">
        <Button 
            variant="outline" 
            onClick={handleUseHint} 
            disabled={hintsUsed >= 2 || isCorrect === true || gameOver}
            className="w-full sm:w-auto"
        >
          <Lightbulb className="w-4 h-4 mr-2" /> Use Hint ({2 - hintsUsed} left)
        </Button>
        <Button onClick={handleResetGameAndStreak} variant="secondary" className="w-full sm:w-auto">
          <RotateCcw className="w-4 h-4 mr-2" /> New Game / Reset Streak
        </Button>
      </CardFooter>
    </Card>
  );
}
