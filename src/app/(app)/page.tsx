
"use client";

import { useEffect, useState, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRight, Sparkles, Trash2, TestTubeDiagonal, Newspaper, Brain, FileText, CheckCircle, Flame } from "lucide-react";
import Link from "next/link";
import { useTTS } from '@/hooks/useTTS';
import { useSound } from '@/hooks/useSound';
import { useRouter } from 'next/navigation';
import { useSettings } from '@/contexts/SettingsContext';
import { motion } from 'framer-motion';
import { Logo } from '@/components/icons/Logo';
import { NAV_ITEMS } from '@/lib/constants';
import { useAuth } from '@/contexts/AuthContext';
import { useIsMobile } from '@/hooks/use-mobile';
import InteractiveCharacterElement from '@/components/features/InteractiveCharacterElement';

const RECENT_TOPICS_LS_KEY = 'learnmint-recent-topics';
const MAX_RECENT_TOPICS_DISPLAY = 5;
const PAGE_TITLE = "Welcome to LearnMint!";

// A new reusable component for the main action cards on the dashboard.
const ActionCard = ({ icon: Icon, title, description, buttonText, href, delay }: { icon: React.ElementType, title: string, description: string, buttonText: string, href: string, delay: number }) => {
    const cardVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.5, delay } },
    };

    return (
        <motion.div variants={cardVariants}>
            <Card className="w-full text-left">
                <CardHeader>
                    <CardTitle className="flex items-center gap-3 text-xl">
                        <Icon className="h-6 w-6 text-primary" />
                        {title}
                    </CardTitle>
                    <CardDescription>{description}</CardDescription>
                </CardHeader>
                <CardFooter>
                    <Button asChild size="lg" className="w-full sm:w-auto bg-green-600 hover:bg-green-700 text-white shadow-lg">
                        <Link href={href}>
                            {buttonText} <ArrowRight className="ml-2 h-4 w-4" />
                        </Link>
                    </Button>
                </CardFooter>
            </Card>
        </motion.div>
    );
};


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

  // Desktop View
  if (!isMobile) {
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
                  <CardTitle>Ask Mint AI</CardTitle>
                </CardHeader>
                <CardContent>
                   <div className="flex gap-4 items-center">
                        <InteractiveCharacterElement characterName="Gojo" imageUrl="/images/gojo-dp.jpg" dataAiHint="Gojo Satoru" />
                        <InteractiveCharacterElement characterName="Holo" imageUrl="/images/holo-dp.jpg" dataAiHint="Holo wise wolf" />
                        <div className="flex-1">
                          <p className="text-muted-foreground text-sm">Have a quick question? Jump into a chat with one of our AI assistants.</p>
                        </div>
                   </div>
                </CardContent>
                <CardFooter>
                    <Button asChild>
                        <Link href="/chatbot">Go to AI Chat <ArrowRight className="ml-2 h-4 w-4"/></Link>
                    </Button>
                </CardFooter>
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
                        <CardTitle>Daily Quests</CardTitle>
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
                        <CardTitle>Featured Subject</CardTitle>
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

  // Mobile View
  return (
    <motion.div 
        className="container mx-auto max-w-4xl py-4 sm:py-8 space-y-6 md:space-y-8"
        initial="hidden"
        animate="visible"
        transition={{ staggerChildren: 0.1 }}
    >
        <motion.div variants={cardVariants}>
          <Card className="text-center bg-transparent border-none shadow-none">
            <CardHeader className="items-center p-0">
              <Logo size={60} />
              <CardTitle className="text-4xl font-bold mt-4">Welcome to LearnMint!</CardTitle>
              <CardDescription className="text-muted-foreground mt-2 max-w-xs">
                Your AI-powered learning assistant for notes, quizzes, tests, and more.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0 mt-4">
                <div className="flex items-center justify-center gap-2 text-sm">
                    <span className="relative flex h-2.5 w-2.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500"></span>
                    </span>
                    <span>138 Learners Online</span>
                </div>
            </CardContent>
             <CardFooter className="flex-col p-0 mt-6">
                <Button asChild size="lg" className="w-full">
                    <Link href="/notes">
                        <Sparkles className="mr-2 h-5 w-5"/> Start Generating Materials
                    </Link>
                </Button>
            </CardFooter>
          </Card>
        </motion.div>
        
        <motion.div variants={cardVariants}>
            <h2 className="text-lg font-semibold text-center text-muted-foreground my-4">Explore Features</h2>
             <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {NAV_ITEMS.map(item => {
                    const Icon = item.icon;
                    // Exclude Dashboard and Profile from this grid for mobile view to avoid redundancy
                    if (item.href === '/' || item.href === '/profile') return null;
                    return (
                        <Link key={item.href} href={item.href} passHref legacyBehavior>
                            <a className="w-full">
                                <Button variant="outline" className="w-full h-20 flex-col gap-1.5" onClick={playClickSound}>
                                    <Icon className="h-6 w-6" />
                                    <span className="text-xs text-center">{item.title}</span>
                                </Button>
                            </a>
                        </Link>
                    )
                })}
            </div>
        </motion.div>
        
        <div className="text-center text-xs text-muted-foreground mt-8 sm:mt-12 py-4 border-t border-border/50">
            Made by <span className="font-bold text-primary">MrGarvit</span>
        </div>
    </motion.div>
  );
}
