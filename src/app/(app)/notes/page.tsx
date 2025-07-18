
"use client";

import { useState, useEffect, useRef, useCallback, type ChangeEvent } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { GraduationCap, Mic, FileSignature, Loader2, AlertTriangle, ImageIcon, XCircle, FileText } from "lucide-react"; 
import Image from 'next/image';

import { useVoiceRecognition } from '@/hooks/useVoiceRecognition';
import { useTTS } from '@/hooks/useTTS';
import { useSound } from '@/hooks/useSound';
import { useSettings } from '@/contexts/SettingsContext';
import { useQuests } from '@/contexts/QuestContext';

import { generateNotesAction } from "@/lib/actions";
import type { CombinedStudyMaterialsOutput } from '@/lib/types'; 
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useTranslation } from '@/hooks/useTranslation';
import { extractTextFromPdf } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { useGuestUsage } from '@/contexts/GuestUsageContext';
import { GuestLock } from '@/components/features/auth/GuestLock';

const RECENT_TOPICS_LS_KEY = "learnmint-recent-topics";
const LOCALSTORAGE_KEY_PREFIX = "learnmint-study-";

export default function GenerateNotesPage() {
  const router = useRouter(); 
  const { toast } = useToast(); 
  const { t } = useTranslation();
  const { completeQuest1 } = useQuests();
  const { user } = useAuth();
  const { isNotesAllowed, incrementNotesGenerated } = useGuestUsage();

  const [topic, setTopic] = useState<string>("");
  const [isLoadingAll, setIsLoadingAll] = useState<boolean>(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageData, setImageData] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [notesError, setNotesError] = useState<string | null>(null);
  const [quizError, setQuizError] = useState<string | null>(null);
  const [flashcardsError, setFlashcardsError] = useState<string | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);

  const { speak, setVoicePreference } = useTTS();
  const { isListening, transcript, startListening, stopListening, browserSupportsSpeechRecognition, error: voiceError } = useVoiceRecognition();
  const { playSound: playClickSound } = useSound('/sounds/ting.mp3');
  const { playSound: playActionSound } = useSound('/sounds/custom-sound-2.mp3', { priority: 'essential' });
  const { soundMode } = useSettings();

  const pageTitleSpokenRef = useRef(false);
  
  useEffect(() => {
    setVoicePreference('holo'); 
  }, [setVoicePreference]);

  useEffect(() => {
    const PAGE_TITLE = t('generate.title');
    const timer = setTimeout(() => {
      if (!pageTitleSpokenRef.current && !isLoadingAll && soundMode === 'full') {
        speak(PAGE_TITLE, { priority: 'optional' });
        pageTitleSpokenRef.current = true;
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [speak, isLoadingAll, t, soundMode]);

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

  const handleFileUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    playClickSound();
    setFileError(null);
    const file = e.target.files?.[0];
    if (file) {
      if (file.type.startsWith('image/')) {
        if (file.size > 2 * 1024 * 1024) { // 2MB limit for images
          toast({ title: "Image too large", description: "Please upload an image smaller than 2MB.", variant: "destructive" });
          return;
        }
        const reader = new FileReader();
        reader.onloadend = () => {
          setImagePreview(reader.result as string);
          setImageData(reader.result as string);
        };
        reader.readAsDataURL(file);
      } else if (file.type === 'application/pdf') {
         if (file.size > 5 * 1024 * 1024) { // 5MB limit for PDFs
          toast({ title: "PDF too large", description: "Please upload a PDF smaller than 5MB.", variant: "destructive" });
          return;
        }
        toast({ title: "Processing PDF", description: "Extracting text from your document, please wait..." });
        try {
          const text = await extractTextFromPdf(file);
          setTopic(text); // Set the extracted text into the topic input
          setImagePreview(null); // Clear any image preview
          setImageData(null);
          toast({ title: "PDF Processed!", description: "Text has been extracted and placed in the topic field." });
        } catch (error) {
          console.error("Error parsing PDF:", error);
          setFileError("Could not extract text from the PDF. The file might be corrupt or incompatible.");
          toast({ title: "PDF Error", description: "Could not extract text from the PDF.", variant: "destructive" });
        }
      } else {
        toast({ title: "Unsupported File", description: "This feature currently supports Images and PDFs.", variant: "default" });
      }
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
    if (user?.isAnonymous && !isNotesAllowed) {
      toast({ title: "Guest Limit Reached", description: "Please sign in to generate more notes.", variant: "destructive" });
      return;
    }

    if (topic.trim().length < 3) {
      toast({ title: t('generate.toast.invalidTopic'), description: t('generate.toast.invalidTopicDesc'), variant: "destructive" });
      return;
    }

    setNotesError(null); setQuizError(null); setFlashcardsError(null);
    setIsLoadingAll(true);
    pageTitleSpokenRef.current = true; 

    if (soundMode === 'full') speak("Generating all study materials. This may take a moment.", { priority: 'optional' });

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

      // Handle notes
      if (combinedResult.notesOutput?.notes) {
        localStorage.setItem(getCacheKey("notes", trimmedTopic), JSON.stringify(combinedResult.notesOutput));
        navigationSuccess = true;
        completeQuest1(); // Mark quest 1 as complete
        if (user?.isAnonymous) {
          incrementNotesGenerated();
        }
      } else {
        setNotesError(t('generate.toast.notesErrorDesc'));
      }

      // Handle quiz
      const quizSuccess = combinedResult.quizOutput?.questions && combinedResult.quizOutput.questions.length > 0;
      if (quizSuccess) {
        localStorage.setItem(getCacheKey("quiz", trimmedTopic), JSON.stringify(combinedResult.quizOutput));
      } else if(combinedResult.quizError) {
        setQuizError(combinedResult.quizError);
      }

      // Handle flashcards
      const flashcardsSuccess = combinedResult.flashcardsOutput?.flashcards && combinedResult.flashcardsOutput.flashcards.length > 0;
      if (flashcardsSuccess) {
        localStorage.setItem(getCacheKey("flashcards", trimmedTopic), JSON.stringify(combinedResult.flashcardsOutput));
      } else if(combinedResult.flashcardsError) {
        setFlashcardsError(combinedResult.flashcardsError);
      }

      // Final aggregated notification
      if (navigationSuccess) {
          const successfulParts = ['Notes'];
          if (quizSuccess) successfulParts.push('Quiz');
          if (flashcardsSuccess) successfulParts.push('Flashcards');
          const successMessage = `${successfulParts.join(', ')} for "${trimmedTopic}" generated and cached.`;
          
          toast({
            title: "Materials Generated!",
            description: successMessage,
          });

          if (soundMode === 'full') speak("Study materials are ready!", { priority: 'optional' });
          router.push(`/study?topic=${encodeURIComponent(trimmedTopic)}`);

      } else {
          // This block runs if notes (the primary content) failed.
          toast({ title: t('generate.toast.notesError'), description: notesError || t('generate.toast.notesErrorDesc'), variant: 'destructive' });
      }

    } catch (err: any) { 
      setNotesError(err.message);
      setQuizError("Could not attempt quiz generation due to initial notes failure.");
      setFlashcardsError("Could not attempt flashcard generation due to initial notes failure.");
      toast({ title: t('generate.toast.generationFailed'), description: err.message, variant: 'destructive' });
      if (soundMode !== 'muted') speak("Sorry, failed to generate study materials.", { priority: 'essential' });
    } finally {
      setIsLoadingAll(false);
      setTopic('');
      setImageData(null);
      setImagePreview(null);
    }
  };
  
  if (user?.isAnonymous && !isNotesAllowed) {
    return <GuestLock featureName="Note Generator" message="You have used your one free note generation for today as a guest." />;
  }

  return (
    <div className="container mx-auto max-w-3xl px-4 py-8 space-y-8">
      <Card className="w-full shadow-xl bg-card/90 backdrop-blur-sm">
        <CardHeader className="text-center">
          <div className="flex items-center justify-center mb-4"><GraduationCap className="h-12 w-12 text-primary" /></div>
          <CardTitle className="text-center text-2xl sm:text-3xl font-bold text-primary">{t('generate.title')}</CardTitle>
          <CardDescription className="text-center text-sm sm:text-base text-muted-foreground px-2">
            {t('generate.description')}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 p-6">
          <div className="flex items-center gap-2">
            <Input
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder={t('generate.placeholder')}
              className="flex-1 text-base sm:text-lg py-3 px-4 transition-colors duration-200 ease-in-out focus-visible:ring-primary focus-visible:ring-2"
              aria-label="Study Topic"
              onKeyDown={(e) => e.key === 'Enter' && !isLoadingAll && topic.trim().length >=3 && handleGenerateAllMaterials()}
            />
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button type="button" variant="outline" size="icon" onClick={() => fileInputRef.current?.click()} title={t('generate.attachFile')}>
                    <ImageIcon className="w-5 h-5 text-muted-foreground group-hover:text-primary" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent><p>Attach Image or PDF</p></TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept="image/*,application/pdf" className="hidden" />
             {browserSupportsSpeechRecognition && (
              <Button
                variant="outline"
                size="icon"
                onClick={handleVoiceCommand}
                disabled={isLoadingAll || isListening}
                aria-label={t('generate.useVoiceInput')}
                title={t('generate.useVoiceInput')}
              >
                <Mic className={`h-5 w-5 ${isListening ? 'text-destructive animate-pulse' : 'text-muted-foreground hover:text-primary'}`} />
              </Button>
            )}
          </div>
          {fileError && <p className="text-sm text-destructive text-center">{fileError}</p>}
          
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
            {isLoadingAll ? t('generate.button.loading') : t('generate.button.default')}
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
            {quizError && <Alert variant="default" className="border-yellow-500/50 text-yellow-600 dark:text-yellow-400 [&>svg]:text-yellow-500"><AlertTriangle className="h-4 w-4" /><AlertTitle>Quiz Info</AlertTitle><AlertDescription>{quizError}</AlertDescription></Alert>}
            {flashcardsError && <Alert variant="default" className="border-yellow-500/50 text-yellow-600 dark:text-yellow-400 [&>svg]:text-yellow-500"><AlertTriangle className="h-4 w-4" /><AlertTitle>Flashcards Info</AlertTitle><AlertDescription>{flashcardsError}</AlertDescription></Alert>}
        </div>
      )}
    </div>
  );
}
