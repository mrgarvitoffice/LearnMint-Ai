
"use client";

import { useEffect, useState, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { NAV_ITEMS, APP_NAME } from "@/lib/constants";
import { ArrowRight, Lightbulb, Brain, TestTubeDiagonal, FileText, HelpCircle, ListChecks, Calculator as CalculatorIcon, Bot, Newspaper, BookMarked, Gamepad2, Trash2, Info } from "lucide-react";
import Link from "next/link";
import { useTTS } from '@/hooks/useTTS'; 
import { useSound } from '@/hooks/useSound';
import { useRouter } from 'next/navigation';

const RECENT_TOPICS_LS_KEY = 'learnmint-recent-topics';
const MAX_RECENT_TOPICS_DISPLAY = 5;

const coreFeaturesListText = [
  "AI Content Generation: Create comprehensive study notes, multiple-choice quizzes, and flashcards for any topic using AI.",
  "Custom Test Creation: Build tests based on specific topics, difficulty levels, number of questions, and timer settings.",
  "Interactive AI Chatbot (Megumin): Engage with a witty AI assistant for questions and even 'singing'. Supports voice input.",
  "Scientific Calculator & Unit Converter: Perform calculations and convert units across various categories.",
  "Daily News Digest: Browse news articles filtered by country, category, and keywords.",
  "Resource Library: Explore OpenStax textbooks, search Google Books & YouTube, and get a daily Math Fact.",
  "Educational Game: Play 'Word Game' (Definition Challenge) and look forward to more games.",
];

const keyToolCards = [
  { title: "Generate Study Notes", href: "/notes", description: "Craft comprehensive notes on any subject.", icon: FileText },
  { title: "Custom Test Creator", href: "/custom-test", description: "Design personalized tests from topics or notes.", icon: TestTubeDiagonal },
];

const exploreFeaturesCards = [
  { title: "AI Quiz Creator", href: "/quiz", description: "Generate interactive quizzes on demand.", icon: HelpCircle },
  { title: "AI Flashcards", href: "/flashcards", description: "Quickly create flashcards for review.", icon: ListChecks },
  { title: "AI Chatbot (Megumin)", href: "/chatbot", description: "Chat with our witty AI assistant.", icon: Bot },
  { title: "Calculator & Converter", href: "/calculator", description: "Solve equations and convert units.", icon: CalculatorIcon },
  { title: "Daily News Digest", href: "/news", description: "Stay updated with the latest news.", icon: Newspaper },
  { title: "Resource Library", href: "/library", description: "Access textbooks, math facts, and more.", icon: BookMarked },
  { title: "LearnMint Arcade", href: "/arcade", description: "Play fun and educational games.", icon: Gamepad2 },
];


export default function DashboardPage() {
  const { speak, isSpeaking, supportedVoices, setVoicePreference, selectedVoice } = useTTS();
  const { playSound: playClickSound } = useSound('/sounds/ting.mp3', 0.3);
  const hasWelcomedRef = useRef(false);
  const voicePreferenceWasSetRef = useRef(false);
  const router = useRouter();

  const [recentTopics, setRecentTopics] = useState<string[]>([]);

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


  useEffect(() => {
    if (supportedVoices.length > 0 && !voicePreferenceWasSetRef.current) {
      setVoicePreference('zia');
      voicePreferenceWasSetRef.current = true;
    }
  }, [supportedVoices, setVoicePreference]);

  useEffect(() => {
    if (
      supportedVoices.length > 0 &&
      voicePreferenceWasSetRef.current && 
      selectedVoice &&                
      !isSpeaking &&
      !hasWelcomedRef.current         
    ) {
      speak("Welcome to LearnMint!");
      hasWelcomedRef.current = true;   
    }
  }, [supportedVoices, selectedVoice, isSpeaking, speak]);


  return (
    <div className="container mx-auto max-w-7xl px-4 py-8 space-y-12">
      <header className="text-center">
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-primary">
          Welcome to {APP_NAME}!
        </h1>
        <p className="mt-4 text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto">
          Your AI-powered learning assistant. Explore tools designed to generate study materials, create custom assessments, and make learning more interactive and efficient.
        </p>
      </header>

      <Card className="bg-card/80 border-primary/30 shadow-xl backdrop-blur-sm">
        <CardHeader>
          <div className="flex items-center gap-3">
            <Brain className="h-7 w-7 text-primary" />
            <CardTitle className="text-2xl text-primary">Core Features Overview</CardTitle>
          </div>
          <CardDescription className="text-muted-foreground">
            {APP_NAME} offers a suite of AI-driven tools and resources to enhance your learning experience:
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="list-disc list-inside space-y-2 text-muted-foreground">
            {coreFeaturesListText.map((feature, index) => (
              <li key={index} className="text-sm md:text-base">{feature}</li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <div className="text-center">
         <Button size="lg" className="bg-accent hover:bg-accent/90 text-accent-foreground text-lg px-8 py-6 shadow-lg" asChild>
            <Link href="/notes">
                <Lightbulb className="mr-3 h-6 w-6" /> Start Generating Notes
            </Link>
        </Button>
      </div>


      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <section className="lg:col-span-1 space-y-6">
          <h2 className="text-2xl font-semibold text-primary mb-4">Key Tools</h2>
          {keyToolCards.map((tool) => {
            const Icon = tool.icon;
            return (
              <Link href={tool.href} key={tool.href} legacyBehavior>
                <a className="block">
                  <Card className="hover:bg-primary/10 hover:shadow-2xl transition-all duration-300 h-full flex flex-col group">
                    <CardHeader className="flex-row items-center gap-4 pb-3">
                      <Icon className="h-8 w-8 text-accent group-hover:text-primary transition-colors" />
                      <CardTitle className="text-xl text-foreground group-hover:text-primary transition-colors">{tool.title}</CardTitle>
                    </CardHeader>
                    <CardContent className="flex-grow">
                      <p className="text-sm text-muted-foreground">
                        {tool.description}
                      </p>
                    </CardContent>
                    <CardFooter>
                       <Button variant="ghost" className="w-full justify-start text-primary hover:text-primary/90 p-0">
                        Go to {tool.title.split(' ')[0]} <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </CardFooter>
                  </Card>
                </a>
              </Link>
            );
          })}
        </section>

        <section className="lg:col-span-2">
           <h2 className="text-2xl font-semibold text-primary mb-4">Explore More Features</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-2 gap-6"> {/* Adjusted for better fit with new cards */}
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
          </div>
        </section>
      </div>

      {/* Recent Topics Card */}
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
          <CardDescription>Quickly revisit topics you've generated notes for.</CardDescription>
        </CardHeader>
        <CardContent>
          {recentTopics.length > 0 ? (
            <ul className="space-y-2">
              {recentTopics.map((topic, index) => (
                <li key={index} className="flex justify-between items-center p-2 border rounded-md hover:bg-muted/50">
                  <button 
                    onClick={() => handleRecentTopicClick(topic)} 
                    className="truncate text-left hover:text-primary flex-grow"
                    title={`Revisit notes for: ${topic}`}
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
            <p className="text-sm text-muted-foreground">No recent topics found. Generate some notes to see them here!</p>
          )}
        </CardContent>
      </Card>
      
      {/* Your Activity Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl flex items-center gap-2">
            <Info className="h-5 w-5 text-primary" />
            Your Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            User accounts and detailed activity tracking (like test scores, generated material history) are not implemented in this version to maintain simplicity.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
