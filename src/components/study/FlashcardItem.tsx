
"use client";

import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RotateCcw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSound } from '@/hooks/useSound';
import type { Flashcard as FlashcardType } from '@/lib/types';

interface FlashcardItemProps {
  flashcard: FlashcardType;
  isCurrent: boolean; // Can be used for animations or special styling if needed
  className?: string;
}

const FlashcardItem: React.FC<FlashcardItemProps> = ({ flashcard, className }) => {
  const [isFlipped, setIsFlipped] = useState(false);
  const { playSound: playFlipSound } = useSound('/sounds/ting.mp3', 0.2);

  const handleFlip = () => {
    playFlipSound();
    setIsFlipped(!isFlipped);
  };

  return (
    <div
      className={cn("perspective w-full h-full rounded-lg cursor-pointer", className)}
      onClick={handleFlip}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && handleFlip()}
      aria-pressed={isFlipped}
      aria-label={`Flashcard: ${flashcard.term}. Click to flip.`}
    >
      <Card
        className={cn(
          "relative w-full h-full preserve-3d transition-transform duration-700 ease-in-out shadow-xl",
          isFlipped && "rotate-y-180"
        )}
      >
        {/* Front of the card */}
        <CardContent className="absolute w-full h-full backface-hidden flex flex-col items-center justify-center p-4 sm:p-6 bg-card border rounded-lg">
          <h3 className="text-lg sm:text-xl md:text-2xl font-semibold text-center text-card-foreground">{flashcard.term}</h3>
          <Button variant="ghost" size="sm" className="absolute bottom-2 sm:bottom-4 right-2 sm:right-4 text-xs text-muted-foreground">
            <RotateCcw className="w-3 h-3 sm:w-4 sm:h-4 mr-1" /> Flip
          </Button>
        </CardContent>

        {/* Back of the card */}
        <CardContent className="absolute w-full h-full backface-hidden rotate-y-180 flex flex-col items-center justify-center p-4 sm:p-6 bg-secondary border rounded-lg">
          <p className="text-xs sm:text-sm md:text-base text-center text-secondary-foreground prose-sm dark:prose-invert max-w-none">
            {flashcard.definition}
          </p>
          <Button variant="ghost" size="sm" className="absolute bottom-2 sm:bottom-4 right-2 sm:right-4 text-xs text-secondary-foreground/80">
            <RotateCcw className="w-3 h-3 sm:w-4 sm:h-4 mr-1" /> Flip
          </Button>
        </CardContent>
      </Card>
      {/* Ensure these styles are globally available or defined in globals.css if not already part of your setup */}
      <style jsx global>{`
        .perspective {
          perspective: 1000px;
        }
        .preserve-3d {
          transform-style: preserve-3d;
        }
        .rotate-y-180 {
          transform: rotateY(180deg);
        }
        .backface-hidden {
          backface-visibility: hidden;
          -webkit-backface-visibility: hidden; /* Safari */
        }
      `}</style>
    </div>
  );
};

export default FlashcardItem;
