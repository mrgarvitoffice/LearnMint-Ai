
"use client";

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DefinitionChallenge } from '@/components/features/arcade/DefinitionChallenge';
import { Gamepad2, Puzzle, Crown, ExternalLink } from 'lucide-react';
import { useTTS } from '@/hooks/useTTS';
import { useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import Image from 'next/image';

const PAGE_TITLE = "LearnMint Arcade Arena";

export default function ArcadePage() {
  const { speak, isSpeaking, isPaused, selectedVoice, setVoicePreference, supportedVoices, voicePreference, cancelTTS } = useTTS();
  const pageTitleSpokenRef = useRef(false);
  const voicePreferenceWasSetRef = useRef(false);

  useEffect(() => {
    if (supportedVoices.length > 0 && !voicePreferenceWasSetRef.current) {
      setVoicePreference('zia');
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
            <Gamepad2 className="h-12 w-12 text-primary-foreground" />
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
          <TabsTrigger value="dino-runner" className="text-base py-3">
            <ExternalLink className="w-5 h-5 mr-2" /> Dino Runner
          </TabsTrigger>
          <TabsTrigger value="chess" className="text-base py-3">
            <Crown className="w-5 h-5 mr-2" /> Play Chess
          </TabsTrigger>
        </TabsList>

        <TabsContent value="definition-challenge">
          <DefinitionChallenge />
        </TabsContent>

        <TabsContent value="dino-runner">
          <Card className="text-center">
            <CardHeader>
              <CardTitle>Dino Runner</CardTitle>
              <CardDescription>The classic infinite runner game. Jump over cacti!</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center gap-4 p-8 bg-muted rounded-lg">
                <div className="relative w-full max-w-xs h-40 sm:h-48 rounded-md overflow-hidden mb-4">
                  <Image 
                    src="https://placehold.co/300x200.png?text=Dino+Run" 
                    alt="Dino Runner Game" 
                    layout="fill" 
                    objectFit="cover"
                    data-ai-hint="dinosaur game" 
                  />
                </div>
                <p className="text-muted-foreground">Get ready to jump over obstacles!</p>
                <Button asChild size="lg">
                  <Link href="https://chromedino.com/" target="_blank" rel="noopener noreferrer">
                    Play Dino Runner <ExternalLink className="w-4 h-4 ml-2"/>
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="chess">
          <Card className="text-center">
            <CardHeader>
              <CardTitle>Play Chess</CardTitle>
              <CardDescription>Challenge the computer or friends in a game of chess.</CardDescription>
            </CardHeader>
            <CardContent>
               <div className="flex flex-col items-center gap-4 p-8 bg-muted rounded-lg">
                <div className="relative w-full max-w-xs h-40 sm:h-48 rounded-md overflow-hidden mb-4">
                  <Image 
                    src="https://placehold.co/300x200.png?text=Chess+Game" 
                    alt="Chess Game" 
                    layout="fill" 
                    objectFit="cover" 
                    data-ai-hint="chess board"
                  />
                </div>
                <p className="text-muted-foreground">Test your strategy on the 64 squares!</p>
                 <Button asChild size="lg">
                  <Link href="https://www.chess.com/play/computer" target="_blank" rel="noopener noreferrer">
                    Play Chess Online <ExternalLink className="w-4 h-4 ml-2"/>
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
