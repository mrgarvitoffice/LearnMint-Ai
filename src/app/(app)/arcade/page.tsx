
"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DefinitionChallenge } from '@/components/features/arcade/DefinitionChallenge';
import { Gamepad2, Puzzle, Construction } from 'lucide-react';
import Image from 'next/image';
import { useTTS } from '@/hooks/useTTS';
import { useEffect, useRef } from 'react';

const PAGE_TITLE = "LearnMint Arcade Arena";

export default function ArcadePage() {
  const { speak, isSpeaking, isPaused, selectedVoice, setVoicePreference, supportedVoices, voicePreference, cancelTTS } = useTTS();
  const pageTitleSpokenRef = useRef(false);
  const voicePreferenceWasSetRef = useRef(false);

  useEffect(() => {
    if (supportedVoices.length > 0 && !voicePreferenceWasSetRef.current) {
      setVoicePreference('luma'); 
      voicePreferenceWasSetRef.current = true;
    }
  }, [supportedVoices, setVoicePreference]);

  useEffect(() => {
    let isMounted = true;
    if (isMounted && selectedVoice && !isSpeaking && !isPaused && !pageTitleSpokenRef.current) {
      speak(PAGE_TITLE);
      pageTitleSpokenRef.current = true;
    }
    return () => { 
      isMounted = false; 
    };
  }, [selectedVoice, isSpeaking, isPaused, speak]);

  return (
    <div className="container mx-auto max-w-4xl px-4 py-8 space-y-8">
      <Card className="shadow-xl bg-card/90 backdrop-blur-sm">
        <CardHeader className="text-center">
          <div className="inline-block p-3 bg-primary/80 rounded-full mb-4 mx-auto"> 
            <Gamepad2 className="w-12 h-12 text-primary-foreground" />
          </div>
          <CardTitle className="text-xl sm:text-2xl font-bold text-primary">
            {PAGE_TITLE}
          </CardTitle>
          <CardDescription className="text-lg text-muted-foreground">
            Sharpen your mind with fun and educational games!
          </CardDescription>
        </CardHeader>
      </Card>

      <Tabs defaultValue="definition-challenge" className="w-full">
        <TabsList className="grid w-full grid-cols-1 sm:grid-cols-3 mb-6">
          <TabsTrigger value="definition-challenge" className="text-base py-3">
            <Puzzle className="w-5 h-5 mr-2" /> Definition Challenge
          </TabsTrigger>
          <TabsTrigger value="dino-runner" className="text-base py-3" disabled>
            <Construction className="w-5 h-5 mr-2" /> Dino Runner (Soon!)
          </TabsTrigger>
          <TabsTrigger value="tetris" className="text-base py-3" disabled>
            <Construction className="w-5 h-5 mr-2" /> Tetris (Soon!)
          </TabsTrigger>
        </TabsList>

        <TabsContent value="definition-challenge">
          <DefinitionChallenge />
        </TabsContent>

        <TabsContent value="dino-runner">
          <Card className="text-center">
            <CardHeader>
              <CardTitle>Dino Runner - Coming Soon!</CardTitle>
              <CardDescription>The classic infinite runner game, adapted for learning fun.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center gap-4 p-8 bg-muted rounded-lg">
                <Image 
                  src="https://placehold.co/300x200.png?text=Dino+Runner" 
                  alt="Dino Runner Placeholder" 
                  width={300} 
                  height={200}
                  data-ai-hint="dinosaur game" 
                  className="rounded-md shadow-md"
                />
                <p className="text-muted-foreground">Get ready to jump over obstacles and learn new facts!</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tetris">
          <Card className="text-center">
            <CardHeader>
              <CardTitle>Tetris - Coming Soon!</CardTitle>
              <CardDescription>The timeless block-stacking puzzle game.</CardDescription>
            </CardHeader>
            <CardContent>
               <div className="flex flex-col items-center gap-4 p-8 bg-muted rounded-lg">
                <Image 
                  src="https://placehold.co/300x200.png?text=Tetris" 
                  alt="Tetris Placeholder" 
                  width={300} 
                  height={200} 
                  data-ai-hint="block game"
                  className="rounded-md shadow-md"
                />
                <p className="text-muted-foreground">Prepare to clear lines and challenge your spatial skills!</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
