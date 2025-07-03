
"use client";

import { useEffect, useState, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRight, Brain, CheckCircle, FileText, TestTubeDiagonal, Newspaper, Sparkles, BookHeart, History } from "lucide-react";
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
import { useTranslation } from '@/hooks/useTranslation';

const RECENT_TOPICS_LS_KEY = 'learnmint-recent-topics';
const MAX_RECENT_TOPICS_DISPLAY = 5;

const dailyMotivationQuotes = [
    "The secret of getting ahead is getting started.",
    "The expert in anything was once a beginner.",
    "The only way to do great work is to love what you do.",
    "A little progress each day adds up to big results.",
    "Believe you can and you're halfway there."
];

const ActionCard = ({ titleKey, descriptionKey, buttonTextKey, href, icon: Icon }: { titleKey: string, descriptionKey: string, buttonTextKey: string, href: string, icon: React.ElementType }) => {
    const { t } = useTranslation();
    return (
        <motion.div whileHover={{ y: -5, scale: 1.02 }} className="w-full">
            <Card className="bg-card/80 backdrop-blur-sm shadow-lg hover:shadow-primary/20 transition-all duration-300 h-full flex flex-col">
                <CardHeader>
                    <div className="flex items-center gap-3 group">
                        <Icon className="w-8 h-8 text-primary transition-transform duration-300 group-hover:scale-110" />
                        <CardTitle className="text-xl font-bold">{t(titleKey)}</CardTitle>
                    </div>
                </CardHeader>
                <CardContent className="flex-grow">
                    <p className="text-muted-foreground">{t(descriptionKey)}</p>
                </CardContent>
                <CardFooter>
                    <Button asChild className="w-full">
                        <Link href={href}>{t(buttonTextKey)} <ArrowRight className="ml-2 w-4 h-4"/></Link>
                    </Button>
                </CardFooter>
            </Card>
        </motion.div>
    );
}

const FeatureIcon = ({ item }: { item: NavItem }) => {
    const { t } = useTranslation();
    return (
        <Link href={item.href} passHref>
            <motion.div
                whileHover={{ scale: 1.05, y: -5 }}
                transition={{ type: "spring", stiffness: 300 }}
                className="flex flex-col items-center gap-3 p-4 rounded-xl hover:bg-primary/10 border border-transparent hover:border-primary/30 transition-all duration-300 cursor-pointer text-center group"
            >
                <div className="p-4 bg-muted rounded-full transition-colors duration-300 group-hover:bg-primary/20">
                    <item.icon className="w-8 h-8 text-primary transition-transform duration-300 group-hover:scale-110" />
                </div>
                <p className="text-sm font-semibold text-muted-foreground group-hover:text-primary transition-colors duration-300">{t(item.title)}</p>
            </motion.div>
        </Link>
    );
};

export default function DashboardPage() {
    const { t, isReady } = useTranslation();
    const { speak, setVoicePreference } = useTTS();
    const { soundMode } = useSettings();
    const { playSound: playClickSound } = useSound('/sounds/ting.mp3', 0.3);
    const router = useRouter();
    const { user } = useAuth();
    
    const [recentTopics, setRecentTopics] = useState<string[]>([]);
    const [dailyQuote, setDailyQuote] = useState('');
    const [totalLearners, setTotalLearners] = useState(138);
    const pageTitleSpokenRef = useRef(false);

    useEffect(() => {
        const initialLearners = parseInt(localStorage.getItem('learnmint-learner-count') || '138', 10);
        setTotalLearners(initialLearners);

        const interval = setInterval(() => {
            setTotalLearners(prevCount => {
                const newCount = prevCount + Math.floor(Math.random() * 3); // Always increment
                localStorage.setItem('learnmint-learner-count', newCount.toString());
                return newCount;
            });
        }, 8000); // update every 8 seconds

        return () => clearInterval(interval);
    }, []);

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
        if (isReady) {
            const PAGE_TITLE = t('dashboard.welcome');
            const timer = setTimeout(() => {
                if (!pageTitleSpokenRef.current && soundMode === 'essential') {
                    speak(PAGE_TITLE, { priority: 'essential' });
                    pageTitleSpokenRef.current = true;
                }
            }, 100);
            
            return () => clearTimeout(timer);
        }
    }, [speak, soundMode, t, isReady]);

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
  
    if (!isReady) {
        return <div className="flex justify-center items-center h-full"><Sparkles className="animate-spin" /></div>;
    }
  
    return (
        <motion.div 
            className="container mx-auto max-w-4xl py-4 sm:py-6 space-y-6 md:space-y-8"
            initial="hidden"
            animate="visible"
        >
            <motion.div custom={0} variants={cardVariants}>
                <Card className="text-center bg-transparent border-none shadow-none">
                    <CardHeader>
                        <motion.div whileHover={{ scale: 1.1, rotate: 5 }} transition={{ type: "spring", stiffness: 300 }}>
                            <Logo size={64} className="mx-auto" />
                        </motion.div>
                        <CardTitle className="text-4xl font-bold mt-4">{t('dashboard.welcome')}</CardTitle>
                        <CardDescription className="text-lg text-muted-foreground mt-1">{t('dashboard.description')}</CardDescription>
                         <div className="flex items-center justify-center gap-2 mt-3 text-primary">
                            <span className="relative flex h-3 w-3">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary/75 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-3 w-3 bg-primary"></span>
                            </span>
                            <span className="animate-pulse-status">{totalLearners} {t('dashboard.totalLearners')}</span>
                        </div>
                    </CardHeader>
                </Card>
            </motion.div>

            <motion.div custom={1} variants={cardVariants} className="space-y-6">
               <ActionCard 
                   titleKey="dashboard.generateMaterials.title"
                   descriptionKey="dashboard.generateMaterials.description"
                   buttonTextKey="dashboard.generateMaterials.button"
                   href="/notes"
                   icon={FileText}
               />
               <ActionCard 
                   titleKey="dashboard.customTest.title"
                   descriptionKey="dashboard.customTest.description"
                   buttonTextKey="dashboard.customTest.button"
                   href="/custom-test"
                   icon={TestTubeDiagonal}
               />
               <ActionCard 
                   titleKey="dashboard.dailyNews.title"
                   descriptionKey="dashboard.dailyNews.description"
                   buttonTextKey="dashboard.dailyNews.button"
                   href="/news"
                   icon={Newspaper}
               />
            </motion.div>
            
            <motion.div custom={2} variants={cardVariants}>
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-3 group">
                            <Sparkles className="text-primary transition-transform duration-300 group-hover:scale-110"/>{t('dashboard.dailyMotivation.title')}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-lg italic text-muted-foreground text-center">"{dailyQuote}"</p>
                    </CardContent>
                </Card>
            </motion.div>
            
            <motion.div custom={3} variants={cardVariants}>
                 <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-3 group">
                            <Brain className="text-primary transition-transform duration-300 group-hover:scale-110"/>{t('dashboard.dailyQuests.title')}
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2 text-sm">
                        <div className="flex items-center gap-2"><CheckCircle className="text-green-500 h-4 w-4"/> {t('dashboard.dailyQuests.quest1')}</div>
                        <div className="flex items-center gap-2 opacity-60"><div className="w-4 h-4 rounded-full border-2 ml-px mr-px border-muted-foreground"/> {t('dashboard.dailyQuests.quest2')}</div>
                        <div className="flex items-center gap-2 opacity-60"><div className="w-4 h-4 rounded-full border-2 ml-px mr-px border-muted-foreground"/> {t('dashboard.dailyQuests.quest3')}</div>
                    </CardContent>
                </Card>
            </motion.div>

            <motion.div custom={4} variants={cardVariants}>
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-3 group">
                            <BookHeart className="text-primary transition-transform duration-300 group-hover:scale-110"/>{t('dashboard.exploreFeatures.title')}
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="grid grid-cols-3 md:grid-cols-4 gap-4 md:gap-6">
                        {NAV_ITEMS.map(item => (
                           <FeatureIcon key={item.href} item={item} />
                        ))}
                    </CardContent>
                </Card>
            </motion.div>

            <motion.div custom={5} variants={cardVariants}>
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-3 group">
                            <History className="text-primary transition-transform duration-300 group-hover:scale-110"/>{t('dashboard.recentTopics.title')}
                        </CardTitle>
                        <CardDescription>{t('dashboard.recentTopics.description')}</CardDescription>
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
                                {t('dashboard.recentTopics.empty')}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </motion.div>
            
            <div className="text-center text-xs text-muted-foreground mt-8 sm:mt-12 py-4 border-t border-border/50">
                {t('dashboard.madeBy')} <span className="font-bold text-primary">MrGarvit</span>
            </div>
      </motion.div>
  );
}
