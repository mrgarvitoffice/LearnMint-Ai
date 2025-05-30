
"use client";

import React from 'react';
import { Button } from '@/components/ui/button';
import { Sparkles } from 'lucide-react';
import Image from 'next/image'; // Use next/image for placeholders too

interface AiGeneratedImageProps {
  promptText: string;
}

const AiGeneratedImage: React.FC<AiGeneratedImageProps> = ({ promptText }) => {
  const googleImagesUrl = `https://www.google.com/search?tbm=isch&q=${encodeURIComponent(promptText)}`;
  
  // Create a concise placeholder text, max 50 chars
  const placeholderText = promptText.length > 50 ? promptText.substring(0, 47) + "..." : promptText;
  const placeholderUrl = `https://placehold.co/600x400.png?text=${encodeURIComponent(placeholderText)}`;

  // Generate a simple 2-word hint for data-ai-hint from the prompt
  const hintKeywords = promptText.toLowerCase().split(/\s+/).slice(0, 2).join(" ");

  return (
    <div className="my-6 p-3 sm:p-4 border border-dashed border-primary/50 rounded-lg bg-background/30 text-center shadow-md">
      <p className="text-xs text-muted-foreground mb-1 uppercase tracking-wider">Visual Aid Suggested</p>
      <p className="font-semibold text-primary mb-2 text-sm sm:text-base">{promptText}</p>
      <div className="aspect-video bg-muted rounded overflow-hidden flex items-center justify-center mb-3 ring-1 ring-border">
        <Image
            src={placeholderUrl}
            alt={`Placeholder: ${promptText}`}
            width={600} // Provide explicit width for non-fill layout
            height={400} // Provide explicit height
            className="max-w-full max-h-full object-contain" // Still useful for containment
            data-ai-hint={hintKeywords} // For potential future image replacement tools
        />
      </div>
      <Button variant="outline" size="sm" asChild className="text-xs sm:text-sm">
        <a href={googleImagesUrl} target="_blank" rel="noopener noreferrer">
          <Sparkles className="mr-1.5 h-3.5 w-3.5" /> Search on Google Images
        </a>
      </Button>
    </div>
  );
};

export default AiGeneratedImage;
