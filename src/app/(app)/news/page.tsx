
"use client";

import { useState } from 'react';
import { useInfiniteQuery } from '@tanstack/react-query';
import { fetchNews } from '@/lib/news-api';
import type { NewsArticle } from '@/lib/types';
import { NewsCard } from '@/components/features/news/NewsCard';
import { NewsFilters } from '@/components/features/news/NewsFilters';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Newspaper, Loader2, AlertTriangle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'; // Added AlertTitle

const ALL_CATEGORIES_VALUE = "_all_categories_"; // Consistent with NewsFilters

interface NewsPageFilters {
  query: string;
  country: string;
  stateOrRegion: string;
  city: string;
  category: string;
}

const initialFilters: NewsPageFilters = {
  query: '',
  country: '', // Default to Any Country (represented by empty string)
  stateOrRegion: '',
  city: '',
  category: 'top', // Default to top headlines
};

export default function NewsPage() {
  const [filters, setFilters] = useState<NewsPageFilters>(initialFilters);
  const [appliedFilters, setAppliedFilters] = useState<NewsPageFilters>(initialFilters);

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
    error,
  } = useInfiniteQuery({
    queryKey: ['news', appliedFilters],
    queryFn: ({ pageParam }) => fetchNews({ 
        query: appliedFilters.query,
        country: appliedFilters.country, // Empty string means no specific country filter for API
        stateOrRegion: appliedFilters.stateOrRegion,
        city: appliedFilters.city,
        category: appliedFilters.category === ALL_CATEGORIES_VALUE ? '' : appliedFilters.category, 
        page: pageParam 
    }),
    initialPageParam: undefined as string | undefined, 
    getNextPageParam: (lastPage) => lastPage.nextPage, 
  });

  const handleFilterChange = (name: keyof NewsPageFilters, value: string) => {
    setFilters(prev => {
      const newFilters = { ...prev, [name]: value };
      // If country is cleared (set to "" which represents 'Any Country'), also clear state/region and city
      if (name === 'country' && !value) {
        newFilters.stateOrRegion = '';
        newFilters.city = '';
      }
      return newFilters;
    });
  };
  

  const handleApplyFilters = () => {
    setAppliedFilters(filters);
  };
  
  const handleResetFilters = () => {
    setFilters(initialFilters);
    setAppliedFilters(initialFilters);
  };

  const articles = data?.pages.flatMap(page => page.results) ?? [];

  return (
    <div className="space-y-8">
      <Card className="shadow-xl bg-card/80 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-2xl text-primary">
            <Newspaper className="w-7 h-7" />
            Daily News Digest
          </CardTitle>
          <CardDescription>Stay updated with the latest news. Filter by keywords, country, category, and more.</CardDescription>
        </CardHeader>
        <CardContent>
          <NewsFilters 
            filters={filters} 
            onFilterChange={handleFilterChange}
            onApplyFilters={handleApplyFilters}
            onResetFilters={handleResetFilters}
            isLoading={isLoading || isFetchingNextPage}
          />
        </CardContent>
      </Card>

      {isLoading && (
        <div className="flex justify-center items-center py-10">
          <Loader2 className="w-12 h-12 animate-spin text-primary" />
          <p className="ml-4 text-lg text-muted-foreground">Fetching latest news...</p>
        </div>
      )}

      {isError && (
        <Alert variant="destructive" className="mt-6">
          <AlertTriangle className="h-5 w-5" />
          <AlertTitle>News API Error</AlertTitle>
          <AlertDescription>
            Error fetching news: {error instanceof Error ? error.message : "An unknown error occurred."} 
            This could be due to an invalid or rate-limited API key for Newsdata.io, or a network issue. 
            Please check your NEWSDATA_API_KEY in your .env file and ensure it's set correctly in your Firebase environment variables if deployed.
          </AlertDescription>
        </Alert>
      )}

      {!isLoading && !isError && articles.length === 0 && (
        <div className="text-center py-10">
          <Newspaper className="w-16 h-16 mx-auto text-muted-foreground/50 mb-4" />
          <p className="text-xl text-muted-foreground">No news articles found.</p>
          <p className="text-sm text-muted-foreground/80">Try adjusting your search or filters, or check if the Newsdata.io API key is working.</p>
        </div>
      )}

      {articles.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {articles.map((article) => (
            <NewsCard key={article.article_id || article.link} article={article} />
          ))}
        </div>
      )}

      {hasNextPage && (
        <div className="flex justify-center mt-8">
          <Button onClick={() => fetchNextPage()} disabled={isFetchingNextPage}>
            {isFetchingNextPage ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : null}
            Load More News
          </Button>
        </div>
      )}
    </div>
  );
}
