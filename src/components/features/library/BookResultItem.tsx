
"use client";

import type { GoogleBookItem } from '@/lib/types';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Image from 'next/image';
import { BookOpen, ExternalLink, BookText } from 'lucide-react';

interface BookResultItemProps {
  book: GoogleBookItem;
  onPreviewRequest: (book: GoogleBookItem) => void;
}

export function BookResultItem({ book, onPreviewRequest }: BookResultItemProps) {
  const placeholderImage = `https://placehold.co/300x450.png?text=${encodeURIComponent(book.title.substring(0, 10) + '...')}`;
  const dataAiHintKeywords = book.title.toLowerCase().split(' ').slice(0, 2).join(' ');

  const handlePrimaryAction = () => {
    onPreviewRequest(book); 
  };

  return (
    <Card className="flex flex-col overflow-hidden shadow-md hover:shadow-lg transition-shadow duration-300 group h-full">
      <CardHeader className="p-3 pb-2 cursor-pointer" onClick={handlePrimaryAction}>
        <div className="relative w-full aspect-[2/3] mb-2 rounded overflow-hidden bg-muted group-hover:opacity-90 transition-opacity">
          <Image
            src={book.thumbnailUrl || placeholderImage}
            alt={`Cover of ${book.title}`}
            fill={true}
            sizes="(max-width: 639px) 90vw, (max-width: 1023px) 45vw, 30vw" // Adjusted sizes
            style={{ objectFit: book.thumbnailUrl ? 'cover' : 'contain' }}
            data-ai-hint={dataAiHintKeywords}
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.srcset = placeholderImage;
              target.src = placeholderImage;
              target.style.objectFit = 'contain';
            }}
            quality={85} 
          />
           {(book.embeddable || !book.thumbnailUrl) && ( // Show icon if embeddable or if it's a placeholder
            <div className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <BookText className="w-10 h-10 text-white/80" />
            </div>
          )}
        </div>
        <CardTitle className="text-sm font-semibold line-clamp-2 group-hover:text-primary transition-colors">
          {book.title}
        </CardTitle>
        {book.authors && <CardDescription className="text-xs line-clamp-1 pt-0.5">{book.authors.join(', ')}</CardDescription>}
      </CardHeader>
      <CardContent className="p-3 pt-0 text-xs line-clamp-3 flex-grow text-muted-foreground cursor-pointer" onClick={handlePrimaryAction}>
        {book.description || "No description available."}
      </CardContent>
      <CardFooter className="p-3 pt-1 flex-col items-stretch gap-1.5">
        {book.embeddable ? (
          <Button variant="default" size="sm" onClick={handlePrimaryAction} className="w-full text-xs">
            <BookText className="mr-1.5 h-3.5 w-3.5" /> Read in App
          </Button>
        ) : (
          <Button variant="outline" size="sm" asChild className="w-full text-xs">
            <a href={book.webReaderLink || book.infoLink} target="_blank" rel="noopener noreferrer">
             <ExternalLink className="mr-1.5 h-3.5 w-3.5" /> View on Google Books
            </a>
          </Button>
        )}
        {book.infoLink && (book.embeddable || (!book.embeddable && book.infoLink !== (book.webReaderLink || book.infoLink))) && (
           <Button variant="link" size="sm" asChild className="w-full text-xs justify-center h-auto py-1 px-2">
            <a href={book.infoLink} target="_blank" rel="noopener noreferrer">
              More Info <ExternalLink className="ml-1 h-3 w-3" />
            </a>
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}

