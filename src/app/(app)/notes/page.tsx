
"use client";

import { useState, useEffect, useRef, useCallback, Suspense } from 'react';
import { useRouter } from 'next/navigation';
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
import type { GenerateStudyNotesOutput, GenerateQuizQuestionsOutput, QuizQuestion, Flashcard, GenerateFlashcardsOutput } from '@/lib/types'; 

import AiGeneratedImage from '@/components/study/AiGeneratedImage';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import NotesView from '@/components/study/NotesView';
import QuizView from '@/components/study/QuizView';
import FlashcardsView from '@/components/study/FlashcardsView';


const PAGE_TITLE = "Generate Topper Notes";
const RECENT_TOPICS_LS_KEY = "learnmint-recent-topics";

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

export default function NotesPage() {
  const router = useRouter();
  
  const [topic, setTopic] = useState<string>("");
  const [activeTopic, setActiveTopic] = useState<string | null>(null);
  
  const [generatedNotesContent, setGeneratedNotesContent] = useState<string | null>(null);
  const [generatedQuizData, setGeneratedQuizData] = useState<QuizQuestion[] | null>(null);
  const [generatedFlashcardsData, setGeneratedFlashcardsData] = useState<Flashcard[] | null>(null);

  const [isLoadingNotes, setIsLoadingNotes] = useState<boolean>(false);
  const [isLoadingQuiz, setIsLoadingQuiz] = useState<boolean>(false);
  const [isLoadingFlashcards, setIsLoadingFlashcards] = useState<boolean>(false);
  const [isGeneratingAll, setIsGeneratingAll] = useState<boolean>(false);
  
  const [errorNotes, setErrorNotes] = useState<string | null>(null);
  const [errorQuiz, setErrorQuiz] = useState<string | null>(null);
  const [errorFlashcards, setErrorFlashcards] = useState<string | null>(null);
  
  const [activeTab, setActiveTab] = useState<string>("notes");
  const [materialsGenerated, setMaterialsGenerated] = useState(false);

  const { toast } = useToast();
  const { playSound: playClickSound } = useSound('/sounds/ting.mp3', 0.3);
  const { speak, pauseTTS, resumeTTS, cancelTTS, isSpeaking, isPaused, supportedVoices, selectedVoice, setSelectedVoiceURI, setVoicePreference, voicePreference } = useTTS();
  const { isListening, transcript, startListening, stopListening, browserSupportsSpeechRecognition, error: voiceError } = useVoiceRecognition();

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
    if (isMounted && selectedVoice && !isSpeaking && !isPaused && !pageTitleSpokenRef.current && !isGeneratingAll && !materialsGenerated) {
      speak(PAGE_TITLE);
      pageTitleSpokenRef.current = true;
    }
    return () => { isMounted = false; };
  }, [selectedVoice, isSpeaking, isPaused, speak, isGeneratingAll, materialsGenerated]);

  useEffect(() => {
    if (transcript) setTopic(transcript);
  }, [transcript]);

  useEffect(() => {
    if (voiceError) {
      toast({ title: "Voice Input Error", description: voiceError, variant: "destructive" });
      setErrorNotes(`Voice input error: ${voiceError}`);
    }
  }, [voiceError, toast]);

  const handleVoiceCommand = useCallback(() => {
    playClickSound();
    if (isListening) stopListening();
    else { setTopic(""); startListening(); }
  }, [isListening, startListening, stopListening, playClickSound]);

  const handleGenerateAllMaterials = useCallback(async () => {
    playClickSound();
    const topicToGenerate = topic.trim();

    if (topicToGenerate.length < 3) {
      toast({ title: "Invalid Topic", description: "Topic must be at least 3 characters long.", variant: "destructive" });
      return;
    }
    
    setActiveTopic(topicToGenerate);
    setErrorNotes(null); setErrorQuiz(null); setErrorFlashcards(null);
    setGeneratedNotesContent(null); setGeneratedQuizData(null); setGeneratedFlashcardsData(null);
    
    setIsGeneratingAll(true);
    setMaterialsGenerated(true);
    setActiveTab("notes");

    if (selectedVoice && !isSpeaking && !isPaused) speak("Generating all study materials. Please wait.");

    try {
      const storedTopics = localStorage.getItem(RECENT_TOPICS_LS_KEY);
      let recentTopicsArray = storedTopics ? JSON.parse(storedTopics) : [];
      if (!recentTopicsArray.includes(topicToGenerate)) {
        recentTopicsArray.unshift(topicToGenerate);
      } else { 
        recentTopicsArray = recentTopicsArray.filter(t => t !== topicToGenerate);
        recentTopicsArray.unshift(topicToGenerate);
      }
      recentTopicsArray = recentTopicsArray.slice(0, 10);
      localStorage.setItem(RECENT_TOPICS_LS_KEY, JSON.stringify(recentTopicsArray));
    } catch (e) { console.error("Failed to save recent topic to localStorage", e); }

    const notesPromise = generateNotesAction({ topic: topicToGenerate }).catch(e => ({ error: e, type: 'notes' }));
    const quizPromise = generateQuizAction({ topic: topicToGenerate, numQuestions: 30, difficulty: 'medium' }).catch(e => ({ error: e, type: 'quiz' }));
    const flashcardsPromise = generateFlashcardsAction({ topic: topicToGenerate, numFlashcards: 20 }).catch(e => ({ error: e, type: 'flashcards' }));

    setIsLoadingNotes(true); setIsLoadingQuiz(true); setIsLoadingFlashcards(true);
    
    const results = await Promise.allSettled([notesPromise, quizPromise, flashcardsPromise]);
    let allSuccessful = true;
    let successMessage = "Study materials are ready!";

    if (results[0].status === 'fulfilled' && !(results[0].value as any).error) {
      setGeneratedNotesContent((results[0].value as GenerateStudyNotesOutput).notes);
    } else {
      setErrorNotes(results[0].status === 'rejected' ? results[0].reason?.message : (results[0].value as any).error?.message || "Failed to generate notes.");
      allSuccessful = false;
    }
    setIsLoadingNotes(false);

    if (results[1].status === 'fulfilled' && !(results[1].value as any).error) {
      setGeneratedQuizData((results[1].value as GenerateQuizQuestionsOutput).questions);
    } else {
      setErrorQuiz(results[1].status === 'rejected' ? results[1].reason?.message : (results[1].value as any).error?.message || "Failed to generate quiz questions.");
      allSuccessful = false;
    }
    setIsLoadingQuiz(false);

    if (results[2].status === 'fulfilled' && !(results[2].value as any).error) {
      setGeneratedFlashcardsData((results[2].value as GenerateFlashcardsOutput).flashcards);
    } else {
      setErrorFlashcards(results[2].status === 'rejected' ? results[2].reason?.message : (results[2].value as any).error?.message || "Failed to generate flashcards.");
      allSuccessful = false;
    }
    setIsLoadingFlashcards(false);
    
    setIsGeneratingAll(false);

    if (selectedVoice && !isSpeaking && !isPaused) {
      if (allSuccessful) {
        toast({ title: "Success!", description: successMessage });
        speak(successMessage);
      } else {
        successMessage = "Some materials failed to generate. Check individual tabs.";
        toast({ title: "Partial Success", description: successMessage, variant: "default" });
        speak(successMessage);
      }
    }
  }, [topic, toast, playClickSound, speak, selectedVoice, isSpeaking, isPaused, setVoicePreference, router]);

  const handleTabChange = (value: string) => { playClickSound(); setActiveTab(value); };
  
  return (
    <div className="container mx-auto max-w-5xl px-2 py-6 sm:px-4 sm:py-8 flex flex-col flex-1 min-h-[calc(100vh-8rem)] space-y-6">
      <Card className="w-full shadow-xl bg-card/90 backdrop-blur-sm">
        <CardHeader className="text-center">
          <div className="flex items-center justify-center mb-4"><GraduationCap className="h-10 w-10 text-primary" /></div>
          <CardTitle className="text-2xl sm:text-3xl font-bold text-primary">{PAGE_TITLE}</CardTitle>
          <CardDescription className="text-sm sm:text-base text-muted-foreground px-2">
            Enter any academic topic, and LearnMint AI will craft detailed notes, a challenging quiz, and insightful flashcards for you.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 p-6">
          <div className="relative">
            <Input id="topicInput" value={topic} onChange={(e) => setTopic(e.target.value)}
              placeholder="e.g., Quantum Physics, Cell Biology"
              className="text-base py-3 px-4 pr-12 transition-colors duration-200 ease-in-out"
              aria-label="Study Topic"
              onKeyDown={(e) => e.key === 'Enter' && !isGeneratingAll && topic.trim().length >=3 && handleGenerateAllMaterials()}
            />
            {browserSupportsSpeechRecognition && (
              <Button variant="ghost" size="icon" className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8"
                onClick={handleVoiceCommand} disabled={isGeneratingAll || isListening} aria-label="Use Voice Input" title="Use Voice Input">
                <Mic className={`h-5 w-5 ${isListening ? 'text-destructive animate-pulse' : 'text-muted-foreground hover:text-primary'}`} />
              </Button>
            )}
          </div>
          {(errorNotes && !isLoadingNotes && !isGeneratingAll) && <p className="text-sm text-destructive text-center">{errorNotes}</p>}
          <Button onClick={handleGenerateAllMaterials} disabled={isGeneratingAll || topic.trim().length < 3}
            className="w-full text-base py-3 group bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 text-primary-foreground shadow-lg transition-all duration-300 ease-in-out hover:shadow-primary/50 active:scale-95"
            size="lg">
            {isGeneratingAll ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Sparkles className="mr-2 h-5 w-5 transition-transform duration-300 group-hover:rotate-[360deg] group-hover:scale-125" />}
            {isGeneratingAll ? "Generating All Materials..." : "Generate Study Materials"}
          </Button>
        </CardContent>
      </Card>

      {materialsGenerated && activeTopic && (
        <Card className="w-full shadow-xl mt-2 flex-1 flex flex-col min-h-0">
           <CardHeader className="pb-2">
             <div className="flex flex-col sm:flex-row justify-between items-center gap-2">
                <CardTitle className="text-xl sm:text-2xl font-bold text-center sm:text-left">
                    Study Hub for: <span className="text-primary">{activeTopic}</span>
                </CardTitle>
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
                 errorNotes ? <ErrorDisplay error={errorNotes} onRetry={() => generateNotesAction({topic: activeTopic || topic}).then(res => setGeneratedNotesContent(res.notes)).catch(e => setErrorNotes(e.message))} contentType="notes" /> :
                 generatedNotesContent && activeTopic ? <NotesView notesContent={generatedNotesContent} topic={activeTopic} /> : <p className="text-muted-foreground p-4 text-center">No notes generated or an error occurred.</p>}
              </TabsContent>
              <TabsContent value="quiz" className="flex-1 mt-0 p-0 outline-none ring-0 flex flex-col min-h-0">
                 {isLoadingQuiz ? <QuizLoadingSkeleton /> :
                  errorQuiz ? <ErrorDisplay error={errorQuiz} onRetry={() => generateQuizAction({topic: activeTopic || topic, numQuestions: 30, difficulty: 'medium'}).then(res => setGeneratedQuizData(res.questions)).catch(e => setErrorQuiz(e.message))} contentType="quiz questions" /> :
                  generatedQuizData && generatedQuizData.length > 0 && activeTopic ? <QuizView questions={generatedQuizData} topic={activeTopic} /> : <p className="text-muted-foreground p-4 text-center">No quiz questions generated or an error occurred.</p>}
              </TabsContent>
              <TabsContent value="flashcards" className="flex-1 mt-0 p-0 outline-none ring-0 flex flex-col min-h-0">
                 {isLoadingFlashcards ? <FlashcardsLoadingSkeleton /> :
                  errorFlashcards ? <ErrorDisplay error={errorFlashcards} onRetry={() => generateFlashcardsAction({topic: activeTopic || topic, numFlashcards: 20}).then(res => setGeneratedFlashcardsData(res.flashcards)).catch(e => setErrorFlashcards(e.message))} contentType="flashcards" /> :
                  generatedFlashcardsData && generatedFlashcardsData.length > 0 && activeTopic ? <FlashcardsView flashcards={generatedFlashcardsData} topic={activeTopic} /> : <p className="text-muted-foreground p-4 text-center">No flashcards generated or an error occurred.</p>}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
