
"use client"; // This page uses client-side hooks for state, effects, and user interactions.

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation'; // For navigation, though not directly used for pushing routes in this version
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

/**
 * GenerateNotesPage Component
 * 
 * This page allows users to input a topic and generate a comprehensive set of study materials:
 * 1. Detailed study notes (with AI-generated images embedded).
 * 2. A 30-question interactive quiz.
 * 3. A set of 20 flashcards.
 * All materials are generated for the same topic in a single action.
 */
export default function GenerateNotesPage() {
  const router = useRouter(); // Next.js router
  const { toast } = useToast(); // Toast notification hook

  // State for the topic input by the user
  const [topic, setTopic] = useState<string>("");
  // State to manage the overall loading status when generating all materials
  const [isLoadingAll, setIsLoadingAll] = useState<boolean>(false);
  
  // State for generated notes content and any errors during notes generation
  const [generatedNotesContent, setGeneratedNotesContent] = useState<string | null>(null);
  const [notesError, setNotesError] = useState<string | null>(null);

  // State for generated quiz data and any errors during quiz generation
  const [generatedQuizData, setGeneratedQuizData] = useState<GenerateQuizQuestionsOutput | null>(null);
  const [quizError, setQuizError] = useState<string | null>(null);

  // State for generated flashcards data and any errors during flashcard generation
  const [generatedFlashcardsData, setGeneratedFlashcardsData] = useState<GenerateFlashcardsOutput | null>(null);
  const [flashcardsError, setFlashcardsError] = useState<string | null>(null);

  // Hooks for Text-to-Speech, Voice Recognition, and Sound Effects
  const { speak, isSpeaking, isPaused, supportedVoices, selectedVoice, setVoicePreference } = useTTS();
  const { isListening, transcript, startListening, stopListening, browserSupportsSpeechRecognition, error: voiceError } = useVoiceRecognition();
  const { playSound: playClickSound } = useSound('/sounds/ting.mp3', 0.3);
  const { playSound: playActionSound } = useSound('/sounds/custom-sound-2.mp3', 0.4);

  // Refs to track if initial TTS announcements have been made
  const pageTitleSpokenRef = useRef(false);
  const voicePreferenceWasSetRef = useRef(false);
  const generatingMessageSpokenRef = useRef(false); // To prevent speaking "generating..." multiple times
  
  // Effect to set preferred TTS voice once supported voices are loaded
  useEffect(() => {
    if (supportedVoices.length > 0 && !voicePreferenceWasSetRef.current) {
      setVoicePreference('luma'); // Default to 'luma' voice
      voicePreferenceWasSetRef.current = true;
    }
  }, [supportedVoices, setVoicePreference]);

  // Effect to speak the page title once TTS is ready and conditions are met
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

  // Effect to update the topic input field with the transcript from voice recognition
  useEffect(() => {
    if (transcript) setTopic(transcript);
  }, [transcript]);

  // Effect to show a toast notification if there's a voice recognition error
  useEffect(() => { 
    if (voiceError) {
      toast({ title: "Voice Input Error", description: voiceError, variant: "destructive" });
    }
  }, [voiceError, toast]);

  /**
   * Handles the voice command button click (start/stop listening).
   */
  const handleVoiceCommand = useCallback(() => {
    playClickSound();
    if (isListening) {
      stopListening();
    } else {
      setTopic(""); // Clear topic before starting new voice input
      startListening();
    }
  }, [isListening, startListening, stopListening, playClickSound]);

  /**
   * Handles the generation of all study materials (notes, quiz, flashcards).
   * This is the primary action triggered by the "Generate All Study Materials" button.
   */
  const handleGenerateAllMaterials = async () => {
    playActionSound(); 
    // Validate topic input
    if (topic.trim().length < 3) {
      toast({ title: "Invalid Topic", description: "Topic must be at least 3 characters long.", variant: "destructive" });
      return;
    }

    // Reset previous states
    setGeneratedNotesContent(null); setNotesError(null);
    setGeneratedQuizData(null); setQuizError(null);
    setGeneratedFlashcardsData(null); setFlashcardsError(null);
    
    setIsLoadingAll(true); // Set loading state for the entire process
    pageTitleSpokenRef.current = true; // Mark page title as "spoken" to prevent re-announcement
    generatingMessageSpokenRef.current = false; // Reset generating message spoken flag

    // Announce that generation is starting
    if (selectedVoice && !isSpeaking && !isPaused && !generatingMessageSpokenRef.current) {
      speak("Generating all study materials: notes, quiz, and flashcards. This may take a moment.");
      generatingMessageSpokenRef.current = true;
    }

    // Save the current topic to localStorage for "Recent Topics" feature
    try {
      const storedTopics = localStorage.getItem(RECENT_TOPICS_LS_KEY);
      let recentTopicsArray = storedTopics ? JSON.parse(storedTopics) : [];
      const trimmedTopic = topic.trim();
      if (!recentTopicsArray.includes(trimmedTopic)) {
        recentTopicsArray.unshift(trimmedTopic); // Add to the beginning
        recentTopicsArray = recentTopicsArray.slice(0, 10); // Keep only the latest 10 topics
        localStorage.setItem(RECENT_TOPICS_LS_KEY, JSON.stringify(recentTopicsArray));
      }
    } catch (e) { console.error("Failed to save recent topic to localStorage", e); }

    try {
      // Call the combined server action to generate all materials
      const combinedResult: CombinedStudyMaterialsOutput = await generateNotesAction({ topic: topic.trim() });
      
      // Handle notes result
      if (combinedResult.notesOutput?.notes) {
        setGeneratedNotesContent(combinedResult.notesOutput.notes);
        toast({ title: 'Notes Generated!', description: `Study notes for "${topic.trim()}" are ready.` });
      } else {
        setNotesError("Failed to generate notes or notes were empty.");
        toast({ title: 'Notes Generation Failed', description: "Primary notes generation failed.", variant: 'destructive' });
      }

      // Handle quiz result
      if (combinedResult.quizOutput?.questions && combinedResult.quizOutput.questions.length > 0) {
        setGeneratedQuizData(combinedResult.quizOutput);
        toast({ title: 'Quiz Generated!', description: `Quiz for "${topic.trim()}" (30 questions) is ready in the Quiz tab.` });
      } else {
        const qError = combinedResult.quizError || "AI returned no quiz questions.";
        setQuizError(qError);
        toast({ title: 'Quiz Generation Info', description: qError, variant: 'default' }); // 'default' variant for info that's not critical failure
      }

      // Handle flashcards result
      if (combinedResult.flashcardsOutput?.flashcards && combinedResult.flashcardsOutput.flashcards.length > 0) {
        setGeneratedFlashcardsData(combinedResult.flashcardsOutput);
        toast({ title: 'Flashcards Generated!', description: `Flashcards for "${topic.trim()}" (20 cards) are ready in the Flashcards tab.` });
      } else {
        const fError = combinedResult.flashcardsError || "AI returned no flashcards.";
        setFlashcardsError(fError);
        toast({ title: 'Flashcards Generation Info', description: fError, variant: 'default' });
      }
      
      // Announce completion if TTS is available
      if (selectedVoice && !isSpeaking && !isPaused) speak("Study materials generated!");

    } catch (err: any) { 
      // Handle critical failure of the primary notes generation
      setNotesError(err.message);
      setQuizError("Could not attempt quiz generation due to initial notes failure.");
      setFlashcardsError("Could not attempt flashcard generation due to initial notes failure.");
      toast({ title: 'Study Material Generation Failed', description: err.message, variant: 'destructive' });
      if (selectedVoice && !isSpeaking && !isPaused) speak("Sorry, failed to generate study materials.");
    } finally {
      setIsLoadingAll(false); // Reset overall loading state
      generatingMessageSpokenRef.current = false; // Reset generating message flag
    }
  };
  
  return (
    <div className="container mx-auto max-w-3xl px-4 py-8 space-y-8">
      {/* Main Card for Topic Input and Generation Button */}
      <Card className="w-full shadow-xl bg-card/90 backdrop-blur-sm">
        <CardHeader className="text-center">
          <div className="flex items-center justify-center mb-4">
            <GraduationCap className="h-12 w-12 text-primary" /> {/* Icon representing learning */}
          </div>
          <CardTitle className="text-center text-2xl sm:text-3xl font-bold text-primary">{PAGE_TITLE}</CardTitle>
          <CardDescription className="text-center text-sm sm:text-base text-muted-foreground px-2">
            Enter any academic topic. LearnMint AI will generate notes, a 30-question quiz, and 20 flashcards.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 p-6">
          {/* Topic Input Field with Voice Recognition Button */}
          <div className="relative">
            <Input
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="e.g., Quantum Physics, Cell Biology, World War II"
              className="text-base sm:text-lg py-3 px-4 pr-12 transition-colors duration-200 ease-in-out focus-visible:ring-primary focus-visible:ring-2"
              aria-label="Study Topic"
              // Allow submitting with Enter key if topic is valid and not loading
              onKeyDown={(e) => e.key === 'Enter' && !isLoadingAll && topic.trim().length >=3 && handleGenerateAllMaterials()}
            />
            {/* Voice input button, shown if browser supports Speech Recognition API */}
            {browserSupportsSpeechRecognition && (
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8"
                onClick={handleVoiceCommand}
                disabled={isLoadingAll || isListening} // Disable while loading or already listening
                aria-label="Use Voice Input"
                title="Use Voice Input"
              >
                <Mic className={`h-5 w-5 ${isListening ? 'text-destructive animate-pulse' : 'text-muted-foreground hover:text-primary'}`} />
              </Button>
            )}
          </div>
          {/* Display voice recognition errors, if any */}
          {voiceError && <p className="text-sm text-destructive text-center">{voiceError}</p>}
          
          {/* Main Button to Generate All Study Materials */}
          <Button
            onClick={handleGenerateAllMaterials}
            disabled={isLoadingAll || topic.trim().length < 3} // Disable if loading or topic is too short
            className="w-full text-base sm:text-lg py-3 transition-all duration-300 ease-in-out group bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 text-primary-foreground shadow-lg hover:shadow-primary/50 active:scale-95"
            size="lg"
          >
            {isLoadingAll ? (
              <Loader2 className="mr-2 h-5 w-5 animate-spin" /> // Loading spinner
            ) : (
              <FileSignature className="mr-2 h-5 w-5 transition-transform duration-300 group-hover:rotate-[5deg] group-hover:scale-110" /> // Icon for generation
            )}
            {isLoadingAll ? "Generating Materials..." : "Generate All Study Materials"}
          </Button>
        </CardContent>
      </Card>

      {/* Tabs for Displaying Generated Content (Notes, Quiz, Flashcards) */}
      {/* This section only appears if content has been generated, is loading, or an error occurred */}
      {(generatedNotesContent || generatedQuizData || generatedFlashcardsData || notesError || quizError || flashcardsError || isLoadingAll) && (
        <Tabs defaultValue="notes" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            {/* Notes Tab Trigger */}
            <TabsTrigger value="notes" onClick={() => playClickSound()}>
              <BookOpenText className="mr-2 h-4 w-4"/>Notes 
              {/* Show loader if notes are loading and no content/error yet */}
              {(isLoadingAll && !generatedNotesContent && !notesError) && <Loader2 className="ml-2 h-4 w-4 animate-spin"/>}
            </TabsTrigger>
            {/* Quiz Tab Trigger - disabled until notes are attempted or quiz data/error exists */}
            <TabsTrigger value="quiz" onClick={() => playClickSound()} disabled={!generatedNotesContent && !generatedQuizData && !quizError}>
              <Brain className="mr-2 h-4 w-4"/>Quiz 
              {(isLoadingAll && !generatedQuizData && !quizError) && <Loader2 className="ml-2 h-4 w-4 animate-spin"/>}
            </TabsTrigger>
            {/* Flashcards Tab Trigger - disabled until notes are attempted or flashcard data/error exists */}
            <TabsTrigger value="flashcards" onClick={() => playClickSound()} disabled={!generatedNotesContent && !generatedFlashcardsData && !flashcardsError}>
              <Layers className="mr-2 h-4 w-4"/>Flashcards 
              {(isLoadingAll && !generatedFlashcardsData && !flashcardsError) && <Loader2 className="ml-2 h-4 w-4 animate-spin"/>}
            </TabsTrigger>
          </TabsList>
          
          {/* Content for Notes Tab */}
          <TabsContent value="notes" className="mt-4">
            {isLoadingAll && !generatedNotesContent && !notesError && ( // Show loader card if actively loading notes
              <Card><CardContent className="p-6 text-center"><Loader2 className="h-8 w-8 animate-spin text-primary mx-auto my-4" /><p>Loading Notes...</p></CardContent></Card>
            )}
            {/* Display error if notes generation failed */}
            {notesError && !isLoadingAll && <Alert variant="destructive"><AlertTriangle className="h-4 w-4" /><AlertTitle>Error Generating Notes</AlertTitle><AlertDescription>{notesError}</AlertDescription></Alert>}
            {/* Display NotesView if notes content is available */}
            {generatedNotesContent && <NotesView notesContent={generatedNotesContent} topic={topic} />}
            {/* Placeholder if nothing is loading, no content, and no error */}
            {!isLoadingAll && !generatedNotesContent && !notesError && <p className="text-muted-foreground p-4 text-center">Materials will appear here after generation.</p>}
          </TabsContent>
          
          {/* Content for Quiz Tab */}
          <TabsContent value="quiz" className="mt-4">
             {isLoadingAll && !generatedQuizData && !quizError && ( // Show loader card if actively loading quiz
              <Card><CardContent className="p-6 text-center"><Loader2 className="h-8 w-8 animate-spin text-primary mx-auto my-4" /><p>Loading Quiz...</p></CardContent></Card>
            )}
            {/* Display error if quiz generation failed */}
            {quizError && !isLoadingAll && <Alert variant="destructive"><AlertTriangle className="h-4 w-4" /><AlertTitle>Error Generating Quiz</AlertTitle><AlertDescription>{quizError}</AlertDescription></Alert>}
            {/* Display QuizView if quiz questions are available */}
            {generatedQuizData?.questions && generatedQuizData.questions.length > 0 && <QuizView questions={generatedQuizData.questions} topic={topic} difficulty="medium"/>}
            {!isLoadingAll && !generatedQuizData && !quizError && <p className="text-muted-foreground p-4 text-center">Quiz will appear here after generation.</p>}
          </TabsContent>

          {/* Content for Flashcards Tab */}
          <TabsContent value="flashcards" className="mt-4">
            {isLoadingAll && !generatedFlashcardsData && !flashcardsError && ( // Show loader card if actively loading flashcards
               <Card><CardContent className="p-6 text-center"><Loader2 className="h-8 w-8 animate-spin text-primary mx-auto my-4" /><p>Loading Flashcards...</p></CardContent></Card>
            )}
            {/* Display error if flashcard generation failed */}
            {flashcardsError && !isLoadingAll && <Alert variant="destructive"><AlertTriangle className="h-4 w-4" /><AlertTitle>Error Generating Flashcards</AlertTitle><AlertDescription>{flashcardsError}</AlertDescription></Alert>}
            {/* Display FlashcardsView if flashcards are available */}
            {generatedFlashcardsData?.flashcards && generatedFlashcardsData.flashcards.length > 0 && <FlashcardsView flashcards={generatedFlashcardsData.flashcards} topic={topic} />}
            {!isLoadingAll && !generatedFlashcardsData && !flashcardsError && <p className="text-muted-foreground p-4 text-center">Flashcards will appear here after generation.</p>}
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
