
"use client";

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useState, useEffect, useCallback, useRef } from 'react';

import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { BookOpenText, Brain, Layers, RefreshCw, AlertTriangle, Loader2 } from "lucide-react";

import { useToast } from "@/hooks/use-toast";
import { useSound } from '@/hooks/useSound';
import { useTTS } from '@/hooks/useTTS';

import { generateNotesAction, generateQuizAction, generateFlashcardsAction } from '@/lib/actions';
import type { GenerateStudyNotesOutput, GenerateQuizQuestionsOutput, GenerateFlashcardsOutput } from '@/lib/types';

import NotesView from '@/components/study/NotesView';
import QuizView from '@/components/study/QuizView';
import FlashcardsView from '@/components/study/FlashcardsView';
import { Skeleton } from '@/components/ui/skeleton';

const PAGE_TITLE_BASE = "Study Hub";

const NotesLoadingSkeleton = () => (
  <div className="p-4 space-y-3">
    <Skeleton className="h-8 w-3/4" />
    <Skeleton className="h-4 w-full" /><Skeleton className="h-4 w-full" /><Skeleton className="h-4 w-5/6" />
    <Skeleton className="h-32 w-full mt-4" />
  </div>
);
const QuizLoadingSkeleton = () => (
  <div className="p-4 space-y-3">
    <Skeleton className="h-6 w-1/2 mb-4" />
    {[...Array(3)].map((_, i) => (
      <div key={i} className="space-y-2 mb-3"><Skeleton className="h-4 w-full" /><Skeleton className="h-4 w-3/4" /></div>
    ))}
  </div>
);
const FlashcardsLoadingSkeleton = () => (
  <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
    {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-32 w-full" />)}
  </div>
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
  const topicParam = searchParams.get("topic");

  const [activeTopic, setActiveTopic] = useState<string>(""); // Renamed from 'topic' to avoid conflict
  const [activeTab, setActiveTab] = useState<string>("notes");

  const { toast } = useToast();
  const { playSound: playClickSound } = useSound('/sounds/ting.mp3', 0.3);
  const { speak, isSpeaking, isPaused, selectedVoice, setVoicePreference, supportedVoices, cancelTTS } = useTTS();
  const queryClient = useQueryClient();

  const pageTitleSpokenRef = useRef(false);
  const voicePreferenceWasSetRef = useRef(false);
  const initialFetchTriggeredRef = useRef(false);

   useEffect(() => {
    if (topicParam) {
      const decodedTopic = decodeURIComponent(topicParam);
      setActiveTopic(decodedTopic);
      // Save to recent topics is handled by the generation page before redirect
    } else {
      setActiveTopic("No topic provided");
    }
  }, [topicParam]);


  useEffect(() => {
    if (supportedVoices.length > 0 && !voicePreferenceWasSetRef.current) {
      setVoicePreference('zia');
      voicePreferenceWasSetRef.current = true;
    }
  }, [supportedVoices, setVoicePreference]);

  useEffect(() => {
    let isMounted = true;
    if (isMounted && selectedVoice && !isSpeaking && !isPaused && !pageTitleSpokenRef.current && activeTopic && activeTopic !== "No topic provided") {
      speak(`${PAGE_TITLE_BASE} for: ${activeTopic}`);
      pageTitleSpokenRef.current = true;
    }
    return () => {
      isMounted = false;
    };
  }, [selectedVoice, isSpeaking, isPaused, speak, activeTopic]);


  const commonQueryOptions = {
    enabled: !!activeTopic && activeTopic !== "No topic provided",
    staleTime: 1000 * 60 * 1, 
    retry: 1,
  };

  const {
    data: notesData,
    isLoading: isLoadingNotes,
    isError: isErrorNotes,
    error: notesError,
    refetch: refetchNotes,
    isFetching: isFetchingNotes,
  } = useQuery<GenerateStudyNotesOutput, Error>({
    queryKey: ["studyNotes", activeTopic],
    queryFn: async () => {
      if (!activeTopic || activeTopic === "No topic provided") throw new Error("A valid topic is required.");
      toast({title: "Generating Notes...", description: `Fetching notes for ${activeTopic}.`})
      return generateNotesAction({ topic: activeTopic });
    },
    ...commonQueryOptions,
  });

  const {
    data: quizData,
    isLoading: isLoadingQuiz,
    isError: isErrorQuiz,
    error: quizError,
    refetch: refetchQuiz,
    isFetching: isFetchingQuiz,
  } = useQuery<GenerateQuizQuestionsOutput, Error>({
    queryKey: ["quizQuestions", activeTopic],
    queryFn: async () => {
      if (!activeTopic || activeTopic === "No topic provided") throw new Error("A valid topic is required.");
      toast({title: "Generating Quiz...", description: `Fetching 30 quiz questions for ${activeTopic}. Difficulty: Medium.`})
      return generateQuizAction({ topic: activeTopic, numQuestions: 30, difficulty: 'medium' });
    },
    ...commonQueryOptions,
    enabled: commonQueryOptions.enabled && (activeTab === 'quiz' || initialFetchTriggeredRef.current),
  });

  const {
    data: flashcardsData,
    isLoading: isLoadingFlashcards,
    isError: isErrorFlashcards,
    error: flashcardsError,
    refetch: refetchFlashcards,
    isFetching: isFetchingFlashcards,
  } = useQuery<GenerateFlashcardsOutput, Error>({
    queryKey: ["flashcards", activeTopic],
    queryFn: async () => {
      if (!activeTopic || activeTopic === "No topic provided") throw new Error("A valid topic is required.");
      toast({title: "Generating Flashcards...", description: `Fetching 20 flashcards for ${activeTopic}.`})
      return generateFlashcardsAction({ topic: activeTopic, numFlashcards: 20 });
    },
    ...commonQueryOptions,
    enabled: commonQueryOptions.enabled && (activeTab === 'flashcards' || initialFetchTriggeredRef.current),
  });

  useEffect(() => {
    if(commonQueryOptions.enabled && !initialFetchTriggeredRef.current) {
        // Notes will fetch automatically due to enabled:true by default if topic exists
        // refetchNotes(); // Not strictly needed if enabled is managed well
        if (activeTab === 'quiz' && (!quizData || isErrorQuiz)) refetchQuiz();
        if (activeTab === 'flashcards' && (!flashcardsData || isErrorFlashcards)) refetchFlashcards();
        initialFetchTriggeredRef.current = true;
    }
  }, [commonQueryOptions.enabled, activeTab, refetchNotes, refetchQuiz, refetchFlashcards, quizData, flashcardsData, isErrorQuiz, isErrorFlashcards]);


  const handleRefreshContent = useCallback(() => {
    playClickSound();
    if (activeTopic && activeTopic !== "No topic provided") {
      toast({ title: "Refreshing All Content", description: `Re-fetching materials for ${activeTopic}.` });
      queryClient.invalidateQueries({ queryKey: ["studyNotes", activeTopic] });
      queryClient.invalidateQueries({ queryKey: ["quizQuestions", activeTopic] });
      queryClient.invalidateQueries({ queryKey: ["flashcards", activeTopic] });
      // Directly refetch based on current tab or all
      refetchNotes();
      if (activeTab === 'quiz' || !quizData) refetchQuiz(); // Refetch if active or no data
      if (activeTab === 'flashcards' || !flashcardsData) refetchFlashcards(); // Refetch if active or no data
    } else {
      toast({ title: "No Topic", description: "Cannot refresh without a valid topic.", variant: "destructive" });
    }
  }, [activeTopic, queryClient, toast, playClickSound, refetchNotes, refetchQuiz, refetchFlashcards, activeTab, quizData, flashcardsData]);

  const handleTabChange = (value: string) => {
    playClickSound();
    setActiveTab(value);
    if (value === 'quiz' && (!quizData || isErrorQuiz) && commonQueryOptions.enabled) refetchQuiz();
    if (value === 'flashcards' && (!flashcardsData || isErrorFlashcards) && commonQueryOptions.enabled) refetchFlashcards();
  };

  const renderContent = () => {
    if (activeTopic === "No topic provided") {
      return (
        <Alert variant="destructive" className="mt-6">
          <AlertTriangle className="h-5 w-5" />
          <AlertTitle>No Topic Specified</AlertTitle>
          <AlertDescription>Please go back to the generation page and enter a topic first.</AlertDescription>
        </Alert>
      );
    }

    return (
      <Tabs defaultValue="notes" value={activeTab} onValueChange={handleTabChange} className="w-full flex-1 flex flex-col min-h-0">
        <TabsList className="grid w-full grid-cols-1 xs:grid-cols-3 mb-4 sm:mb-6 mx-auto md:max-w-md sticky top-[calc(theme(spacing.16)_+_1px)] sm:top-0 z-10 bg-background/80 backdrop-blur-sm py-1.5">
          <TabsTrigger value="notes" className="py-2.5 text-sm sm:text-base"><BookOpenText className="mr-1.5 sm:mr-2 h-4 w-4"/>Notes {(isLoadingNotes || (isFetchingNotes && !notesData)) && <Loader2 className="ml-2 h-4 w-4 animate-spin"/>}</TabsTrigger>
          <TabsTrigger value="quiz" className="py-2.5 text-sm sm:text-base"><Brain className="mr-1.5 sm:mr-2 h-4 w-4"/>Quiz {(isLoadingQuiz || (isFetchingQuiz && !quizData)) && <Loader2 className="ml-2 h-4 w-4 animate-spin"/>}</TabsTrigger>
          <TabsTrigger value="flashcards" className="py-2.5 text-sm sm:text-base"><Layers className="mr-1.5 sm:mr-2 h-4 w-4"/>Flashcards {(isLoadingFlashcards || (isFetchingFlashcards && !flashcardsData)) && <Loader2 className="ml-2 h-4 w-4 animate-spin"/>}</TabsTrigger>
        </TabsList>

        <TabsContent value="notes" className="flex-1 mt-0 p-0 outline-none ring-0 flex flex-col min-h-0">
          {(isLoadingNotes || (isFetchingNotes && !notesData && !isErrorNotes)) ? <NotesLoadingSkeleton /> :
           isErrorNotes ? <ErrorDisplay error={notesError} onRetry={refetchNotes} contentType="notes" /> :
           notesData?.notes ? <NotesView notesContent={notesData.notes} topic={activeTopic} /> : <p className="text-muted-foreground p-4 text-center">No notes generated or an error occurred.</p>}
        </TabsContent>
        <TabsContent value="quiz" className="flex-1 mt-0 p-0 outline-none ring-0 flex flex-col min-h-0">
           {(isLoadingQuiz || (isFetchingQuiz && !quizData && !isErrorQuiz)) ? <QuizLoadingSkeleton /> :
            isErrorQuiz ? <ErrorDisplay error={quizError} onRetry={refetchQuiz} contentType="quiz questions" /> :
            quizData?.questions && quizData.questions.length > 0 ? <QuizView questions={quizData.questions} topic={activeTopic} /> : <p className="text-muted-foreground p-4 text-center">No quiz questions generated or an error occurred.</p>}
        </TabsContent>
        <TabsContent value="flashcards" className="flex-1 mt-0 p-0 outline-none ring-0 flex flex-col min-h-0">
           {(isLoadingFlashcards || (isFetchingFlashcards && !flashcardsData && !isErrorFlashcards)) ? <FlashcardsLoadingSkeleton /> :
            isErrorFlashcards ? <ErrorDisplay error={flashcardsError} onRetry={refetchFlashcards} contentType="flashcards" /> :
            flashcardsData?.flashcards && flashcardsData.flashcards.length > 0 ? <FlashcardsView flashcards={flashcardsData.flashcards} topic={activeTopic} /> : <p className="text-muted-foreground p-4 text-center">No flashcards generated or an error occurred.</p>}
        </TabsContent>
      </Tabs>
    );
  }


  if (!topicParam && activeTopic === "No topic provided") { 
    return (
      <div className="container mx-auto max-w-5xl px-4 py-8 flex flex-col items-center justify-center min-h-[calc(100vh-10rem)]">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="mt-4 text-muted-foreground">Loading study materials...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-5xl px-2 py-6 sm:px-4 sm:py-8 flex flex-col flex-1 min-h-[calc(100vh-8rem)]">
      <div className="flex flex-col sm:flex-row justify-between items-center mb-4 sm:mb-6 gap-2">
        <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-center sm:text-left truncate max-w-xl">
          Study Hub for: <span className="text-primary">{topicParam ? decodeURIComponent(topicParam) : activeTopic}</span>
        </h1>
        <Button onClick={handleRefreshContent} variant="outline" size="sm" className="active:scale-95" disabled={isLoadingNotes || isLoadingQuiz || isLoadingFlashcards || isFetchingNotes || isFetchingQuiz || isFetchingFlashcards}>
          <RefreshCw className="mr-2 h-4 w-4" /> Refresh All
        </Button>
      </div>
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
