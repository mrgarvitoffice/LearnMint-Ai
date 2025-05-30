
"use client";

import type { YoutubeVideoItem } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Image from 'next/image';
import { PlayCircle, CalendarDays } from 'lucide-react';
import { format } from 'date-fns';

interface YoutubeVideoResultItemProps {
  video: YoutubeVideoItem;
  onPlay: (video: YoutubeVideoItem) => void;
}

export function YoutubeVideoResultItem({ video, onPlay }: YoutubeVideoResultItemProps) {
  // Using medium thumbnail (320x180) or high (480x360) if available
  const thumbnailUrl = video.thumbnailUrl; // Already prefer medium/high from the action
  const placeholderImage = `https://placehold.co/320x180.png?text=${encodeURIComponent(video.title.substring(0,15) + '...')}`;
  const dataAiHintKeywords = video.title.toLowerCase().split(' ').slice(0, 2).join(' ');

  const publishedDateFormatted = video.publishedAt 
    ? format(new Date(video.publishedAt), 'PP') 
    : null;

  return (
    <Card className="overflow-hidden shadow-md hover:shadow-lg transition-shadow duration-300 flex flex-col h-full group">
      <button
        onClick={() => onPlay(video)}
        className="block w-full text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-t-lg"
        aria-label={`Play video: ${video.title}`}
      >
        <div className="relative w-full aspect-video bg-muted">
          <Image
            src={thumbnailUrl || placeholderImage}
            alt={`Thumbnail for ${video.title}`}
            fill={true}
            style={{ objectFit: 'cover' }}
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            data-ai-hint={dataAiHintKeywords}
            onError={(e) => { 
              (e.target as HTMLImageElement).srcset = placeholderImage; // Fallback for next/image
              (e.target as HTMLImageElement).src = placeholderImage; 
            }}
          />
          <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100 transition-opacity duration-300">
            <PlayCircle className="w-12 h-12 text-white/90" />
          </div>
        </div>
      </button>
      <CardHeader className="p-3 pb-1 flex-grow">
        <button onClick={() => onPlay(video)} className="block w-full text-left focus:outline-none">
          <CardTitle className="text-sm font-semibold line-clamp-2 hover:text-primary transition-colors">
            {video.title}
          </CardTitle>
        </button>
        <CardDescription className="text-xs pt-0.5 space-y-0.5">
            {video.channelTitle && (
              <span className="block line-clamp-1">{video.channelTitle}</span>
            )}
            {publishedDateFormatted && (
              <span className="flex items-center gap-1 text-muted-foreground/80">
                <CalendarDays className="w-3 h-3" /> {publishedDateFormatted}
              </span>
            )}
        </CardDescription>
      </CardHeader>
      <CardContent className="p-3 pt-1 text-xs text-muted-foreground line-clamp-2">
        {video.description || "No description available."}
      </CardContent>
    </Card>
  );
}
