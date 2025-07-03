
"use client";

import { useEffect, useState, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { NAV_ITEMS } from "@/lib/constants";
import { ArrowRight, Sparkles, Trash2, Bot } from "lucide-react";
import Link from "next/link";
import { useTTS } from '@/hooks/useTTS';
import { useSound } from '@/hooks/useSound';
import { useRouter } from 'next/navigation';
import { useSettings } from '@/contexts/SettingsContext';
import { motion } from 'framer-motion';
import { Input } from '@/components/ui/input';

const RECENT_TOPICS_LS_KEY = 'learnmint-recent-topics';
const MAX_RECENT_TOPICS_DISPLAY = 5;
const PAGE_TITLE = "Welcome to LearnMint!";

export default function DashboardPage() {
  const { speak } = useTTS();
  const { soundMode } = useSettings();
  const { playSound: playClickSound } = useSound('/sounds/ting.mp3', 0.3);
  const router = useRouter();
  
  const [recentTopics, setRecentTopics] = useState<string[]>([]);
  const pageTitleSpokenRef = useRef(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedTopics = localStorage.getItem(RECENT_TOPICS_LS_KEY);
      if (storedTopics) {
        try {
          setRecentTopics(JSON.parse(storedTopics).slice(0, MAX_RECENT_TOPICS_DISPLAY));
        } catch (e) {
          console.error("Failed to parse recent topics from localStorage", e);
          localStorage.removeItem(RECENT_TOPICS_LS_KEY);
        }
      }
    }
  }, []);
  
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!pageTitleSpokenRef.current && (soundMode === 'full' || soundMode === 'essential')) {
        speak(PAGE_TITLE, { priority: 'essential' });
        pageTitleSpokenRef.current = true;
      }
    }, 100);
    
    return () => clearTimeout(timer);
  }, [speak, soundMode]);


  const handleRemoveTopic = (e: React.MouseEvent, topicToRemove: string) => {
    e.stopPropagation();
    e.preventDefault();
    playClickSound();
    const updatedTopics = recentTopics.filter(topic => topic !== topicToRemove);
    setRecentTopics(updatedTopics);
    if (typeof window !== 'undefined') {
      localStorage.setItem(RECENT_TOPICS_LS_KEY, JSON.stringify(updatedTopics));
    }
  };


  const handleRecentTopicClick = (topic: string) => {
    playClickSound();
    router.push(`/study?topic=${encodeURIComponent(topic)}`);
  }
  
  const handleAskAiSubmit = (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      playClickSound();
      const formData = new FormData(e.currentTarget);
      const query = formData.get("ai-query") as string;
      if (query) {
        router.push('/chatbot');
      }
  }

  return (
    <div className="container mx-auto max-w-4xl py-4 sm:py-8 space-y-6 md:space-y-8">
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
        >
            <Card>
                <CardHeader>
                    <CardTitle>Resume Learning</CardTitle>
                    <CardDescription>Pick up where you left off or start a new topic.</CardDescription>
                </CardHeader>
                <CardContent>
                     {recentTopics.length > 0 ? (
                        <ul className="space-y-3">
                            {recentTopics.map((topic, index) => (
                            <li key={index} 
                                onClick={() => handleRecentTopicClick(topic)}
                                className="flex justify-between items-center p-3 border rounded-lg hover:bg-muted/50 hover:border-primary/40 cursor-pointer transition-all">
                                <span className="truncate font-medium">{topic}</span>
                                <div className="flex items-center gap-2">
                                    <Button variant="ghost" size="icon" onClick={(e) => handleRemoveTopic(e, topic)} className="h-7 w-7 ml-2 shrink-0">
                                        <Trash2 className="h-4 w-4 text-muted-foreground/70 hover:text-destructive" />
                                    </Button>
                                    <ArrowRight className="h-5 w-5 text-muted-foreground" />
                                </div>
                            </li>
                            ))}
                        </ul>
                        ) : (
                        <div className="text-center py-4 text-sm text-muted-foreground">
                            No recent topics. Generate some study materials to see them here!
                        </div>
                     )}
                </CardContent>
                <CardFooter>
                     <Button size="sm" asChild>
                        <Link href="/notes">
                            <Sparkles className="mr-2 h-4 w-4" /> Start a New Topic
                        </Link>
                    </Button>
                </CardFooter>
            </Card>
        </motion.div>
        
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
        >
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><Bot className="text-primary"/> Ask MintAI</CardTitle>
                    <CardDescription>Have a question? Get instant help from your AI companion.</CardDescription>
                </CardHeader>
                <form onSubmit={handleAskAiSubmit}>
                    <CardContent>
                        <Input name="ai-query" placeholder="e.g., Explain the theory of relativity..." className="text-base"/>
                    </CardContent>
                    <CardFooter>
                        <Button type="submit">Go to Chatbot</Button>
                    </CardFooter>
                </form>
            </Card>
        </motion.div>

        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
        >
            <Card>
                <CardHeader>
                    <CardTitle>Explore Features</CardTitle>
                    <CardDescription>Jump into any of LearnMint's powerful tools.</CardDescription>
                </CardHeader>
                <CardContent className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                    {NAV_ITEMS.flatMap(item => item.children || item).filter(item => item.href !== '/').map((item) => {
                        const Icon = item.icon;
                        return (
                            <Link href={item.href} key={item.href} legacyBehavior>
                                <a className="block group">
                                    <div className="flex flex-col items-center justify-center text-center gap-2 p-3 border rounded-lg h-full hover:bg-muted/50 hover:border-primary/40 transition-all">
                                        <Icon className="h-7 w-7 text-primary/80 group-hover:text-primary transition-colors" />
                                        <span className="text-sm font-semibold">{item.title}</span>
                                    </div>
                                </a>
                            </Link>
                        );
                    })}
                </CardContent>
            </Card>
        </motion.div>
        
        <div className="text-center text-xs text-muted-foreground mt-8 sm:mt-12 py-4 border-t border-border/50">
            Made by <span className="font-bold text-primary">MrGarvit</span>
        </div>
    </div>
  );
}
