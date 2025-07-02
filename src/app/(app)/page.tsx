
"use client";

import { useEffect, useState, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { APP_NAME } from "@/lib/constants"; // App name constant
import { ArrowRight, Brain, TestTubeDiagonal, FileText, HelpCircle, ListChecks, Calculator as CalculatorIcon, Bot, Newspaper, BookMarked, Gamepad2, Trash2, Sparkles, Quote } from "lucide-react";
import Link from "next/link";
import { useTTS } from '@/hooks/useTTS'; // Text-to-speech hook
import { useSound } from '@/hooks/useSound'; // Sound effects hook
import { useRouter } from 'next/navigation'; // For navigation
import InteractiveCharacterElement from '@/components/features/InteractiveCharacterElement'; // Fun interactive element
import { useAuth } from '@/contexts/AuthContext'; // Authentication context
import { Logo } from '@/components/icons/Logo'; // Import the Logo component
import { cn } from '@/lib/utils';

// Constants for localStorage and display limits
const RECENT_TOPICS_LS_KEY = 'learnmint-recent-topics';
const MAX_RECENT_TOPICS_DISPLAY = 5;
const PAGE_TITLE = `Welcome to ${APP_NAME}`; // Static page title, always "Welcome to LearnMint"

// List of core features to display on the dashboard
const coreFeaturesListText = [
  "<strong>AI Content Generation:</strong> Quickly create notes, quizzes, & flashcards.",
  "<strong>Custom Test Creation:</strong> Design tests with specific topics, difficulty, and timers.",
  "<strong>Interactive AI Chatbot (Kazuma):</strong> Chat with our witty AI for questions or fun. Voice input supported.",
  "<strong>Scientific Calculator & Unit Converter:</strong> For calculations and unit conversions.",
  "<strong>Daily News Digest:</strong> Stay updated with news, filterable by country and category.",
  "<strong>Resource Library:</strong> Access OpenStax samples, search books/videos, and get Math Facts.",
  "<strong>Educational Game:</strong> Play 'Word Game' (Definition Challenge). More games coming!",
];

// Configuration for "Explore More Features" cards
const exploreFeaturesCards = [
  { title: "AI Note Generator", href: "/notes", icon: FileText, description: "Craft comprehensive notes on any subject." },
  { title: "Custom Test Creator", href: "/custom-test", icon: TestTubeDiagonal, description: "Design personalized tests." },
  { title: "AI Quiz Creator", href: "/quiz", icon: HelpCircle, description: "Generate interactive quizzes." },
  { title: "AI Flashcards", href: "/flashcards", icon: ListChecks, description: "Quickly create flashcards." },
  { title: "AI Chatbot (Kazuma)", href: "/chatbot", icon: Bot, description: "Chat with our witty AI." },
  { title: "Calculator & Converter", href: "/calculator", icon: CalculatorIcon, description: "Solve equations & convert." },
  { title: "Daily News Digest", href: "/news", icon: Newspaper, description: "Stay updated with news." },
  { title: "LearnMint Arcade", href: "/arcade", icon: Gamepad2, description: "Play educational games." },
  { title: "Resource Library", href: "/library", icon: BookMarked, description: "Explore learning resources." },
];

// Array of motivational quotes to display randomly
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


/**
 * DashboardPage Component
 *
 * This is the main landing page after a user logs in (or accesses as a guest).
 * It provides an overview of LearnMint's features, quick links, and recent activity.
 */
export default function DashboardPage() {
  // Hooks for text-to-speech, sound effects, navigation, and authentication
  const { speak, isSpeaking, isPaused, supportedVoices, setVoicePreference, selectedVoice } = useTTS();
  const { playSound: playClickSound } = useSound('/sounds/ting.mp3', 0.3);
  const router = useRouter();
  const { user } = useAuth(); // Get current user from AuthContext

  // State for storing recent topics and the daily motivational quote
  const [recentTopics, setRecentTopics] = useState<string[]>([]);
  const [dailyQuote, setDailyQuote] = useState<{ quote: string; author: string } | null>(null);
  const [liveUserCount, setLiveUserCount] = useState(137);

  // Refs to track if initial page announcements have been made
  const pageTitleSpokenRef = useRef(false);
  const voicePreferenceWasSetRef = useRef(false);

  // Effect to set a random motivational quote and load recent topics from localStorage
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
          localStorage.removeItem(RECENT_TOPICS_LS_KEY); // Clear invalid data
        }
      }
    }
  }, []);

  // Effect for the simulated live user counter.
  useEffect(() => {
    // This effect runs only on the client after hydration
    // to avoid server-client mismatch errors with Math.random().
    const interval = setInterval(() => {
      setLiveUserCount(prevCount => {
        const fluctuation = Math.floor(Math.random() * 5) - 2; // Fluctuate by -2, -1, 0, 1, 2
        const newCount = prevCount + fluctuation;
        // Ensure the count stays above a reasonable base number
        return newCount > 100 ? newCount : 100;
      });
    }, 2500); // Update every 2.5 seconds

    return () => clearInterval(interval); // Cleanup on unmount
  }, []); // Empty dependency array ensures this runs once on mount

  // Effect to set the preferred voice for TTS announcements once voices are loaded
  useEffect(() => {
    if (supportedVoices.length > 0 && !voicePreferenceWasSetRef.current) {
      setVoicePreference('luma'); // Default to 'luma' voice for dashboard announcements
      voicePreferenceWasSetRef.current = true;
    }
  }, [supportedVoices, setVoicePreference]);

  // Effect to speak the page title once the selected voice is ready and conditions are met
  useEffect(() => {
    let isMounted = true; // Prevent state updates on unmounted component
    if (isMounted && selectedVoice && !isSpeaking && !isPaused && !pageTitleSpokenRef.current) {
      speak(PAGE_TITLE);
      pageTitleSpokenRef.current = true;
    }
    return () => {
      isMounted = false;
    };
  }, [selectedVoice, isSpeaking, isPaused, speak]);


  /**
   * Handles removing a specific topic from the recent topics list.
   * @param topicToRemove - The topic string to remove.
   */
  const handleRemoveTopic = (topicToRemove: string) => {
    playClickSound();
    const updatedTopics = recentTopics.filter(topic => topic !== topicToRemove);
    setRecentTopics(updatedTopics);
    if (typeof window !== 'undefined') {
      localStorage.setItem(RECENT_TOPICS_LS_KEY, JSON.stringify(updatedTopics));
    }
  };

  /**
   * Clears all topics from the recent topics list and localStorage.
   */
  const handleClearAllTopics = () => {
    playClickSound();
    setRecentTopics([]);
    if (typeof window !== 'undefined') {
      localStorage.removeItem(RECENT_TOPICS_LS_KEY);
    }
  };

  /**
   * Navigates to the study page for a given recent topic.
   * This will now always trigger a fresh generation/fetch on the /study page.
   * @param topic - The topic to navigate to.
   */
  const handleRecentTopicClick = (topic: string) => {
    playClickSound();
    // Navigate to the /study page with the selected topic as a query parameter.
    // The /study page will handle fetching/generating all materials.
    router.push(`/study?topic=${encodeURIComponent(topic)}`);
  }

  return (
    <div className="container mx-auto max-w-7xl px-4 py-8 space-y-10">
      {/* Page Header */}
      <header className="text-center relative">
        <div className="mb-4 flex justify-center">
          <Logo size={64} /> {/* Added Logo component here */}
        </div>
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-primary">
          {PAGE_TITLE}
        </h1>
        <p className="mt-4 text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto">
          Your AI-powered learning assistant for notes, quizzes, tests, and more.
        </p>

        {/* Live User Counter */}
        <div className="mt-6 flex items-center justify-center gap-2 text-sm text-green-400 dark:text-green-300">
          <div className="relative flex h-3 w-3">
            <div className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></div>
            <div className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></div>
          </div>
          <span className="font-semibold">{liveUserCount}</span>
          <span>Learners Online</span>
        </div>
        
        {/* Interactive mascot element, hidden on small screens */}
        <div className="absolute top-0 right-0 -mr-4 -mt-4 opacity-75 hover:opacity-100 transition-opacity hidden sm:block">
          <InteractiveCharacterElement
            characterName="LearnMint Mascot"
            Icon={Sparkles} // Uses Sparkles icon
            containerClassName="p-2"
            dataAiHint="mascot sparkle" // For potential AI image replacement tools
          />
        </div>
      </header>

      {/* Core Features Overview Card */}
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
              // Use dangerouslySetInnerHTML to render HTML strong tags within the feature text
              <li key={index} className="text-sm md:text-base" dangerouslySetInnerHTML={{ __html: feature }} />
            ))}
          </ul>
        </CardContent>
      </Card>

      {/* Call to Action Button */}
      <div className="text-center">
         <Button size="lg" className="bg-accent hover:bg-accent/90 text-accent-foreground text-lg px-8 py-6 shadow-lg group" asChild>
            <Link href="/notes">
                <Sparkles className="mr-3 h-6 w-6 transition-transform duration-300 group-hover:rotate-[360deg] group-hover:scale-125" /> Start Generating Materials
            </Link>
        </Button>
      </div>

      {/* Explore More Features Section */}
      <section>
         <h2 className="text-2xl font-semibold text-primary mb-6 text-center sm:text-left">Explore More Features</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {/* Map through defined features and create interactive cards */}
          {exploreFeaturesCards.map((item) => {
            const Icon = item.icon; // Dynamically get the Lucide icon component
            return (
              <Link href={item.href} key={item.href} legacyBehavior>
                <a className="block h-full group"> {/* Anchor tag for navigation, added group class */}
                  <Card className={cn(
                      "hover:bg-accent/10 hover:shadow-xl transition-all duration-300 h-full flex flex-col justify-between",
                      "group-hover:ring-2 group-hover:ring-primary/30 dark:group-hover:ring-primary/50" // Added ring hover effect
                    )}>
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
          {/* Display the daily motivational quote */}
           {dailyQuote && (
            <Card className={cn(
                "bg-secondary/30 border-secondary/50 hover:shadow-xl transition-shadow duration-300 h-full flex flex-col justify-between group",
                "group-hover:ring-2 group-hover:ring-primary/30 dark:group-hover:ring-primary/50" // Added ring hover effect
              )}>
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

      {/* Recent Topics Section */}
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
                  {/* Button to navigate to study page for the topic */}
                  <button
                    onClick={() => handleRecentTopicClick(topic)}
                    className="truncate text-left hover:text-primary flex-grow"
                    title={`Generate/view study materials for: ${topic}`}
                  >
                    {topic}
                  </button>
                  {/* Button to remove the topic from recent list */}
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

      {/* Footer attribution */}
      <div className="text-center text-sm text-muted-foreground mt-12 py-4 border-t border-border/50">
        Made with <Sparkles className="inline-block h-4 w-4 text-accent" /> by MrGarvit
      </div>
    </div>
  );
}
