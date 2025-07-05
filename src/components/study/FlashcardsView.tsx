
"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card'; 
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Loader2 } from 'lucide-react'; 
import FlashcardItem from './FlashcardItem';
import { Progress } from '@/components/ui/progress';
import { useSound } from '@/hooks/useSound';
import type { Flashcard as FlashcardType } from '@/lib/types';
import { useQuests } from '@/contexts/QuestContext';

interface FlashcardsViewProps {
  flashcards: FlashcardType[] | null;
  topic: string;
}

const FlashcardsView: React.FC<FlashcardsViewProps> = ({ flashcards, topic }) => {
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [viewedIndices, setViewedIndices] = useState(new Set<number>());
  const { playSound: playClickSound } = useSound('/sounds/ting.mp3', 0.3);
  const { quests, completeQuest3 } = useQuests();

  useEffect(() => {
    setCurrentCardIndex(0); 
    setViewedIndices(new Set([0]));
  }, [flashcards]);

  useEffect(() => {
    if (viewedIndices.size >= 5 && !quests.quest3Completed) {
      completeQuest3();
    }
  }, [viewedIndices, quests.quest3Completed, completeQuest3]);

  const handleNextCard = () => {
    playClickSound();
    if (flashcards && currentCardIndex < flashcards.length - 1) {
      const nextIndex = currentCardIndex + 1;
      setCurrentCardIndex(nextIndex);
      setViewedIndices(prev => new Set(prev).add(nextIndex));
    }
  };

  const handlePrevCard = () => {
    playClickSound();
    if (currentCardIndex > 0) {
      const prevIndex = currentCardIndex - 1;
      setCurrentCardIndex(prevIndex);
      setViewedIndices(prev => new Set(prev).add(prevIndex));
    }
  };

  if (!flashcards || flashcards.length === 0) {
    return (
      <Card className="mt-0 shadow-lg flex-1 flex flex-col min-h-0"> 
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

  if (!currentFlashcard) { 
    return (
        <Card className="mt-0 shadow-lg flex-1 flex flex-col min-h-0">
            <CardHeader>
                <CardTitle className="text-lg md:text-xl text-primary font-semibold">Flashcards for: {topic}</CardTitle>
            </CardHeader>
            <CardContent className="flex-1 flex items-center justify-center">
                 <Loader2 className="h-8 w-8 animate-spin text-primary" />
                 <p className="ml-3 text-muted-foreground">Loading flashcard...</p>
            </CardContent>
        </Card>
    );
  }

  return (
    <Card className="mt-0 shadow-lg flex-1 flex flex-col min-h-0"> 
      <CardHeader>
        <CardTitle className="text-lg md:text-xl text-primary font-semibold">Flashcards for: {topic}</CardTitle>
        <CardDescription>
          Card {currentCardIndex + 1} of {flashcards.length}
        </CardDescription>
        <Progress value={((currentCardIndex + 1) / flashcards.length) * 100} className="w-full mt-2 h-2" />
      </CardHeader>
      <CardContent className="flex flex-col items-center justify-center flex-1 p-4 sm:p-6 space-y-4 sm:space-y-6">
        <FlashcardItem
            key={currentCardIndex}
            flashcard={currentFlashcard}
            isCurrent={true} 
            className="w-full max-w-md h-64 sm:h-72 md:h-80" 
        />
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
