
"use client";

import { useState, useEffect, useRef, useCallback, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { GraduationCap, Mic, Sparkles, Loader2, BookOpenText, Brain, Layers, RefreshCw, AlertTriangle, Download, Volume2, PlayCircle, PauseCircle, StopCircle } from "lucide-react";
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

const PAGE_TITLE = "Generate Topper Notes";
const RECENT_TOPICS_LS_KEY = "learnmint-recent-topics";

export default function GenerateNotesPage() {
  const router = useRouter();
  const { toast } = useToast();

  const [topic, setTopic] = useState<string>("");
  
  const [isLoadingAll, setIsLoadingAll] = useState<boolean>(false);
  
  const [generatedNotesContent, setGeneratedNotesContent] = useState<string | null>(null);
  const [notesError, setNotesError] = useState<string | null>(null);
  const [isLoadingNotes, setIsLoadingNotes] = useState<boolean>(false);

  const [generatedQuizData, setGeneratedQuizData] = useState<GenerateQuizQuestionsOutput | null>(null);
  const [quizError, setQuizError] = useState<string | null>(null);
  const [isLoadingQuiz, setIsLoadingQuiz] = useState<boolean>(false);

  const [generatedFlashcardsData, setGeneratedFlashcardsData] = useState<GenerateFlashcardsOutput | null>(null);
  const [flashcardsError, setFlashcardsError] = useState<string | null>(null);
  const [isLoadingFlashcards, setIsLoadingFlashcards] = useState<boolean>(false);

  const { speak, isSpeaking, isPaused, supportedVoices, selectedVoice, setVoicePreference, voicePreference, cancelTTS } = useTTS();
  const { isListening, transcript, startListening, stopListening, browserSupportsSpeechRecognition, error: voiceError } = useVoiceRecognition();
  const { playSound: playClickSound } = useSound('/sounds/ting.mp3', 0.3);

  const pageTitleSpokenRef = useRef(false);
  const voicePreferenceWasSetRef = useRef(false);
  const generatingMessageSpokenRef = useRef(false);
  
  useEffect(() => {
    if (supportedVoices.length > 0 && !voicePreferenceWasSetRef.current) {
      setVoicePreference('kai'); 
      voicePreferenceWasSetRef.current = true;
    }
  }, [supportedVoices, setVoicePreference]);

  useEffect(() => {
    let isMounted = true;
    if (isMounted && selectedVoice && !isSpeaking && !isPaused && !pageTitleSpokenRef.current && !isLoadingAll && !generatedNotesContent) {
      speak(PAGE_TITLE);
      pageTitleSpokenRef.current = true;
    }
    return () => { isMounted = false; };
  }, [selectedVoice, isSpeaking, isPaused, speak, isLoadingAll, generatedNotesContent]);

  useEffect(() => {
    if (transcript) setTopic(transcript);
  }, [transcript]);

  useEffect(() => {
    if (voiceError) {
      toast({ title: "Voice Input Error", description: voiceError, variant: "destructive" });
    }
  }, [voiceError, toast]);

  const handleVoiceCommand = useCallback(() => {
    playClickSound();
    if (isListening) stopListening();
    else { setTopic(""); startListening(); }
  }, [isListening, startListening, stopListening, playClickSound]);

  const handleGenerateAllMaterials = async () => {
    playClickSound();
    if (topic.trim().length < 3) {
      toast({ title: "Invalid Topic", description: "Topic must be at least 3 characters long.", variant: "destructive" });
      return;
    }

    setGeneratedNotesContent(null); setNotesError(null);
    setGeneratedQuizData(null); setQuizError(null);
    setGeneratedFlashcardsData(null); setFlashcardsError(null);
    setIsLoadingAll(true);
    setIsLoadingNotes(true); setIsLoadingQuiz(true); setIsLoadingFlashcards(true);
    pageTitleSpokenRef.current = true; // Mark as spoken since interaction started

    if (selectedVoice && !isSpeaking && !isPaused && !generatingMessageSpokenRef.current) {
      speak("Generating all study materials, please wait.");
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
    } catch (e) { console.error("Failed to save recent topic to localStorage", e); }

    const notesPromise = generateNotesAction({ topic: topic.trim() })
      .then(data => { setGeneratedNotesContent(data.notes); return { status: 'fulfilled', value: 'Notes' }; })
      .catch(err => { setNotesError(err.message); return { status: 'rejected', reason: 'Notes' }; })
      .finally(() => setIsLoadingNotes(false));

    const quizPromise = generateQuizAction({ topic: topic.trim(), numQuestions: 30, difficulty: 'medium' })
      .then(data => { setGeneratedQuizData(data); return { status: 'fulfilled', value: 'Quiz' }; })
      .catch(err => { setQuizError(err.message); return { status: 'rejected', reason: 'Quiz' }; })
      .finally(() => setIsLoadingQuiz(false));

    const flashcardsPromise = generateFlashcardsAction({ topic: topic.trim(), numFlashcards: 20 })
      .then(data => { setGeneratedFlashcardsData(data); return { status: 'fulfilled', value: 'Flashcards' }; })
      .catch(err => { setFlashcardsError(err.message); return { status: 'rejected', reason: 'Flashcards' }; })
      .finally(() => setIsLoadingFlashcards(false));
    
    const results = await Promise.allSettled([notesPromise, quizPromise, flashcardsPromise]);
    
    setIsLoadingAll(false);
    generatingMessageSpokenRef.current = false;

    const successfulGenerations = results.filter(r => r.status === 'fulfilled' && r.value.status === 'fulfilled').length;
    if (successfulGenerations > 0) {
        toast({ title: 'Content Generated!', description: `${successfulGenerations} section(s) successfully generated.` });
        if (selectedVoice && !isSpeaking && !isPaused) speak("Study materials are ready!");
    } else {
        toast({ title: 'Generation Failed', description: 'Could not generate any study materials. Please check errors below.', variant: 'destructive' });
        if (selectedVoice && !isSpeaking && !isPaused) speak("Sorry, failed to generate study materials.");
    }
  };
  
  return (
    <div className="container mx-auto max-w-3xl px-4 py-8 space-y-8">
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
              onKeyDown={(e) => e.key === 'Enter' && !isLoadingAll && topic.trim().length >=3 && handleGenerateAllMaterials()}
            />
            {browserSupportsSpeechRecognition && (
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8"
                onClick={handleVoiceCommand}
                disabled={isLoadingAll || isListening}
                aria-label="Use Voice Input"
                title="Use Voice Input"
              >
                <Mic className={`h-5 w-5 ${isListening ? 'text-destructive animate-pulse' : 'text-muted-foreground hover:text-primary'}`} />
              </Button>
            )}
          </div>
          {voiceError && <p className="text-sm text-destructive text-center">{voiceError}</p>}
          {notesError && <Alert variant="destructive" className="mt-2"><AlertTriangle className="h-4 w-4" /><AlertTitle>Notes Error</AlertTitle><AlertDescription>{notesError}</AlertDescription></Alert>}
          {quizError && <Alert variant="destructive" className="mt-2"><AlertTriangle className="h-4 w-4" /><AlertTitle>Quiz Error</AlertTitle><AlertDescription>{quizError}</AlertDescription></Alert>}
          {flashcardsError && <Alert variant="destructive" className="mt-2"><AlertTriangle className="h-4 w-4" /><AlertTitle>Flashcards Error</AlertTitle><AlertDescription>{flashcardsError}</AlertDescription></Alert>}
          <Button
            onClick={handleGenerateAllMaterials}
            disabled={isLoadingAll || topic.trim().length < 3}
            className="w-full text-base sm:text-lg py-3 transition-all duration-300 ease-in-out group bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 text-primary-foreground shadow-lg hover:shadow-primary/50 active:scale-95"
            size="lg"
          >
            {isLoadingAll ? (
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            ) : (
              <Sparkles className="mr-2 h-5 w-5 transition-transform duration-300 group-hover:rotate-[360deg] group-hover:scale-125" />
            )}
            {isLoadingAll ? "Generating All Materials..." : "Generate Study Materials"}
          </Button>
        </CardContent>
      </Card>

      {(generatedNotesContent || generatedQuizData || generatedFlashcardsData ) && (
        <Tabs defaultValue="notes" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="notes" onClick={() => playClickSound()}>
              <BookOpenText className="mr-2 h-4 w-4"/>Notes {isLoadingNotes && <Loader2 className="ml-2 h-4 w-4 animate-spin"/>}
            </TabsTrigger>
            <TabsTrigger value="quiz" onClick={() => playClickSound()}>
              <Brain className="mr-2 h-4 w-4"/>Quiz {isLoadingQuiz && <Loader2 className="ml-2 h-4 w-4 animate-spin"/>}
            </TabsTrigger>
            <TabsTrigger value="flashcards" onClick={() => playClickSound()}>
              <Layers className="mr-2 h-4 w-4"/>Flashcards {isLoadingFlashcards && <Loader2 className="ml-2 h-4 w-4 animate-spin"/>}
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="notes" className="mt-4">
            {isLoadingNotes && !generatedNotesContent && <Card><CardContent className="p-6 text-center"><Loader2 className="h-8 w-8 animate-spin text-primary mx-auto my-4" /><p>Loading Notes...</p></CardContent></Card>}
            {notesError && !generatedNotesContent && <Alert variant="destructive"><AlertTriangle className="h-4 w-4" /><AlertTitle>Error Generating Notes</AlertTitle><AlertDescription>{notesError}</AlertDescription></Alert>}
            {generatedNotesContent && <NotesView notesContent={generatedNotesContent} topic={topic} />}
          </TabsContent>
          
          <TabsContent value="quiz" className="mt-4">
            {isLoadingQuiz && !generatedQuizData && <Card><CardContent className="p-6 text-center"><Loader2 className="h-8 w-8 animate-spin text-primary mx-auto my-4" /><p>Loading Quiz...</p></CardContent></Card>}
            {quizError && !generatedQuizData && <Alert variant="destructive"><AlertTriangle className="h-4 w-4" /><AlertTitle>Error Generating Quiz</AlertTitle><AlertDescription>{quizError}</AlertDescription></Alert>}
            {generatedQuizData?.questions && generatedQuizData.questions.length > 0 && <QuizView questions={generatedQuizData.questions} topic={topic} difficulty="medium" />}
            {generatedQuizData && (!generatedQuizData.questions || generatedQuizData.questions.length === 0) && !isLoadingQuiz && !quizError && <p className="text-muted-foreground p-4 text-center">No quiz questions were generated for this topic.</p>}
          </TabsContent>

          <TabsContent value="flashcards" className="mt-4">
            {isLoadingFlashcards && !generatedFlashcardsData && <Card><CardContent className="p-6 text-center"><Loader2 className="h-8 w-8 animate-spin text-primary mx-auto my-4" /><p>Loading Flashcards...</p></CardContent></Card>}
            {flashcardsError && !generatedFlashcardsData && <Alert variant="destructive"><AlertTriangle className="h-4 w-4" /><AlertTitle>Error Generating Flashcards</AlertTitle><AlertDescription>{flashcardsError}</AlertDescription></Alert>}
            {generatedFlashcardsData?.flashcards && generatedFlashcardsData.flashcards.length > 0 && <FlashcardsView flashcards={generatedFlashcardsData.flashcards} topic={topic} />}
            {generatedFlashcardsData && (!generatedFlashcardsData.flashcards || generatedFlashcardsData.flashcards.length === 0) && !isLoadingFlashcards && !flashcardsError && <p className="text-muted-foreground p-4 text-center">No flashcards were generated for this topic.</p>}
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
