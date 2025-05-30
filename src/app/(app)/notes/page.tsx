
"use client";

import { useState, useEffect, useCallback, useRef, Suspense } from 'react';
import { useRouter } from 'next/navigation'; // Keep for potential future use
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useVoiceRecognition } from '@/hooks/useVoiceRecognition';
import { useTTS } from '@/hooks/useTTS';
import { useSound } from '@/hooks/useSound';
import { GraduationCap, Mic, Sparkles, Loader2, BookOpenText, HelpCircle, ListChecks, Brain, Layers, RefreshCw, AlertTriangle } from "lucide-react";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { generateNotesAction, generateQuizAction, generateFlashcardsAction } from '@/lib/actions';
import type { GenerateStudyNotesOutput, GenerateStudyNotesInput } from '@/ai/flows/generate-study-notes';
import type { GenerateQuizQuestionsOutput, GenerateQuizQuestionsInput } from '@/ai/flows/generate-quiz-questions';
import type { GenerateFlashcardsOutput, GenerateFlashcardsInput } from '@/ai/flows/generate-flashcards';
import { useQuery, useQueryClient } from '@tanstack/react-query'; // For potential future query-based fetching
import NotesView from '@/components/study/NotesView';
import QuizView from '@/components/study/QuizView';
import FlashcardsView from '@/components/study/FlashcardsView';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

const PAGE_TITLE = "Generate Topper Notes";
const LOCAL_STORAGE_RECENT_TOPICS_KEY = "learnmint-recent-topics";

const NotesLoadingSkeleton = () => ( <div className="p-4 space-y-3"><Skeleton className="h-8 w-3/4" /><Skeleton className="h-4 w-full" /><Skeleton className="h-4 w-full" /><Skeleton className="h-4 w-5/6" /><Skeleton className="h-32 w-full mt-4" /></div> );
const QuizLoadingSkeleton = () => ( <div className="p-4 space-y-3"><Skeleton className="h-6 w-1/2 mb-4" />{[...Array(3)].map((_, i) => ( <div key={i} className="space-y-2 mb-3"><Skeleton className="h-4 w-full" /><Skeleton className="h-4 w-3/4" /></div> ))}</div> );
const FlashcardsLoadingSkeleton = () => ( <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-4">{[...Array(4)].map((_, i) => <Skeleton key={i} className="h-32 w-full" />)}</div> );

const ErrorDisplay = ({ error, onRetry, contentType }: { error: Error | string | null, onRetry?: () => void, contentType: string }) => (
  <Alert variant="destructive" className="mt-2">
    <AlertTriangle className="h-4 w-4" />
    <AlertTitle>Error loading {contentType}</AlertTitle>
    <AlertDescription>
      {typeof error === 'string' ? error : error?.message || `Failed to load ${contentType}.`}
      {onRetry && <Button onClick={onRetry} variant="link" className="pl-1 text-destructive h-auto py-0">Try again</Button>}
    </AlertDescription>
  </Alert>
);


export default function NotesPage() {
  const [topic, setTopic] = useState<string>("");
  const [inputTopic, setInputTopic] = useState<string>(""); // For the input field
  
  const [generatedNotesContent, setGeneratedNotesContent] = useState<GenerateStudyNotesOutput | null>(null);
  const [generatedQuizData, setGeneratedQuizData] = useState<GenerateQuizQuestionsOutput | null>(null);
  const [generatedFlashcardsData, setGeneratedFlashcardsData] = useState<GenerateFlashcardsOutput | null>(null);

  const [isLoadingNotes, setIsLoadingNotes] = useState<boolean>(false);
  const [isLoadingQuiz, setIsLoadingQuiz] = useState<boolean>(false);
  const [isLoadingFlashcards, setIsLoadingFlashcards] = useState<boolean>(false);
  
  const [errorNotes, setErrorNotes] = useState<string | null>(null);
  const [errorQuiz, setErrorQuiz] = useState<string | null>(null);
  const [errorFlashcards, setErrorFlashcards] = useState<string | null>(null);
  
  const [activeTab, setActiveTab] = useState<string>("notes");
  const [materialsGenerated, setMaterialsGenerated] = useState(false);

  const router = useRouter();
  const { toast } = useToast();
  const { playSound: playClickSound } = useSound('/sounds/ting.mp3', 0.3);
  const { speak, isSpeaking, isPaused, supportedVoices, selectedVoice, setVoicePreference, cancelTTS } = useTTS();
  
  const { isListening, transcript, startListening, stopListening, browserSupportsSpeechRecognition, error: voiceError } = useVoiceRecognition();

  const pageTitleSpokenRef = useRef(false);
  const voicePreferenceWasSetRef = useRef(false);
  const queryClient = useQueryClient();


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
    return () => { isMounted = false; };
  }, [selectedVoice, isSpeaking, isPaused, speak]);

  useEffect(() => {
    if (transcript) {
      setInputTopic(transcript);
      toast({ title: "Topic Updated", description: "Voice input captured." });
    }
  }, [transcript, toast]);

  useEffect(() => {
    if (voiceError) {
      toast({ title: "Voice Error", description: voiceError, variant: "destructive" });
      setErrorNotes(`Voice input error: ${voiceError}`); // Show error in a relevant place
    }
  }, [voiceError, toast]);

  const handleVoiceCommand = useCallback(() => {
    playClickSound();
    if (isListening) {
      stopListening();
    } else {
      setInputTopic(""); 
      startListening();
    }
  }, [isListening, startListening, stopListening, playClickSound]);

  const handleGenerateAllMaterials = useCallback(async () => {
    playClickSound();
    if (inputTopic.trim().length < 3) {
      setErrorNotes("Please enter a topic with at least 3 characters.");
      toast({ title: "Invalid Topic", description: "Topic must be at least 3 characters long.", variant: "destructive" });
      return;
    }
    
    setTopic(inputTopic.trim()); // Set the "active" topic for fetching
    setErrorNotes(null);
    setErrorQuiz(null);
    setErrorFlashcards(null);
    setGeneratedNotesContent(null);
    setGeneratedQuizData(null);
    setGeneratedFlashcardsData(null);
    
    setIsLoadingNotes(true);
    setIsLoadingQuiz(true);
    setIsLoadingFlashcards(true);
    setMaterialsGenerated(true); // Indicate that generation process has started
    setActiveTab("notes"); // Default to notes tab

    if (selectedVoice && !isSpeaking && !isPaused) {
      speak("Generating all study materials, please wait.");
    }

    try {
      const storedTopics = localStorage.getItem(LOCAL_STORAGE_RECENT_TOPICS_KEY);
      let recentTopicsArray = storedTopics ? JSON.parse(storedTopics) : [];
      const trimmedTopic = inputTopic.trim();
      if (!recentTopicsArray.includes(trimmedTopic)) {
        recentTopicsArray.unshift(trimmedTopic);
      } else {
        recentTopicsArray = recentTopicsArray.filter(t => t !== trimmedTopic);
        recentTopicsArray.unshift(trimmedTopic);
      }
      recentTopicsArray = recentTopicsArray.slice(0, 10);
      localStorage.setItem(LOCAL_STORAGE_RECENT_TOPICS_KEY, JSON.stringify(recentTopicsArray));
    } catch (e) {
      console.error("Failed to save recent topic to localStorage", e);
    }

    const notesPromise = generateNotesAction({ topic: inputTopic.trim() });
    const quizPromise = generateQuizAction({ topic: inputTopic.trim(), numQuestions: 30, difficulty: 'medium' });
    const flashcardsPromise = generateFlashcardsAction({ topic: inputTopic.trim(), numFlashcards: 20 });

    const results = await Promise.allSettled([notesPromise, quizPromise, flashcardsPromise]);

    let allSuccessful = true;

    if (results[0].status === 'fulfilled') {
      setGeneratedNotesContent(results[0].value);
    } else {
      setErrorNotes(results[0].reason?.message || "Failed to generate notes.");
      allSuccessful = false;
    }
    setIsLoadingNotes(false);

    if (results[1].status === 'fulfilled') {
      setGeneratedQuizData(results[1].value);
    } else {
      setErrorQuiz(results[1].reason?.message || "Failed to generate quiz.");
      allSuccessful = false;
    }
    setIsLoadingQuiz(false);

    if (results[2].status === 'fulfilled') {
      setGeneratedFlashcardsData(results[2].value);
    } else {
      setErrorFlashcards(results[2].reason?.message || "Failed to generate flashcards.");
      allSuccessful = false;
    }
    setIsLoadingFlashcards(false);
    
    if (allSuccessful) {
      toast({ title: "Success!", description: "All study materials generated."});
      if (selectedVoice && !isSpeaking && !isPaused) speak("Study materials are ready!");
    } else {
      toast({ title: "Partial Success", description: "Some materials failed to generate. Check individual tabs.", variant: "default" });
      if (selectedVoice && !isSpeaking && !isPaused) speak("Some materials failed to generate.");
    }

  }, [inputTopic, toast, playClickSound, speak, selectedVoice, isSpeaking, isPaused, setVoicePreference]);

  const handleRefreshContent = useCallback(() => {
      playClickSound();
      if (!topic || topic === "No topic provided") {
        toast({ title: "No Topic", description: "Cannot refresh without a valid topic.", variant: "destructive" });
        return;
      }
      toast({ title: "Refreshing Content", description: `Fetching latest materials for ${topic}.` });
      // This should ideally re-trigger the individual fetches or the main generation
      // For now, we'll re-trigger the all-in-one generation.
      if (topic) {
          setInputTopic(topic); // Set input topic to current active topic for re-generation
          handleGenerateAllMaterials();
      }
    }, [topic, toast, playClickSound, handleGenerateAllMaterials]);

  const handleTabChange = (value: string) => {
    playClickSound();
    setActiveTab(value);
  };
  
  const isLoadingAny = isLoadingNotes || isLoadingQuiz || isLoadingFlashcards;

  return (
    <div className="container mx-auto max-w-3xl px-4 py-8 flex flex-col items-center min-h-[calc(100vh-10rem)] space-y-6">
      <Card className="w-full shadow-xl bg-card/90 backdrop-blur-sm">
        <CardHeader className="text-center">
          <div className="flex items-center justify-center mb-4">
            <GraduationCap className="h-12 w-12 text-primary" />
          </div>
          <CardTitle className="text-2xl sm:text-3xl font-bold text-primary">{PAGE_TITLE}</CardTitle>
          <CardDescription className="text-sm sm:text-base text-muted-foreground px-2">
            Enter any academic topic, and LearnMint AI will generate comprehensive study notes, a quiz, and flashcards for you.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 p-6">
          <div className="relative">
            <Input
              id="topicInput"
              value={inputTopic}
              onChange={(e) => setInputTopic(e.target.value)}
              placeholder="e.g., Quantum Physics, Cell Biology"
              className="text-base sm:text-lg py-3 px-4 pr-12 transition-colors duration-200 ease-in-out"
              aria-label="Study Topic"
              onKeyDown={(e) => e.key === 'Enter' && !isLoadingAny && inputTopic.trim().length >=3 && handleGenerateAllMaterials()}
            />
            {browserSupportsSpeechRecognition && (
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8"
                onClick={handleVoiceCommand}
                disabled={isLoadingAny || isListening}
                aria-label="Use Voice Input"
                title="Use Voice Input"
              >
                <Mic className={`h-5 w-5 ${isListening ? 'text-destructive animate-pulse' : 'text-muted-foreground hover:text-primary'}`} />
              </Button>
            )}
          </div>
          {errorNotes && !isLoadingNotes && <p className="text-sm text-destructive text-center">{errorNotes}</p>}
          <Button
            onClick={handleGenerateAllMaterials}
            disabled={isLoadingAny || inputTopic.trim().length < 3}
            className="w-full text-base sm:text-lg py-3 group bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 text-primary-foreground shadow-lg transition-all duration-300 ease-in-out hover:shadow-primary/50 active:scale-95"
            size="lg"
          >
            {isLoadingAny ? (
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            ) : (
              <Sparkles className="mr-2 h-5 w-5 transition-transform duration-300 group-hover:rotate-[360deg] group-hover:scale-125" />
            )}
            {isLoadingAny ? "Generating Materials..." : "Generate Study Materials"}
          </Button>
        </CardContent>
      </Card>

      {materialsGenerated && (
        <Card className="w-full shadow-xl mt-8 flex-1 flex flex-col min-h-0">
           <CardHeader className="pb-2">
             <div className="flex flex-col sm:flex-row justify-between items-center gap-2">
                <CardTitle className="text-xl sm:text-2xl md:text-3xl font-bold text-center sm:text-left">
                    Study Hub for: <span className="text-primary">{topic}</span>
                </CardTitle>
                <Button onClick={handleRefreshContent} variant="outline" size="sm" className="active:scale-95" disabled={isLoadingAny}>
                    <RefreshCw className="mr-2 h-4 w-4" /> Refresh All
                </Button>
            </div>
          </CardHeader>
          <CardContent className="p-2 sm:p-4 flex-1 flex flex-col min-h-0">
            <Tabs defaultValue="notes" value={activeTab} onValueChange={handleTabChange} className="w-full flex-1 flex flex-col min-h-0">
              <TabsList className="grid w-full grid-cols-3 mb-4 sm:mb-6 mx-auto md:max-w-md sticky top-[calc(theme(spacing.16)_+_1px)] sm:top-0 z-10 bg-background/80 backdrop-blur-sm py-1.5">
                <TabsTrigger value="notes" className="py-2.5 text-sm sm:text-base"><BookOpenText className="mr-1.5 sm:mr-2 h-4 w-4"/>Notes {isLoadingNotes && <Loader2 className="ml-2 h-4 w-4 animate-spin"/>}</TabsTrigger>
                <TabsTrigger value="quiz" className="py-2.5 text-sm sm:text-base"><Brain className="mr-1.5 sm:mr-2 h-4 w-4"/>Quiz {isLoadingQuiz && <Loader2 className="ml-2 h-4 w-4 animate-spin"/>}</TabsTrigger>
                <TabsTrigger value="flashcards" className="py-2.5 text-sm sm:text-base"><Layers className="mr-1.5 sm:mr-2 h-4 w-4"/>Flashcards {isLoadingFlashcards && <Loader2 className="ml-2 h-4 w-4 animate-spin"/>}</TabsTrigger>
              </TabsList>

              <TabsContent value="notes" className="flex-1 mt-0 p-0 outline-none ring-0 flex flex-col min-h-0">
                {isLoadingNotes ? <NotesLoadingSkeleton /> :
                 errorNotes ? <ErrorDisplay error={errorNotes} onRetry={handleRefreshContent} contentType="notes" /> :
                 generatedNotesContent?.notes ? <NotesView notesContent={generatedNotesContent.notes} topic={topic} /> : <p className="text-muted-foreground p-4 text-center">No notes generated or an error occurred.</p>}
              </TabsContent>
              <TabsContent value="quiz" className="flex-1 mt-0 p-0 outline-none ring-0 flex flex-col min-h-0">
                 {isLoadingQuiz ? <QuizLoadingSkeleton /> :
                  errorQuiz ? <ErrorDisplay error={errorQuiz} onRetry={handleRefreshContent} contentType="quiz questions" /> :
                  generatedQuizData?.questions ? <QuizView questions={generatedQuizData.questions} topic={topic} /> : <p className="text-muted-foreground p-4 text-center">No quiz questions generated or an error occurred.</p>}
              </TabsContent>
              <TabsContent value="flashcards" className="flex-1 mt-0 p-0 outline-none ring-0 flex flex-col min-h-0">
                 {isLoadingFlashcards ? <FlashcardsLoadingSkeleton /> :
                  errorFlashcards ? <ErrorDisplay error={errorFlashcards} onRetry={handleRefreshContent} contentType="flashcards" /> :
                  generatedFlashcardsData?.flashcards ? <FlashcardsView flashcards={generatedFlashcardsData.flashcards} topic={topic} /> : <p className="text-muted-foreground p-4 text-center">No flashcards generated or an error occurred.</p>}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
