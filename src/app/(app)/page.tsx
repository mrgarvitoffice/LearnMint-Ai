
"use client";

import { useEffect, useState, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRight, Brain, Trash2, Flame, CheckCircle, Bot, ShieldCheck, Bell } from "lucide-react";
import Link from "next/link";
import { useTTS } from '@/hooks/useTTS';
import { useSound } from '@/hooks/useSound';
import { useRouter } from 'next/navigation';
import { useSettings } from '@/contexts/SettingsContext';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { useIsMobile } from '@/hooks/use-mobile';
import InteractiveCharacterElement from '@/components/features/InteractiveCharacterElement';

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
  
  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
  };
  
  const { user } = useAuth();
  const isMobile = useIsMobile();

  return (
      <motion.div 
          className="container mx-auto max-w-7xl py-4 sm:py-6 space-y-6 md:space-y-8"
          initial="hidden"
          animate="visible"
          transition={{ staggerChildren: 0.1 }}
      >
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column (takes 2/3 space) */}
          <div className="lg:col-span-2 space-y-6">
            <motion.div variants={cardVariants}>
              <Card className="text-left bg-card/80 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="text-3xl font-bold">Welcome back, {user?.displayName?.split(' ')[0] || 'Learner'}!</CardTitle>
                  <CardDescription>Ready to dive back in or explore something new?</CardDescription>
                </CardHeader>
              </Card>
            </motion.div>
             <motion.div variants={cardVariants}>
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-3"><Brain className="text-primary"/>Resume Learning</CardTitle>
                        <CardDescription>Quickly revisit your recent study sessions.</CardDescription>
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
                </Card>
            </motion.div>
             <motion.div variants={cardVariants}>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-3"><Bot className="text-primary"/>Ask Mint AI</CardTitle>
                   <CardDescription>Have a quick question? Jump into a chat with one of our AI assistants.</CardDescription>
                </CardHeader>
                <CardContent>
                   <div className="flex gap-4 items-center">
                        <InteractiveCharacterElement characterName="Gojo" imageUrl="/images/gojo-dp.jpg" dataAiHint="Gojo Satoru" />
                        <InteractiveCharacterElement characterName="Holo" imageUrl="/images/holo-dp.jpg" dataAiHint="Holo wise wolf" />
                        <div className="flex-1">
                           <Button asChild>
                              <Link href="/chatbot">Go to AI Chat <ArrowRight className="ml-2 h-4 w-4"/></Link>
                          </Button>
                        </div>
                   </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Right Column (takes 1/3 space) */}
          <div className="space-y-6">
            <motion.div variants={cardVariants}>
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><Flame className="text-orange-500"/>Streak Progress</CardTitle>
                    </CardHeader>
                    <CardContent className="text-center">
                        <p className="text-4xl font-bold">7</p>
                        <p className="text-sm text-muted-foreground">Days</p>
                    </CardContent>
                </Card>
            </motion.div>
            <motion.div variants={cardVariants}>
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><ShieldCheck className="text-primary"/>Daily Quests</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2 text-sm">
                        <div className="flex items-center gap-2"><CheckCircle className="text-green-500 h-4 w-4"/> Generate 1 new note set.</div>
                        <div className="flex items-center gap-2 opacity-60"><div className="w-4 h-4 rounded-full border-2 ml-px mr-px border-muted-foreground"/> Complete 1 quiz.</div>
                        <div className="flex items-center gap-2 opacity-60"><div className="w-4 h-4 rounded-full border-2 ml-px mr-px border-muted-foreground"/> Learn 5 new flashcards.</div>
                    </CardContent>
                </Card>
            </motion.div>
            <motion.div variants={cardVariants}>
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><Bell className="text-primary" />Featured Subject</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p>Biology: The Krebs Cycle</p>
                    </CardContent>
                     <CardFooter>
                        <Button variant="secondary" asChild><Link href="/study?topic=The%20Krebs%20Cycle">Study Now</Link></Button>
                    </CardFooter>
                </Card>
            </motion.div>
          </div>
        </div>
        <div className="text-center text-xs text-muted-foreground mt-8 sm:mt-12 py-4 border-t border-border/50">
            Made by <span className="font-bold text-primary">MrGarvit</span>
        </div>
      </motion.div>
  );
}
