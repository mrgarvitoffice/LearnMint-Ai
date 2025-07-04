
"use client";

import { useEffect, useState, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRight, Brain, CheckCircle, FileText, TestTubeDiagonal, Newspaper, Sparkles, BookHeart, History, Users, Quote, Loader2 } from "lucide-react";
import Link from "next/link";
import { useTTS } from '@/hooks/useTTS';
import { useSound } from '@/hooks/useSound';
import { useRouter } from 'next/navigation';
import { useSettings } from '@/contexts/SettingsContext';
import { motion } from 'framer-motion';
import { Logo } from '@/components/icons/Logo';
import { NAV_ITEMS } from '@/lib/constants';
import type { NavItem } from '@/lib/constants';
import { useTranslation } from '@/hooks/useTranslation';
import { useAuth } from '@/contexts/AuthContext';
import { useQuests } from '@/contexts/QuestContext';
import { db } from '@/lib/firebase/config';
import { doc, getDoc } from 'firebase/firestore';
import { cn } from '@/lib/utils';
import { useQuery } from '@tanstack/react-query';
import { fetchMathFact } from '@/lib/math-fact-api';
import type { MathFact } from '@/lib/types';
import { MATH_FACTS_FALLBACK } from '@/lib/constants';

const RECENT_TOPICS_LS_KEY = 'learnmint-recent-topics';
const MAX_RECENT_TOPICS_DISPLAY = 5;

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

const DailyQuestItem = ({ isCompleted, text }: { isCompleted: boolean; text: string }) => (
    <div className={cn("flex items-center gap-2", isCompleted && "text-muted-foreground line-through")}>
        {isCompleted ? (
            <CheckCircle className="text-green-500 h-4 w-4" />
        ) : (
            <div className="w-4 h-4 rounded-full border-2 ml-px mr-px border-muted-foreground/50" />
        )}
        {text}
    </div>
);

export default function DashboardPage() {
    const { t, isReady } = useTranslation();
    const { speak, setVoicePreference } = useTTS();
    const { soundMode } = useSettings();
    const { playSound: playClickSound } = useSound('/sounds/ting.mp3');
    const router = useRouter();
    const { user } = useAuth();
    const { quests } = useQuests();
    
    const [recentTopics, setRecentTopics] = useState<string[]>([]);
    const [totalLearners, setTotalLearners] = useState<number | null>(null);
    const [loadingLearners, setLoadingLearners] = useState(true);
    const [currentMathFact, setCurrentMathFact] = useState<MathFact | null>(null);
    const pageTitleSpokenRef = useRef(false);

    // Fetch Math Fact for Daily Motivation
    const { data: mathFact, isLoading: isLoadingMathFact, refetch: refetchMathFact } = useQuery<MathFact>({
        queryKey: ['mathFactDashboard'],
        queryFn: fetchMathFact,
        staleTime: 1000 * 60 * 60,
        gcTime: 1000 * 60 * 65,
        refetchOnWindowFocus: false,
    });

    useEffect(() => {
        if (mathFact) {
            setCurrentMathFact(mathFact);
        } else if (!isLoadingMathFact) {
            const randomIndex = Math.floor(Math.random() * MATH_FACTS_FALLBACK.length);
            setCurrentMathFact({ text: MATH_FACTS_FALLBACK[randomIndex] });
        }
    }, [mathFact, isLoadingMathFact]);

    const handleRefreshMathFact = () => {
        playClickSound();
        refetchMathFact();
    };

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
        }
    }, [setVoicePreference]);

    useEffect(() => {
        const fetchLearnerCount = async () => {
            setLoadingLearners(true);
            try {
                const docRef = doc(db, "metadata", "userCount");
                const docSnap = await getDoc(docRef);

                if (docSnap.exists()) {
                    setTotalLearners(docSnap.data().count);
                } else {
                    // If doc doesn't exist, show the initial base count of 21.
                    setTotalLearners(21);
                }
            } catch (error) {
                console.error("Error fetching total learners. Firestore rules may need adjustment for public read on 'metadata/userCount'.", error);
                setTotalLearners(21); // Fallback to base count on error
            } finally {
                setLoadingLearners(false);
            }
        };

        // Fetch count for all users, but only after auth state is known.
        if (user !== undefined) {
             fetchLearnerCount();
        }
    }, [user]);
  
    useEffect(() => {
        if (soundMode !== 'muted' && isReady && !pageTitleSpokenRef.current) {
            const PAGE_TITLE = t('dashboard.welcome');
            const timer = setTimeout(() => {
                speak(PAGE_TITLE, { priority: 'essential' });
                pageTitleSpokenRef.current = true;
            }, 500);
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
            className="mx-auto max-w-7xl px-4 md:px-6 py-4 sm:py-6 space-y-6 md:space-y-8"
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
                        
                        {loadingLearners ? (
                             <div className="mt-3 h-6 flex justify-center items-center gap-2"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
                        ) : totalLearners !== null ? (
                            <div className="mt-3 h-6 flex justify-center items-center gap-2 group cursor-pointer">
                               <Users className="h-5 w-5 text-green-400/80 group-hover:text-green-400 transition-colors" />
                               <span className="font-semibold text-green-400/90 group-hover:text-green-400 transition-colors">
                                   {t('dashboard.totalLearners')}: {totalLearners.toLocaleString()}
                               </span>
                            </div>
                        ) : (
                           <div className="h-6 mt-3" />
                        )}

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
                <Card className="bg-secondary/30 border-orange-500/30 hover:shadow-xl transition-shadow duration-300 group">
                    <CardHeader className="pb-2 pt-4">
                        <div className="flex items-center gap-3 mb-2">
                            <Quote className="h-7 w-7 text-orange-500/80 group-hover:text-orange-600 transition-colors" />
                            <CardTitle className="text-xl font-semibold text-orange-600 dark:text-orange-500">{t('dashboard.dailyMotivation.title')}</CardTitle>
                        </div>
                        {isLoadingMathFact && !currentMathFact ? (
                            <div className="flex items-center space-x-2 text-muted-foreground py-3 h-[4.5rem]"><Loader2 className="h-5 w-5 animate-spin" /><span>Loading fact...</span></div>
                        ) : currentMathFact ? (
                            <CardDescription className="text-lg text-orange-700 dark:text-orange-400 font-medium pt-1 italic py-3 h-[4.5rem] flex items-center justify-center">
                            "{currentMathFact.text}"
                            </CardDescription>
                        ) : (
                            <CardDescription className="text-lg text-muted-foreground py-3 h-[4.5rem] flex items-center justify-center">Could not load fact. Using a classic one!</CardDescription>
                        )}
                    </CardHeader>
                    <CardFooter className="pt-2 pb-4">
                        <Button onClick={handleRefreshMathFact} variant="outline" size="sm" disabled={isLoadingMathFact} className="bg-background/70 group-hover:border-orange-500/50 group-hover:text-orange-600 transition-colors">
                            {isLoadingMathFact && <Loader2 className="h-4 w-4 animate-spin mr-2" />} New Fact
                        </Button>
                    </CardFooter>
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
                       <DailyQuestItem isCompleted={quests.quest1Completed} text={t('dashboard.dailyQuests.quest1')} />
                       <DailyQuestItem isCompleted={quests.quest2Completed} text={t('dashboard.dailyQuests.quest2')} />
                       <DailyQuestItem isCompleted={quests.quest3Completed} text={t('dashboard.dailyQuests.quest3')} />
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
