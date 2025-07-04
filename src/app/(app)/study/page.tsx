
"use client";

import { Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useState, useEffect, useCallback, useRef } from 'react';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { BookOpenText, Brain, Layers, RefreshCw, AlertTriangle, Loader2, Home } from "lucide-react"; 

import { useToast } from "@/hooks/use-toast";
import { useSound } from '@/hooks/useSound';
import { useTTS } from '@/hooks/useTTS';

import { generateNotesAction, generateQuizAction, generateFlashcardsAction } from "@/lib/actions";
import type { GenerateStudyNotesOutput, GenerateQuizQuestionsOutput, GenerateFlashcardsOutput, QueryError } from '@/lib/types';

import NotesView from '@/components/study/NotesView';
import QuizView from '@/components/study/QuizView';
import FlashcardsView from '@/components/study/FlashcardsView';
import { Skeleton } from '@/components/ui/skeleton';

const PAGE_TITLE_BASE = "Study Hub";
const LOCALSTORAGE_KEY_PREFIX = "learnmint-study-";

const NotesLoadingSkeleton = () => (
  <Card className="mt-0 shadow-lg flex-1 flex flex-col min-h-0">
    <CardContent className="p-6">
      <div className="space-y-3">
        <Skeleton className="h-8 w-3/4" /><Skeleton className="h-4 w-full" /><Skeleton className="h-4 w-full" /><Skeleton className="h-4 w-5/6" />
        <Skeleton className="h-32 w-full mt-4" />
      </div>
    </CardContent>
  </Card>
);
const QuizLoadingSkeleton = () => (
  <Card className="mt-0 shadow-lg flex-1 flex flex-col min-h-0">
    <CardContent className="p-6">
      <div className="space-y-3">
        <Skeleton className="h-6 w-1/2 mb-4" />
        {[...Array(3)].map((_, i) => ( <div key={i} className="space-y-2 mb-3"><Skeleton className="h-4 w-full" /><Skeleton className="h-4 w-3/4" /></div>))}
      </div>
    </CardContent>
  </Card>
);
const FlashcardsLoadingSkeleton = () => (
   <Card className="mt-0 shadow-lg flex-1 flex flex-col min-h-0">
    <CardContent className="p-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-32 w-full" />)}
      </div>
    </CardContent>
  </Card>
);

const ErrorDisplay = ({ error, onRetry, contentType }: { error: Error | null, onRetry: () => void, contentType: string }) => (
  <Alert variant="destructive" className="mt-2">
    <AlertTriangle className="h-4 w-4" />
    <AlertTitle>Error loading {contentType}</AlertTitle>
    <AlertDescription>
      {error?.message || `Failed to load ${contentType}.`}
      <Button onClick={onRetry} variant="link" className="pl-1 text-destructive h-auto py-0">Try again</Button>
    </AlertDescription>
  </Alert>
);


function StudyPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter(); 
  const topicParam = searchParams.get("topic");

  const [activeTopic, setActiveTopic] = useState<string>(""); 
  const [activeTab, setActiveTab] = useState<string>("notes");

  const { toast } = useToast();
  const { playSound: playActionSound } = useSound('/sounds/custom-sound-2.mp3', { volume: 0.4, priority: 'essential' });
  const { playSound: playClickSound } = useSound('/sounds/ting.mp3');
  const { speak, setVoicePreference } = useTTS();
  const queryClient = useQueryClient();

  const pageTitleSpokenRef = useRef(false);
  
  useEffect(() => {
    const decodedTopic = topicParam ? decodeURIComponent(topicParam).trim() : "";
    if (decodedTopic && decodedTopic !== activeTopic) {
      setActiveTopic(decodedTopic);
      pageTitleSpokenRef.current = false; 
    } else if (!decodedTopic && activeTopic) { 
      setActiveTopic("");
      pageTitleSpokenRef.current = false;
    }
  }, [topicParam, activeTopic]);


  useEffect(() => {
    setVoicePreference('holo');
  }, [setVoicePreference]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (!pageTitleSpokenRef.current && activeTopic) {
        speak(`${PAGE_TITLE_BASE} for: ${activeTopic}`, { priority: 'essential' });
        pageTitleSpokenRef.current = true;
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [speak, activeTopic]);


  const getCacheKey = (type: string, topic: string) => `${LOCALSTORAGE_KEY_PREFIX}${type}-${topic.toLowerCase().replace(/\s+/g, '-')}`;

  useEffect(() => {
    if (activeTopic && typeof window !== 'undefined') {
      const cachedNotes = localStorage.getItem(getCacheKey("notes", activeTopic));
      if (cachedNotes) {
        try {
          queryClient.setQueryData(["studyNotes", activeTopic], JSON.parse(cachedNotes));
        } catch (e) { console.error("Failed to parse cached notes", e); }
      }
      const cachedQuiz = localStorage.getItem(getCacheKey("quiz", activeTopic));
      if (cachedQuiz) {
        try {
          queryClient.setQueryData(["quizQuestions", activeTopic], JSON.parse(cachedQuiz));
        } catch (e) { console.error("Failed to parse cached quiz", e); }
      }
      const cachedFlashcards = localStorage.getItem(getCacheKey("flashcards", activeTopic));
      if (cachedFlashcards) {
        try {
          queryClient.setQueryData(["flashcards", activeTopic], JSON.parse(cachedFlashcards));
        } catch (e) { console.error("Failed to parse cached flashcards", e); }
      }
    }
  }, [activeTopic, queryClient]);


  const commonQueryOptions = {
    enabled: !!activeTopic,
    staleTime: 1000 * 60 * 5, 
    gcTime: 1000 * 60 * 10,    
    retry: 1,
  };

  const {
    data: notesData,
    isLoading: isLoadingNotes,
    isError: isErrorNotes,
    error: notesErrorObj, 
    refetch: refetchNotes,
    isFetching: isFetchingNotes,
  } = useQuery<GenerateStudyNotesOutput, QueryError>({
    queryKey: ["studyNotes", activeTopic],
    queryFn: async () => {
      if (!activeTopic) throw new Error("A valid topic is required.");
      const data = await generateNotesAction({ topic: activeTopic });
      if (typeof window !== 'undefined' && data?.notes) localStorage.setItem(getCacheKey("notes", activeTopic), JSON.stringify(data));
      return data;
    },
    ...commonQueryOptions,
  });

  const {
    data: quizData,
    isLoading: isLoadingQuiz,
    isError: isErrorQuiz,
    error: quizErrorObj, 
    refetch: refetchQuiz,
    isFetching: isFetchingQuiz,
  } = useQuery<GenerateQuizQuestionsOutput, QueryError>({
    queryKey: ["quizQuestions", activeTopic],
    queryFn: async () => {
      if (!activeTopic) throw new Error("A topic is required.");
      const data = await generateQuizAction({ topic: activeTopic, numQuestions: 30, difficulty: 'medium' });
      if (typeof window !== 'undefined' && data?.questions) localStorage.setItem(getCacheKey("quiz", activeTopic), JSON.stringify(data));
      return data;
    },
    ...commonQueryOptions,
  });

  const {
    data: flashcardsData,
    isLoading: isLoadingFlashcards,
    isError: isErrorFlashcards,
    error: flashcardsErrorObj, 
    refetch: refetchFlashcards,
    isFetching: isFetchingFlashcards,
  } = useQuery<GenerateFlashcardsOutput, QueryError>({
    queryKey: ["flashcards", activeTopic],
    queryFn: async () => {
      if (!activeTopic) throw new Error("A topic is required.");
      const data = await generateFlashcardsAction({ topic: activeTopic, numFlashcards: 20 });
      if (typeof window !== 'undefined' && data?.flashcards) localStorage.setItem(getCacheKey("flashcards", activeTopic), JSON.stringify(data));
      return data;
    },
    ...commonQueryOptions,
  });


  const handleRefreshContent = useCallback(() => {
    playActionSound();
    if (activeTopic) {
      toast({ title: "Refreshing All Content", description: `Re-fetching materials for ${activeTopic}.` });
      pageTitleSpokenRef.current = false; 
      queryClient.invalidateQueries({ queryKey: ["studyNotes", activeTopic] });
      queryClient.invalidateQueries({ queryKey: ["quizQuestions", activeTopic] });
      queryClient.invalidateQueries({ queryKey: ["flashcards", activeTopic] });
    } else {
      toast({ title: "No Topic", description: "Cannot refresh without a valid topic.", variant: "destructive" });
    }
  }, [activeTopic, queryClient, toast, playActionSound]);

  const handleTabChange = (value: string) => {
    playClickSound();
    setActiveTab(value);
  };

  const renderContent = () => {
    if (!activeTopic) { 
      return (
        <Alert variant="default" className="mt-6 flex flex-col items-center justify-center text-center p-6">
          <Home className="h-10 w-10 text-muted-foreground mb-3" />
          <AlertTitle className="text-xl">No Topic Specified</AlertTitle>
          <AlertDescription className="mb-4">
            Please generate study materials from the main "Generate" page first, or select a recent topic from the dashboard.
          </AlertDescription>
          <Button onClick={() => router.push('/notes')} variant="outline">
            Go to Generate Page
          </Button>
        </Alert>
      );
    }

    return (
      <Tabs defaultValue="notes" value={activeTab} onValueChange={handleTabChange} className="w-full flex-1 flex flex-col min-h-0">
        <TabsList className="grid w-full grid-cols-3 mb-4 sm:mb-6 mx-auto md:max-w-md sticky top-[calc(theme(spacing.16)_+_1px)] sm:top-0 z-10 bg-background/80 backdrop-blur-sm py-1.5">
          <TabsTrigger value="notes" className="py-2.5 text-sm sm:text-base"><BookOpenText className="mr-1.5 sm:mr-2 h-4 w-4"/>Notes {(isLoadingNotes || (isFetchingNotes && !isErrorNotes)) && <Loader2 className="ml-2 h-4 w-4 animate-spin"/>}</TabsTrigger>
          <TabsTrigger value="quiz" className="py-2.5 text-sm sm:text-base"><Brain className="mr-1.5 sm:mr-2 h-4 w-4"/>Quiz {(isLoadingQuiz || (isFetchingQuiz && !isErrorQuiz)) && <Loader2 className="ml-2 h-4 w-4 animate-spin"/>}</TabsTrigger>
          <TabsTrigger value="flashcards" className="py-2.5 text-sm sm:text-base"><Layers className="mr-1.5 sm:mr-2 h-4 w-4"/>Flashcards {(isLoadingFlashcards || (isFetchingFlashcards && !isErrorFlashcards)) && <Loader2 className="ml-2 h-4 w-4 animate-spin"/>}</TabsTrigger>
        </TabsList>

        <TabsContent value="notes" className="flex-1 mt-0 p-0 outline-none ring-0 flex flex-col min-h-0">
          { (isLoadingNotes || (isFetchingNotes && !isErrorNotes)) ? <NotesLoadingSkeleton /> :
           isErrorNotes ? <ErrorDisplay error={notesErrorObj} onRetry={refetchNotes} contentType="notes" /> :
           (notesData?.notes && notesData.notes.trim() !== "") ? <NotesView notesContent={notesData.notes} topic={activeTopic} /> : 
           (notesData && (notesData.notes === null || notesData.notes.trim() === "")) ? <p className="text-muted-foreground p-4 text-center">Notes for this topic were generated successfully but appear to be empty.</p> :
           <p className="text-muted-foreground p-4 text-center">No notes available. Try refreshing or generating for a different topic.</p>}
        </TabsContent>
        
        <TabsContent value="quiz" className="flex-1 mt-0 p-0 outline-none ring-0 flex flex-col min-h-0">
          { (isLoadingQuiz || (isFetchingQuiz && !isErrorQuiz)) ? <QuizLoadingSkeleton /> :
            isErrorQuiz ? <ErrorDisplay error={quizErrorObj} onRetry={refetchQuiz} contentType="quiz questions" /> :
            quizData?.questions && quizData.questions.length > 0 ? <QuizView questions={quizData.questions} topic={activeTopic} difficulty="medium" /> :
            quizData && (!quizData.questions || quizData.questions.length === 0) ? <p className="text-muted-foreground p-4 text-center">Quiz was processed, but no questions were returned for this topic. Try refreshing or a different topic.</p> :
            <p className="text-muted-foreground p-4 text-center">Quiz data could not be loaded. Please try refreshing.</p>
          }
        </TabsContent>

        <TabsContent value="flashcards" className="flex-1 mt-0 p-0 outline-none ring-0 flex flex-col min-h-0">
          { (isLoadingFlashcards || (isFetchingFlashcards && !isErrorFlashcards)) ? <FlashcardsLoadingSkeleton /> :
            isErrorFlashcards ? <ErrorDisplay error={flashcardsErrorObj} onRetry={refetchFlashcards} contentType="flashcards" /> :
            flashcardsData?.flashcards && flashcardsData.flashcards.length > 0 ? <FlashcardsView flashcards={flashcardsData.flashcards} topic={activeTopic} /> :
            flashcardsData && (!flashcardsData.flashcards || flashcardsData.flashcards.length === 0) ? <p className="text-muted-foreground p-4 text-center">Flashcards were processed, but no cards were returned for this topic. Try refreshing or a different topic.</p> :
            <p className="text-muted-foreground p-4 text-center">Flashcard data could not be loaded. Please try refreshing.</p>
          }
        </TabsContent>
      </Tabs>
    );
  }

  return (
    <div className="container mx-auto max-w-5xl px-2 py-6 sm:px-4 sm:py-8 flex flex-col flex-1 min-h-[calc(100vh-8rem)]">
      {activeTopic ? (
        <div className="flex flex-col sm:flex-row justify-between items-center mb-4 sm:mb-6 gap-2">
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-center sm:text-left truncate max-w-xl">
            Study Hub for: <span className="text-primary">{activeTopic}</span>
          </h1>
          <Button onClick={handleRefreshContent} variant="outline" size="sm" className="active:scale-95" disabled={isLoadingNotes || isLoadingQuiz || isLoadingFlashcards || isFetchingNotes || isFetchingQuiz || isFetchingFlashcards}>
            <RefreshCw className="mr-2 h-4 w-4" /> Refresh Content
          </Button>
        </div>
      ) : null}
      {renderContent()}
    </div>
  );
}

export default function StudyPage() {
  return (
    <Suspense fallback={
      <div className="container mx-auto max-w-5xl px-4 py-8 flex flex-col items-center justify-center min-h-[calc(100vh-10rem)]">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="mt-4 text-muted-foreground">Loading Study Hub...</p>
      </div>
    }>
      <StudyPageContent />
    </Suspense>
  );
}
