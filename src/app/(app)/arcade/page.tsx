
"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DefinitionChallenge } from '@/components/features/arcade/DefinitionChallenge';
import { Gamepad2, Puzzle, Crown, ExternalLink } from 'lucide-react';
import { useTTS } from '@/hooks/useTTS';
import { useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

const PAGE_TITLE = "LearnMint Arcade";

export default function ArcadePage() {
  const { speak, isSpeaking, isPaused, selectedVoice, setVoicePreference, supportedVoices } = useTTS();
  const pageTitleSpokenRef = useRef(false);
  const voicePreferenceWasSetRef = useRef(false);

  useEffect(() => {
    if (supportedVoices.length > 0 && !voicePreferenceWasSetRef.current) {
      setVoicePreference('holo');
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
        <TabsList className="flex flex-wrap items-center justify-center rounded-md bg-muted p-1.5 text-muted-foreground gap-1.5 mb-6 h-auto sm:grid sm:grid-cols-3 sm:gap-2 sm:h-10 sm:p-1">
          <TabsTrigger value="definition-challenge" className="text-xs px-2.5 py-1.5 sm:text-sm sm:px-3 sm:py-1.5 flex items-center justify-center">
            <Puzzle className="w-3.5 h-3.5 mr-1 sm:w-4 sm:h-4 sm:mr-1.5" /> Definition Challenge
          </TabsTrigger>
          <TabsTrigger value="dino-runner" className="text-xs px-2.5 py-1.5 sm:text-sm sm:px-3 sm:py-1.5 flex items-center justify-center">
            <ExternalLink className="w-3.5 h-3.5 mr-1 sm:w-4 sm:h-4 sm:mr-1.5" /> Dino Runner
          </TabsTrigger>
          <TabsTrigger value="chess" className="text-xs px-2.5 py-1.5 sm:text-sm sm:px-3 sm:py-1.5 flex items-center justify-center">
            <Crown className="w-3.5 h-3.5 mr-1 sm:w-4 sm:h-4 sm:mr-1.5" /> Play Chess
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
                <p className="text-muted-foreground">Get ready to jump over obstacles!</p>
                <Button asChild size="lg">
                  <a href="https://chromedino.com/" target="_blank" rel="noopener noreferrer">
                    Play Dino Runner <ExternalLink className="w-4 h-4 ml-2"/>
                  </a>
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
                <p className="text-muted-foreground">Test your strategy on the 64 squares!</p>
                 <Button asChild size="lg">
                  <a href="https://www.chess.com/play/computer" target="_blank" rel="noopener noreferrer">
                    Play Chess Online <ExternalLink className="w-4 h-4 ml-2"/>
                  </a>
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
