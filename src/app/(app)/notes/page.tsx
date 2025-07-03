
"use client";

import { useState, useEffect, useRef, useCallback, type ChangeEvent } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { GraduationCap, Mic, FileSignature, Loader2, AlertTriangle, ImageIcon, XCircle, FileText, AudioLines, Video } from "lucide-react"; 
import Image from 'next/image';

import { useVoiceRecognition } from '@/hooks/useVoiceRecognition';
import { useTTS } from '@/hooks/useTTS';
import { useSound } from '@/hooks/useSound';
import { useSettings } from '@/contexts/SettingsContext';

import { generateNotesAction } from "@/lib/actions";
import type { CombinedStudyMaterialsOutput } from '@/lib/types'; 
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';

const PAGE_TITLE = "Generate Study Materials";
const RECENT_TOPICS_LS_KEY = "learnmint-recent-topics";
const LOCALSTORAGE_KEY_PREFIX = "learnmint-study-";

export default function GenerateNotesPage() {
  const router = useRouter(); 
  const { toast } = useToast(); 

  const [topic, setTopic] = useState<string>("");
  const [isLoadingAll, setIsLoadingAll] = useState<boolean>(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageData, setImageData] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [notesError, setNotesError] = useState<string | null>(null);
  const [quizError, setQuizError] = useState<string | null>(null);
  const [flashcardsError, setFlashcardsError] = useState<string | null>(null);

  const { speak, isSpeaking, isPaused, setVoicePreference } = useTTS();
  const { soundMode } = useSettings();
  const { isListening, transcript, startListening, stopListening, browserSupportsSpeechRecognition, error: voiceError } = useVoiceRecognition();
  const { playSound: playClickSound } = useSound('/sounds/ting.mp3', 0.3);
  const { playSound: playActionSound } = useSound('/sounds/custom-sound-2.mp3', 0.4);

  const pageTitleSpokenRef = useRef(false);
  const generatingMessageSpokenRef = useRef(false);
  
  useEffect(() => {
    setVoicePreference('holo'); 
  }, [setVoicePreference]);

  useEffect(() => {
    let isMounted = true;
    if (isMounted && soundMode === 'full' && !isSpeaking && !isPaused && !pageTitleSpokenRef.current && !isLoadingAll) {
      speak(PAGE_TITLE);
      pageTitleSpokenRef.current = true;
    }
    return () => { isMounted = false; };
  }, [isSpeaking, isPaused, speak, isLoadingAll, soundMode]);

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

  const handleImageUpload = (e: ChangeEvent<HTMLInputElement>) => {
    playClickSound();
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) { // 2MB limit
        toast({ title: "Image too large", description: "Please upload an image smaller than 2MB.", variant: "destructive" });
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
        setImageData(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = () => {
    playClickSound();
    setImagePreview(null);
    setImageData(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

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

    if (soundMode === 'full' && !isSpeaking && !isPaused && !generatingMessageSpokenRef.current) {
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
      const combinedResult: CombinedStudyMaterialsOutput = await generateNotesAction({ topic: trimmedTopic, image: imageData || undefined });
      let navigationSuccess = false;

      if (combinedResult.notesOutput?.notes) {
        localStorage.setItem(getCacheKey("notes", trimmedTopic), JSON.stringify(combinedResult.notesOutput));
        toast({ title: 'Notes Generated & Cached!', description: `Study notes for "${trimmedTopic}" are ready.` });
        navigationSuccess = true;
      } else {
        setNotesError("Failed to generate notes or notes were empty.");
        toast({ title: 'Notes Generation Failed', description: "Primary notes generation failed.", variant: 'destructive' });
      }

      if (combinedResult.quizOutput?.questions && combinedResult.quizOutput.questions.length > 0) {
        localStorage.setItem(getCacheKey("quiz", trimmedTopic), JSON.stringify(combinedResult.quizOutput));
        toast({ title: 'Quiz Generated & Cached!', description: `Quiz for "${trimmedTopic}" is ready.` });
      } else {
        const qError = combinedResult.quizError || "AI returned no quiz questions.";
        setQuizError(qError);
        toast({ title: 'Quiz Generation Info', description: qError, variant: 'default' });
      }

      if (combinedResult.flashcardsOutput?.flashcards && combinedResult.flashcardsOutput.flashcards.length > 0) {
        localStorage.setItem(getCacheKey("flashcards", trimmedTopic), JSON.stringify(combinedResult.flashcardsOutput));
        toast({ title: 'Flashcards Generated & Cached!', description: `Flashcards for "${trimmedTopic}" are ready.` });
      } else {
        const fError = combinedResult.flashcardsError || "AI returned no flashcards.";
        setFlashcardsError(fError);
        toast({ title: 'Flashcards Generation Info', description: fError, variant: 'default' });
      }
      
      if (soundMode === 'full' && !isSpeaking && !isPaused) speak("Study materials generated and cached!");

      if (navigationSuccess) {
        router.push(`/study?topic=${encodeURIComponent(trimmedTopic)}`);
      }

    } catch (err: any) { 
      setNotesError(err.message);
      setQuizError("Could not attempt quiz generation due to initial notes failure.");
      setFlashcardsError("Could not attempt flashcard generation due to initial notes failure.");
      toast({ title: 'Study Material Generation Failed', description: err.message, variant: 'destructive' });
      if (soundMode === 'full' && !isSpeaking && !isPaused) speak("Sorry, failed to generate study materials.");
    } finally {
      setIsLoadingAll(false);
      generatingMessageSpokenRef.current = false;
      setTopic('');
      setImageData(null);
      setImagePreview(null);
    }
  };
  
  return (
    <div className="container mx-auto max-w-3xl px-4 py-8 space-y-8">
      <Card className="w-full shadow-xl bg-card/90 backdrop-blur-sm">
        <CardHeader className="text-center">
          <div className="flex items-center justify-center mb-4"><GraduationCap className="h-12 w-12 text-primary" /></div>
          <CardTitle className="text-center text-2xl sm:text-3xl font-bold text-primary">{PAGE_TITLE}</CardTitle>
          <CardDescription className="text-center text-sm sm:text-base text-muted-foreground px-2">
            Enter any academic topic. LearnMint AI will generate notes, a 30-question quiz, and 20 flashcards, then take you to the Study Hub.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 p-6">
          <div className="flex items-center gap-2">
            <Input
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="e.g., Quantum Physics, Cell Biology"
              className="flex-1 text-base sm:text-lg py-3 px-4 transition-colors duration-200 ease-in-out focus-visible:ring-primary focus-visible:ring-2"
              aria-label="Study Topic"
              onKeyDown={(e) => e.key === 'Enter' && !isLoadingAll && topic.trim().length >=3 && handleGenerateAllMaterials()}
            />
            <Popover>
              <PopoverTrigger asChild>
                <Button type="button" variant="outline" size="icon" title="Attach File">
                  <FileText className="w-5 h-5 text-muted-foreground hover:text-primary" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-2">
                <div className="flex gap-2">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button type="button" variant="outline" size="icon" onClick={() => fileInputRef.current?.click()}>
                          <ImageIcon className="w-5 h-5" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent><p>Upload Image</p></TooltipContent>
                    </Tooltip>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button type="button" variant="outline" size="icon" disabled>
                          <AudioLines className="w-5 h-5" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent><p>Audio (Coming Soon)</p></TooltipContent>
                    </Tooltip>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button type="button" variant="outline" size="icon" disabled>
                          <Video className="w-5 h-5" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent><p>Video (Coming Soon)</p></TooltipContent>
                    </Tooltip>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button type="button" variant="outline" size="icon" disabled>
                          <FileText className="w-5 h-5" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent><p>PDF (Coming Soon)</p></TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              </PopoverContent>
            </Popover>
            <input type="file" ref={fileInputRef} onChange={handleImageUpload} accept="image/*" className="hidden" />
             {browserSupportsSpeechRecognition && (
              <Button
                variant="outline"
                size="icon"
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
          
          {imagePreview && (
            <div className="relative w-28 h-28 mx-auto">
              <Image src={imagePreview} alt="Selected preview" layout="fill" objectFit="cover" className="rounded-md border-2 border-primary/50" />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-destructive text-destructive-foreground hover:bg-destructive/80"
                onClick={handleRemoveImage}
              >
                <XCircle className="h-5 w-5" />
              </Button>
            </div>
          )}
          
          <Button
            onClick={handleGenerateAllMaterials}
            disabled={isLoadingAll || topic.trim().length < 3}
            className="w-full text-base sm:text-lg py-3 transition-all duration-300 ease-in-out group active:scale-95"
            size="lg"
            variant="default"
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
