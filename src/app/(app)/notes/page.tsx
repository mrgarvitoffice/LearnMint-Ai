
"use client"; // This page uses client-side hooks for state, effects, and user interactions.

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation'; // For navigation
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast"; // For displaying notifications
// Icons from lucide-react
import { GraduationCap, Mic, FileSignature, Loader2, BookOpenText, Brain, Layers, AlertTriangle } from "lucide-react"; 

// Hooks for enhanced user experience
import { useVoiceRecognition } from '@/hooks/useVoiceRecognition'; // For voice input
import { useTTS } from '@/hooks/useTTS'; // For text-to-speech
import { useSound } from '@/hooks/useSound'; // For sound effects

// Server actions and types
import { generateNotesAction } from "@/lib/actions"; // Combined server action for all materials
import type { CombinedStudyMaterialsOutput, GenerateStudyNotesOutput, GenerateQuizQuestionsOutput, GenerateFlashcardsOutput } from '@/lib/types'; 

// Child components for displaying generated content
import NotesView from '@/components/study/NotesView';
import QuizView from '@/components/study/QuizView';
import FlashcardsView from '@/components/study/FlashcardsView';

const PAGE_TITLE = "Generate Study Materials"; // Title for TTS and UI
const RECENT_TOPICS_LS_KEY = "learnmint-recent-topics"; // Key for storing recent topics in localStorage
const LOCALSTORAGE_KEY_PREFIX = "learnmint-study-"; // For caching study materials


/**
 * GenerateNotesPage Component
 * 
 * This page allows users to input a topic and generate a comprehensive set of study materials:
 * 1. Detailed study notes (with AI-generated images embedded).
 * 2. A 30-question interactive quiz.
 * 3. A set of 20 flashcards.
 * All materials are generated for the same topic in a single action.
 * After generation, data is cached and user is navigated to /study page.
 */
export default function GenerateNotesPage() {
  const router = useRouter(); 
  const { toast } = useToast(); 

  const [topic, setTopic] = useState<string>("");
  const [isLoadingAll, setIsLoadingAll] = useState<boolean>(false);
  
  // These states are now primarily for displaying errors if generation fails before navigation
  const [notesError, setNotesError] = useState<string | null>(null);
  const [quizError, setQuizError] = useState<string | null>(null);
  const [flashcardsError, setFlashcardsError] = useState<string | null>(null);

  const { speak, isSpeaking, isPaused, supportedVoices, selectedVoice, setVoicePreference } = useTTS();
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
    if (isMounted && selectedVoice && !isSpeaking && !isPaused && !pageTitleSpokenRef.current && !isLoadingAll) {
      speak(PAGE_TITLE);
      pageTitleSpokenRef.current = true;
    }
    return () => { 
      isMounted = false;
    };
  }, [selectedVoice, isSpeaking, isPaused, speak, isLoadingAll]);

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

  const getCacheKey = (type: string, topicKey: string) => `${LOCALSTORAGE_KEY_PREFIX}${type}-${topicKey.toLowerCase().replace(/\s+/g, '-')}`;

  const handleGenerateAllMaterials = async () => {
    playActionSound(); 
    if (topic.trim().length < 3) {
      toast({ title: "Invalid Topic", description: "Topic must be at least 3 characters long.", variant: "destructive" });
      return;
    }

    setNotesError(null); setQuizError(null); setFlashcardsError(null);
    setIsLoadingAll(true);
    pageTitleSpokenRef.current = true; 
    generatingMessageSpokenRef.current = false;

    if (selectedVoice && !isSpeaking && !isPaused && !generatingMessageSpokenRef.current) {
      speak("Generating all study materials: notes, quiz, and flashcards. This may take a moment.");
      generatingMessageSpokenRef.current = true;
    }

    const trimmedTopic = topic.trim();
    try {
      const storedTopics = localStorage.getItem(RECENT_TOPICS_LS_KEY);
      let recentTopicsArray = storedTopics ? JSON.parse(storedTopics) : [];
      if (!recentTopicsArray.includes(trimmedTopic)) {
        recentTopicsArray.unshift(trimmedTopic);
        recentTopicsArray = recentTopicsArray.slice(0, 10);
        localStorage.setItem(RECENT_TOPICS_LS_KEY, JSON.stringify(recentTopicsArray));
      }
    } catch (e) { console.error("Failed to save recent topic to localStorage", e); }

    try {
      const combinedResult: CombinedStudyMaterialsOutput = await generateNotesAction({ topic: trimmedTopic });
      let navigationSuccess = false;

      // Cache notes
      if (combinedResult.notesOutput?.notes) {
        localStorage.setItem(getCacheKey("notes", trimmedTopic), JSON.stringify(combinedResult.notesOutput));
        toast({ title: 'Notes Generated & Cached!', description: `Study notes for "${trimmedTopic}" are ready.` });
        navigationSuccess = true; // Consider navigation successful if notes are generated
      } else {
        setNotesError("Failed to generate notes or notes were empty.");
        toast({ title: 'Notes Generation Failed', description: "Primary notes generation failed.", variant: 'destructive' });
      }

      // Cache quiz
      if (combinedResult.quizOutput?.questions && combinedResult.quizOutput.questions.length > 0) {
        localStorage.setItem(getCacheKey("quiz", trimmedTopic), JSON.stringify(combinedResult.quizOutput));
        toast({ title: 'Quiz Generated & Cached!', description: `Quiz for "${trimmedTopic}" is ready.` });
      } else {
        const qError = combinedResult.quizError || "AI returned no quiz questions.";
        setQuizError(qError); // Set error for local display if needed, though we navigate away
        toast({ title: 'Quiz Generation Info', description: qError, variant: 'default' });
      }

      // Cache flashcards
      if (combinedResult.flashcardsOutput?.flashcards && combinedResult.flashcardsOutput.flashcards.length > 0) {
        localStorage.setItem(getCacheKey("flashcards", trimmedTopic), JSON.stringify(combinedResult.flashcardsOutput));
        toast({ title: 'Flashcards Generated & Cached!', description: `Flashcards for "${trimmedTopic}" are ready.` });
      } else {
        const fError = combinedResult.flashcardsError || "AI returned no flashcards.";
        setFlashcardsError(fError); // Set error for local display if needed
        toast({ title: 'Flashcards Generation Info', description: fError, variant: 'default' });
      }
      
      if (selectedVoice && !isSpeaking && !isPaused) speak("Study materials generated and cached!");

      if (navigationSuccess) {
        router.push(`/study?topic=${encodeURIComponent(trimmedTopic)}`);
      }

    } catch (err: any) { 
      setNotesError(err.message); // Primary error is likely notes
      setQuizError("Could not attempt quiz generation due to initial notes failure.");
      setFlashcardsError("Could not attempt flashcard generation due to initial notes failure.");
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
            Enter any academic topic. LearnMint AI will generate notes, a 30-question quiz, and 20 flashcards, then take you to the Study Hub.
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
            {isLoadingAll ? "Generating & Caching..." : "Generate & Go to Study Hub"}
          </Button>
        </CardContent>
      </Card>

      {/* Display errors locally if generation fails before navigation */}
      {isLoadingAll && (
        <div className="text-center py-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
          <p className="text-muted-foreground mt-2">AI is working its magic...</p>
        </div>
      )}
      {!isLoadingAll && (notesError || quizError || flashcardsError) && (
        <div className="space-y-4">
            {notesError && <Alert variant="destructive"><AlertTriangle className="h-4 w-4" /><AlertTitle>Notes Error</AlertTitle><AlertDescription>{notesError}</AlertDescription></Alert>}
            {quizError && <Alert variant="destructive"><AlertTriangle className="h-4 w-4" /><AlertTitle>Quiz Error</AlertTitle><AlertDescription>{quizError}</AlertDescription></Alert>}
            {flashcardsError && <Alert variant="destructive"><AlertTriangle className="h-4 w-4" /><AlertTitle>Flashcards Error</AlertTitle><AlertDescription>{flashcardsError}</AlertDescription></Alert>}
        </div>
      )}
    </div>
  );
}

    