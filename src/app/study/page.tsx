
"use client";

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useState, useEffect, useCallback, useRef } from 'react';

import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { BookOpenText, Brain, Layers, RefreshCw, AlertTriangle, Loader2 } from "lucide-react";

import { useToast } from "@/hooks/use-toast";
import { useSound } from '@/hooks/useSound';
import { useTTS } from '@/hooks/useTTS';

import { generateNotesAction, generateQuizAction, generateFlashcardsAction } from '@/lib/actions';
import type { GenerateStudyNotesOutput } from '@/ai/flows/generate-study-notes';
import type { GenerateQuizQuestionsOutput } from '@/ai/flows/generate-quiz-questions';
import type { GenerateFlashcardsOutput } from '@/ai/flows/generate-flashcards';

import NotesView from '@/components/study/NotesView';
import QuizView from '@/components/study/QuizView';
import FlashcardsView from '@/components/study/FlashcardsView';

const PAGE_TITLE_BASE = "Study Hub";
const LOCAL_STORAGE_RECENT_TOPICS_KEY = "recentLearnMintTopics"; // Ensure this matches generate page

function StudyPageContent() {
  const searchParams = useSearchParams();
  const topicParam = searchParams.get("topic");
  const [topic, setTopic] = useState<string>("Loading topic...");
  const [activeTab, setActiveTab] = useState<string>("notes");

  const { toast } = useToast();
  const { playSound: playClickSound } = useSound('/sounds/ting.mp3', 0.3);
  const { speak, isSpeaking, selectedVoice, setVoicePreference, supportedVoices, cancel: cancelTTS } = useTTS();
  const queryClient = useQueryClient();

  const pageTitleSpokenRef = useRef(false);
  const voicePreferenceWasSetRef = useRef(false);
  const initialFetchTriggeredRef = useRef(false);

  useEffect(() => {
    if (topicParam) {
      const decodedTopic = decodeURIComponent(topicParam);
      setTopic(decodedTopic);
      // Save to recent topics when page loads with a valid topic
      try {
        const storedTopics = localStorage.getItem(LOCAL_STORAGE_RECENT_TOPICS_KEY);
        let recentTopicsArray: string[] = storedTopics ? JSON.parse(storedTopics) : [];
        if (!recentTopicsArray.includes(decodedTopic)) {
          recentTopicsArray.unshift(decodedTopic);
          recentTopicsArray = recentTopicsArray.slice(0, 10);
          localStorage.setItem(LOCAL_STORAGE_RECENT_TOPICS_KEY, JSON.stringify(recentTopicsArray));
        }
      } catch (e) {
        console.error("Failed to save recent topic to localStorage from study page", e);
      }
    } else {
      setTopic("No topic provided");
    }
  }, [topicParam]);

  useEffect(() => {
    if (supportedVoices.length > 0 && !voicePreferenceWasSetRef.current) {
      setVoicePreference('female');
      voicePreferenceWasSetRef.current = true;
    }
  }, [supportedVoices, setVoicePreference]);

  useEffect(() => {
    let isMounted = true;
    if (isMounted && selectedVoice && !isSpeaking && !pageTitleSpokenRef.current && topic && topic !== "Loading topic..." && topic !== "No topic provided") {
      speak(`${PAGE_TITLE_BASE} for: ${topic}`);
      pageTitleSpokenRef.current = true;
    }
    return () => {
      isMounted = false;
      if (pageTitleSpokenRef.current && isMounted) {
         cancelTTS();
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedVoice, isSpeaking, topic]);


  const commonQueryOptions = {
    enabled: !!topic && topic !== "Loading topic..." && topic !== "No topic provided",
    staleTime: 1000 * 60 * 5, // 5 minutes
    retry: 1, // Retry once on failure
  };

  const {
    data: notesData,
    isLoading: isLoadingNotes,
    isError: isErrorNotes,
    error: notesError,
    refetch: refetchNotes,
    isFetching: isFetchingNotes,
  } = useQuery<GenerateStudyNotesOutput, Error>({
    queryKey: ["studyNotes", topic],
    queryFn: async () => {
      if (!topic || topic === "Loading topic..." || topic === "No topic provided") throw new Error("A valid topic is required.");
      toast({title: "Generating Notes...", description: `Fetching notes for ${topic}.`})
      return generateNotesAction({ topic });
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
    queryKey: ["quizQuestions", topic],
    queryFn: async () => {
      if (!topic || topic === "Loading topic..." || topic === "No topic provided") throw new Error("A valid topic is required.");
      toast({title: "Generating Quiz...", description: `Fetching 30 quiz questions for ${topic}.`})
      return generateQuizAction({ topic, numQuestions: 30 });
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
    queryKey: ["flashcards", topic],
    queryFn: async () => {
      if (!topic || topic === "Loading topic..." || topic === "No topic provided") throw new Error("A valid topic is required.");
      toast({title: "Generating Flashcards...", description: `Fetching 20 flashcards for ${topic}.`})
      return generateFlashcardsAction({ topic, numFlashcards: 20 });
    },
    ...commonQueryOptions,
    enabled: commonQueryOptions.enabled && (activeTab === 'flashcards' || initialFetchTriggeredRef.current),
  });
  
  useEffect(() => {
    if(commonQueryOptions.enabled && !initialFetchTriggeredRef.current) {
        // Trigger initial fetch for all content types once topic is valid
        // This helps populate cache even if user doesn't click tabs immediately
        refetchNotes();
        refetchQuiz();
        refetchFlashcards();
        initialFetchTriggeredRef.current = true;
    }
  }, [commonQueryOptions.enabled, refetchNotes, refetchQuiz, refetchFlashcards]);


  const handleRefreshContent = useCallback(() => {
    playClickSound();
    if (topic && topic !== "Loading topic..." && topic !== "No topic provided") {
      toast({ title: "Refreshing All Content", description: `Re-fetching materials for ${topic}.` });
      // Invalidate and refetch all queries for the current topic
      queryClient.invalidateQueries({ queryKey: ["studyNotes", topic] });
      queryClient.invalidateQueries({ queryKey: ["quizQuestions", topic] });
      queryClient.invalidateQueries({ queryKey: ["flashcards", topic] });
      // Optionally, call refetch functions directly if immediate re-request is desired
      // refetchNotes(); refetchQuiz(); refetchFlashcards();
    } else {
      toast({ title: "No Topic", description: "Cannot refresh without a valid topic.", variant: "destructive" });
    }
  }, [topic, queryClient, toast, playClickSound]);
  
  const handleTabChange = (value: string) => {
    playClickSound();
    setActiveTab(value);
    // Eagerly fetch if not already fetched or errored
    if (value === 'quiz' && !quizData && !isErrorQuiz && commonQueryOptions.enabled) refetchQuiz();
    if (value === 'flashcards' && !flashcardsData && !isErrorFlashcards && commonQueryOptions.enabled) refetchFlashcards();
  };

  const renderTabContent = (
    isLoading: boolean,
    isFetching: boolean,
    isError: boolean,
    error: Error | null,
    data: any,
    ViewComponent: React.ElementType,
    contentType: 'notes' | 'quiz' | 'flashcards',
    refetchFn: () => void
  ) => {
    if (isLoading || (isFetching && !data)) { // Show skeleton if initial load or fetching without data
      return (
        <Card className="mt-0 p-0 shadow-none border-none flex-1">
          <CardContent className="space-y-4 p-2 sm:p-4">
            <Skeleton className="h-8 w-3/5 mb-4" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-4/5" />
            <Skeleton className="h-32 w-full mt-4" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
          </CardContent>
        </Card>
      );
    }
    if (isError) {
      return (
        <Alert variant="destructive" className="mt-2">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Error loading {contentType}</AlertTitle>
          <AlertDescription>
            {error?.message || `Failed to load ${contentType}.`}
            <Button onClick={() => refetchFn()} variant="link" className="pl-1 text-destructive h-auto py-0">Try again</Button>
          </AlertDescription>
        </Alert>
      );
    }
    if (contentType === 'notes' && data?.notes) {
      return <NotesView notesContent={data.notes} topic={topic} />;
    }
    if (contentType === 'quiz' && data?.questions) {
      return <QuizView questions={data.questions} topic={topic} />;
    }
    if (contentType === 'flashcards' && data?.flashcards) {
      return <FlashcardsView flashcards={data.flashcards} topic={topic} />;
    }
    return <p className="text-muted-foreground p-4 text-center">No {contentType} available for this topic yet, or an error occurred during generation.</p>;
  };

  if (topic === "Loading topic...") {
    return (
      <div className="container mx-auto max-w-5xl px-4 py-8 flex flex-col items-center justify-center min-h-[calc(100vh-10rem)]">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="mt-4 text-muted-foreground">Loading study materials...</p>
      </div>
    );
  }

  if (topic === "No topic provided") {
    return (
      <div className="container mx-auto max-w-3xl px-4 py-8 text-center">
        <Alert variant="destructive">
          <AlertTriangle className="h-5 w-5" />
          <AlertTitle>No Topic Specified</AlertTitle>
          <AlertDescription>Please go back to the generation page and enter a topic first.</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-5xl px-2 py-6 sm:px-4 sm:py-8 flex flex-col flex-1 min-h-[calc(100vh-8rem)]"> {/* Ensure page takes height */}
      <div className="flex flex-col sm:flex-row justify-between items-center mb-4 sm:mb-6 gap-2">
        <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-center sm:text-left truncate max-w-xl">
          Study Hub for: <span className="text-primary">{topic}</span>
        </h1>
        <Button onClick={handleRefreshContent} variant="outline" size="sm" className="active:scale-95">
          <RefreshCw className="mr-2 h-4 w-4" /> Refresh All
        </Button>
      </div>

      <Tabs defaultValue="notes" value={activeTab} onValueChange={handleTabChange} className="w-full flex-1 flex flex-col">
        <TabsList className="grid w-full grid-cols-3 mb-4 sm:mb-6 mx-auto md:max-w-md sticky top-16 sm:top-0 z-10 bg-background/80 backdrop-blur-sm py-1.5">
          <TabsTrigger value="notes" className="py-2.5 text-sm sm:text-base"><BookOpenText className="mr-1.5 sm:mr-2 h-4 w-4"/>Notes</TabsTrigger>
          <TabsTrigger value="quiz" className="py-2.5 text-sm sm:text-base"><Brain className="mr-1.5 sm:mr-2 h-4 w-4"/>Quiz</TabsTrigger>
          <TabsTrigger value="flashcards" className="py-2.5 text-sm sm:text-base"><Layers className="mr-1.5 sm:mr-2 h-4 w-4"/>Flashcards</TabsTrigger>
        </TabsList>

        <TabsContent value="notes" className="flex-1 mt-0 p-0 outline-none ring-0">
          {renderTabContent(isLoadingNotes, isFetchingNotes, isErrorNotes, notesError, notesData, NotesView, 'notes', refetchNotes)}
        </TabsContent>
        <TabsContent value="quiz" className="flex-1 mt-0 p-0 outline-none ring-0">
           {renderTabContent(isLoadingQuiz, isFetchingQuiz, isErrorQuiz, quizError, quizData, QuizView, 'quiz', refetchQuiz)}
        </TabsContent>
        <TabsContent value="flashcards" className="flex-1 mt-0 p-0 outline-none ring-0">
           {renderTabContent(isLoadingFlashcards, isFetchingFlashcards, isErrorFlashcards, flashcardsError, flashcardsData, FlashcardsView, 'flashcards', refetchFlashcards)}
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default function StudyPage() {
  // Suspense is required by Next.js when using useSearchParams in a page component
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
