
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
import { generateFlashcards, type GenerateFlashcardsOutput } from '@/ai/flows/generate-flashcards';
import { Loader2, ListChecks, ChevronLeft, ChevronRight } from 'lucide-react';
import { FlashcardComponent } from '@/components/features/flashcards/Flashcard';
import { Progress } from '@/components/ui/progress';
import { useSound } from '@/hooks/useSound';
import { useTTS } from '@/hooks/useTTS';

const formSchema = z.object({
  topic: z.string().min(3, { message: 'Topic must be at least 3 characters.' }),
});
type FormData = z.infer<typeof formSchema>;

const PAGE_TITLE = "AI Flashcard Factory";

export default function FlashcardsPage() {
  const [flashcardsData, setFlashcardsData] = useState<GenerateFlashcardsOutput | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const { toast } = useToast();
  const { playSound: playClickSound } = useSound('/sounds/ting.mp3', 0.3);
  const { speak, isSpeaking: isTTSSpeaking, selectedVoice, setVoicePreference, supportedVoices } = useTTS();

  const pageTitleSpokenRef = useRef(false);
  const voicePreferenceWasSetRef = useRef(false);
  const generatingMessageSpokenRef = useRef(false);

  const { register, handleSubmit, formState: { errors }, watch } = useForm<FormData>({
    resolver: zodResolver(formSchema),
  });
  const topicValue = watch('topic');

  useEffect(() => {
    if (supportedVoices.length > 0 && !voicePreferenceWasSetRef.current) {
      setVoicePreference('female'); 
      voicePreferenceWasSetRef.current = true;
    }
  }, [supportedVoices, setVoicePreference]);

  useEffect(() => {
    if (selectedVoice && !isTTSSpeaking && !pageTitleSpokenRef.current && !isLoading && !flashcardsData) {
      speak(PAGE_TITLE);
      pageTitleSpokenRef.current = true;
    }
  }, [selectedVoice, isTTSSpeaking, speak, isLoading, flashcardsData]);

  useEffect(() => {
    if (isLoading && !generatingMessageSpokenRef.current && selectedVoice && !isTTSSpeaking) {
      speak("Generating flashcards. Please wait.");
      generatingMessageSpokenRef.current = true;
    }
    if (!isLoading) {
      generatingMessageSpokenRef.current = false; 
    }
  }, [isLoading, selectedVoice, isTTSSpeaking, speak]);

  const onSubmit: SubmitHandler<FormData> = async (data) => {
    playClickSound();
    setIsLoading(true);
    setFlashcardsData(null);
    setCurrentCardIndex(0);

    if (selectedVoice && !isTTSSpeaking) {
      speak("Generating flashcards. Please wait.");
    }

    try {
      const result = await generateFlashcards(data);
      if (result.flashcards && result.flashcards.length > 0) {
        setFlashcardsData(result);
        toast({ title: 'Flashcards Generated!', description: 'Your flashcards are ready.' });
        if (selectedVoice && !isTTSSpeaking) {
          speak("Flashcards ready!");
        }
      } else {
        toast({ title: 'No Flashcards', description: 'The AI returned no flashcards for this topic.', variant: 'destructive' });
        if (selectedVoice && !isTTSSpeaking) {
          speak("Sorry, no flashcards were returned.");
        }
      }
    } catch (error) {
      console.error('Error generating flashcards:', error);
      toast({ title: 'Error', description: 'Failed to generate flashcards. Please try again.', variant: 'destructive' });
      if (selectedVoice && !isTTSSpeaking) {
        speak("Sorry, there was an error generating flashcards.");
      }
    } finally {
      setIsLoading(false);
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
    pageTitleSpokenRef.current = false; // Allow title to be spoken again
  }

  return (
    <div className="container mx-auto max-w-3xl px-4 py-8 space-y-8">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-2xl md:text-3xl text-primary font-bold">
            <ListChecks className="w-7 h-7" />
            {PAGE_TITLE}
          </CardTitle>
          <CardDescription>Enter a topic to generate flashcards for quick review.</CardDescription>
        </CardHeader>
        {!flashcardsData ? (
          <form onSubmit={handleSubmit(onSubmit)}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="topic">Topic</Label>
                <Input id="topic" placeholder="e.g., Key Historical Figures, Chemical Elements" {...register('topic')} />
                {errors.topic && <p className="text-sm text-destructive">{errors.topic.message}</p>}
              </div>
            </CardContent>
            <CardFooter>
              <Button type="submit" disabled={isLoading}>
                {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Generate Flashcards
              </Button>
            </CardFooter>
          </form>
        ) : (
           <CardFooter>
             <Button onClick={handleCreateNewSet} variant="outline">
                Create New Set
              </Button>
           </CardFooter>
        )}
      </Card>

      {flashcardsData && flashcardsData.flashcards.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Flashcards for: {topicValue}</CardTitle>
            <CardDescription>
              Card {currentCardIndex + 1} of {flashcardsData.flashcards.length}
            </CardDescription>
             <Progress value={((currentCardIndex + 1) / flashcardsData.flashcards.length) * 100} className="w-full mt-2" />
          </CardHeader>
          <CardContent className="flex flex-col items-center space-y-6">
            <FlashcardComponent
              term={flashcardsData.flashcards[currentCardIndex].term}
              definition={flashcardsData.flashcards[currentCardIndex].definition}
              className="w-full max-w-lg"
            />
            <div className="flex justify-between w-full max-w-lg">
              <Button variant="outline" onClick={handlePrevCard} disabled={currentCardIndex === 0}>
                <ChevronLeft className="w-4 h-4 mr-2" /> Previous
              </Button>
              <Button variant="outline" onClick={handleNextCard} disabled={currentCardIndex === flashcardsData.flashcards.length - 1}>
                Next <ChevronRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
