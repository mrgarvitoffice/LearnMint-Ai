
"use client";

import { useEffect, useState, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRight, Sparkles, Trash2, TestTubeDiagonal, Newspaper, Brain, FileText } from "lucide-react";
import Link from "next/link";
import { useTTS } from '@/hooks/useTTS';
import { useSound } from '@/hooks/useSound';
import { useRouter } from 'next/navigation';
import { useSettings } from '@/contexts/SettingsContext';
import { motion } from 'framer-motion';
import { Logo } from '@/components/icons/Logo';
import { NAV_ITEMS } from '@/lib/constants';

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

  return (
    <motion.div 
        className="container mx-auto max-w-4xl py-4 sm:py-8 space-y-6 md:space-y-8"
        initial="hidden"
        animate="visible"
        transition={{ staggerChildren: 0.1 }}
    >
        <motion.div variants={cardVariants}>
          <Card className="text-center bg-card/80 backdrop-blur-sm">
            <CardHeader className="items-center">
              <Logo size={60} />
              <CardTitle className="text-4xl font-bold mt-4">Welcome to LearnMint!</CardTitle>
            </CardHeader>
          </Card>
        </motion.div>

        <ActionCard
            icon={FileText}
            title="Generate Study Materials"
            description="Let AI create comprehensive notes, quizzes, and flashcards on any topic."
            buttonText="Start Generating"
            href="/notes"
            delay={0.1}
        />
        <ActionCard
            icon={TestTubeDiagonal}
            title="Create a Custom Test"
            description="Tailor a test from specific topics, notes, or recent studies."
            buttonText="Build a Test"
            href="/custom-test"
            delay={0.2}
        />
        <ActionCard
            icon={Newspaper}
            title="Daily News Digest"
            description="Stay informed with the latest articles, filterable by location and category."
            buttonText="Read News"
            href="/news"
            delay={0.3}
        />
        
        <motion.div variants={cardVariants}>
            <Card>
                <CardHeader className="flex-row items-center gap-3 space-y-0">
                    <Brain className="h-6 w-6 text-primary" />
                    <CardTitle>Daily Motivation</CardTitle>
                </CardHeader>
                <CardContent>
                    <blockquote className="border-l-2 border-primary/50 pl-4 italic text-muted-foreground">
                        "The secret of getting ahead is getting started."
                        <footer className="mt-2 text-sm not-italic">- Mark Twain</footer>
                    </blockquote>
                </CardContent>
            </Card>
        </motion.div>
        
        <motion.div variants={cardVariants}>
            <Card>
                <CardHeader>
                    <CardTitle>Explore All Features</CardTitle>
                    <CardDescription>Quickly access all of LearnMint's powerful tools.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                        {NAV_ITEMS.map(item => {
                            const Icon = item.icon;
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
                </CardContent>
            </Card>
        </motion.div>

        <motion.div variants={cardVariants}>
            <Card>
                <CardHeader>
                    <CardTitle>Recent Topics</CardTitle>
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
        
        <div className="text-center text-xs text-muted-foreground mt-8 sm:mt-12 py-4 border-t border-border/50">
            Made by <span className="font-bold text-primary">MrGarvit</span>
        </div>
    </motion.div>
  );
}
