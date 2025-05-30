
"use client";

import { useState, useEffect, useRef } from 'react';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { generateFlashcardsAction } from '@/lib/actions'; 
import type { GenerateFlashcardsOutput } from '@/lib/types'; 
import { Loader2, ListChecks, ChevronLeft, ChevronRight, Sparkles } from 'lucide-react';
import { FlashcardComponent } from '@/components/features/flashcards/Flashcard'; 
import { Progress } from '@/components/ui/progress';
import { useSound } from '@/hooks/useSound';
import { useTTS } from '@/hooks/useTTS';

const formSchema = z.object({
  topic: z.string().min(3, { message: 'Topic must be at least 3 characters.' }),
  numFlashcards: z.coerce.number().min(1, "Min 1 flashcard").max(50, "Max 50 flashcards").default(10),
});
type FormData = z.infer<typeof formSchema>;

const PAGE_TITLE = "AI Flashcard Factory";

export default function FlashcardsPage() {
  const [flashcardsData, setFlashcardsData] = useState<GenerateFlashcardsOutput | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const { toast } = useToast();
  const { playSound: playClickSound } = useSound('/sounds/ting.mp3', 0.3);

  const { speak, isSpeaking, isPaused, selectedVoice, setVoicePreference, supportedVoices, voicePreference } = useTTS();
  const pageTitleSpokenRef = useRef(false);
  const voicePreferenceWasSetRef = useRef(false);
  const generatingMessageSpokenRef = useRef(false);

  const { register, handleSubmit, formState: { errors }, watch } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      numFlashcards: 10,
    }
  });
  const topicValue = watch('topic'); 

  useEffect(() => {
    if (supportedVoices.length > 0 && !voicePreferenceWasSetRef.current) {
      setVoicePreference('zia'); 
      voicePreferenceWasSetRef.current = true;
    }
  }, [supportedVoices, setVoicePreference]);

  useEffect(() => {
    let isMounted = true;
    if (isMounted && selectedVoice && !isSpeaking && !isPaused && !pageTitleSpokenRef.current && !isLoading && !flashcardsData) {
      speak(PAGE_TITLE);
      pageTitleSpokenRef.current = true;
    }
    return () => { isMounted = false; };
  }, [selectedVoice, isSpeaking, isPaused, speak, isLoading, flashcardsData]);

  useEffect(() => {
    if (isLoading && !generatingMessageSpokenRef.current && selectedVoice && !isSpeaking && !isPaused) {
      speak("Generating flashcards. Please wait.");
      generatingMessageSpokenRef.current = true;
    }
    if (!isLoading && generatingMessageSpokenRef.current) { 
      generatingMessageSpokenRef.current = false; 
    }
  }, [isLoading, selectedVoice, isSpeaking, isPaused, speak]);

  const onSubmit: SubmitHandler<FormData> = async (data) => {
    playClickSound();
    setIsLoading(true);
    setFlashcardsData(null);
    setCurrentCardIndex(0);
    pageTitleSpokenRef.current = true; 

    if (selectedVoice && !isSpeaking && !isPaused && !generatingMessageSpokenRef.current) {
      speak("Generating flashcards. Please wait.");
      generatingMessageSpokenRef.current = true;
    }

    try {
      const result = await generateFlashcardsAction(data);
      if (result.flashcards && result.flashcards.length > 0) {
        setFlashcardsData(result);
        toast({ title: 'Flashcards Generated!', description: `Your flashcards for "${data.topic}" are ready.` });
        if (selectedVoice && !isSpeaking && !isPaused) speak("Flashcards ready!");
      } else {
        toast({ title: 'No Flashcards', description: 'The AI returned no flashcards for this topic.', variant: 'destructive' });
        if (selectedVoice && !isSpeaking && !isPaused) speak("Sorry, no flashcards were returned.");
      }
    } catch (error) {
      console.error('Error generating flashcards:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to generate flashcards. Please try again.';
      toast({ title: 'Error', description: errorMessage, variant: 'destructive' });
      if (selectedVoice && !isSpeaking && !isPaused) speak("Sorry, there was an error generating flashcards.");
    } finally {
      setIsLoading(false);
      generatingMessageSpokenRef.current = false;
    }
  };

  const handleNextCard = () => {
    playClickSound();
    if (flashcardsData && currentCardIndex < flashcardsData.flashcards.length - 1) {
      setCurrentCardIndex(prev => prev + 1);
    }
  };

  const handlePrevCard = () => {
    playClickSound();
    if (currentCardIndex > 0) {
      setCurrentCardIndex(prev => prev - 1);
    }
  };
  
  const handleCreateNewSet = () => {
    playClickSound();
    setFlashcardsData(null); 
    setCurrentCardIndex(0);
    pageTitleSpokenRef.current = false; 
  }

  if (!flashcardsData) {
    return (
      <div className="container mx-auto max-w-xl px-4 py-8 flex flex-col items-center justify-center min-h-[calc(100vh-12rem)] space-y-8">
        <Card className="w-full shadow-xl bg-card/90 backdrop-blur-sm">
          <CardHeader className="text-center">
            <div className="flex items-center justify-center mb-4">
                <ListChecks className="h-7 w-7 text-primary" />
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
                <Input id="topic" placeholder="e.g., Key Historical Figures, Chemical Elements" {...register('topic')} className="text-base"/>
                {errors.topic && <p className="text-sm text-destructive">{errors.topic.message}</p>}
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
  
  return (
    <div className="container mx-auto max-w-2xl px-4 py-8 flex flex-col items-center min-h-[calc(100vh-12rem)] space-y-8">
        <Card className="w-full shadow-xl">
        <CardHeader>
            <CardTitle className="text-xl text-primary">Flashcards for: {topicValue}</CardTitle>
            <CardDescription className="text-sm">
            Card {currentCardIndex + 1} of {flashcardsData.flashcards.length}
            </CardDescription>
            <Progress value={((currentCardIndex + 1) / flashcardsData.flashcards.length) * 100} className="w-full mt-2 h-2.5" />
        </CardHeader>
        <CardContent className="flex flex-col items-center space-y-6 p-6 min-h-[350px] justify-center">
            <FlashcardComponent
            term={flashcardsData.flashcards[currentCardIndex].term}
            definition={flashcardsData.flashcards[currentCardIndex].definition}
            className="w-full max-w-lg h-64 md:h-72"
            />
        </CardContent>
        <CardFooter className="flex flex-col sm:flex-row justify-between items-center gap-3 p-6 border-t">
            <div className="flex gap-3 w-full sm:w-auto">
                <Button variant="outline" onClick={handlePrevCard} disabled={currentCardIndex === 0} className="flex-1 sm:flex-initial">
                    <ChevronLeft className="w-4 h-4 mr-2" /> Previous
                </Button>
                <Button variant="outline" onClick={handleNextCard} disabled={currentCardIndex === flashcardsData.flashcards.length - 1} className="flex-1 sm:flex-initial">
                    Next <ChevronRight className="w-4 h-4 ml-2" />
                </Button>
            </div>
            <Button onClick={handleCreateNewSet} variant="secondary" className="w-full mt-3 sm:mt-0 sm:w-auto">
                Create New Set
            </Button>
        </CardFooter>
        </Card>
    </div>
  );
}
