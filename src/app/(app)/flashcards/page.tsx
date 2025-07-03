"use client";

import { useState, useRef, useEffect } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Loader2, Sparkles, AlertTriangle, Layers, Mic, Volume2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useSound } from '@/hooks/useSound';
import { useVoiceRecognition } from '@/hooks/useVoiceRecognition';
import { generateAudioFlashcardsAction } from '@/lib/actions';
import type { GenerateAudioFlashcardsOutput } from '@/lib/types';
import { ScrollArea } from '@/components/ui/scroll-area';
import FlashcardItem from '@/components/study/FlashcardItem';

export default function AudioFlashcardsPage() {
  const [topic, setTopic] = useState('');
  const [numFlashcards, setNumFlashcards] = useState(10);
  const [generatedContent, setGeneratedContent] = useState<GenerateAudioFlashcardsOutput | null>(null);
  
  const { toast } = useToast();
  const { playSound: playActionSound } = useSound('/sounds/custom-sound-2.mp3', 0.4);
  const { playSound: playClickSound } = useSound('/sounds/ting.mp3', 0.3);
  const { isListening, transcript, startListening, stopListening, browserSupportsSpeechRecognition } = useVoiceRecognition();
  const audioPlayerRef = useRef<HTMLAudioElement>(null);

  const { mutate: generate, isPending: isLoading } = useMutation({
    mutationFn: generateAudioFlashcardsAction,
    onSuccess: (data) => {
      if (!data.flashcards || data.flashcards.length === 0) {
        toast({ title: "Generation Issue", description: "The AI generated no flashcards for this topic.", variant: 'default' });
        setGeneratedContent(null);
        return;
      }
      setGeneratedContent(data);
      toast({ title: "Generation Complete!", description: `${data.flashcards.length} flashcards created.${data.audioDataUri ? ' Audio is ready.' : ' Audio generation failed.'}` });
      if(data.audioDataUri && audioPlayerRef.current) {
        audioPlayerRef.current.load();
        audioPlayerRef.current.play().catch(e => console.error("Audio autoplay failed:", e));
      }
    },
    onError: (error) => {
      toast({ title: "Generation Failed", description: error.message, variant: "destructive" });
      setGeneratedContent(null);
    }
  });

  const handleGenerate = () => {
    playActionSound();
    if (topic.trim().length < 3) {
      toast({ title: "Invalid Topic", description: "Topic must be at least 3 characters long.", variant: "destructive" });
      return;
    }
    setGeneratedContent(null);
    generate({ topic, numFlashcards });
  };
  
  const handleMicClick = () => {
    playClickSound();
    if (isListening) stopListening();
    else startListening();
  };
  
  useEffect(() => {
    if (transcript) setTopic(transcript);
  }, [transcript]);

  return (
    <div className="container mx-auto max-w-4xl px-4 py-8 space-y-8">
      <Card className="shadow-xl bg-card/90 backdrop-blur-sm">
        <CardHeader className="text-center">
          <div className="flex items-center justify-center mb-4"><Layers className="h-12 w-12 text-primary" /></div>
          <CardTitle className="text-xl sm:text-2xl font-bold text-primary">Audio Flashcard Factory</CardTitle>
          <CardDescription>
            A "crazy" feature as requested! Generate flashcards and listen to them with AI-powered voices.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="topic-input">Topic</Label>
            <div className="flex gap-2">
              <Input
                id="topic-input"
                placeholder="e.g., The French Revolution"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                disabled={isLoading}
              />
              {browserSupportsSpeechRecognition && (
                <Button variant="outline" size="icon" onClick={handleMicClick} disabled={isLoading}>
                  <Mic className={`h-5 w-5 ${isListening ? 'text-destructive animate-pulse' : ''}`} />
                </Button>
              )}
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="num-flashcards">Number of Flashcards: {numFlashcards}</Label>
            <Slider
              id="num-flashcards"
              min={5} max={25} step={1}
              value={[numFlashcards]}
              onValueChange={(value) => setNumFlashcards(value[0])}
              disabled={isLoading}
            />
          </div>
        </CardContent>
        <CardFooter className="justify-center">
          <Button size="lg" onClick={handleGenerate} disabled={isLoading}>
            {isLoading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Sparkles className="mr-2 h-5 w-5" />}
            Generate Audio Flashcards
          </Button>
        </CardFooter>
      </Card>

      {isLoading && (
        <div className="text-center py-6">
          <Loader2 className="h-10 w-10 animate-spin text-primary mx-auto" />
          <p className="mt-3 text-muted-foreground">The AI is thinking... This may take a moment, especially with audio.</p>
        </div>
      )}

      {generatedContent && (
        <Card>
          <CardHeader>
            <CardTitle>Generated Flashcards for: {topic}</CardTitle>
            <CardDescription>
              {generatedContent.flashcards.length} cards generated. 
              {generatedContent.audioDataUri ? " Audio is available below." : " Audio generation failed, showing text only."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {generatedContent.audioDataUri && (
              <div className="mb-6">
                <Alert>
                  <Volume2 className="h-4 w-4" />
                  <AlertTitle>Auditory Learning Mode</AlertTitle>
                  <AlertDescription>
                    Press play to listen to all flashcards. The term is read by a male voice, and the definition by a female voice.
                  </AlertDescription>
                </Alert>
                <audio ref={audioPlayerRef} controls src={generatedContent.audioDataUri} className="w-full mt-3">
                  Your browser does not support the audio element.
                </audio>
              </div>
            )}
             <ScrollArea className="h-[500px] w-full pr-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {generatedContent.flashcards.map((card, index) => (
                        <FlashcardItem key={index} flashcard={card} isCurrent={false} />
                    ))}
                </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
