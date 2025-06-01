
import type { NewsArticle } from '@/lib/types';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ExternalLink, CalendarDays, Globe } from 'lucide-react';
import { format } from 'date-fns'; // Import format

interface NewsCardProps {
  article: NewsArticle;
}

export function NewsCard({ article }: NewsCardProps) {
  // Improved placeholder logic: uses article title snippet, then category, then default 'News'
  const placeholderTextContent = article.title?.substring(0, 25) || article.category?.[0] || 'News';
  const placeholderImage = `https://placehold.co/600x400.png?text=${encodeURIComponent(placeholderTextContent)}`;
  const dataAiHintForPlaceholder = placeholderTextContent.toLowerCase().split(' ').slice(0, 2).join(' ');


  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    const target = e.target as HTMLImageElement;
    target.src = placeholderImage;
    target.setAttribute('data-ai-hint', dataAiHintForPlaceholder); // Update hint for placeholder
  };

  const formattedDate = article.pubDate 
    ? format(new Date(article.pubDate), "do MMM ''yy") // Format: 30th May '25
    : 'Date not available';

  return (
    <Card className="flex flex-col h-full overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300">
      <div className="relative w-full h-48 overflow-hidden">
        <img
          src={article.image_url || placeholderImage}
          alt={article.title || "News article image"}
          className="w-full h-full object-cover"
          onError={handleImageError}
          loading="lazy"
          data-ai-hint={article.image_url ? (article.title?.toLowerCase().split(' ').slice(0,2).join(' ') || 'news article') : dataAiHintForPlaceholder}
        />
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
