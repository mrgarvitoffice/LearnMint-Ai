
"use client";

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { GraduationCap, Mic, Sparkles, Loader2 } from 'lucide-react';
import { useVoiceRecognition } from '@/hooks/useVoiceRecognition';
import { useTTS } from '@/hooks/useTTS';
import { useSound } from '@/hooks/useSound';
import { useToast } from '@/hooks/use-toast';

const PAGE_TITLE = "Generate Study Materials";
const LOCAL_STORAGE_RECENT_TOPICS_KEY = "recentLearnMintTopics"; // As per user document

export default function GeneratePage() {
  const [topic, setTopic] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  const pageTitlePlayedRef = useRef(false);
  const generatingAnnouncementPlayedRef = useRef(false);

  const router = useRouter();
  const { toast } = useToast();
  const { playSound: playClickSound } = useSound('/sounds/ting.mp3');
  const { 
    speak, 
    isSpeaking: isTTSSpeaking, 
    selectedVoice, 
    setVoicePreference, 
    supportedVoices 
  } = useTTS();

  const {
    isListening,
    transcript,
    startListening,
    stopListening,
    browserSupportsSpeechRecognition: hasRecognitionSupport,
    error: voiceError,
  } = useVoiceRecognition();

  // Effect to set default TTS voice preference
  useEffect(() => {
    if (supportedVoices.length > 0) {
      setVoicePreference('female'); // As per document's playVocalAnnouncement("...", "female")
    }
  }, [supportedVoices, setVoicePreference]);

  // Effect to update topic from voice transcript
  useEffect(() => {
    if (transcript) {
      setTopic(transcript);
      toast({ title: "Topic Updated", description: "Voice input captured." });
    }
  }, [transcript, toast]);

  // Effect to show voice recognition errors
  useEffect(() => {
    if (voiceError) {
      toast({ title: "Voice Error", description: voiceError, variant: "destructive" });
      setError(`Voice input error: ${voiceError}`);
    }
  }, [voiceError, toast]);

  // Vocal announcement on page load
  useEffect(() => {
    if (selectedVoice && !isTTSSpeaking && !pageTitlePlayedRef.current && !isLoading) {
      speak(PAGE_TITLE);
      pageTitlePlayedRef.current = true;
    }
  }, [selectedVoice, isTTSSpeaking, speak, isLoading, PAGE_TITLE]);


  const handleVoiceCommand = useCallback(() => {
    playClickSound();
    if (isListening) {
      stopListening();
    } else {
      setTopic(""); // Clear topic before starting new voice input
      startListening();
    }
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
    generatingAnnouncementPlayedRef.current = false; // Reset for this attempt

    if (selectedVoice && !isTTSSpeaking && !generatingAnnouncementPlayedRef.current) {
        speak("Generating study materials, please wait.");
        generatingAnnouncementPlayedRef.current = true;
    }

    try {
      const storedTopics = localStorage.getItem(LOCAL_STORAGE_RECENT_TOPICS_KEY);
      let recentTopicsArray: string[] = storedTopics ? JSON.parse(storedTopics) : [];
      
      const trimmedTopic = topic.trim();
      if (!recentTopicsArray.includes(trimmedTopic)) {
        recentTopicsArray.unshift(trimmedTopic);
        recentTopicsArray = recentTopicsArray.slice(0, 10); // Keep last 10
        localStorage.setItem(LOCAL_STORAGE_RECENT_TOPICS_KEY, JSON.stringify(recentTopicsArray));
      }
    } catch (e) {
      console.error("Failed to save recent topic to localStorage", e);
      // Non-critical error, proceed with navigation
    }

    // Navigate to the study page
    // The setIsLoading(false) will effectively be handled by the page navigation
    // or if an error occurs before navigation.
    router.push(`/study?topic=${encodeURIComponent(topic.trim())}`);

  }, [topic, router, toast, playClickSound, speak, selectedVoice, isTTSSpeaking]);
  
  return (
    <div className="container mx-auto max-w-2xl px-4 py-8 flex flex-col items-center justify-center min-h-[calc(100vh-8rem)]">
      <Card className="w-full max-w-xl shadow-xl bg-card/90 backdrop-blur-sm">
        <CardHeader>
          <div className="flex items-center justify-center mb-4">
            <GraduationCap className="h-12 w-12 text-primary" />
          </div>
          <CardTitle className="text-center text-2xl sm:text-3xl font-bold text-primary">{PAGE_TITLE}</CardTitle>
          <CardDescription className="text-center text-sm sm:text-base text-muted-foreground">
            Enter any academic topic, and LearnMint AI will generate comprehensive study notes, a quiz, and flashcards for you.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6 p-6">
          <div className="relative">
            <Input
              id="topicInput"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="e.g., Quantum Physics, Cell Biology, World War II"
              className="text-base sm:text-lg py-3 px-4 pr-12 transition-colors duration-200 ease-in-out focus:ring-primary focus:border-primary" 
              aria-label="Study Topic"
              onKeyDown={(e) => e.key === 'Enter' && !isLoading && topic.trim().length >=3 && handleGenerate()}
            />
            {hasRecognitionSupport && (
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8"
                onClick={handleVoiceCommand}
                disabled={isLoading} 
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
            className="w-full text-base sm:text-lg py-3 group bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 text-primary-foreground shadow-lg transition-all duration-300 ease-in-out hover:shadow-primary/50 active:scale-95"
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
