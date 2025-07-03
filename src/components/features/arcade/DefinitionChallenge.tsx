
"use client";

import { useState, useEffect, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { DEFINITION_CHALLENGE_WORDS } from '@/lib/constants';
import type { DefinitionChallengeWord } from '@/lib/types';
import { Lightbulb, CheckCircle, XCircle, Zap, RotateCcw } from 'lucide-react';
import { useSound } from '@/hooks/useSound';
import { useTTS } from '@/hooks/useTTS'; 
import { cn } from '@/lib/utils';

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
  const [mistakesMadeThisWord, setMistakesMadeThisWord] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [wordFailedMessage, setWordFailedMessage] = useState('');
  
  const { playSound: playCorrectSound } = useSound('/sounds/correct-answer.mp3', 0.5); 
  const { playSound: playIncorrectSound } = useSound('/sounds/incorrect-answer.mp3', 0.5); 
  const { playSound: playClickSound } = useSound('/sounds/ting.mp3', 0.3);
  const { speak, isSpeaking, isPaused, setVoicePreference } = useTTS();
  
  useEffect(() => {
    setVoicePreference('holo'); 
  }, [setVoicePreference]);

  const shuffleArray = (array: DefinitionChallengeWord[]) => {
    const newArray = [...array];
    for (let i = newArray.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    return newArray;
  };
  
  const initializeGame = useCallback(() => {
    playClickSound();
    setWords(shuffleArray(DEFINITION_CHALLENGE_WORDS));
    setCurrentWordIndex(0);
    setGuess('');
    setFeedback('');
    setIsCorrect(null);
    setHintsUsed(0);
    setShowHint(false);
    setGameOver(false);
    setMistakesMadeThisWord(0);
    setWordFailedMessage('');
  }, [playClickSound]);

  useEffect(() => {
    const storedHighScore = localStorage.getItem('learnmint-dc-highscore');
    if (storedHighScore) {
      setHighScore(parseInt(storedHighScore, 10));
    }
    initializeGame();
  }, [initializeGame]);

  const currentWord = words[currentWordIndex];

  const nextWord = useCallback(() => {
    if (currentWordIndex < words.length - 1) {
      setCurrentWordIndex(prev => prev + 1);
      setGuess('');
      setFeedback('');
      setIsCorrect(null);
      setHintsUsed(0);
      setShowHint(false);
      setMistakesMadeThisWord(0);
      setWordFailedMessage('');
    } else {
      setGameOver(true);
      const finalMessage = `Game Over! You completed all words. Your final streak: ${streak}. High Score: ${highScore}`;
      setFeedback(finalMessage);
      speak(finalMessage, { priority: 'essential' });
    }
  }, [currentWordIndex, words.length, streak, highScore, speak]);

  const handleGuessSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    playClickSound();
    if (!currentWord || gameOver || isCorrect === true) return;

    if (guess.trim().toLowerCase() === currentWord.term.toLowerCase()) {
      setFeedback('Correct!');
      setIsCorrect(true);
      const newStreak = streak + 1;
      setStreak(newStreak);
      if (newStreak > highScore) {
        setHighScore(newStreak);
        localStorage.setItem('learnmint-dc-highscore', newStreak.toString());
      }
      playCorrectSound();
      speak("Correct!", { priority: 'essential' });
      setTimeout(nextWord, 1500);
    } else {
      const newMistakes = mistakesMadeThisWord + 1;
      setMistakesMadeThisWord(newMistakes);
      setStreak(0);
      playIncorrectSound();
      speak("Incorrect.", { priority: 'essential' });

      if (newMistakes >= 3) {
        const failMsg = `Oops! The correct answer was: ${currentWord.term}`;
        setFeedback(failMsg);
        setWordFailedMessage(`The word was: ${currentWord.term}.`);
        speak(`The correct word was ${currentWord.term}.`, { priority: 'essential' });
        setIsCorrect(false); 
        setTimeout(nextWord, 2500); 
      } else {
        setFeedback(`Incorrect. Attempts remaining: ${3 - newMistakes}`);
        setIsCorrect(false);
      }
    }
  }, [playClickSound, currentWord, gameOver, isCorrect, guess, streak, highScore, mistakesMadeThisWord, nextWord, playCorrectSound, playIncorrectSound, speak]);

  const handleUseHint = () => {
    playClickSound();
    if (!currentWord || hintsUsed >= 3 || gameOver || isCorrect === true) return; 
    setShowHint(true);
    const newHintsUsed = hintsUsed + 1;
    setHintsUsed(newHintsUsed);
    let hintText = "";
    if (newHintsUsed === 1) {
      hintText = `Hint: ${currentWord.hint}`;
    } else if (newHintsUsed === 2) {
      hintText = `Hint: The first letter is "${currentWord.term[0]}"`;
    } else if (newHintsUsed === 3) {
      const lettersToShow = Math.ceil(currentWord.term.length / 3);
      hintText = `Hint: Starts with "${currentWord.term.substring(0, lettersToShow)}..."`;
    }
    setFeedback(hintText);
    speak(hintText, { priority: 'essential' });
  };

  const handleResetGameAndStreak = () => {
    playClickSound();
    setStreak(0); 
    initializeGame();
    speak("New game started.", { priority: 'essential' });
  }
  
  if (!currentWord && !gameOver) {
    return (
      <div className="flex justify-center items-center h-40">
        <Zap className="w-8 h-8 animate-spin text-primary" />
        <p className="ml-3 text-lg">Loading Definition Challenge...</p>
      </div>
    );
  }

  return (
    <Card className="w-full max-w-lg mx-auto shadow-lg">
      <CardHeader>
        <CardTitle className="text-xl text-primary">Definition Challenge</CardTitle>
        <CardDescription>Guess the term based on its definition. Good luck!</CardDescription>
        <div className="flex justify-between text-sm text-muted-foreground mt-2">
          <span>Word: {currentWordIndex + 1} / {words.length}</span>
          <div className="space-x-3">
            <span>Streak: {streak} <Zap className="inline h-4 w-4 text-yellow-500" /></span>
            <span>High Score: {highScore}</span>
          </div>
        </div>
         {!gameOver && currentWord && <p className="text-xs text-muted-foreground">Attempts remaining: {3 - mistakesMadeThisWord}</p>}
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
            <div className="p-4 bg-muted rounded-md min-h-[6rem] flex items-center justify-center">
              <p className="text-md text-center">{currentWord.definition}</p>
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
                  disabled={isCorrect === true || gameOver || mistakesMadeThisWord >=3}
                  className={cn(isCorrect === false && mistakesMadeThisWord < 3 ? 'border-destructive focus-visible:ring-destructive' : '')}
                />
              </div>
              <Button type="submit" className="w-full" disabled={isCorrect === true || gameOver || mistakesMadeThisWord >=3 || !guess.trim()}>
                Submit Guess
              </Button>
            </form>
            {wordFailedMessage && (
                 <Alert variant="destructive">
                    <XCircle className="h-5 w-5" />
                    <AlertTitle>Word Failed</AlertTitle>
                    <AlertDescription>{wordFailedMessage}</AlertDescription>
                </Alert>
            )}
            {isCorrect === true && (
              <Alert variant="default" className="bg-green-500/10 border-green-500">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <AlertTitle>Correct!</AlertTitle>
              </Alert>
            )}
            {isCorrect === false && feedback && !feedback.startsWith("Hint:") && mistakesMadeThisWord < 3 && (
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
            disabled={hintsUsed >= 3 || isCorrect === true || gameOver || mistakesMadeThisWord >= 3}
            className="w-full sm:w-auto"
        >
          <Lightbulb className="w-4 h-4 mr-2" /> Use Hint ({3 - hintsUsed} left)
        </Button>
        <Button onClick={handleResetGameAndStreak} variant="secondary" className="w-full sm:w-auto">
          <RotateCcw className="w-4 h-4 mr-2" /> New Game / Reset Streak
        </Button>
      </CardFooter>
    </Card>
  );
}
