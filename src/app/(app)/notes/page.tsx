
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

import { generateNotesAction, type GenerateStudyNotesInput } from "@/lib/actions"; 
import type { CombinedStudyMaterialsOutput, GenerateStudyNotesOutput, GenerateQuizQuestionsOutput, GenerateFlashcardsOutput } from '@/lib/types'; 

import AiGeneratedImage from '@/components/study/AiGeneratedImage';
import NotesView from '@/components/study/NotesView';
import QuizView from '@/components/study/QuizView';
import FlashcardsView from '@/components/study/FlashcardsView';
import { Skeleton } from '@/components/ui/skeleton';

const PAGE_TITLE = "Generate Study Materials"; 
const RECENT_TOPICS_LS_KEY = "learnmint-recent-topics";

export default function GenerateNotesPage() {
  const router = useRouter();
  const { toast } = useToast();

  const [topic, setTopic] = useState<string>("");
  const [isLoadingAll, setIsLoadingAll] = useState<boolean>(false);
  
  const [generatedNotesContent, setGeneratedNotesContent] = useState<string | null>(null);
  const [notesError, setNotesError] = useState<string | null>(null);
  // isLoadingNotes is now covered by isLoadingAll for the initial combined generation

  const [generatedQuizData, setGeneratedQuizData] = useState<GenerateQuizQuestionsOutput | null>(null);
  const [quizError, setQuizError] = useState<string | null>(null);
  // isLoadingQuiz and isLoadingQuizFromNotes are now covered by isLoadingAll

  const [generatedFlashcardsData, setGeneratedFlashcardsData] = useState<GenerateFlashcardsOutput | null>(null);
  const [flashcardsError, setFlashcardsError] = useState<string | null>(null);
  // isLoadingFlashcards and isLoadingFlashcardsFromNotes are now covered by isLoadingAll

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
    pageTitleSpokenRef.current = true; 
    generatingMessageSpokenRef.current = false; 

    if (selectedVoice && !isSpeaking && !isPaused && !generatingMessageSpokenRef.current) {
      speak("Generating all study materials: notes, quiz, and flashcards. This may take a moment.");
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

    try {
      // The type of combinedResult will be inferred from generateNotesAction's return type
      const combinedResult = await generateNotesAction({ topic: topic.trim() });
      
      if (combinedResult.notesOutput?.notes) {
        setGeneratedNotesContent(combinedResult.notesOutput.notes);
        toast({ title: 'Notes Generated!', description: `Study notes for "${topic.trim()}" are ready.` });
      } else {
        setNotesError("Failed to generate notes or notes were empty.");
        toast({ title: 'Notes Generation Failed', description: "Primary notes generation failed.", variant: 'destructive' });
      }

      if (combinedResult.quizOutput?.questions && combinedResult.quizOutput.questions.length > 0) {
        setGeneratedQuizData(combinedResult.quizOutput);
        toast({ title: 'Quiz Generated!', description: `Quiz for "${topic.trim()}" (30 questions) is ready in the Quiz tab.` });
      } else {
        const qError = combinedResult.quizError || "AI returned no quiz questions.";
        setQuizError(qError);
        toast({ title: 'Quiz Generation Info', description: qError, variant: 'default' });
      }

      if (combinedResult.flashcardsOutput?.flashcards && combinedResult.flashcardsOutput.flashcards.length > 0) {
        setGeneratedFlashcardsData(combinedResult.flashcardsOutput);
        toast({ title: 'Flashcards Generated!', description: `Flashcards for "${topic.trim()}" (20 cards) are ready in the Flashcards tab.` });
      } else {
        const fError = combinedResult.flashcardsError || "AI returned no flashcards.";
        setFlashcardsError(fError);
        toast({ title: 'Flashcards Generation Info', description: fError, variant: 'default' });
      }
      
      if (selectedVoice && !isSpeaking && !isPaused) speak("Study materials generated!");

    } catch (err: any) { 
      setNotesError(err.message);
      setQuizError("Could not attempt quiz generation due to initial failure.");
      setFlashcardsError("Could not attempt flashcard generation due to initial failure.");
      toast({ title: 'Study Material Generation Failed', description: err.message, variant: 'destructive' });
      if (selectedVoice && !isSpeaking && !isPaused) speak("Sorry, failed to generate study materials.");
    } finally {
      setIsLoadingAll(false);
      generatingMessageSpokenRef.current = false;
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
            Enter any academic topic. LearnMint AI will generate notes, a 30-question quiz, and 20 flashcards.
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
            disabled={isLoadingAll || topic.trim().length < 3}
            className="w-full text-base sm:text-lg py-3 transition-all duration-300 ease-in-out group bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 text-primary-foreground shadow-lg hover:shadow-primary/50 active:scale-95"
            size="lg"
          >
            {isLoadingAll ? (
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            ) : (
              <FileSignature className="mr-2 h-5 w-5 transition-transform duration-300 group-hover:rotate-[5deg] group-hover:scale-110" />
            )}
            {isLoadingAll ? "Generating Materials..." : "Generate All Study Materials"}
          </Button>
        </CardContent>
      </Card>

      {/* Removed the "Derived Content Actions" card as generation is now automatic */}

      {(generatedNotesContent || generatedQuizData || generatedFlashcardsData || notesError || quizError || flashcardsError || isLoadingAll) && (
        <Tabs defaultValue="notes" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="notes" onClick={() => playClickSound()}>
              <BookOpenText className="mr-2 h-4 w-4"/>Notes {(isLoadingAll && !generatedNotesContent && !notesError) && <Loader2 className="ml-2 h-4 w-4 animate-spin"/>}
            </TabsTrigger>
            <TabsTrigger value="quiz" onClick={() => playClickSound()} disabled={!generatedNotesContent && !generatedQuizData && !quizError}>
              <Brain className="mr-2 h-4 w-4"/>Quiz {(isLoadingAll && !generatedQuizData && !quizError) && <Loader2 className="ml-2 h-4 w-4 animate-spin"/>}
            </TabsTrigger>
            <TabsTrigger value="flashcards" onClick={() => playClickSound()} disabled={!generatedNotesContent && !generatedFlashcardsData && !flashcardsError}>
              <Layers className="mr-2 h-4 w-4"/>Flashcards {(isLoadingAll && !generatedFlashcardsData && !flashcardsError) && <Loader2 className="ml-2 h-4 w-4 animate-spin"/>}
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="notes" className="mt-4">
            {isLoadingAll && !generatedNotesContent && !notesError && (
              <Card><CardContent className="p-6 text-center"><Loader2 className="h-8 w-8 animate-spin text-primary mx-auto my-4" /><p>Loading Notes...</p></CardContent></Card>
            )}
            {notesError && !isLoadingAll && <Alert variant="destructive"><AlertTriangle className="h-4 w-4" /><AlertTitle>Error Generating Notes</AlertTitle><AlertDescription>{notesError}</AlertDescription></Alert>}
            {generatedNotesContent && <NotesView notesContent={generatedNotesContent} topic={topic} />}
            {!isLoadingAll && !generatedNotesContent && !notesError && <p className="text-muted-foreground p-4 text-center">Materials will appear here after generation.</p>}
          </TabsContent>
          
          <TabsContent value="quiz" className="mt-4">
             {isLoadingAll && !generatedQuizData && !quizError && (
              <Card><CardContent className="p-6 text-center"><Loader2 className="h-8 w-8 animate-spin text-primary mx-auto my-4" /><p>Loading Quiz...</p></CardContent></Card>
            )}
            {quizError && !isLoadingAll && <Alert variant="destructive"><AlertTriangle className="h-4 w-4" /><AlertTitle>Error Generating Quiz</AlertTitle><AlertDescription>{quizError}</AlertDescription></Alert>}
            {generatedQuizData?.questions && generatedQuizData.questions.length > 0 && <QuizView questions={generatedQuizData.questions} topic={topic} difficulty="medium"/>}
            {!isLoadingAll && !generatedQuizData && !quizError && <p className="text-muted-foreground p-4 text-center">Quiz will appear here after generation.</p>}
          </TabsContent>

          <TabsContent value="flashcards" className="mt-4">
            {isLoadingAll && !generatedFlashcardsData && !flashcardsError && (
               <Card><CardContent className="p-6 text-center"><Loader2 className="h-8 w-8 animate-spin text-primary mx-auto my-4" /><p>Loading Flashcards...</p></CardContent></Card>
            )}
            {flashcardsError && !isLoadingAll && <Alert variant="destructive"><AlertTriangle className="h-4 w-4" /><AlertTitle>Error Generating Flashcards</AlertTitle><AlertDescription>{flashcardsError}</AlertDescription></Alert>}
            {generatedFlashcardsData?.flashcards && generatedFlashcardsData.flashcards.length > 0 && <FlashcardsView flashcards={generatedFlashcardsData.flashcards} topic={topic} />}
            {!isLoadingAll && !generatedFlashcardsData && !flashcardsError && <p className="text-muted-foreground p-4 text-center">Flashcards will appear here after generation.</p>}
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
