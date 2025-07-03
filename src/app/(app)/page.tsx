
"use client";

import { useEffect, useState, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRight, Brain, Trash2, CheckCircle, FileText, TestTubeDiagonal, Newspaper, Sparkles, BookHeart, History } from "lucide-react";
import Link from "next/link";
import { useTTS } from '@/hooks/useTTS';
import { useSound } from '@/hooks/useSound';
import { useRouter } from 'next/navigation';
import { useSettings } from '@/contexts/SettingsContext';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { Logo } from '@/components/icons/Logo';
import { NAV_ITEMS } from '@/lib/constants';
import type { NavItem } from '@/lib/constants';

const RECENT_TOPICS_LS_KEY = 'learnmint-recent-topics';
const MAX_RECENT_TOPICS_DISPLAY = 5;
const PAGE_TITLE = "Welcome to LearnMint!";

const dailyMotivationQuotes = [
    "The secret of getting ahead is getting started.",
    "The expert in anything was once a beginner.",
    "The only way to do great work is to love what you do.",
    "A little progress each day adds up to big results.",
    "Believe you can and you're halfway there."
];

const ActionCard = ({ title, description, buttonText, href, icon: Icon }: { title: string, description: string, buttonText: string, href: string, icon: React.ElementType }) => (
    <Card className="bg-card/80 backdrop-blur-sm shadow-lg hover:shadow-primary/20 transition-all duration-300">
        <CardHeader>
            <div className="flex items-center gap-3">
                <Icon className="w-8 h-8 text-primary" />
                <CardTitle className="text-xl font-bold">{title}</CardTitle>
            </div>
        </CardHeader>
        <CardContent>
            <p className="text-muted-foreground">{description}</p>
        </CardContent>
        <CardFooter>
            <Button asChild className="w-full">
                <Link href={href}>{buttonText} <ArrowRight className="ml-2 w-4 h-4"/></Link>
            </Button>
        </CardFooter>
    </Card>
);

const FeatureIcon = ({ item }: { item: NavItem }) => (
    <Link href={item.href} passHref>
        <div className="flex flex-col items-center gap-2 p-3 rounded-lg hover:bg-muted transition-colors cursor-pointer text-center">
            <div className="p-3 bg-muted rounded-full">
                <item.icon className="w-6 h-6 text-primary" />
            </div>
            <p className="text-xs font-medium text-muted-foreground">{item.title}</p>
        </div>
    </Link>
);

export default function DashboardPage() {
    const { speak, setVoicePreference } = useTTS();
    const { soundMode } = useSettings();
    const { playSound: playClickSound } = useSound('/sounds/ting.mp3', 0.3);
    const router = useRouter();
    const { user } = useAuth();
    
    const [recentTopics, setRecentTopics] = useState<string[]>([]);
    const [dailyQuote, setDailyQuote] = useState('');
    const pageTitleSpokenRef = useRef(false);

    useEffect(() => {
        setVoicePreference('gojo');
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
            // Set daily quote
            const today = new Date().toDateString();
            const storedQuoteDate = localStorage.getItem('learnmint-quote-date');
            if (storedQuoteDate === today) {
                setDailyQuote(localStorage.getItem('learnmint-quote') || dailyMotivationQuotes[0]);
            } else {
                const newQuote = dailyMotivationQuotes[Math.floor(Math.random() * dailyMotivationQuotes.length)];
                setDailyQuote(newQuote);
                localStorage.setItem('learnmint-quote', newQuote);
                localStorage.setItem('learnmint-quote-date', today);
            }
        }
    }, [setVoicePreference]);
  
    useEffect(() => {
        const timer = setTimeout(() => {
            if (!pageTitleSpokenRef.current && soundMode === 'essential') {
                speak(PAGE_TITLE, { priority: 'essential' });
                pageTitleSpokenRef.current = true;
            }
        }, 100);
        
        return () => clearTimeout(timer);
    }, [speak, soundMode]);

    const handleRecentTopicClick = (topic: string) => {
        playClickSound();
        router.push(`/study?topic=${encodeURIComponent(topic)}`);
    }

    const cardVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: (i: number) => ({
            opacity: 1,
            y: 0,
            transition: { delay: i * 0.1, duration: 0.5 }
        }),
    };
  
    return (
        <motion.div 
            className="container mx-auto max-w-4xl py-4 sm:py-6 space-y-6 md:space-y-8"
            initial="hidden"
            animate="visible"
        >
            <motion.div custom={0} variants={cardVariants}>
                <Card className="text-center bg-transparent border-none shadow-none">
                    <CardHeader>
                        <Logo size={64} className="mx-auto" />
                        <CardTitle className="text-4xl font-bold mt-4">Welcome to LearnMint!</CardTitle>
                        <CardDescription className="text-lg text-muted-foreground mt-1">Your AI-powered learning assistant for notes, quizzes, tests, and more.</CardDescription>
                         <div className="flex items-center justify-center gap-2 mt-3 text-primary">
                            <span className="relative flex h-3 w-3">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary/75 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-3 w-3 bg-primary"></span>
                            </span>
                            <span className="animate-pulse-status">138 Learners Online</span>
                        </div>
                    </CardHeader>
                </Card>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <motion.div custom={1} variants={cardVariants} className="md:col-span-1">
                   <ActionCard 
                       title="Generate Materials"
                       description="Let AI create comprehensive notes, quizzes, and flashcards for any topic."
                       buttonText="Start Generating Notes"
                       href="/notes"
                       icon={FileText}
                   />
                </motion.div>
                 <motion.div custom={2} variants={cardVariants} className="md:col-span-1">
                   <ActionCard 
                       title="Create Custom Test"
                       description="Build a tailored test from topics, notes, or recent study sessions."
                       buttonText="Go to Test Creator"
                       href="/custom-test"
                       icon={TestTubeDiagonal}
                   />
                </motion.div>
                <motion.div custom={3} variants={cardVariants} className="md:col-span-1">
                   <ActionCard 
                       title="Daily News Digest"
                       description="Catch up on the latest headlines from around the world, filtered your way."
                       buttonText="Read Today's News"
                       href="/news"
                       icon={Newspaper}
                   />
                </motion.div>
            </div>
            
            <motion.div custom={4} variants={cardVariants}>
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-3"><Sparkles className="text-primary"/>Daily Motivation</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-lg italic text-muted-foreground text-center">"{dailyQuote}"</p>
                    </CardContent>
                </Card>
            </motion.div>

            <motion.div custom={5} variants={cardVariants}>
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-3"><BookHeart className="text-primary"/>Explore All Features</CardTitle>
                    </CardHeader>
                    <CardContent className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                        {NAV_ITEMS.map(item => (
                           <FeatureIcon key={item.href} item={item} />
                        ))}
                    </CardContent>
                </Card>
            </motion.div>

            <motion.div custom={6} variants={cardVariants}>
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-3"><History className="text-primary"/>Recent Topics</CardTitle>
                        <CardDescription>Quickly jump back into your recent study sessions.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {recentTopics.length > 0 ? (
                            <ul className="space-y-2">
                                {recentTopics.map((topic, index) => (
                                <li key={index} 
                                    onClick={() => handleRecentTopicClick(topic)}
                                    className="flex justify-between items-center p-3 border rounded-lg hover:bg-muted/50 hover:border-primary/40 cursor-pointer transition-all">
                                    <span className="truncate font-medium">{topic}</span>
                                    <ArrowRight className="h-5 w-5 text-muted-foreground" />
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
