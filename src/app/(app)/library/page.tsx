
"use client";

import { useState, useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MATH_FACTS_FALLBACK } from '@/lib/constants';
import { fetchMathFact } from '@/lib/math-fact-api';
import type { MathFact } from '@/lib/types';
import { ResourceCard } from '@/components/features/library/ResourceCard';
import { BookMarked, Search, Youtube, Lightbulb, BookOpen, Brain, ExternalLink, Loader2 } from 'lucide-react';
import { useTTS } from '@/hooks/useTTS';

const PAGE_TITLE = "LearnMint Knowledge Hub";

export default function LibraryPage() {
  const [youtubeSearchTerm, setYoutubeSearchTerm] = useState('');
  const [googleBooksSearchTerm, setGoogleBooksSearchTerm] = useState('');
  const [currentMathFact, setCurrentMathFact] = useState<MathFact | null>(null);

  const { speak, isSpeaking, isPaused, selectedVoice, setVoicePreference, supportedVoices, voicePreference, cancelTTS } = useTTS();
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
    return () => {
      isMounted = false;
    };
  }, [selectedVoice, isSpeaking, isPaused, speak]);

  const { data: mathFact, isLoading: isLoadingMathFact, refetch: refetchMathFact } = useQuery<MathFact>({
    queryKey: ['mathFact'], queryFn: fetchMathFact, staleTime: Infinity, gcTime: Infinity, refetchOnWindowFocus: false,
  });

  useEffect(() => {
    if (mathFact) setCurrentMathFact(mathFact);
    else if (!isLoadingMathFact) {
      const randomIndex = Math.floor(Math.random() * MATH_FACTS_FALLBACK.length);
      setCurrentMathFact({ text: MATH_FACTS_FALLBACK[randomIndex] });
    }
  }, [mathFact, isLoadingMathFact]);

  const handleRefreshMathFact = () => {
    refetchMathFact();
    if(selectedVoice && !isSpeaking && !isPaused) speak("Fetching new math fact.");
  };
  const handleYoutubeSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (youtubeSearchTerm.trim()) {
      if(selectedVoice && !isSpeaking && !isPaused) speak(`Searching YouTube for ${youtubeSearchTerm.trim()}`);
      window.open(`https://www.youtube.com/results?search_query=${encodeURIComponent(youtubeSearchTerm.trim())}`, '_blank');
    }
  };
  const handleGoogleBooksSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (googleBooksSearchTerm.trim()) {
      if(selectedVoice && !isSpeaking && !isPaused) speak(`Searching Google Books for ${googleBooksSearchTerm.trim()}`);
      window.open(`https://www.google.com/search?tbm=bks&q=${encodeURIComponent(googleBooksSearchTerm.trim())}`, '_blank');
    }
  };

  const otherResources = [
    { title: "Wikidata", description: "The free and open knowledge base that can be read and edited by humans and machines.", link: "https://www.wikidata.org/", icon: BookOpen },
    { title: "CK-12 Foundation", description: "Free K-12 STEM resources.", link: "https://www.ck12.org/", icon: Lightbulb },
    { title: "Project Gutenberg", description: "Over 70,000 free eBooks.", link: "https://www.gutenberg.org/", icon: Brain },
  ];

  return (
    <div className="container mx-auto max-w-4xl px-4 py-8 space-y-10">
      <Card className="shadow-xl bg-card/90 backdrop-blur-sm">
        <CardHeader className="text-center">
          <div className="flex items-center justify-center mb-4"><BookMarked className="h-12 w-12 text-primary" /></div>
          <CardTitle className="text-xl sm:text-2xl font-bold text-primary">{PAGE_TITLE}</CardTitle>
          <CardDescription>Explore a collection of educational resources and tools.</CardDescription>
        </CardHeader>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-xl flex items-center gap-2"><Lightbulb className="w-6 h-6 text-yellow-500" />Math Fact of the Day</CardTitle></CardHeader>
        <CardContent>
          {isLoadingMathFact && !currentMathFact ? <div className="flex items-center space-x-2"><Loader2 className="h-5 w-5 animate-spin" /><span>Loading math fact...</span></div>
          : currentMathFact ? <p className="text-lg italic">"{currentMathFact.text}"</p>
          : <p className="text-lg italic">Could not load math fact. Try refreshing!</p>}
        </CardContent>
        <CardFooter><Button onClick={handleRefreshMathFact} variant="outline" size="sm" disabled={isLoadingMathFact}>{isLoadingMathFact && <Loader2 className="h-4 w-4 animate-spin mr-2" />}New Fact</Button></CardFooter>
      </Card>

      <section>
        <Card>
          <CardHeader><CardTitle className="text-xl flex items-center gap-2"><Youtube className="w-6 h-6 text-red-500" />Search YouTube</CardTitle></CardHeader>
          <form onSubmit={handleYoutubeSearch}>
            <CardContent className="flex gap-2">
              <Input type="search" placeholder="Search for educational videos..." value={youtubeSearchTerm} onChange={(e) => setYoutubeSearchTerm(e.target.value)}/>
              <Button type="submit">Search</Button>
            </CardContent>
          </form>
           <CardFooter className="text-xs text-muted-foreground pt-2">This will redirect you to YouTube search results.</CardFooter>
        </Card>
      </section>

      <section>
        <Card>
          <CardHeader><CardTitle className="text-xl flex items-center gap-2"><Search className="w-6 h-6 text-blue-500" />Search Google Books</CardTitle></CardHeader>
          <form onSubmit={handleGoogleBooksSearch}>
            <CardContent className="flex gap-2">
              <Input type="search" placeholder="Search for books and articles..." value={googleBooksSearchTerm} onChange={(e) => setGoogleBooksSearchTerm(e.target.value)}/>
              <Button type="submit">Search</Button>
            </CardContent>
          </form>
          <CardFooter className="text-xs text-muted-foreground pt-2">This will redirect you to Google Books search results.</CardFooter>
        </Card>
      </section>

      <section>
        <h2 className="text-2xl font-semibold mb-4">Other Helpful Resources</h2>
         <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
           {otherResources.map(resource => <ResourceCard key={resource.title} title={resource.title} description={resource.description} link={resource.link} icon={resource.icon} linkText="Visit Site"/>)}
        </div>
      </section>
    </div>
  );
}
