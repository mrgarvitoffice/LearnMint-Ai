
"use client";

import { useEffect, useState, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { APP_NAME } from "@/lib/constants";
import { ArrowRight, Brain, TestTubeDiagonal, FileText, ListChecks, Calculator as CalculatorIcon, Bot, Newspaper, BookMarked, Gamepad2, Trash2, Sparkles, Quote } from "lucide-react";
import Link from "next/link";
import { useTTS } from '@/hooks/useTTS';
import { useSound } from '@/hooks/useSound';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Logo } from '@/components/icons/Logo';
import { cn } from '@/lib/utils';

const RECENT_TOPICS_LS_KEY = 'learnmint-recent-topics';
const MAX_RECENT_TOPICS_DISPLAY = 5;
const PAGE_TITLE = `Welcome to ${APP_NAME}`;

const exploreFeaturesCards = [
  { title: "AI Note Generator", href: "/notes", icon: FileText, description: "Craft comprehensive notes on any subject." },
  { title: "Custom Test Creator", href: "/custom-test", icon: TestTubeDiagonal, description: "Design personalized tests." },
  { title: "AI Flashcards", href: "/flashcards", icon: ListChecks, description: "Quickly create flashcards." },
  { title: "AI Chatbot", href: "/chatbot", icon: Bot, description: "Chat with our witty AI companions." },
  { title: "Calculator & Converter", href: "/calculator", icon: CalculatorIcon, description: "Solve equations & convert units." },
  { title: "Daily News Digest", href: "/news", icon: Newspaper, description: "Stay updated with global news." },
  { title: "LearnMint Arcade", href: "/arcade", icon: Gamepad2, description: "Play educational games." },
  { title: "Resource Library", href: "/library", icon: BookMarked, description: "Explore learning resources." },
];

const motivationalQuotes = [
  { quote: "The only way to do great work is to love what you do. ✨", author: "Steve Jobs" },
  { quote: "Believe you can and you're halfway there. 🚀", author: "Theodore Roosevelt" },
  { quote: "Strive for progress, not perfection. 🌱", author: "Unknown" },
  { quote: "Your limitation is only your imagination. 🧠", author: "Unknown" },
  { quote: "Dream bigger. Do bigger. 💪", author: "Unknown" },
  { quote: "The future belongs to those who believe in the beauty of their dreams. 🌟", author: "Eleanor Roosevelt" },
  { quote: "Every day is a new opportunity to learn and grow. 📚", author: "Unknown" },
  { quote: "Don't watch the clock; do what it does. Keep going. 🕰️", author: "Sam Levenson"}
];

export default function DashboardPage() {
  const { speak, isSpeaking, isPaused, supportedVoices, setVoicePreference, selectedVoice } = useTTS();
  const { playSound: playClickSound } = useSound('/sounds/ting.mp3', 0.3);
  const router = useRouter();
  const { user } = useAuth();

  const [recentTopics, setRecentTopics] = useState<string[]>([]);
  const [dailyQuote, setDailyQuote] = useState<{ quote: string; author: string } | null>(null);
  const [liveUserCount, setLiveUserCount] = useState(137);

  const pageTitleSpokenRef = useRef(false);
  const voicePreferenceWasSetRef = useRef(false);

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
    const interval = setInterval(() => {
      setLiveUserCount(prevCount => {
        const fluctuation = Math.floor(Math.random() * 5) - 2;
        const newCount = prevCount + fluctuation;
        return newCount > 100 ? newCount : 100;
      });
    }, 2500);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (supportedVoices.length > 0 && !voicePreferenceWasSetRef.current) {
      setVoicePreference('luma');
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

  const handleRemoveTopic = (topicToRemove: string) => {
    playClickSound();
    const updatedTopics = recentTopics.filter(topic => topic !== topicToRemove);
    setRecentTopics(updatedTopics);
    if (typeof window !== 'undefined') {
      localStorage.setItem(RECENT_TOPICS_LS_KEY, JSON.stringify(updatedTopics));
    }
  };

  const handleClearAllTopics = () => {
    playClickSound();
    setRecentTopics([]);
    if (typeof window !== 'undefined') {
      localStorage.removeItem(RECENT_TOPICS_LS_KEY);
    }
  };

  const handleRecentTopicClick = (topic: string) => {
    playClickSound();
    router.push(`/study?topic=${encodeURIComponent(topic)}`);
  }

  return (
    <div className="container mx-auto max-w-7xl px-4 py-8 space-y-10">
      <header className="text-center relative">
        <div className="flex justify-center mb-4">
            <Logo size={64} />
        </div>
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-foreground">
          {PAGE_TITLE}
        </h1>
        <p className="mt-4 text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto">
          Your AI-powered learning assistant for notes, quizzes, tests, and more.
        </p>
        <div className="mt-6 flex items-center justify-center gap-2 text-sm text-green-500 dark:text-green-400">
          <div className="relative flex h-3 w-3">
            <div className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></div>
            <div className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></div>
          </div>
          <span className="font-semibold">{liveUserCount}</span>
          <span>Learners Online</span>
        </div>
      </header>

      <div className="text-center">
         <Button size="lg" className="text-lg py-6 shadow-lg hover:shadow-primary/50 group active:scale-95 transition-all duration-300 bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 text-primary-foreground" asChild>
            <Link href="/notes">
                <Sparkles className="mr-3 h-6 w-6 transition-transform duration-300 group-hover:rotate-[360deg] group-hover:scale-125" /> Start Generating Materials
            </Link>
        </Button>
      </div>

      <section>
         <h2 className="text-2xl font-semibold text-foreground mb-6 text-center sm:text-left">Explore Features</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {exploreFeaturesCards.map((item) => {
            const Icon = item.icon;
            return (
              <Link href={item.href} key={item.href} legacyBehavior>
                <a className="block h-full group">
                  <Card className="hover:bg-muted/50 hover:shadow-xl transition-all duration-300 h-full flex flex-col justify-between hover:ring-2 hover:ring-primary/50">
                     <CardHeader className="pb-2 pt-4">
                      <div className="flex items-center gap-3 mb-2">
                          <div className="p-2 bg-primary/10 rounded-lg">
                            <Icon className="h-6 w-6 text-primary" />
                          </div>
                          <CardTitle className="text-base font-semibold text-foreground">{item.title}</CardTitle>
                      </div>
                      <CardDescription className="text-xs text-muted-foreground/80 pt-1">{item.description}</CardDescription>
                    </CardHeader>
                    <CardFooter className="pt-2 pb-4">
                       <Button variant="link" className="p-0 h-auto text-xs text-primary hover:text-primary/80">
                        Open {item.title.split(' ')[0]} <ArrowRight className="ml-1 h-3 w-3" />
                      </Button>
                    </CardFooter>
                  </Card>
                </a>
              </Link>
            );
          })}
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-xl flex items-center justify-between">
              <span>Recent Topics</span>
              {recentTopics.length > 0 && (
                <Button variant="ghost" size="sm" onClick={handleClearAllTopics} className="text-xs text-destructive hover:text-destructive/80">
                  <Trash2 className="mr-1 h-3.5 w-3.5" /> Clear All
                </Button>
              )}
            </CardTitle>
            <CardDescription>Quickly revisit topics to generate or view study materials.</CardDescription>
          </CardHeader>
          <CardContent>
            {recentTopics.length > 0 ? (
              <ul className="space-y-2">
                {recentTopics.map((topic, index) => (
                  <li key={index} className="flex justify-between items-center p-2 border rounded-md hover:bg-muted/50">
                    <button
                      onClick={() => handleRecentTopicClick(topic)}
                      className="truncate text-left hover:text-primary flex-grow"
                      title={`Generate/view study materials for: ${topic}`}
                    >
                      {topic}
                    </button>
                    <Button variant="ghost" size="icon" onClick={() => handleRemoveTopic(topic)} className="h-7 w-7 ml-2">
                      <Trash2 className="h-3.5 w-3.5 text-destructive/70 hover:text-destructive" />
                    </Button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">No recent topics found. Generate some study materials to see them here!</p>
            )}
          </CardContent>
        </Card>

        {dailyQuote && (
          <Card className="bg-secondary/30 border-secondary/50 flex flex-col justify-center items-center text-center p-6">
            <Quote className="h-8 w-8 text-secondary-foreground/60 mb-3" />
            <blockquote className="text-lg font-semibold text-secondary-foreground">
              "{dailyQuote.quote}"
            </blockquote>
            <p className="text-sm text-muted-foreground/80 mt-2">- {dailyQuote.author}</p>
          </Card>
        )}
      </div>

      <div className="text-center text-sm text-muted-foreground mt-12 py-4 border-t border-border/50">
        Made with <Sparkles className="inline-block h-4 w-4 text-accent" /> by MrGarvit
      </div>
    </div>
  );
}
