
"use client";

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DefinitionChallenge } from '@/components/features/arcade/DefinitionChallenge';
import { Gamepad2, Puzzle, Crown, ExternalLink, Link as LinkIcon } from 'lucide-react';
import Image from 'next/image';
import { useTTS } from '@/hooks/useTTS';
import { useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

const PAGE_TITLE = "LearnMint Arcade Arena";

const otherGames = [
  { name: "2048", url: "https://play2048.co/", description: "Join the numbers and get to the 2048 tile!", dataAiHint: "number puzzle" },
  { name: "Pac-Man", url: "https://www.google.com/search?q=pacman", description: "Classic arcade game by Google.", dataAiHint: "classic arcade" },
  { name: "Slither.io", url: "http://slither.io/", description: "Play against others in this modern snake game.", dataAiHint: "snake game" },
];


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
                <Image
                  src="https://placehold.co/300x200.png"
                  alt="Dino Runner"
                  width={300}
                  height={200}
                  data-ai-hint="dinosaur game"
                  className="rounded-md shadow-md"
                />
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
                <Image
                  src="https://placehold.co/300x200.png"
                  alt="Chess"
                  width={300}
                  height={200}
                  data-ai-hint="chess board"
                  className="rounded-md shadow-md"
                />
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

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-xl flex items-center">
            <LinkIcon className="w-6 h-6 mr-2 text-primary"/> More Fun Games (External Links)
          </CardTitle>
          <CardDescription>
            Check out these other classic games you can play in your browser (no login required).
          </CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {otherGames.map((game) => (
            <Card key={game.name} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">{game.name}</CardTitle>
                 <CardDescription className="text-xs pt-1">{game.description}</CardDescription>
              </CardHeader>
              <CardContent className="flex justify-center items-center py-4">
                 <Image
                  src={`https://placehold.co/200x100.png?text=${encodeURIComponent(game.name)}`}
                  alt={game.name}
                  width={200}
                  height={100}
                  data-ai-hint={game.dataAiHint}
                  className="rounded-md"
                />
              </CardContent>
              <CardFooter>
                <Button asChild variant="outline" className="w-full">
                  <Link href={game.url} target="_blank" rel="noopener noreferrer">
                    Play {game.name} <ExternalLink className="w-4 h-4 ml-2"/>
                  </Link>
                </Button>
              </CardFooter>
            </Card>
          ))}
        </CardContent>
      </Card>

    </div>
  );
}
