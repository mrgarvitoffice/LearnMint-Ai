
"use client";

import { useState, useEffect, useRef, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { GraduationCap, Mic, Sparkles, Loader2, BookOpenText, Brain, Layers, RefreshCw, AlertTriangle, Download, PlayCircle, PauseCircle, StopCircle } from "lucide-react";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

import { useVoiceRecognition } from '@/hooks/useVoiceRecognition';
import { useTTS } from '@/hooks/useTTS';
import { useSound } from '@/hooks/useSound';

import { generateNotesAction, generateQuizAction, generateFlashcardsAction } from '@/lib/actions';
import type { GenerateStudyNotesOutput, GenerateQuizQuestionsOutput, QuizQuestion, GenerateFlashcardsOutput, Flashcard } from '@/lib/types'; 

import AiGeneratedImage from '@/components/study/AiGeneratedImage';
import NotesView from '@/components/study/NotesView';
import QuizView from '@/components/study/QuizView';
import FlashcardsView from '@/components/study/FlashcardsView';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

const PAGE_TITLE = "Generate Study Materials";
const RECENT_TOPICS_LS_KEY = "learnmint-recent-topics"; // Corrected key

const NotesLoadingSkeleton = () => ( <div className="p-4 space-y-3"><Skeleton className="h-8 w-3/4" /><Skeleton className="h-4 w-full" /><Skeleton className="h-4 w-full" /><Skeleton className="h-4 w-5/6" /><Skeleton className="h-32 w-full mt-4" /></div> );
const QuizLoadingSkeleton = () => ( <div className="p-4 space-y-3"><Skeleton className="h-6 w-1/2 mb-4" />{[...Array(3)].map((_, i) => ( <div key={i} className="space-y-2 mb-3"><Skeleton className="h-4 w-full" /><Skeleton className="h-4 w-3/4" /></div> ))}</div> );
const FlashcardsLoadingSkeleton = () => ( <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-4">{[...Array(4)].map((_, i) => <Skeleton key={i} className="h-32 w-full" />)}</div> );

const ErrorDisplay = ({ error, onRetry, contentType }: { error: string | null, onRetry?: () => void, contentType: string }) => (
  <Alert variant="destructive" className="mt-2">
    <AlertTriangle className="h-4 w-4" />
    <AlertTitle>Error loading {contentType}</AlertTitle>
    <AlertDescription>
      {error || `Failed to load ${contentType}.`}
      {onRetry && <Button onClick={onRetry} variant="link" className="pl-1 text-destructive h-auto py-0">Try again</Button>}
    </AlertDescription>
  </Alert>
);

function GenerateNotesPageContent() {
  const router = useRouter();
  const { toast } = useToast();

  const [topic, setTopic] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  const { speak, isSpeaking, isPaused, supportedVoices, selectedVoice, setVoicePreference, voicePreference, cancelTTS, pauseTTS, resumeTTS } = useTTS();
  const { isListening, transcript, startListening, stopListening, browserSupportsSpeechRecognition, error: voiceError } = useVoiceRecognition();
  const { playSound: playClickSound } = useSound('/sounds/ting.mp3', 0.3);

  const pageTitleSpokenRef = useRef(false);
  const voicePreferenceWasSetRef = useRef(false);
  const generatingMessageSpokenRef = useRef(false);


  useEffect(() => {
    if (supportedVoices.length > 0 && !voicePreferenceWasSetRef.current) {
      setVoicePreference('zia'); 
      voicePreferenceWasSetRef.current = true;
    }
  }, [supportedVoices, setVoicePreference]);

  useEffect(() => {
    let isMounted = true;
    if (isMounted && selectedVoice && !isSpeaking && !isPaused && !pageTitleSpokenRef.current && !isLoading) {
      speak(PAGE_TITLE);
      pageTitleSpokenRef.current = true;
    }
    return () => { isMounted = false; };
  }, [selectedVoice, isSpeaking, isPaused, speak, isLoading]);

  useEffect(() => {
    if (transcript) setTopic(transcript);
  }, [transcript]);

  useEffect(() => {
    if (voiceError) {
      toast({ title: "Voice Input Error", description: voiceError, variant: "destructive" });
      setError(`Voice input error: ${voiceError}`);
    }
  }, [voiceError, toast]);

  const handleVoiceCommand = useCallback(() => {
    playClickSound();
    if (isListening) stopListening();
    else { setTopic(""); startListening(); }
  }, [isListening, startListening, stopListening, playClickSound]);

  const handleGenerate = useCallback(async () => {
    playClickSound();
    if (topic.trim().length < 3) {
      setError("Please enter a topic with at least 3 characters.");
      toast({ title: "Invalid Topic", description: "Topic must be at least 3 characters long.", variant: "destructive" });
      return;
    }
    setError(null);
    setIsLoading(true);
    if(selectedVoice && !isSpeaking && !isPaused && !generatingMessageSpokenRef.current) {
        speak("Generating study materials, please wait.");
        generatingMessageSpokenRef.current = true;
    }
    

    try {
      const storedTopics = localStorage.getItem(RECENT_TOPICS_LS_KEY);
      let recentTopicsArray = storedTopics ? JSON.parse(storedTopics) : [];
      const trimmedTopic = topic.trim();
      if (!recentTopicsArray.includes(trimmedTopic)) {
        recentTopicsArray.unshift(trimmedTopic);
        recentTopicsArray = recentTopicsArray.slice(0, 10); 
        localStorage.setItem(RECENT_TOPICS_LS_KEY, JSON.stringify(recentTopicsArray));
      }
    } catch (e) {
      console.error("Failed to save recent topic to localStorage", e);
    }

    router.push(`/study?topic=${encodeURIComponent(topic.trim())}`);
    // setIsLoading(false); // isLoading state will persist until navigation is complete
    // setTopic(""); // Let topic persist in input for now
    generatingMessageSpokenRef.current = false; // Reset after navigation attempt
  }, [topic, router, toast, playClickSound, speak, selectedVoice, isSpeaking, isPaused]);
  
  return (
    <div className="container mx-auto max-w-xl px-4 py-8 flex flex-col items-center justify-center min-h-[calc(100vh-12rem)] space-y-8">
        <Card className="w-full shadow-xl bg-card/90 backdrop-blur-sm">
        <CardHeader className="text-center">
            <div className="flex items-center justify-center mb-4">
            <GraduationCap className="h-12 w-12 text-primary" />
            </div>
            <CardTitle className="text-center text-2xl sm:text-3xl font-bold text-primary">{PAGE_TITLE}</CardTitle>
            <CardDescription className="text-center text-sm sm:text-base text-muted-foreground px-2">
            Enter any academic topic, and LearnMint AI will generate comprehensive study notes, a quiz, and flashcards for you.
            </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 p-6">
            <div className="relative">
            <Input
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="e.g., Quantum Physics, Cell Biology, World War II"
                className="text-base sm:text-lg py-3 px-4 pr-12 transition-colors duration-200 ease-in-out focus-visible:ring-primary focus-visible:ring-2"
                aria-label="Study Topic"
                onKeyDown={(e) => e.key === 'Enter' && !isLoading && topic.trim().length >=3 && handleGenerate()}
            />
            {browserSupportsSpeechRecognition && (
                <Button
                variant="ghost"
                size="icon"
                className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8"
                onClick={handleVoiceCommand}
                disabled={isLoading || isListening}
                aria-label="Use Voice Input"
                title="Use Voice Input"
                >
                <Mic className={`h-5 w-5 ${isListening ? 'text-destructive animate-pulse' : 'text-muted-foreground hover:text-primary'}`} />
                </Button>
            )}
            </div>
            {error && <p className="text-sm text-destructive text-center">{error}</p>}
            <Button
            onClick={handleGenerate}
            disabled={isLoading || topic.trim().length < 3}
            className="w-full text-base sm:text-lg py-3 transition-all duration-300 ease-in-out group bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 text-primary-foreground shadow-lg hover:shadow-primary/50 active:scale-95"
            size="lg"
            >
            {isLoading ? (
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            ) : (
                <Sparkles className="mr-2 h-5 w-5 transition-transform duration-300 group-hover:rotate-[360deg] group-hover:scale-125" />
            )}
            {isLoading ? "Generating..." : "Get Topper Notes"}
            </Button>
        </CardContent>
        </Card>
    </div>
  );
}


export default function NotesPage() {
  return (
    <Suspense fallback={<div className="flex justify-center items-center min-h-screen"><Loader2 className="h-12 w-12 animate-spin text-primary" /></div>}>
      <GenerateNotesPageContent />
    </Suspense>
  );
}
    

    