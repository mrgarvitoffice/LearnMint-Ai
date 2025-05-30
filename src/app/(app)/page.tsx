
"use client";

import { useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { NAV_ITEMS, APP_NAME } from "@/lib/constants";
import { ArrowRight, Lightbulb, FileText, TestTubeDiagonal, HelpCircle, ListChecks, Calculator, Bot, Newspaper, BookMarked, Gamepad2 } from "lucide-react";
import Link from "next/link";
import { useSound } from '@/hooks/useSound';

const coreFeaturesList = [
  "AI Content Generation: Create comprehensive study notes, multiple-choice quizzes, and flashcards for any topic using AI (powered by Genkit and Google AI).",
  "Custom Test Creation: Build tests based on specific topics (single or multiple recent), difficulty levels, number of questions, optional custom notes, and timer settings.",
  "Interactive AI Chatbot (Megumin): Engage with \"Megumin,\" a witty AI assistant, for small talk, questions, and even \"singing\" (text-based). Supports voice input and user image uploads.",
  "Scientific Calculator & Unit Converter: Perform basic and scientific calculations. Includes a Unit Converter (Length, Temperature, Weight/Mass, Volume, Area, Speed) and a history of the last 3 calculations.",
  "Daily News Digest: Browse news articles filtered by country, state/region (text input), city (text input), and general categories, powered by Newsdata.io.",
  "Resource Library: Explore a sample catalog of OpenStax textbooks, search Google Books & YouTube (redirects), and view a \"Math Fact of the Day\".",
  "Educational Game: Play \"Word Game\" (a definition/term guessing game with hints and streak scoring). Placeholders for \"Dino Runner\"",
  "Theme Toggle: Switch between light and dark modes.",
  "Responsive UI: Designed to adapt to various screen sizes, including mobile (with drawer navigation).",
  "Auditory Feedback: Click sounds and vocal announcements for a more engaging experience.",
];

const keyTools = [
  { title: "Generate Study Notes", href: "/notes", description: "Craft comprehensive notes on any subject with AI assistance.", icon: FileText },
  { title: "Custom Test Creator", href: "/custom-test", description: "Design personalized tests from topics or your own notes.", icon: TestTubeDiagonal },
];

// Filter out Dashboard, parent AI Tools, and already listed keyTools for "Explore More"
const otherFeaturesRaw = NAV_ITEMS.flatMap(item =>
  item.title === 'AI Tools' && item.children ? 
  item.children.map(child => ({ ...child, parentIcon: item.icon })) : 
  (item.href !== '/' && item.href !== '#' ? [{ ...item, parentIcon: item.icon }] : [])
).filter(item => 
  !keyTools.find(kt => kt.title === item.title) && 
  item.title !== 'Dashboard' // Explicitly remove Dashboard from here
);

// Deduplicate based on href, preferring items that might have specific icons if NavItem structure varies
const uniqueOtherFeaturesMap = new Map();
otherFeaturesRaw.forEach(item => {
  if (!uniqueOtherFeaturesMap.has(item.href)) {
    uniqueOtherFeaturesMap.set(item.href, item);
  }
});
const otherFeatures = Array.from(uniqueOtherFeaturesMap.values());


export default function DashboardPage() {
  const { playSound: playWelcomeSound } = useSound('/sounds/welcome-learnmint.mp3', 0.6);

  useEffect(() => {
    // Play welcome sound once when the component mounts
    playWelcomeSound();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty dependency array ensures this runs only once

  return (
    <div className="container mx-auto py-8 px-4 md:px-6 space-y-12">
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
            <Lightbulb className="h-7 w-7 text-primary" />
            <CardTitle className="text-2xl text-primary">Core Features Overview</CardTitle>
          </div>
          <CardDescription className="text-muted-foreground">
            {APP_NAME} offers a suite of AI-driven tools and resources to enhance your learning experience:
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="list-disc list-inside space-y-2 text-muted-foreground">
            {coreFeaturesList.map((feature, index) => (
              <li key={index} className="text-sm md:text-base">{feature}</li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Key Tools - Top Left */}
        <section className="lg:col-span-1 space-y-6">
          <h2 className="text-2xl font-semibold text-primary mb-4">Key Tools</h2>
          {keyTools.map((tool) => {
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

        {/* Explore More Features - Top Right / "Slidebar" content */}
        <section className="lg:col-span-2">
           <h2 className="text-2xl font-semibold text-primary mb-4">Explore More Features</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
            {otherFeatures.map((item) => {
              if (!item.icon) return null; // Should not happen with current NAV_ITEMS structure but good for safety
              const Icon = item.icon;
              return (
                <Link href={item.href} key={item.href} legacyBehavior>
                  <a className="block h-full">
                    <Card className="hover:bg-accent/10 hover:shadow-xl transition-all duration-300 h-full flex flex-col justify-between group">
                      <CardHeader className="flex-row items-center gap-3 space-y-0 pb-2 pt-4">
                        <Icon className="h-5 w-5 text-muted-foreground group-hover:text-accent transition-colors" />
                        <CardTitle className="text-base font-medium text-foreground group-hover:text-accent transition-colors">{item.title}</CardTitle>
                      </CardHeader>
                      <CardContent className="pt-1 pb-3">
                         <Button variant="link" className="p-0 h-auto text-xs text-accent hover:text-accent/80">
                          Open {item.title.split(' ')[0]} <ArrowRight className="ml-1 h-3 w-3" />
                        </Button>
                      </CardContent>
                    </Card>
                  </a>
                </Link>
              );
            })}
          </div>
        </section>
      </div>
    </div>
  );
}
