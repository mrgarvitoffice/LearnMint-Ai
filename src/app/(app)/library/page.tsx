
"use client";

import { useState, useEffect, useRef, type FormEvent, useCallback } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MATH_FACTS_FALLBACK } from '@/lib/constants';
import { fetchMathFact } from '@/lib/math-fact-api';
import type { MathFact, YoutubeVideoItem, GoogleBookItem, QueryError, YoutubeSearchInput, GoogleBooksSearchInput, YoutubeSearchOutput, GoogleBooksSearchOutput } from '@/lib/types';
import { ResourceCard } from '@/components/features/library/ResourceCard';
import { YoutubeVideoResultItem } from '@/components/features/library/YoutubeVideoResultItem';
import { BookResultItem } from '@/components/features/library/BookResultItem';
import { BookMarked, Search, Youtube, Lightbulb, BookOpen, Brain, ExternalLink, Loader2, Quote, Video, X, CalendarDays, Eye, BookText, Maximize, Minimize, Mic } from 'lucide-react';
import { useTTS } from '@/hooks/useTTS';
import { directYoutubeSearch, directGoogleBooksSearch } from '@/lib/actions'; 
import { ScrollArea } from '@/components/ui/scroll-area';
import Image from 'next/image';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from '@/components/ui/dialog';
import { useSound } from '@/hooks/useSound';
import { useVoiceRecognition } from '@/hooks/useVoiceRecognition'; // Added

const PAGE_TITLE = "LearnMint Knowledge Hub";

export default function LibraryPage() {
  const [youtubeSearchTerm, setYoutubeSearchTerm] = useState('');
  const [googleBooksSearchTerm, setGoogleBooksSearchTerm] = useState('');
  const [currentMathFact, setCurrentMathFact] = useState<MathFact | null>(null);

  const [youtubeResults, setYoutubeResults] = useState<YoutubeVideoItem[]>([]);
  const [selectedYoutubeVideo, setSelectedYoutubeVideo] = useState<YoutubeVideoItem | null>(null);

  const [googleBooksResults, setGoogleBooksResults] = useState<GoogleBookItem[]>([]);
  
  const [fullscreenBook, setFullscreenBook] = useState<GoogleBookItem | null>(null);
  const fullscreenContainerRef = useRef<HTMLDivElement>(null);

  const { speak, isSpeaking, isPaused, selectedVoice, setVoicePreference, supportedVoices, voicePreference, cancelTTS } = useTTS();
  const pageTitleSpokenRef = useRef(false);
  const voicePreferenceWasSetRef = useRef(false);
  const { toast } = useToast();
  const { playSound: playActionSound } = useSound('/sounds/custom-sound-2.mp3', 0.4);
  const { playSound: playClickSound } = useSound('/sounds/ting.mp3', 0.3);

  const { isListening, transcript, startListening, stopListening, error: voiceError, browserSupportsSpeechRecognition } = useVoiceRecognition(); // Added
  const [voiceSearchTarget, setVoiceSearchTarget] = useState<'youtube' | 'books' | null>(null); // Added

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

  // Update search terms based on voice transcript
  useEffect(() => {
    if (transcript && voiceSearchTarget) {
      if (voiceSearchTarget === 'youtube') {
        setYoutubeSearchTerm(transcript);
      } else if (voiceSearchTarget === 'books') {
        setGoogleBooksSearchTerm(transcript);
      }
    }
  }, [transcript, voiceSearchTarget]);

  useEffect(() => {
    if (voiceError) {
      toast({ title: "Voice Input Error", description: voiceError, variant: "destructive" });
    }
  }, [voiceError, toast]);

  const handleMicClick = (target: 'youtube' | 'books') => {
    playClickSound();
    if (isListening && voiceSearchTarget === target) {
      stopListening();
      setVoiceSearchTarget(null);
    } else {
      setVoiceSearchTarget(target);
      if (target === 'youtube') setYoutubeSearchTerm(''); // Clear previous text
      else if (target === 'books') setGoogleBooksSearchTerm(''); // Clear previous text
      startListening();
    }
  };


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
    playClickSound();
    refetchMathFact();
    if(selectedVoice && !isSpeaking && !isPaused) speak("Fetching new math fact.");
  };

  const youtubeSearchMutation = useMutation<YoutubeSearchOutput, QueryError, YoutubeSearchInput>({
    mutationFn: directYoutubeSearch, 
    onSuccess: (data) => {
      if (data.videos && data.videos.length > 0) {
        setYoutubeResults(data.videos);
        toast({ title: "YouTube Search Complete", description: `${data.videos.length} videos found.` });
      } else {
        setYoutubeResults([]);
        toast({ title: "No YouTube Videos Found", description: "Try a different search term. Ensure your YOUTUBE_API_KEY is valid and the YouTube Data API v3 is enabled in Google Cloud Console." });
      }
    },
    onError: (error) => {
      console.error("YouTube search error (direct action):", error);
      toast({ title: "YouTube Search Error", description: error.message || "Could not fetch videos. Ensure YOUTUBE_API_KEY is valid and YouTube Data API v3 is enabled.", variant: "destructive" });
      setYoutubeResults([]);
    }
  });

  const googleBooksSearchMutation = useMutation<GoogleBooksSearchOutput, QueryError, GoogleBooksSearchInput>({
    mutationFn: (input) => directGoogleBooksSearch({...input, country: 'US'}), 
    onSuccess: (data) => {
      if (data.books && data.books.length > 0) {
        setGoogleBooksResults(data.books);
        toast({ title: "Google Books Search Complete", description: `${data.books.length} books found.` });
      } else {
        setGoogleBooksResults([]);
        toast({ title: "No Books Found", description: "Try a different search term. Ensure your GOOGLE_BOOKS_API_KEY is valid and the Google Books API is enabled." });
      }
    },
    onError: (error) => {
      console.error("Google Books search error (direct action):", error);
      toast({ title: "Google Books Search Error", description: error.message || "Could not fetch books. Ensure GOOGLE_BOOKS_API_KEY is valid.", variant: "destructive" });
      setGoogleBooksResults([]);
    }
  });

  const handleYoutubeSearchSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (youtubeSearchTerm.trim()) {
      playActionSound();
      if(selectedVoice && !isSpeaking && !isPaused) speak(`Searching YouTube for ${youtubeSearchTerm.trim()}`);
      setYoutubeResults([]); 
      youtubeSearchMutation.mutate({ query: youtubeSearchTerm.trim(), maxResults: 8 });
      if (isListening && voiceSearchTarget === 'youtube') stopListening();
      setVoiceSearchTarget(null);
    }
  };

  const handleGoogleBooksSearchSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (googleBooksSearchTerm.trim()) {
      playActionSound();
      if(selectedVoice && !isSpeaking && !isPaused) speak(`Searching Google Books for ${googleBooksSearchTerm.trim()}`);
      setGoogleBooksResults([]); 
      googleBooksSearchMutation.mutate({ query: googleBooksSearchTerm.trim(), maxResults: 9, country: 'US' });
      if (isListening && voiceSearchTarget === 'books') stopListening();
      setVoiceSearchTarget(null);
    }
  };
  
  const openBookInFullscreen = (book: GoogleBookItem) => {
    playClickSound();
    if (book.embeddable) {
      setFullscreenBook(book);
    } else {
      window.open(book.webReaderLink || book.infoLink || `https://books.google.com/books?id=${book.bookId}`, '_blank', 'noopener,noreferrer');
      toast({ title: "Opening on Google Books", description: "This book will be opened on the Google Books website." });
    }
  };

  const closeFullscreenViewer = useCallback(() => {
    playClickSound();
    if (document.fullscreenElement && fullscreenContainerRef.current === document.fullscreenElement) {
      document.exitFullscreen().catch(err => console.error("Error exiting fullscreen:", err));
    }
    setFullscreenBook(null);
  }, [playClickSound]);

  useEffect(() => {
    const handleActualFullscreenChange = () => {
      if (!document.fullscreenElement && fullscreenBook) {
        setFullscreenBook(null); 
      }
    };

    if (fullscreenBook && fullscreenContainerRef.current) {
      fullscreenContainerRef.current.requestFullscreen()
        .catch(err => {
          toast({
            title: "Fullscreen Mode Not Available",
            description: `Could not enter fullscreen automatically: ${err.message}. Displaying in an overlay.`,
            variant: "default",
          });
        });
    }
    
    document.addEventListener('fullscreenchange', handleActualFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleActualFullscreenChange);
      if (document.fullscreenElement && fullscreenContainerRef.current === document.fullscreenElement) {
          document.exitFullscreen().catch(err => console.error("Error exiting fullscreen on cleanup:", err));
      }
    };
  }, [fullscreenBook, toast]);

  const otherResources = [
    { title: "Wikidata", description: "A free and open knowledge base that can be read and edited by humans and machines.", link: "https://www.wikidata.org/", icon: BookOpen },
    { title: "CK-12 Foundation", description: "Free K-12 STEM resources.", link: "https://www.ck12.org/", icon: Lightbulb },
    { title: "Project Gutenberg", description: "Over 70,000 free eBooks.", link: "https://www.gutenberg.org/", icon: Brain },
  ];

  return (
    <div className="container mx-auto max-w-4xl px-4 py-8 space-y-10">
      {fullscreenBook && (
        <div
          ref={fullscreenContainerRef}
          className="fixed inset-0 z-[100] flex flex-col bg-background"
        >
          <div className="flex items-center justify-between p-3 bg-muted/80 backdrop-blur-sm shadow-md">
            <h3 className="text-lg font-semibold truncate text-foreground pl-2">{fullscreenBook.title}</h3>
            <Button variant="ghost" size="icon" onClick={closeFullscreenViewer} aria-label="Close reader">
              <X className="h-6 w-6 text-foreground" />
            </Button>
          </div>
          <iframe
            src={`https://books.google.com/books?id=${fullscreenBook.bookId}&pg=PP1&output=embed`}
            title={`Read ${fullscreenBook.title}`}
            className="w-full flex-1 border-0"
            allow="fullscreen"
          ></iframe>
           {fullscreenBook.infoLink && (
            <div className="p-2 bg-muted/80 text-right">
              <Button variant="link" size="sm" asChild className="text-xs">
                <a href={fullscreenBook.infoLink} target="_blank" rel="noopener noreferrer">
                  More Info on Google Books <ExternalLink className="ml-1 h-3 w-3" />
                </a>
              </Button>
            </div>
          )}
        </div>
      )}

      {!fullscreenBook && (
        <>
          <Card className="shadow-xl bg-card/90 backdrop-blur-sm">
            <CardHeader className="text-center">
              <div className="flex items-center justify-center mb-4"><BookMarked className="h-12 w-12 text-primary" /></div>
              <CardTitle className="text-xl sm:text-2xl font-bold text-primary">{PAGE_TITLE}</CardTitle>
              <CardDescription>Explore a collection of educational resources and tools.</CardDescription>
            </CardHeader>
          </Card>

          <Card className="bg-secondary/30 border-orange-500/30 hover:shadow-xl transition-shadow duration-300 group">
            <CardHeader className="pb-2 pt-4">
              <div className="flex items-center gap-3 mb-2">
                <Quote className="h-7 w-7 text-orange-500/80 group-hover:text-orange-600 transition-colors" />
                <CardTitle className="text-xl font-semibold text-orange-600 dark:text-orange-500 group-hover:text-orange-700 dark:group-hover:text-orange-400 transition-colors">Math Fact of the Day</CardTitle>
              </div>
              {isLoadingMathFact && !currentMathFact ? (
                <div className="flex items-center space-x-2 text-muted-foreground py-3"><Loader2 className="h-5 w-5 animate-spin" /><span>Loading math fact...</span></div>
                ) : currentMathFact ? (
                <CardDescription className="text-lg text-orange-700 dark:text-orange-400 font-medium pt-1 italic py-3">
                  "{currentMathFact.text}"
                </CardDescription>
                ) : (
                <CardDescription className="text-lg text-muted-foreground py-3">Could not load math fact. Try refreshing!</CardDescription>
                )
              }
            </CardHeader>
            <CardFooter className="pt-2 pb-4">
              <Button onClick={handleRefreshMathFact} variant="outline" size="sm" disabled={isLoadingMathFact} className="bg-background/70 group-hover:border-orange-500/50 group-hover:text-orange-600 transition-colors">
                {isLoadingMathFact && <Loader2 className="h-4 w-4 animate-spin mr-2" />}New Fact
              </Button>
            </CardFooter>
          </Card>

          <section>
            <Card>
              <CardHeader><CardTitle className="text-xl flex items-center gap-2"><Youtube className="w-7 h-7 text-red-500" />Search &amp; Play YouTube Videos</CardTitle></CardHeader>
              <form onSubmit={handleYoutubeSearchSubmit}>
                <CardContent className="flex gap-2 items-center">
                  <Input type="search" placeholder="Search for educational videos..." value={youtubeSearchTerm} onChange={(e) => setYoutubeSearchTerm(e.target.value)} disabled={youtubeSearchMutation.isPending}/>
                  {browserSupportsSpeechRecognition && (
                    <Button type="button" variant="ghost" size="icon" onClick={() => handleMicClick('youtube')} disabled={youtubeSearchMutation.isPending}>
                      <Mic className={`w-5 h-5 ${isListening && voiceSearchTarget === 'youtube' ? 'text-destructive animate-pulse' : ''}`} />
                    </Button>
                  )}
                  <Button type="submit" disabled={youtubeSearchMutation.isPending || !youtubeSearchTerm.trim()}>
                    {youtubeSearchMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Search
                  </Button>
                </CardContent>
              </form>
              {youtubeSearchMutation.isPending && youtubeResults.length === 0 && (
                <div className="px-6 pb-6 flex items-center justify-center space-x-2 text-muted-foreground h-40">
                    <Loader2 className="h-6 w-6 animate-spin" /><span>Searching YouTube...</span>
                </div>
              )}
              {youtubeResults.length > 0 && (
                <div className="px-6 pb-6">
                  <h3 className="text-lg font-semibold mb-3 mt-4">Results:</h3>
                  <ScrollArea className="h-[400px] w-full pr-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {youtubeResults.map(video => (
                        <YoutubeVideoResultItem
                          key={video.videoId}
                          video={video}
                          onPlay={() => { playClickSound(); setSelectedYoutubeVideo(video);}}
                        />
                      ))}
                    </div>
                  </ScrollArea>
                </div>
              )}
              {!youtubeSearchMutation.isPending && youtubeSearchMutation.isSuccess && youtubeResults.length === 0 && (
                <div className="px-6 pb-6 text-center text-muted-foreground h-40 flex flex-col justify-center items-center">
                    <Video className="w-10 h-10 mb-2 opacity-50" />
                    <p>No videos found for "{youtubeSearchTerm}". Try a different search.</p>
                </div>
              )}
            </Card>
          </section>

          {selectedYoutubeVideo && (
            <Dialog open={!!selectedYoutubeVideo} onOpenChange={(isOpen) => { if (!isOpen) setSelectedYoutubeVideo(null); }}>
              <DialogContent className="max-w-3xl p-0 border-0 data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95">
                <DialogHeader className="sr-only">
                  <DialogTitle>{selectedYoutubeVideo.title}</DialogTitle>
                </DialogHeader>
                <div className="aspect-video relative">
                  <iframe
                    width="100%"
                    height="100%"
                    src={`https://www.youtube.com/embed/${selectedYoutubeVideo.videoId}?autoplay=1`}
                    title={selectedYoutubeVideo.title}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    allowFullScreen
                    className="rounded-lg"
                  ></iframe>
                  <DialogClose asChild>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="absolute top-2 right-2 bg-black/50 hover:bg-black/70 text-white rounded-full h-8 w-8 z-10"
                        aria-label="Close video player"
                    >
                        <X className="h-5 w-5" />
                    </Button>
                  </DialogClose>
                </div>
              </DialogContent>
            </Dialog>
          )}

          <section>
            <Card>
              <CardHeader><CardTitle className="text-xl flex items-center gap-2"><BookOpen className="w-7 h-7 text-blue-500" />Search &amp; Read Google Books</CardTitle></CardHeader>
              <form onSubmit={handleGoogleBooksSearchSubmit}>
                <CardContent className="flex gap-2 items-center">
                  <Input type="search" placeholder="Search for books and articles..." value={googleBooksSearchTerm} onChange={(e) => setGoogleBooksSearchTerm(e.target.value)} disabled={googleBooksSearchMutation.isPending}/>
                  {browserSupportsSpeechRecognition && (
                     <Button type="button" variant="ghost" size="icon" onClick={() => handleMicClick('books')} disabled={googleBooksSearchMutation.isPending}>
                       <Mic className={`w-5 h-5 ${isListening && voiceSearchTarget === 'books' ? 'text-destructive animate-pulse' : ''}`} />
                     </Button>
                  )}
                  <Button type="submit" disabled={googleBooksSearchMutation.isPending || !googleBooksSearchTerm.trim()}>
                    {googleBooksSearchMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Search
                  </Button>
                </CardContent>
              </form>
              {googleBooksSearchMutation.isPending && googleBooksResults.length === 0 && (
                <div className="px-6 pb-6 flex items-center justify-center space-x-2 text-muted-foreground h-40">
                    <Loader2 className="h-6 w-6 animate-spin" /><span>Searching Google Books...</span>
                </div>
              )}
              {googleBooksResults.length > 0 && (
                <div className="px-6 pb-6">
                  <h3 className="text-lg font-semibold mb-3 mt-4">Book Results:</h3>
                  <ScrollArea className="h-[400px] w-full pr-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {googleBooksResults.map(book => (
                        <BookResultItem 
                            key={book.bookId} 
                            book={book} 
                            onPreviewRequest={openBookInFullscreen}
                          />
                      ))}
                    </div>
                  </ScrollArea>
                </div>
              )}
              {!googleBooksSearchMutation.isPending && googleBooksSearchMutation.isSuccess && googleBooksResults.length === 0 && (
                <div className="px-6 pb-6 text-center text-muted-foreground h-40 flex flex-col justify-center items-center">
                    <BookOpen className="w-10 h-10 mb-2 opacity-50" />
                    <p>No books found for "{googleBooksSearchTerm}". Try a different search.</p>
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
        </>
      )}
    </div>
  );
}

    