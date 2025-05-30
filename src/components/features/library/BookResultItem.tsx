
"use client";

import type { GoogleBookItem } from '@/lib/types';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Image from 'next/image';
import { BookOpen, ExternalLink, Eye } from 'lucide-react';

interface BookResultItemProps {
  book: GoogleBookItem;
  onPreviewRequest: (book: GoogleBookItem) => void;
}

export function BookResultItem({ book, onPreviewRequest }: BookResultItemProps) {
  const placeholderImage = `https://placehold.co/128x192.png?text=${encodeURIComponent(book.title.substring(0, 10) + '...')}`;
  const dataAiHintKeywords = book.title.toLowerCase().split(' ').slice(0, 2).join(' ');

  const handlePrimaryAction = () => {
    if (book.embeddable) {
      onPreviewRequest(book);
    } else if (book.webReaderLink || book.infoLink) {
      window.open(book.webReaderLink || book.infoLink, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <Card className="flex flex-col overflow-hidden shadow-md hover:shadow-lg transition-shadow duration-300 group h-full">
      <CardHeader className="p-3 pb-2 cursor-pointer" onClick={handlePrimaryAction}>
        <div className="relative w-full aspect-[2/3] mb-2 rounded overflow-hidden bg-muted group-hover:opacity-90 transition-opacity">
          <Image
            src={book.thumbnailUrl || placeholderImage}
            alt={`Cover of ${book.title}`}
            fill={true}
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            style={{ objectFit: 'cover' }} // Use cover for better fill, contain for placeholder might be better
            data-ai-hint={dataAiHintKeywords}
            onError={(e) => {
              (e.target as HTMLImageElement).srcset = placeholderImage;
              (e.target as HTMLImageElement).src = placeholderImage;
              (e.target as HTMLImageElement).style.objectFit = 'contain'; // Ensure placeholder is visible
            }}
          />
           {book.embeddable && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <Eye className="w-10 h-10 text-white/80" />
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
        {book.embeddable && (
          <Button variant="default" size="sm" onClick={() => onPreviewRequest(book)} className="w-full text-xs">
            <Eye className="mr-1.5 h-3.5 w-3.5" /> Preview in App
          </Button>
        )}
        {(book.webReaderLink || book.infoLink) && (
           <Button variant="outline" size="sm" asChild className="w-full text-xs">
            <a href={book.webReaderLink || book.infoLink} target="_blank" rel="noopener noreferrer">
              <BookOpen className="mr-1.5 h-3.5 w-3.5" /> View on Google Books <ExternalLink className="ml-1 h-3 w-3" />
            </a>
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
