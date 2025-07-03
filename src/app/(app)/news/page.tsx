
"use client";

import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useInfiniteQuery } from '@tanstack/react-query';
import { fetchNews } from '@/lib/news-api';
import type { NewsArticle } from '@/lib/types';
import { NewsCard } from '@/components/features/news/NewsCard';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Newspaper, Loader2, AlertTriangle, PlayCircle, PauseCircle, StopCircle, Volume1, Volume2, VolumeX } from 'lucide-react';
import { NewsFilters } from '@/components/features/news/NewsFilters';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useSound } from '@/hooks/useSound';
import { useToast } from '@/hooks/use-toast';
import { NEWS_LANGUAGES } from '@/lib/constants';
import { useSettings } from '@/contexts/SettingsContext';

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
  const [voicePreference, setVoicePreference] = useState<'holo' | 'gojo'>('holo');

  const { soundMode } = useSettings();
  const { playSound: playActionSound } = useSound('/sounds/custom-sound-2.mp3', 0.4);
  const { toast } = useToast();

  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [browserVoices, setBrowserVoices] = useState<SpeechSynthesisVoice[]>([]);
  
  const headlinesArrayForTTS = useRef<string[]>([]);
  const currentSpokenHeadlineIndexRef = useRef(0);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  useEffect(() => {
    const loadVoices = () => setBrowserVoices(window.speechSynthesis.getVoices());
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      loadVoices();
      if (window.speechSynthesis.onvoiceschanged !== undefined) {
        window.speechSynthesis.onvoiceschanged = loadVoices;
      }
    }
    return () => {
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.onvoiceschanged = null;
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const cancelLocalTTS = useCallback(() => {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    setIsSpeaking(false);
    setIsPaused(false);
    currentSpokenHeadlineIndexRef.current = 0;
  }, []);

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
    cancelLocalTTS();
    setAppliedFilters(filters);
  };
  const handleResetFilters = () => {
    playActionSound();
    cancelLocalTTS();
    setFilters(initialFilters);
    setAppliedFilters(initialFilters);
  };

  const articles = useMemo(() => {
    const allArticlesFlat = data?.pages.flatMap(page => page?.results ?? []) ?? [];
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
    headlinesArrayForTTS.current = articles.map(article => article.title).filter((title): title is string => !!title);
  }, [articles]);

  const speakNextHeadline = useCallback(() => {
    if (currentSpokenHeadlineIndexRef.current >= headlinesArrayForTTS.current.length) {
      setIsSpeaking(false);
      setIsPaused(false);
      currentSpokenHeadlineIndexRef.current = 0;
      toast({ title: "Finished Reading Headlines", description: "All loaded headlines have been read." });
      return;
    }
    const text = headlinesArrayForTTS.current[currentSpokenHeadlineIndexRef.current];

    if (typeof window === 'undefined' || !window.speechSynthesis || browserVoices.length === 0) {
      toast({ title: "TTS Not Ready", description: "Browser voices are not available yet.", variant: "default" });
      return;
    }
    
    const utterance = new SpeechSynthesisUtterance(text);
    utteranceRef.current = utterance;
    const lang = NEWS_LANGUAGES.find(l => l.value === appliedFilters.language)?.bcp47 || 'en-US';
    utterance.lang = lang;

    let targetVoice: SpeechSynthesisVoice | undefined;
    const voicesForLang = browserVoices.filter(v => v.lang.startsWith(lang.split('-')[0]));
    
    if (voicePreference === 'gojo') {
      const maleVoicePreferences = ['Daniel', 'Google US English', 'David', 'Alex'];
      targetVoice = voicesForLang.find(v => maleVoicePreferences.some(p => v.name.includes(p))) || voicesForLang.find(v => v.gender === 'male');
    } else {
      const femaleVoicePreferences = ['Samantha', 'Google UK English Female', 'Zira', 'Fiona'];
      targetVoice = voicesForLang.find(v => femaleVoicePreferences.some(p => v.name.includes(p))) || voicesForLang.find(v => v.gender === 'female');
    }
    utterance.voice = targetVoice || voicesForLang.find(v => v.default) || voicesForLang[0];

    utterance.onstart = () => { setIsSpeaking(true); setIsPaused(false); };
    utterance.onpause = () => { setIsSpeaking(true); setIsPaused(true); };
    utterance.onresume = () => { setIsSpeaking(true); setIsPaused(false); };
    utterance.onend = () => {
        currentSpokenHeadlineIndexRef.current++;
        speakNextHeadline(); // Automatically speak the next one
    };
    utterance.onerror = (e) => {
        console.error("SpeechSynthesis Error:", e);
        toast({ title: "Voice Error", description: `Could not play audio. (${e.error})`, variant: "destructive" });
        setIsSpeaking(false); setIsPaused(false);
    };
    
    window.speechSynthesis.speak(utterance);
  }, [browserVoices, voicePreference, appliedFilters.language, toast]);

  const handlePlaybackControl = () => {
    playActionSound();
    if (soundMode === 'muted') {
        toast({ title: "Sound Muted", description: "Please enable sound in settings to use this feature." });
        return;
    }
    if (isSpeaking && !isPaused) {
        window.speechSynthesis.pause();
    } else if (isPaused) {
        window.speechSynthesis.resume();
    } else {
        if (headlinesArrayForTTS.current.length === 0) {
            toast({ title: "No Headlines", description: "No news headlines available to read." });
            return;
        }
        currentSpokenHeadlineIndexRef.current = 0;
        speakNextHeadline();
    }
  };

  const handleStopTTS = () => {
    playActionSound();
    cancelLocalTTS();
  };

  const handleSetVoicePreference = (pref: 'gojo' | 'holo') => {
    playActionSound();
    cancelLocalTTS();
    setVoicePreference(pref);
  }

  const getPlaybackButtonTextAndIcon = () => {
    if (isSpeaking && !isPaused) return { text: "Pause", icon: <PauseCircle className="h-4 w-4 mr-2" /> };
    if (isPaused) return { text: "Resume", icon: <PlayCircle className="h-4 w-4 mr-2" /> };
    return { text: "Read Headlines", icon: <PlayCircle className="h-4 w-4 mr-2" /> };
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
                  onClick={() => handleSetVoicePreference('gojo')}
                  variant={voicePreference === 'gojo' ? 'default' : 'ghost'}
                  size="sm" className="text-xs h-8 px-3"
                >
                  Gojo
                </Button>
                <Button
                  onClick={() => handleSetVoicePreference('holo')}
                  variant={voicePreference === 'holo' || !voicePreference ? 'default' : 'ghost'}
                  size="sm" className="text-xs h-8 px-3"
                >
                  Holo
                </Button>
              </div>
              <Button onClick={handlePlaybackControl} variant="outline" className="h-9 w-full sm:w-auto" title={playbackButtonText} disabled={soundMode !== 'full'}>
                  {soundMode !== 'full' ? <VolumeX className="h-4 w-4 mr-2" /> : playbackButtonIcon} {soundMode === 'full' ? playbackButtonText : "Enable Full Sound"}
              </Button>
              <Button onClick={handleStopTTS} variant="outline" size="icon" className="h-9 w-9" title="Stop Reading" disabled={!isSpeaking && !isPaused}>
                <StopCircle className="h-5 w-5" />
              </Button>
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
