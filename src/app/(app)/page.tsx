
"use client";

import { useEffect, useState, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { NAV_ITEMS } from "@/lib/constants";
import { ArrowRight, Sparkles, Quote, Trash2, Flame, ShieldCheck, Bell, Bot, CheckCircle } from "lucide-react";
import Link from "next/link";
import { useTTS } from '@/hooks/useTTS';
import { useSound } from '@/hooks/useSound';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useSettings } from '@/contexts/SettingsContext';
import { motion } from 'framer-motion';
import { Input } from '@/components/ui/input';

const RECENT_TOPICS_LS_KEY = 'learnmint-recent-topics';
const MAX_RECENT_TOPICS_DISPLAY = 3;
const PAGE_TITLE = "Welcome to LearnMint!";

const motivationalQuotes = [
  { quote: "The only way to do great work is to love what you do. ✨", author: "Steve Jobs" },
  { quote: "Believe you can and you're halfway there. 🚀", author: "Theodore Roosevelt" },
  { quote: "Strive for progress, not perfection. 🌱", author: "Unknown" },
  { quote: "Your limitation is only your imagination. 🧠", author: "Unknown" },
  { quote: "Dream bigger. Do bigger. 💪", author: "Unknown" },
];

const DashboardCard = ({ children, className }: { children: React.ReactNode, className?: string }) => (
    <motion.div
        whileHover={{ scale: 1.02, y: -2 }}
        transition={{ type: "spring", stiffness: 300, damping: 15 }}
    >
        <Card className={className}>
            {children}
        </Card>
    </motion.div>
);


export default function DashboardPage() {
  const { speak } = useTTS();
  const { soundMode } = useSettings();
  const { playSound: playClickSound } = useSound('/sounds/ting.mp3', 0.3);
  const router = useRouter();
  
  const [recentTopics, setRecentTopics] = useState<string[]>([]);
  const [dailyQuote, setDailyQuote] = useState<{ quote: string; author: string } | null>(null);

  const pageTitleSpokenRef = useRef(false);

  useEffect(() => {
    const randomIndex = Math.floor(Math.random() * motivationalQuotes.length);
    setDailyQuote(motivationalQuotes[randomIndex]);

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
        // In a real scenario, you'd pass this query to the chatbot page
        router.push('/chatbot');
      }
  }

  return (
    <div className="container mx-auto max-w-7xl px-0 sm:px-4 py-4 sm:py-8 space-y-6 md:space-y-8">
        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
            {/* Left Column */}
            <div className="lg:col-span-2 space-y-6 md:space-y-8">
                {/* Resume Learning Card */}
                <DashboardCard>
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
                </DashboardCard>

                 {/* Ask Mint AI Card */}
                <DashboardCard>
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
                </DashboardCard>
                
                 {/* Featured Subjects */}
                <DashboardCard>
                    <CardHeader>
                        <CardTitle>Explore Features</CardTitle>
                        <CardDescription>Jump into any of LearnMint's powerful tools.</CardDescription>
                    </CardHeader>
                    <CardContent className="grid grid-cols-2 sm:grid-cols-3 gap-4">
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
                </DashboardCard>
            </div>

            {/* Right Column */}
            <div className="space-y-6 md:space-y-8">
                <DashboardCard className="bg-gradient-to-br from-primary/20 to-secondary/20">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><Flame className="text-orange-500" /> Streak</CardTitle>
                    </CardHeader>
                    <CardContent className="text-center">
                        <p className="text-5xl font-bold">7</p>
                        <p className="text-muted-foreground">You're on a 7-day streak! Keep it up!</p>
                    </CardContent>
                </DashboardCard>

                <DashboardCard>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><ShieldCheck className="text-green-500"/> Daily Quests</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2 text-sm">
                        <div className="flex items-center gap-2"><CheckCircle className="text-green-500 h-4 w-4"/> Generate 1 new note set.</div>
                        <div className="flex items-center gap-2 opacity-60"><div className="w-4 h-4 rounded-full border-2 ml-px mr-px border-muted-foreground"/> Complete 1 quiz.</div>
                        <div className="flex items-center gap-2 opacity-60"><div className="w-4 h-4 rounded-full border-2 ml-px mr-px border-muted-foreground"/> Learn 5 new flashcards.</div>
                    </CardContent>
                </DashboardCard>

                <DashboardCard>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><Bell className="text-yellow-500"/> Notifications</CardTitle>
                    </CardHeader>
                    <CardContent>
                         {dailyQuote && (
                            <div className="text-center text-sm italic p-2 bg-muted/50 rounded-lg">
                                <p>"{dailyQuote.quote}"</p>
                                <p className="text-xs text-muted-foreground mt-1">- {dailyQuote.author}</p>
                            </div>
                        )}
                    </CardContent>
                </DashboardCard>

            </div>
        </div>

        <div className="text-center text-xs text-muted-foreground mt-8 sm:mt-12 py-4 border-t border-border/50">
            Made by <span className="font-bold text-primary">MrGarvit</span>
        </div>
    </div>
  );
}
