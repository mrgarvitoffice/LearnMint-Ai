
"use client";

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card'; // Added CardFooter
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import FlashcardItem from './FlashcardItem';
import { Progress } from '@/components/ui/progress';
import { useSound } from '@/hooks/useSound';
import type { Flashcard as FlashcardType } from '@/lib/types';

interface FlashcardsViewProps {
  flashcards: FlashcardType[] | null;
  topic: string;
}

const FlashcardsView: React.FC<FlashcardsViewProps> = ({ flashcards, topic }) => {
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const { playSound: playClickSound } = useSound('/sounds/ting.mp3', 0.3);

  const handleNextCard = () => {
    playClickSound();
    if (flashcards && currentCardIndex < flashcards.length - 1) {
      setCurrentCardIndex(prev => prev + 1);
    }
  };

  const handlePrevCard = () => {
    playClickSound();
    if (currentCardIndex > 0) {
      setCurrentCardIndex(prev => prev - 1);
    }
  };

  if (!flashcards || flashcards.length === 0) {
    return (
      <Card className="mt-6 shadow-lg flex-1 flex flex-col">
        <CardHeader>
          <CardTitle className="text-lg md:text-xl text-primary font-semibold">Flashcards for: {topic}</CardTitle>
        </CardHeader>
        <CardContent className="flex-1 flex items-center justify-center">
          <p className="text-muted-foreground">No flashcards available for this topic, or an error occurred.</p>
        </CardContent>
      </Card>
    );
  }
  
  const currentFlashcard = flashcards[currentCardIndex];

  return (
    <Card className="mt-6 shadow-lg flex-1 flex flex-col min-h-0">
      <CardHeader>
        <CardTitle className="text-lg md:text-xl text-primary font-semibold">Flashcards for: {topic}</CardTitle>
        <CardDescription>
          Card {currentCardIndex + 1} of {flashcards.length}
        </CardDescription>
        <Progress value={((currentCardIndex + 1) / flashcards.length) * 100} className="w-full mt-2 h-2" />
      </CardHeader>
      <CardContent className="flex flex-col items-center justify-center flex-1 p-4 sm:p-6 space-y-4 sm:space-y-6">
        {currentFlashcard && (
          <FlashcardItem
            flashcard={currentFlashcard}
            isCurrent={true} 
            className="w-full max-w-md h-64 sm:h-72 md:h-80" 
          />
        )}
      </CardContent>
      <CardFooter className="flex justify-between p-4 sm:p-6 border-t">
        <Button variant="outline" onClick={handlePrevCard} disabled={currentCardIndex === 0} className="px-3 sm:px-4">
          <ChevronLeft className="w-4 h-4 mr-1 sm:mr-2" /> Previous
        </Button>
        <Button variant="outline" onClick={handleNextCard} disabled={currentCardIndex === flashcards.length - 1} className="px-3 sm:px-4">
          Next <ChevronRight className="w-4 h-4 ml-1 sm:ml-2" />
        </Button>
      </CardFooter>
    </Card>
  );
};

export default FlashcardsView;
