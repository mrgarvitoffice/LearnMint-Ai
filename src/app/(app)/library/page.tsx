
"use client";

import { useState, useEffect, useRef, type FormEvent } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { MATH_FACTS_FALLBACK } from '@/lib/constants';
import { fetchMathFact } from '@/lib/math-fact-api';
import type { MathFact, YoutubeVideoItem, GoogleBookItem, QueryError } from '@/lib/types';
import { ResourceCard } from '@/components/features/library/ResourceCard';
import { YoutubeVideoResultItem } from '@/components/features/library/YoutubeVideoResultItem';
import { BookMarked, Search, Youtube, Lightbulb, BookOpen, Brain, ExternalLink, Loader2, Quote, Video, X } from 'lucide-react';
import { useTTS } from '@/hooks/useTTS';
import { searchYoutubeVideos, type YoutubeSearchInput, type YoutubeSearchOutput } from '@/ai/flows/search-youtube-videos';
import { searchGoogleBooks, type GoogleBooksSearchInput, type GoogleBooksSearchOutput } from '@/ai/flows/search-google-books';
import { ScrollArea } from '@/components/ui/scroll-area';
import Image from 'next/image';
import { useToast } from '@/hooks/use-toast';

const PAGE_TITLE = "LearnMint Knowledge Hub";

export default function LibraryPage() {
  const [youtubeSearchTerm, setYoutubeSearchTerm] = useState('');
  const [googleBooksSearchTerm, setGoogleBooksSearchTerm] = useState('');
  const [currentMathFact, setCurrentMathFact] = useState<MathFact | null>(null);

  const [youtubeResults, setYoutubeResults] = useState<YoutubeVideoItem[]>([]);
  const [selectedYoutubeVideo, setSelectedYoutubeVideo] = useState<YoutubeVideoItem | null>(null);

  const [googleBooksResults, setGoogleBooksResults] = useState<GoogleBookItem[]>([]);
  const [selectedGoogleBook, setSelectedGoogleBook] = useState<GoogleBookItem | null>(null);


  const { speak, isSpeaking, isPaused, selectedVoice, setVoicePreference, supportedVoices, voicePreference, cancelTTS } = useTTS();
  const pageTitleSpokenRef = useRef(false);
  const voicePreferenceWasSetRef = useRef(false);
  const { toast } = useToast();

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

  const youtubeSearchMutation = useMutation<YoutubeSearchOutput, QueryError, YoutubeSearchInput>({
    mutationFn: searchYoutubeVideos,
    onSuccess: (data) => {
      if (data.videos && data.videos.length > 0) {
        setYoutubeResults(data.videos);
        toast({ title: "YouTube Search Complete", description: `${data.videos.length} videos found.` });
      } else {
        setYoutubeResults([]);
        toast({ title: "No YouTube Videos Found", description: "Try a different search term." });
      }
    },
    onError: (error) => {
      console.error("YouTube search error:", error);
      toast({ title: "YouTube Search Error", description: error.message || "Could not fetch videos.", variant: "destructive" });
      setYoutubeResults([]);
    }
  });

  const googleBooksSearchMutation = useMutation<GoogleBooksSearchOutput, QueryError, GoogleBooksSearchInput>({
    mutationFn: searchGoogleBooks,
    onSuccess: (data) => {
      if (data.books && data.books.length > 0) {
        setGoogleBooksResults(data.books);
        toast({ title: "Google Books Search Complete", description: `${data.books.length} books found.` });
      } else {
        setGoogleBooksResults([]);
        toast({ title: "No Books Found", description: "Try a different search term." });
      }
    },
    onError: (error) => {
      console.error("Google Books search error:", error);
      toast({ title: "Google Books Search Error", description: error.message || "Could not fetch books.", variant: "destructive" });
      setGoogleBooksResults([]);
    }
  });


  const handleYoutubeSearchSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (youtubeSearchTerm.trim()) {
      if(selectedVoice && !isSpeaking && !isPaused) speak(`Searching YouTube for ${youtubeSearchTerm.trim()}`);
      setYoutubeResults([]); // Clear previous results
      youtubeSearchMutation.mutate({ query: youtubeSearchTerm.trim(), maxResults: 9 });
    }
  };

  const handleGoogleBooksSearchSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (googleBooksSearchTerm.trim()) {
      if(selectedVoice && !isSpeaking && !isPaused) speak(`Searching Google Books for ${googleBooksSearchTerm.trim()}`);
      setGoogleBooksResults([]); // Clear previous results
      googleBooksSearchMutation.mutate({ query: googleBooksSearchTerm.trim(), maxResults: 9 });
    }
  };

  const otherResources = [
    { title: "Wikidata", description: "A free and open knowledge base that can be read and edited by humans and machines.", link: "https://www.wikidata.org/", icon: BookOpen },
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

      <Card className="bg-secondary/30 border-secondary/50 hover:shadow-xl transition-shadow duration-300 group">
        <CardHeader className="pb-2 pt-4">
          <div className="flex items-center gap-3 mb-2">
            <Quote className="h-7 w-7 text-secondary-foreground/80 group-hover:text-accent transition-colors" />
            <CardTitle className="text-xl font-semibold text-secondary-foreground group-hover:text-accent transition-colors">Math Fact of the Day</CardTitle>
          </div>
          {isLoadingMathFact && !currentMathFact ? (
            <div className="flex items-center space-x-2 text-muted-foreground py-3"><Loader2 className="h-5 w-5 animate-spin" /><span>Loading math fact...</span></div>
            ) : currentMathFact ? (
            <CardDescription className="text-lg text-accent-foreground font-medium pt-1 italic py-3">
              "{currentMathFact.text}"
            </CardDescription>
            ) : (
            <CardDescription className="text-lg text-muted-foreground py-3">Could not load math fact. Try refreshing!</CardDescription>
            )
          }
        </CardHeader>
        <CardFooter className="pt-2 pb-4">
          <Button onClick={handleRefreshMathFact} variant="outline" size="sm" disabled={isLoadingMathFact} className="bg-background/70 group-hover:border-accent/50 group-hover:text-accent transition-colors">
            {isLoadingMathFact && <Loader2 className="h-4 w-4 animate-spin mr-2" />}New Fact
          </Button>
        </CardFooter>
      </Card>

      <section>
        <Card>
          <CardHeader><CardTitle className="text-xl flex items-center gap-2"><Youtube className="w-7 h-7 text-red-500" />Search & Play YouTube Videos</CardTitle></CardHeader>
          <form onSubmit={handleYoutubeSearchSubmit}>
            <CardContent className="flex gap-2">
              <Input type="search" placeholder="Search for educational videos..." value={youtubeSearchTerm} onChange={(e) => setYoutubeSearchTerm(e.target.value)} disabled={youtubeSearchMutation.isPending}/>
              <Button type="submit" disabled={youtubeSearchMutation.isPending || !youtubeSearchTerm.trim()}>
                {youtubeSearchMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Search
              </Button>
            </CardContent>
          </form>
          {youtubeResults.length > 0 && (
            <div className="px-6 pb-6">
              <h3 className="text-lg font-semibold mb-3 mt-4">Results:</h3>
              <ScrollArea className="h-[400px] w-full pr-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {youtubeResults.map(video => (
                    <YoutubeVideoResultItem
                      key={video.videoId}
                      video={video}
                      onPlay={() => setSelectedYoutubeVideo(video)}
                    />
                  ))}
                </div>
              </ScrollArea>
            </div>
          )}
        </Card>
      </section>

      {selectedYoutubeVideo && (
        <Dialog open={!!selectedYoutubeVideo} onOpenChange={(isOpen) => { if (!isOpen) setSelectedYoutubeVideo(null); }}>
          <DialogContent className="max-w-3xl aspect-video p-0 border-0">
            <DialogHeader className="sr-only">
              <DialogTitle>{selectedYoutubeVideo.title}</DialogTitle>
            </DialogHeader>
            <div className="aspect-video">
              <iframe
                width="100%"
                height="100%"
                src={`https://www.youtube.com/embed/${selectedYoutubeVideo.videoId}?autoplay=1`}
                title={selectedYoutubeVideo.title}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
                className="rounded-lg"
              ></iframe>
            </div>
             <Button
                variant="ghost"
                size="icon"
                className="absolute top-2 right-2 bg-black/50 hover:bg-black/70 text-white rounded-full h-8 w-8 z-10"
                onClick={() => setSelectedYoutubeVideo(null)}
                aria-label="Close video player"
            >
                <X className="h-5 w-5" />
            </Button>
          </DialogContent>
        </Dialog>
      )}

      <section>
        <Card>
          <CardHeader><CardTitle className="text-xl flex items-center gap-2"><BookOpen className="w-7 h-7 text-blue-500" />Search Google Books</CardTitle></CardHeader>
          <form onSubmit={handleGoogleBooksSearchSubmit}>
            <CardContent className="flex gap-2">
              <Input type="search" placeholder="Search for books and articles..." value={googleBooksSearchTerm} onChange={(e) => setGoogleBooksSearchTerm(e.target.value)} disabled={googleBooksSearchMutation.isPending}/>
              <Button type="submit" disabled={googleBooksSearchMutation.isPending || !googleBooksSearchTerm.trim()}>
                {googleBooksSearchMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Search
              </Button>
            </CardContent>
          </form>
           {googleBooksResults.length > 0 && (
            <div className="px-6 pb-6">
              <h3 className="text-lg font-semibold mb-3 mt-4">Book Results:</h3>
              <ScrollArea className="h-[400px] w-full pr-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {googleBooksResults.map(book => (
                     <Card key={book.bookId} className="flex flex-col overflow-hidden">
                        <CardHeader className="p-3">
                           {book.thumbnailUrl && (
                             <div className="relative w-full aspect-[2/3] mb-2 rounded overflow-hidden bg-muted">
                               <Image src={book.thumbnailUrl} alt={book.title} layout="fill" objectFit="contain" data-ai-hint="book cover" />
                             </div>
                           )}
                           <CardTitle className="text-sm font-semibold line-clamp-2">{book.title}</CardTitle>
                           {book.authors && <CardDescription className="text-xs line-clamp-1">{book.authors.join(', ')}</CardDescription>}
                        </CardHeader>
                        <CardContent className="p-3 pt-0 text-xs line-clamp-3 flex-grow">
                           {book.description || "No description available."}
                        </CardContent>
                        <CardFooter className="p-3 pt-0">
                           <Button variant="link" size="sm" asChild className="p-0 h-auto text-xs">
                             <a href={book.infoLink} target="_blank" rel="noopener noreferrer">View on Google Books <ExternalLink className="ml-1 h-3 w-3" /></a>
                           </Button>
                        </CardFooter>
                     </Card>
                  ))}
                </div>
              </ScrollArea>
            </div>
          )}
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
