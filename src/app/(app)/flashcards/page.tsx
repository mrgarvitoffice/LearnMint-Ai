
"use client";

import { useState, useEffect, useRef, useCallback, type ChangeEvent } from 'react';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { generateFlashcardsAction } from '@/lib/actions'; 
import type { GenerateFlashcardsOutput, GenerateFlashcardsInput } from '@/lib/types'; 
import { Loader2, ListChecks, Sparkles, FileText, ImageIcon, AudioLines, Video, XCircle, Mic } from 'lucide-react';
import FlashcardsView from '@/components/study/FlashcardsView';
import { useSound } from '@/hooks/useSound';
import { useTTS } from '@/hooks/useTTS';
import Image from 'next/image';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useVoiceRecognition } from '@/hooks/useVoiceRecognition';
import { useSettings } from '@/contexts/SettingsContext';

const formSchema = z.object({
  topic: z.string().min(3, { message: 'Topic must be at least 3 characters.' }),
  numFlashcards: z.coerce.number().min(1, "Min 1 flashcard").max(50, "Max 50 flashcards").default(10),
});
type FormData = z.infer<typeof formSchema>;

const PAGE_TITLE = "AI Flashcard Factory";

export default function FlashcardsPage() {
  const [generatedFlashcardsData, setGeneratedFlashcardsData] = useState<GenerateFlashcardsOutput | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [imageData, setImageData] = useState<string | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { toast } = useToast();
  const { playSound: playClickSound } = useSound('/sounds/ting.mp3', 0.3);
  const { playSound: playActionSound } = useSound('/sounds/custom-sound-2.mp3', 0.4);

  const { speak, isSpeaking, isPaused, setVoicePreference } = useTTS();
  const { soundMode } = useSettings();
  const pageTitleSpokenRef = useRef(false);
  const generatingMessageSpokenRef = useRef(false);

  const { isListening, transcript, startListening, stopListening, browserSupportsSpeechRecognition, error: voiceError } = useVoiceRecognition();


  const { register, handleSubmit, formState: { errors }, watch, reset, setValue } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      numFlashcards: 10,
      topic: '',
    }
  });
  const topicValue = watch('topic'); 

  useEffect(() => {
    if (transcript) setValue('topic', transcript);
  }, [transcript, setValue]);

  useEffect(() => { 
    if (voiceError) {
      toast({ title: "Voice Input Error", description: voiceError, variant: "destructive" });
    }
  }, [voiceError, toast]);

  const handleVoiceCommand = useCallback(() => {
    playClickSound();
    if (isListening) stopListening();
    else { setValue("topic", ""); startListening(); }
  }, [isListening, startListening, stopListening, playClickSound, setValue]);


  useEffect(() => {
    setVoicePreference('holo'); 
  }, [setVoicePreference]);

  useEffect(() => {
    let isMounted = true;
    if (isMounted && soundMode === 'full' && !isSpeaking && !isPaused && !pageTitleSpokenRef.current && !isLoading && !generatedFlashcardsData) {
      speak(PAGE_TITLE);
      pageTitleSpokenRef.current = true;
    }
    return () => { isMounted = false; };
  }, [isSpeaking, isPaused, speak, isLoading, generatedFlashcardsData, soundMode]);

  useEffect(() => {
    if (isLoading && soundMode === 'full' && !generatingMessageSpokenRef.current && !isSpeaking && !isPaused) {
      speak("Generating flashcards. Please wait.");
      generatingMessageSpokenRef.current = true;
    }
    if (!isLoading && generatingMessageSpokenRef.current) { 
      generatingMessageSpokenRef.current = false; 
    }
  }, [isLoading, isSpeaking, isPaused, speak, soundMode]);

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


  const onSubmit: SubmitHandler<FormData> = async (data) => {
    playActionSound();
    setIsLoading(true);
    setGeneratedFlashcardsData(null);
    pageTitleSpokenRef.current = true; 
    generatingMessageSpokenRef.current = false;

    if (soundMode === 'full' && !isSpeaking && !isPaused && !generatingMessageSpokenRef.current) {
      speak("Generating flashcards. Please wait.");
      generatingMessageSpokenRef.current = true;
    }
    
    const input: GenerateFlashcardsInput = {
      ...data,
      image: imageData || undefined,
    };

    try {
      const result = await generateFlashcardsAction(input);
      if (result.flashcards && result.flashcards.length > 0) {
        setGeneratedFlashcardsData(result);
        toast({ title: 'Flashcards Generated!', description: `Your flashcards for "${data.topic}" are ready.` });
        if (soundMode === 'full' && !isSpeaking && !isPaused) speak("Flashcards ready!");
      } else {
        toast({ title: 'No Flashcards', description: 'The AI returned no flashcards for this topic.', variant: 'destructive' });
        if (soundMode === 'full' && !isSpeaking && !isPaused) speak("Sorry, no flashcards were returned.");
      }
    } catch (error) {
      console.error('Error generating flashcards:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to generate flashcards. Please try again.';
      toast({ title: 'Error', description: errorMessage, variant: 'destructive' });
      if (soundMode === 'full' && !isSpeaking && !isPaused) speak("Sorry, there was an error generating flashcards.");
    } finally {
      setIsLoading(false);
      generatingMessageSpokenRef.current = false;
    }
  };
  
  const handleCreateNewSet = () => {
    playClickSound();
    setGeneratedFlashcardsData(null); 
    pageTitleSpokenRef.current = false; 
    generatingMessageSpokenRef.current = false;
    reset({ topic: '', numFlashcards: 10 }); 
    setImageData(null);
    setImagePreview(null);
  }

  if (generatedFlashcardsData && topicValue) {
    return (
      <div className="container mx-auto max-w-2xl px-4 py-8 flex flex-col items-center min-h-[calc(100vh-12rem)] space-y-8">
        <FlashcardsView flashcards={generatedFlashcardsData.flashcards} topic={topicValue} />
        <div className="text-center">
            <Button onClick={handleCreateNewSet} variant="outline" size="lg">Create New Set</Button>
        </div>
      </div>
    )
  }
  
  return (
    <div className="container mx-auto max-w-xl px-4 py-8 flex flex-col items-center justify-center min-h-[calc(100vh-12rem)]">
      <Card className="w-full shadow-xl bg-card/90 backdrop-blur-sm">
        <CardHeader className="text-center">
          <div className="flex items-center justify-center mb-4">
              <ListChecks className="h-12 w-12 text-primary" />
          </div>
          <CardTitle className="text-xl sm:text-2xl font-bold text-primary">{PAGE_TITLE}</CardTitle>
          <CardDescription className="text-sm sm:text-base text-muted-foreground px-2">
              Enter a topic and number of cards to create your flashcard set.
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit(onSubmit)}>
          <CardContent className="space-y-6 p-6">
            <div className="space-y-2">
              <Label htmlFor="topic">Topic</Label>
              <div className="flex items-center gap-2">
                <Input id="topic" placeholder="e.g., Key Historical Figures" {...register('topic')} className="text-base flex-1" />
                 <Popover>
                    <PopoverTrigger asChild>
                      <Button type="button" variant="outline" size="icon" title="Attach File">
                        <FileText className="w-5 h-5" />
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
                 {browserSupportsSpeechRecognition && (
                    <Button type="button" variant="outline" size="icon" onClick={handleVoiceCommand} disabled={isLoading || isListening}><Mic className={`w-5 h-5 ${isListening ? 'text-destructive animate-pulse' : ''}`} /></Button>
                )}
              </div>
              {errors.topic && <p className="text-sm text-destructive mt-1">{errors.topic.message}</p>}
               {imagePreview && (
                <div className="relative w-20 h-20 mt-2">
                  <Image src={imagePreview} alt="Image preview" layout="fill" objectFit="cover" className="rounded-md" />
                  <Button type="button" variant="ghost" size="icon" onClick={handleRemoveImage} className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-destructive text-destructive-foreground">
                    <XCircle className="w-4 h-4" />
                  </Button>
                </div>
              )}
               <input type="file" ref={fileInputRef} onChange={handleImageUpload} accept="image/*" className="hidden" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="numFlashcards">Number of Flashcards (1-50)</Label>
              <Input id="numFlashcards" type="number" {...register('numFlashcards')} className="text-base"/>
              {errors.numFlashcards && <p className="text-sm text-destructive">{errors.numFlashcards.message}</p>}
            </div>
          </CardContent>
          <CardFooter className="justify-center p-6">
            <Button type="submit" disabled={isLoading} size="lg" className="min-w-[200px]">
              {isLoading ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : <Sparkles className="w-5 h-5 mr-2" />}
              Generate Flashcards
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
