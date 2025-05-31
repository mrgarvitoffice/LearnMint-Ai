
"use client";

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { GraduationCap, Mic, Sparkles, Loader2, BookOpenText, Brain, Layers, RefreshCw, AlertTriangle, Download, Volume2, PlayCircle, PauseCircle, StopCircle, FileSignature, HelpCircleIcon, StickyNote } from "lucide-react"; // Added icons
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

import { useVoiceRecognition } from '@/hooks/useVoiceRecognition';
import { useTTS } from '@/hooks/useTTS';
import { useSound } from '@/hooks/useSound';

import { generateNotesAction, generateQuizFromNotesAction, generateFlashcardsFromNotesAction, type GenerateStudyNotesInput, type GenerateStudyNotesOutput } from "@/lib/actions"; // Updated imports
import type { GenerateQuizQuestionsOutput, GenerateFlashcardsOutput } from '@/lib/types'; // Kept for data types

import AiGeneratedImage from '@/components/study/AiGeneratedImage';
import NotesView from '@/components/study/NotesView';
import QuizView from '@/components/study/QuizView';
import FlashcardsView from '@/components/study/FlashcardsView';
import { Skeleton } from '@/components/ui/skeleton';

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
  const [isLoadingQuizFromNotes, setIsLoadingQuizFromNotes] = useState<boolean>(false);


  const [generatedFlashcardsData, setGeneratedFlashcardsData] = useState<GenerateFlashcardsOutput | null>(null);
  const [flashcardsError, setFlashcardsError] = useState<string | null>(null);
  const [isLoadingFlashcards, setIsLoadingFlashcards] = useState<boolean>(false);
  const [isLoadingFlashcardsFromNotes, setIsLoadingFlashcardsFromNotes] = useState<boolean>(false);


  const { speak, isSpeaking, isPaused, supportedVoices, selectedVoice, setVoicePreference, voicePreference, cancelTTS } = useTTS();
  const { isListening, transcript, startListening, stopListening, browserSupportsSpeechRecognition, error: voiceError } = useVoiceRecognition();
  const { playSound: playClickSound } = useSound('/sounds/ting.mp3', 0.3);
  const { playSound: playActionSound } = useSound('/sounds/custom-sound-2.mp3', 0.4);

  const pageTitleSpokenRef = useRef(false);
  const voicePreferenceWasSetRef = useRef(false);
  const generatingMessageSpokenRef = useRef(false);
  
  useEffect(() => {
    if (supportedVoices.length > 0 && !voicePreferenceWasSetRef.current) {
      setVoicePreference('luma'); 
      voicePreferenceWasSetRef.current = true;
    }
  }, [supportedVoices, setVoicePreference]);

  useEffect(() => {
    let isMounted = true;
    if (isMounted && selectedVoice && !isSpeaking && !isPaused && !pageTitleSpokenRef.current && !isLoadingAll && !generatedNotesContent) {
      speak(PAGE_TITLE);
      pageTitleSpokenRef.current = true;
    }
    return () => { 
      isMounted = false;
    };
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
    playActionSound(); 
    if (topic.trim().length < 3) {
      toast({ title: "Invalid Topic", description: "Topic must be at least 3 characters long.", variant: "destructive" });
      return;
    }

    setGeneratedNotesContent(null); setNotesError(null);
    setGeneratedQuizData(null); setQuizError(null);
    setGeneratedFlashcardsData(null); setFlashcardsError(null);
    
    setIsLoadingAll(true);
    setIsLoadingNotes(true); 
    // These will be triggered by user action after notes are done, so not setting them here.
    // setIsLoadingQuiz(true); 
    // setIsLoadingFlashcards(true);
    pageTitleSpokenRef.current = true; 
    generatingMessageSpokenRef.current = false; 

    if (selectedVoice && !isSpeaking && !isPaused && !generatingMessageSpokenRef.current) {
      speak("Generating study notes. Please wait.");
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

    // Only generate notes initially
    try {
      const notesResult = await generateNotesAction({ topic: topic.trim() });
      setGeneratedNotesContent(notesResult.notes);
      toast({ title: 'Notes Generated!', description: `Study notes for "${topic.trim()}" are ready.` });
      if (selectedVoice && !isSpeaking && !isPaused) speak("Notes generated successfully! You can now create a quiz or flashcards from them.");
    } catch (err: any) {
      setNotesError(err.message);
      toast({ title: 'Notes Generation Failed', description: err.message, variant: 'destructive' });
      if (selectedVoice && !isSpeaking && !isPaused) speak("Sorry, failed to generate notes.");
    } finally {
      setIsLoadingNotes(false);
      setIsLoadingAll(false); // Only notes were generated "all at once"
      generatingMessageSpokenRef.current = false;
    }
  };

  const handleGenerateQuizFromNotes = async () => {
    playActionSound();
    if (!generatedNotesContent) {
      toast({ title: "No Notes", description: "Please generate notes first to create a quiz from them.", variant: "destructive" });
      return;
    }
    setIsLoadingQuizFromNotes(true);
    setQuizError(null);
    setGeneratedQuizData(null); // Clear previous quiz
    if (selectedVoice && !isSpeaking && !isPaused) speak("Generating quiz from notes.");

    try {
      const quizResult = await generateQuizFromNotesAction({ notesContent: generatedNotesContent, numQuestions: 15 }); // Default to 15 questions
      setGeneratedQuizData(quizResult);
      toast({ title: "Quiz from Notes Generated!", description: "Quiz is ready in the Quiz tab." });
      if (selectedVoice && !isSpeaking && !isPaused) speak("Quiz from notes generated!");
    } catch (err: any) {
      setQuizError(err.message);
      toast({ title: "Quiz from Notes Failed", description: err.message, variant: "destructive" });
      if (selectedVoice && !isSpeaking && !isPaused) speak("Failed to generate quiz from notes.");
    } finally {
      setIsLoadingQuizFromNotes(false);
    }
  };

  const handleGenerateFlashcardsFromNotes = async () => {
    playActionSound();
    if (!generatedNotesContent) {
      toast({ title: "No Notes", description: "Please generate notes first to create flashcards from them.", variant: "destructive" });
      return;
    }
    setIsLoadingFlashcardsFromNotes(true);
    setFlashcardsError(null);
    setGeneratedFlashcardsData(null); // Clear previous flashcards
    if (selectedVoice && !isSpeaking && !isPaused) speak("Generating flashcards from notes.");
    
    try {
      const flashcardsResult = await generateFlashcardsFromNotesAction({ notesContent: generatedNotesContent, numFlashcards: 15 }); // Default to 15 flashcards
      setGeneratedFlashcardsData(flashcardsResult);
      toast({ title: "Flashcards from Notes Generated!", description: "Flashcards are ready in the Flashcards tab." });
      if (selectedVoice && !isSpeaking && !isPaused) speak("Flashcards from notes generated!");
    } catch (err: any) {
      setFlashcardsError(err.message);
      toast({ title: "Flashcards from Notes Failed", description: err.message, variant: "destructive" });
       if (selectedVoice && !isSpeaking && !isPaused) speak("Failed to generate flashcards from notes.");
    } finally {
      setIsLoadingFlashcardsFromNotes(false);
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
            Enter any academic topic. LearnMint AI will generate comprehensive study notes with AI images.
            You can then create a quiz and flashcards based on these notes.
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
          
          <Button
            onClick={handleGenerateAllMaterials}
            disabled={isLoadingAll || isLoadingNotes || topic.trim().length < 3}
            className="w-full text-base sm:text-lg py-3 transition-all duration-300 ease-in-out group bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 text-primary-foreground shadow-lg hover:shadow-primary/50 active:scale-95"
            size="lg"
          >
            {(isLoadingAll || isLoadingNotes) ? (
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            ) : (
              <FileSignature className="mr-2 h-5 w-5 transition-transform duration-300 group-hover:rotate-[5deg] group-hover:scale-110" />
            )}
            {(isLoadingAll || isLoadingNotes) ? "Generating Notes..." : "Generate Study Notes"}
          </Button>
        </CardContent>
      </Card>

      {generatedNotesContent && !isLoadingNotes && (
        <Card className="w-full shadow-md bg-card/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-lg text-primary">Derived Content Actions</CardTitle>
            <CardDescription>Use the generated notes to create quizzes and flashcards.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col sm:flex-row gap-3">
            <Button onClick={handleGenerateQuizFromNotes} disabled={isLoadingQuizFromNotes || !generatedNotesContent} className="flex-1 group">
              {isLoadingQuizFromNotes ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <HelpCircleIcon className="mr-2 h-4 w-4 group-hover:animate-pulse" />}
              {isLoadingQuizFromNotes ? "Creating Quiz..." : "Create Quiz from Notes"}
            </Button>
            <Button onClick={handleGenerateFlashcardsFromNotes} disabled={isLoadingFlashcardsFromNotes || !generatedNotesContent} className="flex-1 group">
              {isLoadingFlashcardsFromNotes ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <StickyNote className="mr-2 h-4 w-4 group-hover:animate-bounce" />}
              {isLoadingFlashcardsFromNotes ? "Creating Flashcards..." : "Create Flashcards from Notes"}
            </Button>
          </CardContent>
        </Card>
      )}

      {(generatedNotesContent || generatedQuizData || generatedFlashcardsData || notesError || quizError || flashcardsError || isLoadingAll || isLoadingNotes || isLoadingQuizFromNotes || isLoadingFlashcardsFromNotes) && (
        <Tabs defaultValue="notes" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="notes" onClick={() => playClickSound()}>
              <BookOpenText className="mr-2 h-4 w-4"/>Notes {(isLoadingNotes && !generatedNotesContent) && <Loader2 className="ml-2 h-4 w-4 animate-spin"/>}
            </TabsTrigger>
            <TabsTrigger value="quiz" onClick={() => playClickSound()} disabled={!generatedNotesContent && !generatedQuizData && !quizError}>
              <Brain className="mr-2 h-4 w-4"/>Quiz {(isLoadingQuizFromNotes && !generatedQuizData) && <Loader2 className="ml-2 h-4 w-4 animate-spin"/>}
            </TabsTrigger>
            <TabsTrigger value="flashcards" onClick={() => playClickSound()} disabled={!generatedNotesContent && !generatedFlashcardsData && !flashcardsError}>
              <Layers className="mr-2 h-4 w-4"/>Flashcards {(isLoadingFlashcardsFromNotes && !generatedFlashcardsData) && <Loader2 className="ml-2 h-4 w-4 animate-spin"/>}
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="notes" className="mt-4">
            {isLoadingNotes && !generatedNotesContent && (
              <Card><CardContent className="p-6 text-center"><Loader2 className="h-8 w-8 animate-spin text-primary mx-auto my-4" /><p>Loading Notes...</p></CardContent></Card>
            )}
            {notesError && <Alert variant="destructive"><AlertTriangle className="h-4 w-4" /><AlertTitle>Error Generating Notes</AlertTitle><AlertDescription>{notesError}</AlertDescription></Alert>}
            {generatedNotesContent && <NotesView notesContent={generatedNotesContent} topic={topic} />}
            {!isLoadingNotes && !generatedNotesContent && !notesError && !isLoadingAll && <p className="text-muted-foreground p-4 text-center">Notes will appear here after generation.</p>}
          </TabsContent>
          
          <TabsContent value="quiz" className="mt-4">
             {isLoadingQuizFromNotes && !generatedQuizData && (
              <Card><CardContent className="p-6 text-center"><Loader2 className="h-8 w-8 animate-spin text-primary mx-auto my-4" /><p>Loading Quiz from Notes...</p></CardContent></Card>
            )}
            {quizError && <Alert variant="destructive"><AlertTriangle className="h-4 w-4" /><AlertTitle>Error Generating Quiz</AlertTitle><AlertDescription>{quizError}</AlertDescription></Alert>}
            {generatedQuizData?.questions && generatedQuizData.questions.length > 0 && <QuizView questions={generatedQuizData.questions} topic={topic} difficulty="medium"/>}
            {generatedQuizData && (!generatedQuizData.questions || generatedQuizData.questions.length === 0) && !isLoadingQuizFromNotes && !quizError && <p className="text-muted-foreground p-4 text-center">Quiz from notes will appear here. Click "Create Quiz from Notes" above.</p>}
            {!isLoadingQuizFromNotes && !generatedQuizData && !quizError && <p className="text-muted-foreground p-4 text-center">Quiz will appear here. Generate notes first, then click "Create Quiz from Notes".</p>}
          </TabsContent>

          <TabsContent value="flashcards" className="mt-4">
            {isLoadingFlashcardsFromNotes && !generatedFlashcardsData && (
               <Card><CardContent className="p-6 text-center"><Loader2 className="h-8 w-8 animate-spin text-primary mx-auto my-4" /><p>Loading Flashcards from Notes...</p></CardContent></Card>
            )}
            {flashcardsError && <Alert variant="destructive"><AlertTriangle className="h-4 w-4" /><AlertTitle>Error Generating Flashcards</AlertTitle><AlertDescription>{flashcardsError}</AlertDescription></Alert>}
            {generatedFlashcardsData?.flashcards && generatedFlashcardsData.flashcards.length > 0 && <FlashcardsView flashcards={generatedFlashcardsData.flashcards} topic={topic} />}
            {generatedFlashcardsData && (!generatedFlashcardsData.flashcards || generatedFlashcardsData.flashcards.length === 0) && !isLoadingFlashcardsFromNotes && !flashcardsError && <p className="text-muted-foreground p-4 text-center">Flashcards from notes will appear here. Click "Create Flashcards from Notes" above.</p>}
            {!isLoadingFlashcardsFromNotes && !generatedFlashcardsData && !flashcardsError && <p className="text-muted-foreground p-4 text-center">Flashcards will appear here. Generate notes first, then click "Create Flashcards from Notes".</p>}
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
