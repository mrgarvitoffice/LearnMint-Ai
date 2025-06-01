
"use client";

import { useState, useEffect, useRef, useMemo } from 'react';
import { useInfiniteQuery } from '@tanstack/react-query';
import { fetchNews } from '@/lib/news-api';
import type { NewsArticle } from '@/lib/types';
import { NewsCard } from '@/components/features/news/NewsCard';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Newspaper, Loader2, AlertTriangle, PlayCircle, PauseCircle, StopCircle, Speaker } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { NewsFilters } from '@/components/features/news/NewsFilters';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useTTS } from '@/hooks/useTTS';
import { useSound } from '@/hooks/useSound';
import { useToast } from '@/hooks/use-toast';
import { NEWS_LANGUAGES } from '@/lib/constants';


const PAGE_TITLE = "Global News Terminal";

interface NewsPageFilters {
  query: string;
  country: string;
  stateOrRegion: string;
  city: string;
  category: string;
  language: string;
}

const initialFilters: NewsPageFilters = { query: '', country: '', stateOrRegion: '', city: '', category: 'top', language: 'en' };


export default function NewsPage() {
  const [filters, setFilters] = useState<NewsPageFilters>(initialFilters);
  const [appliedFilters, setAppliedFilters] = useState<NewsPageFilters>(initialFilters);

  const {
    speak,
    pauseTTS,
    resumeTTS,
    cancelTTS,
    isSpeaking,
    isPaused,
    supportedVoices,
    selectedVoice,
    setVoicePreference,
    voicePreference
  } = useTTS();
  const pageTitleSpokenRef = useRef(false);
  const voicePreferenceWasSetRef = useRef(false);
  const { playSound: playActionSound } = useSound('/sounds/custom-sound-2.mp3', 0.4);
  const ttsHeadlinesRef = useRef<string>("");
  const { toast } = useToast();

  useEffect(() => {
    if (supportedVoices.length > 0 && !voicePreferenceWasSetRef.current) {
      // Default voice preference for UI elements, not necessarily for news reading
      setVoicePreference('luma');
      voicePreferenceWasSetRef.current = true;
    }
  }, [supportedVoices, setVoicePreference]);

  useEffect(() => {
    let isMounted = true;
    if (isMounted && selectedVoice && !isSpeaking && !isPaused && !pageTitleSpokenRef.current) {
      if (!ttsHeadlinesRef.current || ttsHeadlinesRef.current.trim() === "") {
        const currentLanguageFilter = appliedFilters.language || 'en';
        const languageInfo = NEWS_LANGUAGES.find(l => l.value === currentLanguageFilter);
        const bcp47Lang = languageInfo ? languageInfo.bcp47 : 'en-US';
        speak(PAGE_TITLE, bcp47Lang);
      }
      pageTitleSpokenRef.current = true;
    }
    return () => {
      isMounted = false;
    };
  }, [selectedVoice, isSpeaking, isPaused, speak, appliedFilters.language]);

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading, isError, error } = useInfiniteQuery({
    queryKey: ['news', appliedFilters],
    queryFn: ({ pageParam }) => fetchNews({
        query: appliedFilters.query, country: appliedFilters.country,
        stateOrRegion: appliedFilters.stateOrRegion, city: appliedFilters.city,
        category: appliedFilters.category, page: pageParam, language: appliedFilters.language
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

  const handleApplyFilters = () => {
    playActionSound();
    setAppliedFilters(filters);
    pageTitleSpokenRef.current = true;
    if (selectedVoice && !isSpeaking && !isPaused) {
      const currentLanguageFilter = filters.language || 'en';
      const languageInfo = NEWS_LANGUAGES.find(l => l.value === currentLanguageFilter);
      const bcp47Lang = languageInfo ? languageInfo.bcp47 : 'en-US';
      speak("Fetching news with new filters.", bcp47Lang);
    }
  };
  const handleResetFilters = () => {
    playActionSound();
    setFilters(initialFilters);
    setAppliedFilters(initialFilters);
    pageTitleSpokenRef.current = true;
    if (selectedVoice && !isSpeaking && !isPaused) {
      // Resetting filters implies default language (English) for this announcement
      speak("News filters reset.", "en-US");
    }
  };

  const articles = useMemo(() => {
    const allArticlesFlat = data?.pages.flatMap(page => page.results) ?? [];
    const uniqueArticlesMap = new Map<string, NewsArticle>();
    const seenNormalizedTitles = new Set<string>();

    const normalizeTitleForKey = (title: string | null | undefined): string => {
      if (!title) return "";
      let normalized = title.toLowerCase();
      const prefixes = ['breaking:', 'update:', 'live:', 'alert:', 'exclusive:', 'video:', 'photos:', 'watch:', 'opinion:'];
      for (const prefix of prefixes) {
        if (normalized.startsWith(prefix)) {
          normalized = normalized.substring(prefix.length).trim();
          break;
        }
      }
      normalized = normalized.replace(/[^a-z0-9\s]/g, ''); // Keep only letters, numbers, and spaces
      normalized = normalized.replace(/\s+/g, ' ').trim(); // Collapse multiple spaces
      return normalized;
    };

    allArticlesFlat.forEach(article => {
      const currentNormalizedTitle = normalizeTitleForKey(article.title);
      if (currentNormalizedTitle && seenNormalizedTitles.has(currentNormalizedTitle)) {
        return; // Skip if this exact normalized title has been seen
      }
      if (currentNormalizedTitle) {
        seenNormalizedTitles.add(currentNormalizedTitle);
      }

      let mapKey: string | null = null;
      if (article.article_id && article.article_id.trim() !== "") {
        mapKey = `id-${article.article_id.trim()}`;
      }

      if (!mapKey && article.link) {
        try {
          const url = new URL(article.link);
          const normalizedLink = url.hostname + url.pathname; // Use hostname + pathname
          if (normalizedLink) {
            mapKey = `link-${normalizedLink}`;
          }
        } catch (e) {
          // console.warn(`Could not parse article link for mapKey: ${article.link}`);
        }
      }

      // Title-based key is now effectively handled by seenNormalizedTitles,
      // but we still need a mapKey for the uniqueArticlesMap if ID/Link based failed.
      if (!mapKey && currentNormalizedTitle) {
         mapKey = `title-${currentNormalizedTitle}`; // Fallback mapKey
      }


      if (mapKey && !uniqueArticlesMap.has(mapKey)) {
        uniqueArticlesMap.set(mapKey, article);
      } else if (!mapKey) {
        // console.warn("Article skipped due to missing ID, Link, and valid Title for key generation:", article.title);
      }
    });
    return Array.from(uniqueArticlesMap.values());
  }, [data]);

  useEffect(() => {
    if (articles && articles.length > 0) {
        const numHeadlinesToRead = 10; // Standard limit for all languages
        const headlinesText = articles
            .slice(0, numHeadlinesToRead)
            .map(article => article.title)
            .filter(title => !!title)
            .join('. ');
        ttsHeadlinesRef.current = headlinesText;
    } else {
        ttsHeadlinesRef.current = "";
    }
  }, [articles]); // Removed appliedFilters.language as it's no longer used for slicing

  const handlePlaybackControl = () => {
    playActionSound();
    cancelTTS(); // Always cancel previous before starting new headline reading

    const textToPlay = ttsHeadlinesRef.current;
    if (!textToPlay.trim()) {
        toast({ title: "No Headlines", description: "No news headlines available to read.", variant: "default" });
        return;
    }

    const currentLanguageFilter = appliedFilters.language || 'en';
    const languageInfo = NEWS_LANGUAGES.find(l => l.value === currentLanguageFilter);
    const bcp47Lang = languageInfo ? languageInfo.bcp47 : 'en-US';

    if (isSpeaking && !isPaused) {
        pauseTTS();
    } else if (isPaused) {
        resumeTTS();
    } else {
        speak(textToPlay, bcp47Lang);
    }
  };

  const handleStopTTS = () => {
    playActionSound();
    cancelTTS();
  };

  const getSelectedDropdownValue = () => {
    if (voicePreference) return voicePreference;
    if (selectedVoice?.name.toLowerCase().includes('luma')) return 'luma';
    if (selectedVoice?.name.toLowerCase().includes('zia')) return 'zia';
    if (selectedVoice?.name.toLowerCase().includes('kai')) return 'kai';
    return 'luma';
  };

  return (
    <div className="container mx-auto max-w-7xl px-4 py-8 space-y-8">
      <Card className="shadow-xl bg-card/90 backdrop-blur-sm">
        <CardHeader className="text-center">
          <div className="flex items-center justify-center mb-4"><Newspaper className="h-12 w-12 text-primary" /></div>
          <CardTitle className="text-xl sm:text-2xl font-bold text-primary">{PAGE_TITLE}</CardTitle>
          <CardDescription>Stay updated with the latest news. Filter by keywords, country, category, and more.</CardDescription>
        </CardHeader>
        <CardContent className="pt-0 pb-4">
          <div className="mb-6 flex flex-col sm:flex-row justify-center items-center gap-2 border-t border-b py-3 border-border/50">
              <Select
                value={getSelectedDropdownValue()}
                onValueChange={(value) => {
                    playActionSound();
                    setVoicePreference(value as 'zia' | 'kai' | 'luma' | null);
                }}
              >
                  <SelectTrigger className="w-full sm:w-auto text-xs h-9 min-w-[120px]">
                      <Speaker className="h-3.5 w-3.5 mr-1.5 opacity-70"/>
                      <SelectValue placeholder="Voice" />
                  </SelectTrigger>
                  <SelectContent>
                      <SelectItem value="luma">Luma (Female)</SelectItem>
                      <SelectItem value="zia">Zia (Female)</SelectItem>
                      <SelectItem value="kai">Kai (Male)</SelectItem>
                  </SelectContent>
              </Select>
              <Button onClick={handlePlaybackControl} variant="outline" className="h-9 w-full sm:w-auto" title={isSpeaking && !isPaused ? "Pause Headlines" : isPaused ? "Resume Headlines" : "Read Headlines"}>
                  {isSpeaking && !isPaused ? <PauseCircle className="h-4 w-4 mr-2" /> : <PlayCircle className="h-4 w-4 mr-2" />} {isSpeaking && !isPaused ? "Pause" : isPaused ? "Resume" : "Read Headlines"}
              </Button>
              <Button onClick={handleStopTTS} variant="outline" size="icon" className="h-9 w-9" title="Stop Reading" disabled={!isSpeaking && !isPaused}> <StopCircle className="h-5 w-5" /> </Button>
          </div>
        </CardContent>
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
          {articles.map((article) => <NewsCard key={article.article_id || article.link || article.title} article={article} />)}
        </div>
      )}
      {hasNextPage && (
        <div className="flex justify-center mt-8">
          <Button onClick={() => { playActionSound(); fetchNextPage(); }} disabled={isFetchingNextPage}>
            {isFetchingNextPage && <Loader2 className="w-4 h-4 mr-2 animate-spin" />} Load More News
          </Button>
        </div>
      )}
    </div>
  );
}

