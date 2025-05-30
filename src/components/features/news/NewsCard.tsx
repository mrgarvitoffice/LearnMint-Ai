import type { NewsArticle } from '@/lib/types';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Image from 'next/image';
import { ExternalLink, CalendarDays, Globe } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface NewsCardProps {
  article: NewsArticle;
}

export function NewsCard({ article }: NewsCardProps) {
  const placeholderImage = `https://placehold.co/600x400.png?text=${article.category?.[0] || 'News'}`;
  const dataAiHint = article.category?.[0] || 'news article';

  return (
    <Card className="flex flex-col h-full overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300">
      {article.image_url ? (
        <div className="relative w-full h-48">
          <Image 
            src={article.image_url} 
            alt={article.title} 
            layout="fill" 
            objectFit="cover"
            data-ai-hint={dataAiHint}
            onError={(e) => { (e.target as HTMLImageElement).src = placeholderImage; }}
          />
        </div>
      ) : (
         <div className="relative w-full h-48">
          <Image 
            src={placeholderImage}
            alt={article.title} 
            layout="fill" 
            objectFit="cover"
            data-ai-hint={dataAiHint}
          />
        </div>
      )}
      <CardHeader className="pb-3">
        <CardTitle className="text-lg leading-tight">{article.title}</CardTitle>
        <CardDescription className="text-xs text-muted-foreground pt-1">
          <span className="flex items-center gap-1"><Globe className="w-3 h-3" /> {article.source_id}</span>
          {article.pubDate && (
             <span className="flex items-center gap-1 mt-1">
                <CalendarDays className="w-3 h-3" />
                {formatDistanceToNow(new Date(article.pubDate), { addSuffix: true })}
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
