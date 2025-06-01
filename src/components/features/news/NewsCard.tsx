
"use client";

import type { NewsArticle } from '@/lib/types';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ExternalLink, CalendarDays, Globe, ImageOff } from 'lucide-react';
import { format } from 'date-fns';
import { useState, useEffect } from 'react';

interface NewsCardProps {
  article: NewsArticle;
}

export function NewsCard({ article }: NewsCardProps) {
  const placeholderTextContent = article.title?.substring(0, 25) || article.category?.[0] || 'News';
  const placeholderImageBase = `https://placehold.co/600x400.png`;
  const placeholderImageWithText = `${placeholderImageBase}?text=${encodeURIComponent(placeholderTextContent)}`;
  const dataAiHintForPlaceholder = placeholderTextContent.toLowerCase().split(' ').slice(0, 2).join(' ');

  const [currentImageSrc, setCurrentImageSrc] = useState<string>(article.image_url || placeholderImageWithText);
  const [imageLoadError, setImageLoadError] = useState<boolean>(false);

  useEffect(() => {
    // Reset state when the article prop changes significantly (ID or link or image_url itself)
    // This ensures that if a component instance is reused for a new article, its image state is fresh.
    console.log(`NewsCard Effect: Article changed. Old ID: ${article.article_id || article.link}, New Image URL: ${article.image_url}`);
    setCurrentImageSrc(article.image_url || placeholderImageWithText);
    setImageLoadError(false);
  }, [article.article_id, article.link, article.image_url, placeholderImageWithText]); // Added article.link and article.image_url

  const handleError = () => {
    if (currentImageSrc === placeholderImageWithText) {
      // Placeholder itself failed or was the initial src and failed
      console.error(`NewsCard: Placeholder image ALSO FAILED for article: ${article.title?.substring(0,30)}... Placeholder URL was: ${placeholderImageWithText}`);
      setImageLoadError(true); // Mark that we cannot show any image.
    } else {
      // Original image failed, switch to placeholder
      console.warn(`NewsCard: Original image FAILED for article: ${article.title?.substring(0,30)}... (URL: ${article.image_url}). Switching to placeholder: ${placeholderImageWithText}`);
      setCurrentImageSrc(placeholderImageWithText);
      // imageLoadError remains false for now, as we're *trying* the placeholder.
      // If the placeholder itself triggers an error, this handleError will be called again,
      // and the condition `currentImageSrc === placeholderImageWithText` will be true, setting imageLoadError.
    }
  };

  const formattedDate = article.pubDate
    ? format(new Date(article.pubDate), "do MMM ''yy")
    : 'Date not available';

  const getDynamicDataAiHint = () => {
    if (imageLoadError || (!article.image_url && currentImageSrc === placeholderImageWithText)) {
      // If error or original image was null and we're on placeholder
      return dataAiHintForPlaceholder;
    }
    // Otherwise, use title-based hint for the original image
    return article.title?.toLowerCase().split(' ').slice(0,2).join(' ') || 'news article';
  };

  return (
    <Card className="flex flex-col h-full overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300">
      <div className="relative w-full h-48 overflow-hidden bg-muted flex items-center justify-center">
        {imageLoadError ? (
          <div className="flex flex-col items-center justify-center text-muted-foreground p-2">
            <ImageOff className="w-10 h-10 mb-1" />
            <span className="text-xs text-center">Image unavailable</span>
          </div>
        ) : (
          <img
            src={currentImageSrc}
            alt={article.title || "News article image"}
            className="w-full h-full object-cover"
            onError={handleError}
            loading="lazy"
            data-ai-hint={getDynamicDataAiHint()}
          />
        )}
      </div>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg leading-tight">{article.title}</CardTitle>
        <CardDescription className="text-xs text-muted-foreground pt-1">
          <span className="flex items-center gap-1"><Globe className="w-3 h-3" /> {article.source_id}</span>
          {article.pubDate && (
             <span className="flex items-center gap-1 mt-1">
                <CalendarDays className="w-3 h-3" />
                {formattedDate}
             </span>
          )}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-grow pb-4">
        <p className="text-sm text-muted-foreground line-clamp-3">
          {article.description || "No description available."}
        </p>
      </CardContent>
      <CardFooter>
        <Button asChild variant="outline" size="sm" className="w-full">
          <a href={article.link} target="_blank" rel="noopener noreferrer">
            Read More <ExternalLink className="w-4 h-4 ml-2" />
          </a>
        </Button>
      </CardFooter>
    </Card>
  );
}
