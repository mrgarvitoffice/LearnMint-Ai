
"use client";

import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
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
    setVoicePreference,
    voicePreference
  } = useTTS();
  const pageTitleSpokenRef = useRef(false);
  const voicePreferenceWasSetRef = useRef(false);
  const { playSound: playActionSound } = useSound('/sounds/custom-sound-2.mp3', 0.4);
  const { toast } = useToast();

  const headlinesArrayForTTS = useRef<string[]>([]);
  const currentSpokenHeadlineIndexRef = useRef(0);
  const isSpeakingHindiSequenceRef = useRef(false);
  // State to help button text reflect sequence state accurately
  const [isDisplayingPauseForHindi, setIsDisplayingPauseForHindi] = useState(false);


  useEffect(() => {
    if (!voicePreferenceWasSetRef.current) {
      setVoicePreference('holo');
      voicePreferenceWasSetRef.current = true;
    }
  }, [setVoicePreference]);

  useEffect(() => {
    let isMounted = true;
    if (isMounted && !isSpeaking && !isPaused && !pageTitleSpokenRef.current) {
        speak(PAGE_TITLE);
      pageTitleSpokenRef.current = true;
    }
    return () => {
      isMounted = false;
    };
  }, [isSpeaking, isPaused, speak, appliedFilters.language]);

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
    cancelTTS(); // Stop any ongoing speech
    isSpeakingHindiSequenceRef.current = false; // Reset Hindi sequence state
    currentSpokenHeadlineIndexRef.current = 0;
    setIsDisplayingPauseForHindi(false);
    setAppliedFilters(filters);
    pageTitleSpokenRef.current = true; 
    if (!isSpeaking && !isPaused) {
      speak("Fetching news with new filters.");
    }
  };
  const handleResetFilters = () => {
    playActionSound();
    cancelTTS();
    isSpeakingHindiSequenceRef.current = false;
    currentSpokenHeadlineIndexRef.current = 0;
    setIsDisplayingPauseForHindi(false);
    setFilters(initialFilters);
    setAppliedFilters(initialFilters);
    pageTitleSpokenRef.current = true;
    if (!isSpeaking && !isPaused) {
      speak("News filters reset.");
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
      normalized = normalized.replace(/[^a-z0-9\s]/g, '');
      normalized = normalized.replace(/\s+/g, ' ').trim();
      return normalized;
    };

    allArticlesFlat.forEach(article => {
      const currentNormalizedTitle = normalizeTitleForKey(article.title);
      if (currentNormalizedTitle && seenNormalizedTitles.has(currentNormalizedTitle)) return;
      if (currentNormalizedTitle) seenNormalizedTitles.add(currentNormalizedTitle);

      let mapKey: string | null = null;
      if (article.article_id && article.article_id.trim() !== "") mapKey = `id-${article.article_id.trim()}`;
      if (!mapKey && article.link) {
        try {
          const url = new URL(article.link);
          const normalizedLink = url.hostname + url.pathname;
          if (normalizedLink) mapKey = `link-${normalizedLink}`;
        } catch (e) {/* ignore */}
      }
      if (!mapKey && currentNormalizedTitle) mapKey = `title-${currentNormalizedTitle}`;

      if (mapKey && !uniqueArticlesMap.has(mapKey)) uniqueArticlesMap.set(mapKey, article);
    });
    return Array.from(uniqueArticlesMap.values());
  }, [data]);

  useEffect(() => {
    const newHeadlinesArray = articles.map(article => article.title).filter(title => !!title);
    // Only update ref if content actually changed to prevent issues with ongoing sequences
    if (JSON.stringify(headlinesArrayForTTS.current) !== JSON.stringify(newHeadlinesArray)) {
        headlinesArrayForTTS.current = newHeadlinesArray;
        if (isSpeakingHindiSequenceRef.current) {
            cancelTTS();
            isSpeakingHindiSequenceRef.current = false;
            currentSpokenHeadlineIndexRef.current = 0;
            setIsDisplayingPauseForHindi(false);
        }
    }
  }, [articles, cancelTTS]);


  const speakNextHindiHeadline = useCallback(() => {
    if (!isSpeakingHindiSequenceRef.current || currentSpokenHeadlineIndexRef.current >= headlinesArrayForTTS.current.length) {
      isSpeakingHindiSequenceRef.current = false;
      setIsDisplayingPauseForHindi(false);
      currentSpokenHeadlineIndexRef.current = 0; // Reset for next time
      return;
    }
    const headlineToSpeak = headlinesArrayForTTS.current[currentSpokenHeadlineIndexRef.current];
    speak(headlineToSpeak, () => { // Pass the onEndCallback
      if (isSpeakingHindiSequenceRef.current) { // Check if still in sequence mode
        currentSpokenHeadlineIndexRef.current += 1;
        speakNextHindiHeadline(); // Call for the next one
      }
    });
  }, [speak]); // Removed headlinesArrayForTTS from deps, using ref directly

  const handlePlaybackControl = () => {
    playActionSound();
    const currentLanguageFilter = appliedFilters.language || 'en';

    if (currentLanguageFilter === 'hi') {
      if (isSpeakingHindiSequenceRef.current) { // If sequence is active
        if (isSpeaking && !isPaused) {
          pauseTTS();
          setIsDisplayingPauseForHindi(true); // Indicates we should show "Resume"
        } else if (isPaused) {
          resumeTTS();
          setIsDisplayingPauseForHindi(false); // Indicates we should show "Pause"
        } else { // Sequence was active but not speaking/paused (e.g., error, or just finished one and waiting)
          // This case might need re-triggering if it was an error state.
          // For simplicity, let's treat it as if we are starting the sequence from current index.
           cancelTTS(); // Clear any odd state
           setIsDisplayingPauseForHindi(false);
           speakNextHindiHeadline(); // Try to speak the current or next headline
        }
      } else { // Start new Hindi sequence
        if (headlinesArrayForTTS.current.length === 0) {
          toast({ title: "No Headlines", description: "No news headlines available to read.", variant: "default" });
          return;
        }
        cancelTTS(); // Ensure any previous non-sequence speech is stopped
        isSpeakingHindiSequenceRef.current = true;
        currentSpokenHeadlineIndexRef.current = 0; // Start from the beginning
        setIsDisplayingPauseForHindi(false); // Should show "Pause" once speech starts
        speakNextHindiHeadline();
      }
    } else { // For non-Hindi languages
      const nonHindiHeadlinesText = headlinesArrayForTTS.current.join('. ');
      if (!nonHindiHeadlinesText.trim()) {
          toast({ title: "No Headlines", description: "No news headlines available to read.", variant: "default" });
          return;
      }
      if (isSpeaking && !isPaused) {
          pauseTTS();
      } else if (isPaused) {
          resumeTTS();
      } else {
          cancelTTS();
          speak(nonHindiHeadlinesText);
      }
    }
  };

  const handleStopTTS = () => {
    playActionSound();
    cancelTTS();
    isSpeakingHindiSequenceRef.current = false;
    currentSpokenHeadlineIndexRef.current = 0;
    setIsDisplayingPauseForHindi(false);
  };
  
  const getPlaybackButtonTextAndIcon = () => {
    const currentLanguageFilter = appliedFilters.language || 'en';
    if (currentLanguageFilter === 'hi') {
      if (isSpeakingHindiSequenceRef.current) {
        return isPaused || isDisplayingPauseForHindi ? { text: "Resume", icon: <PlayCircle className="h-4 w-4 mr-2" /> } : { text: "Pause", icon: <PauseCircle className="h-4 w-4 mr-2" /> };
      }
      return { text: "Read Headlines", icon: <PlayCircle className="h-4 w-4 mr-2" /> };
    }
    // For non-Hindi
    return isSpeaking && !isPaused ? { text: "Pause", icon: <PauseCircle className="h-4 w-4 mr-2" /> } : 
           isPaused ? { text: "Resume", icon: <PlayCircle className="h-4 w-4 mr-2" /> } : 
           { text: "Read Headlines", icon: <PlayCircle className="h-4 w-4 mr-2" /> };
  };

  const { text: playbackButtonText, icon: playbackButtonIcon } = getPlaybackButtonTextAndIcon();


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
             <div className="flex items-center gap-1.5 p-1 bg-muted rounded-lg">
                <Button
                  onClick={() => { playActionSound(); setVoicePreference('gojo'); }}
                  variant={voicePreference === 'gojo' ? 'default' : 'ghost'}
                  size="sm" className="text-xs h-8 px-3"
                >
                  Gojo
                </Button>
                <Button
                  onClick={() => { playActionSound(); setVoicePreference('holo'); }}
                  variant={voicePreference === 'holo' || !voicePreference ? 'default' : 'ghost'}
                  size="sm" className="text-xs h-8 px-3"
                >
                  Holo
                </Button>
              </div>
              <Button onClick={handlePlaybackControl} variant="outline" className="h-9 w-full sm:w-auto" title={playbackButtonText}>
                  {playbackButtonIcon} {playbackButtonText}
              </Button>
              <Button onClick={handleStopTTS} variant="outline" size="icon" className="h-9 w-9" title="Stop Reading" disabled={!isSpeaking && !isPaused && !isSpeakingHindiSequenceRef.current}> <StopCircle className="h-5 w-5" /> </Button>
          </div>
        </CardContent>
        <CardContent>
          <NewsFilters filters={filters} onFilterChange={handleFilterChange} onApplyFilters={onApplyFilters} onResetFilters={handleResetFilters} isLoading={isLoading || isFetchingNextPage} />
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
