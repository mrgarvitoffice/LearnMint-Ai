
"use client";

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useVoiceRecognition } from '@/hooks/useVoiceRecognition';
import { useTTS } from '@/hooks/useTTS';
import { useSound } from '@/hooks/useSound';
import { GraduationCap, Mic, Sparkles, Loader2 } from "lucide-react";

const PAGE_TITLE = "Generate Study Materials";
const LOCAL_STORAGE_RECENT_TOPICS_KEY = "recentLearnMintTopics";

export default function GeneratePage() {
  const [topic, setTopic] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false); // For the main button action
  const [error, setError] = useState<string | null>(null);
  
  const router = useRouter();
  const { toast } = useToast();
  const { playSound: playClickSound } = useSound('/sounds/ting.mp3', 0.3);
  const { speak, isSpeaking: isTTSSpeaking, supportedVoices, selectedVoice, setVoicePreference, cancel: cancelTTS } = useTTS();
  
  const {
    isListening,
    transcript,
    startListening,
    stopListening,
    browserSupportsSpeechRecognition: hasRecognitionSupport,
    error: voiceError,
  } = useVoiceRecognition();

  const pageTitleSpokenRef = useRef(false);
  const voicePreferenceWasSetRef = useRef(false);
  // Removed generatingMessageSpokenRef as setIsLoading now controls the button text and vocal announcement directly

  useEffect(() => {
    if (supportedVoices.length > 0 && !voicePreferenceWasSetRef.current) {
      setVoicePreference('female'); // Or 'zia' as per your preference
      voicePreferenceWasSetRef.current = true;
    }
  }, [supportedVoices, setVoicePreference]);

  useEffect(() => {
    let isMounted = true;
    if (isMounted && selectedVoice && !isTTSSpeaking && !pageTitleSpokenRef.current && !isLoading) {
      speak(PAGE_TITLE);
      pageTitleSpokenRef.current = true;
    }
    return () => {
      isMounted = false;
      if (pageTitleSpokenRef.current && isMounted) { // Only cancel if this specific announcement was playing
        cancelTTS();
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedVoice, isTTSSpeaking, isLoading]); // Removed speak and cancelTTS from deps to avoid loops

  useEffect(() => {
    if (transcript) {
      setTopic(transcript);
      toast({ title: "Topic Updated", description: "Voice input captured." });
    }
  }, [transcript, toast]);

  useEffect(() => {
    if (voiceError) {
      toast({ title: "Voice Error", description: voiceError, variant: "destructive" });
      setError(`Voice input error: ${voiceError}`);
    }
  }, [voiceError, toast]);

  const handleVoiceCommand = useCallback(() => {
    playClickSound();
    if (isListening) {
      stopListening();
    } else {
      setTopic(""); 
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

    if (selectedVoice && !isTTSSpeaking) {
      speak("Generating study materials, please wait.");
    }

    try {
      const storedTopics = localStorage.getItem(LOCAL_STORAGE_RECENT_TOPICS_KEY);
      let recentTopicsArray: string[] = storedTopics ? JSON.parse(storedTopics) : [];
      const trimmedTopic = topic.trim();
      
      // Add to front if not already present
      if (!recentTopicsArray.includes(trimmedTopic)) {
        recentTopicsArray.unshift(trimmedTopic);
      } else { // Move to front if already present
        recentTopicsArray = recentTopicsArray.filter(t => t !== trimmedTopic);
        recentTopicsArray.unshift(trimmedTopic);
      }
      recentTopicsArray = recentTopicsArray.slice(0, 10); // Keep last 10
      localStorage.setItem(LOCAL_STORAGE_RECENT_TOPICS_KEY, JSON.stringify(recentTopicsArray));
    } catch (e) {
      console.error("Failed to save recent topic to localStorage", e);
      // Non-critical error, proceed with navigation
    }
    
    router.push(`/study?topic=${encodeURIComponent(topic.trim())}`);
    // setIsLoading(false); // This will be set by page navigation or if an error occurs before redirect.
  }, [topic, router, toast, playClickSound, speak, selectedVoice, isTTSSpeaking]);

  return (
    <div className="container mx-auto max-w-xl px-4 py-8 flex flex-col items-center justify-center min-h-[calc(100vh-12rem)]"> {/* Adjusted min-height */}
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
        <CardContent className="space-y-6 p-6">
          <div className="relative">
            <Input
              id="topicInput"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="e.g., Quantum Physics, Cell Biology"
              className="text-base sm:text-lg py-3 px-4 pr-12 transition-colors duration-200 ease-in-out"
              aria-label="Study Topic"
              onKeyDown={(e) => e.key === 'Enter' && !isLoading && topic.trim().length >=3 && handleGenerate()}
            />
            {hasRecognitionSupport && (
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
            className="w-full text-base sm:text-lg py-3 group bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 text-primary-foreground shadow-lg transition-all duration-300 ease-in-out hover:shadow-primary/50 active:scale-95"
            size="lg"
          >
            {isLoading ? (
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            ) : (
              <Sparkles className="mr-2 h-5 w-5 transition-transform duration-300 group-hover:rotate-[360deg] group-hover:scale-125" />
            )}
            {isLoading ? "Proceeding to Study Hub..." : "Get Topper Notes"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
