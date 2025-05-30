
"use client";

import { useState, useEffect, useRef } from 'react';
import { useInfiniteQuery } from '@tanstack/react-query';
import { fetchNews } from '@/lib/news-api';
import type { NewsArticle } from '@/lib/types';
import { NewsCard } from '@/components/features/news/NewsCard';
import { NewsFilters } from '@/components/features/news/NewsFilters';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Newspaper, Loader2, AlertTriangle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useTTS } from '@/hooks/useTTS';

const PAGE_TITLE = "Global News Terminal";

interface NewsPageFilters {
  query: string;
  country: string; 
  stateOrRegion: string;
  city: string;
  category: string; 
}

const initialFilters: NewsPageFilters = { query: '', country: '', stateOrRegion: '', city: '', category: '' };


export default function NewsPage() {
  const [filters, setFilters] = useState<NewsPageFilters>(initialFilters);
  const [appliedFilters, setAppliedFilters] = useState<NewsPageFilters>(initialFilters);

  const { speak, isSpeaking, isPaused, selectedVoice, setVoicePreference, supportedVoices, voicePreference } = useTTS();
  const pageTitleSpokenRef = useRef(false);
  const voicePreferenceWasSetRef = useRef(false);

  useEffect(() => {
    if (supportedVoices.length > 0 && !voicePreferenceWasSetRef.current) {
      setVoicePreference('zia'); 
      voicePreferenceWasSetRef.current = true;
    }
  }, [supportedVoices, setVoicePreference]);

  useEffect(() => {
    let isMounted = true;
    if (isMounted && selectedVoice && !isSpeaking && !isPaused && !pageTitleSpokenRef.current) {
      speak(PAGE_TITLE);
      pageTitleSpokenRef.current = true;
    }
    return () => { isMounted = false; };
  }, [selectedVoice, isSpeaking, isPaused, speak]);

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading, isError, error } = useInfiniteQuery({
    queryKey: ['news', appliedFilters],
    queryFn: ({ pageParam }) => fetchNews({
        query: appliedFilters.query, country: appliedFilters.country, 
        stateOrRegion: appliedFilters.stateOrRegion, city: appliedFilters.city,
        category: appliedFilters.category, page: pageParam
    }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextPage,
    refetchOnWindowFocus: false, 
  });

  const handleFilterChange = (name: keyof NewsPageFilters, value: string) => {
    setFilters(prev => {
      const newFilters = { ...prev, [name]: value };
      if (name === 'country') { 
        newFilters.stateOrRegion = ''; 
        newFilters.city = ''; 
      }
      return newFilters;
    });
  };

  const handleApplyFilters = () => { setAppliedFilters(filters); pageTitleSpokenRef.current = true; /* Prevent re-announcement on filter apply */ };
  const handleResetFilters = () => { setFilters(initialFilters); setAppliedFilters(initialFilters); pageTitleSpokenRef.current = true; };

  const articles = data?.pages.flatMap(page => page.results) ?? [];

  return (
    <div className="container mx-auto max-w-7xl px-4 py-8 space-y-8">
      <Card className="shadow-xl bg-card/90 backdrop-blur-sm">
        <CardHeader className="text-center">
          <div className="flex items-center justify-center mb-4"><Newspaper className="h-7 w-7 text-primary" /></div>
          <CardTitle className="text-xl sm:text-2xl font-bold text-primary">{PAGE_TITLE}</CardTitle>
          <CardDescription>Stay updated with the latest news. Filter by keywords, country, category, and more.</CardDescription>
        </CardHeader>
        <CardContent>
          <NewsFilters filters={filters} onFilterChange={handleFilterChange} onApplyFilters={handleApplyFilters} onResetFilters={handleResetFilters} isLoading={isLoading || isFetchingNextPage} />
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
            Please check your NEWSDATA_API_KEY in your .env file and ensure it's set correctly if deployed.
          </AlertDescription>
        </Alert>
      )}
      {!isLoading && !isError && articles.length === 0 && (
        <div className="text-center py-10">
          <Newspaper className="w-16 h-16 mx-auto text-muted-foreground/50 mb-4" />
          <p className="text-xl text-muted-foreground">No news articles found.</p>
          <p className="text-sm text-muted-foreground/80">Try adjusting your search or filters.</p>
        </div>
      )}
      {articles.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {articles.map((article) => <NewsCard key={article.article_id || article.link} article={article} />)}
        </div>
      )}
      {hasNextPage && (
        <div className="flex justify-center mt-8">
          <Button onClick={() => fetchNextPage()} disabled={isFetchingNextPage}>
            {isFetchingNextPage && <Loader2 className="w-4 h-4 mr-2 animate-spin" />} Load More News
          </Button>
        </div>
      )}
    </div>
  );
}


    