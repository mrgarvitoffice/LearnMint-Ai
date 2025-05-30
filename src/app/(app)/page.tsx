
"use client";

import { useEffect, useState, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { APP_NAME } from "@/lib/constants";
import { ArrowRight, Brain, TestTubeDiagonal, FileText, HelpCircle, ListChecks, Calculator as CalculatorIcon, Bot, Newspaper, BookMarked, Gamepad2, Trash2, Sparkles, Quote, Smile } from "lucide-react";
import Link from "next/link";
import { useTTS } from '@/hooks/useTTS';
import { useSound } from '@/hooks/useSound';
import { useRouter } from 'next/navigation';
import InteractiveCharacterElement from '@/components/features/InteractiveCharacterElement';

const RECENT_TOPICS_LS_KEY = 'learnmint-recent-topics';
const MAX_RECENT_TOPICS_DISPLAY = 5;
const PAGE_TITLE_BASE = `Welcome to ${APP_NAME}`; // Base title

const coreFeaturesListText = [
  "<strong>AI Content Generation:</strong> Quickly create notes, quizzes, & flashcards.",
  "<strong>Custom Test Creation:</strong> Design tests with specific topics, difficulty, and timers.",
  "<strong>Interactive AI Chatbot (Megumin):</strong> Chat with a witty AI for questions or fun. Voice input supported.",
  "<strong>Scientific Calculator & Unit Converter:</strong> For calculations and unit conversions.",
  "<strong>Daily News Digest:</strong> Stay updated with news, filterable by country and category.",
  "<strong>Resource Library:</strong> Access OpenStax samples, search books/videos, and get Math Facts.",
  "<strong>Educational Game:</strong> Play 'Word Game' (Definition Challenge). More games coming!",
];

const exploreFeaturesCards = [
  { title: "AI Note Generator", href: "/notes", icon: FileText, description: "Craft comprehensive notes on any subject." },
  { title: "Custom Test Creator", href: "/custom-test", icon: TestTubeDiagonal, description: "Design personalized tests." },
  { title: "AI Quiz Creator", href: "/quiz", icon: HelpCircle, description: "Generate interactive quizzes." },
  { title: "AI Flashcards", href: "/flashcards", icon: ListChecks, description: "Quickly create flashcards." },
  { title: "AI Chatbot (Megumin)", href: "/chatbot", icon: Bot, description: "Chat with our witty AI." },
  { title: "Calculator & Converter", href: "/calculator", icon: CalculatorIcon, description: "Solve equations & convert." },
  { title: "Daily News Digest", href: "/news", icon: Newspaper, description: "Stay updated with news." },
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
  const { speak, isSpeaking, isPaused, supportedVoices, setVoicePreference, selectedVoice, voicePreference, cancelTTS } = useTTS();
  const { playSound: playClickSound } = useSound('/sounds/ting.mp3', 0.3);
  const router = useRouter();

  const [recentTopics, setRecentTopics] = useState<string[]>([]);
  const [dailyQuote, setDailyQuote] = useState<{ quote: string; author: string } | null>(null);
  
  const pageTitleSpokenRef = useRef(false);
  const voicePreferenceWasSetRef = useRef(false);
  const [pageTitle, setPageTitle] = useState(PAGE_TITLE_BASE);


  useEffect(() => {
    setPageTitle(PAGE_TITLE_BASE); // Always set to base title
  }, []);


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
    if (supportedVoices.length > 0 && !voicePreferenceWasSetRef.current) {
      console.log("Dashboard: Setting initial voice preference to luma");
      setVoicePreference('luma'); 
      voicePreferenceWasSetRef.current = true;
    }
  }, [supportedVoices, setVoicePreference]);

  useEffect(() => {
    let isMounted = true;
    if (isMounted && selectedVoice && !isSpeaking && !isPaused && !pageTitleSpokenRef.current) {
      console.log(`Dashboard: Attempting to speak pageTitle ("${pageTitle}") with voice: ${selectedVoice.name}`);
      speak(pageTitle);
      pageTitleSpokenRef.current = true;
    }
    return () => {
      isMounted = false;
    };
  }, [selectedVoice, isSpeaking, isPaused, speak, pageTitle]);


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
    router.push(`/notes?topic=${encodeURIComponent(topic)}`);
  }

  return (
    <div className="container mx-auto max-w-7xl px-4 py-8 space-y-10">
      <header className="text-center relative">
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-primary">
          {pageTitle}
        </h1>
        <p className="mt-4 text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto">
          Your AI-powered learning assistant for notes, quizzes, tests, and more.
        </p>
        <div className="absolute top-0 right-0 -mr-4 -mt-4 opacity-75 hover:opacity-100 transition-opacity hidden sm:block">
          <InteractiveCharacterElement
            characterName="LearnMint Mascot"
            Icon={Sparkles}
            containerClassName="p-2"
            dataAiHint="mascot sparkle"
          />
        </div>
      </header>

      <Card className="bg-card/80 border-primary/30 shadow-xl backdrop-blur-sm">
        <CardHeader>
          <div className="flex items-center gap-3">
            <Brain className="h-7 w-7 text-primary" />
            <CardTitle className="text-2xl text-primary">Core Features Overview</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
           <ul className="list-disc list-inside space-y-1.5 text-muted-foreground">
            {coreFeaturesListText.map((feature, index) => (
              <li key={index} className="text-sm md:text-base" dangerouslySetInnerHTML={{ __html: feature }} />
            ))}
          </ul>
        </CardContent>
      </Card>

      <div className="text-center">
         <Button size="lg" className="bg-accent hover:bg-accent/90 text-accent-foreground text-lg px-8 py-6 shadow-lg group" asChild>
            <Link href="/notes">
                <Sparkles className="mr-3 h-6 w-6 transition-transform duration-300 group-hover:rotate-[360deg] group-hover:scale-125" /> Start Generating Notes
            </Link>
        </Button>
      </div>

      <section>
         <h2 className="text-2xl font-semibold text-primary mb-6 text-center sm:text-left">Explore More Features</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {exploreFeaturesCards.map((item) => {
            const Icon = item.icon;
            return (
              <Link href={item.href} key={item.href} legacyBehavior>
                <a className="block h-full">
                  <Card className="hover:bg-accent/10 hover:shadow-xl transition-all duration-300 h-full flex flex-col justify-between group">
                     <CardHeader className="pb-2 pt-4">
                      <div className="flex items-center gap-3 mb-2">
                          <Icon className="h-6 w-6 text-muted-foreground group-hover:text-accent transition-colors" />
                          <CardTitle className="text-base font-medium text-foreground group-hover:text-accent transition-colors">{item.title}</CardTitle>
                      </div>
                      <CardDescription className="text-xs text-muted-foreground/80 pt-1">{item.description}</CardDescription>
                    </CardHeader>
                    <CardFooter className="pt-2 pb-4">
                       <Button variant="link" className="p-0 h-auto text-xs text-accent hover:text-accent/80">
                        Open {item.title.split(' ')[0]} <ArrowRight className="ml-1 h-3 w-3" />
                      </Button>
                    </CardFooter>
                  </Card>
                </a>
              </Link>
            );
          })}
           {dailyQuote && (
            <Card className="bg-secondary/30 border-secondary/50 hover:shadow-xl transition-shadow duration-300 h-full flex flex-col justify-between group">
              <CardHeader className="pb-2 pt-4">
                <div className="flex items-center gap-3 mb-2">
                  <Quote className="h-6 w-6 text-secondary-foreground/80 group-hover:text-accent transition-colors" />
                  <CardTitle className="text-base font-medium text-secondary-foreground group-hover:text-accent transition-colors">Daily Motivation</CardTitle>
                </div>
                <CardDescription className="text-base text-accent font-semibold pt-1 italic">
                  "{dailyQuote.quote}"
                </CardDescription>
              </CardHeader>
              <CardFooter className="pt-2 pb-4">
                <p className="text-xs text-muted-foreground/70">- {dailyQuote.author}</p>
              </CardFooter>
            </Card>
          )}
        </div>
      </section>
      
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
          <CardDescription>Quickly revisit topics you've generated study materials for.</CardDescription>
        </CardHeader>
        <CardContent>
          {recentTopics.length > 0 ? (
            <ul className="space-y-2">
              {recentTopics.map((topic, index) => (
                <li key={index} className="flex justify-between items-center p-2 border rounded-md hover:bg-muted/50">
                  <button
                    onClick={() => handleRecentTopicClick(topic)}
                    className="truncate text-left hover:text-primary flex-grow"
                    title={`Revisit study materials for: ${topic}`}
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
            <p className="text-sm text-muted-foreground">No recent topics found. Generate some study materials to see them here!</p>
          )}
        </CardContent>
      </Card>
      
      <div className="text-center text-sm text-muted-foreground mt-12 py-4">
        Made by - MrGarvit
      </div>
    </div>
  );
}
