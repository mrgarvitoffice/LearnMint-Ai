
"use client";

import { useState, useEffect, useRef } from 'react';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import ReactMarkdown from 'react-markdown';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { generateStudyNotes, type GenerateStudyNotesOutput } from '@/ai/flows/generate-study-notes';
import { generateQuizFromNotes } from '@/ai/flows/generate-quiz-from-notes';
import { generateFlashcardsFromNotes } from '@/ai/flows/generate-flashcards-from-notes';
import type { GenerateQuizOutput } from '@/ai/flows/generate-quiz';
import type { GenerateFlashcardsOutput as GenerateFlashcardsOutputFromNotes } from '@/ai/flows/generate-flashcards';
import { Loader2, FileText, Search, Mic, PlayCircle, PauseCircle, StopCircle, HelpCircleIcon, ListChecksIcon, Download, Volume2 } from 'lucide-react';
import { useVoiceRecognition } from '@/hooks/useVoiceRecognition';
import { useTTS } from '@/hooks/useTTS';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import Link from 'next/link';
import { useSound } from '@/hooks/useSound';

const formSchema = z.object({
  topic: z.string().min(3, { message: 'Topic must be at least 3 characters long.' }),
});
type FormData = z.infer<typeof formSchema>;

const MAX_RECENT_TOPICS = 10;
const RECENT_TOPICS_LS_KEY = 'learnmint-recent-topics';
const PAGE_TITLE = "Generate Topper Notes";

export default function NotesPage() {
  const [notes, setNotes] = useState<GenerateStudyNotesOutput | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isGeneratingQuiz, setIsGeneratingQuiz] = useState(false);
  const [isGeneratingFlashcards, setIsGeneratingFlashcards] = useState(false);
  
  const [quizFromNotes, setQuizFromNotes] = useState<GenerateQuizOutput | null>(null);
  const [flashcardsFromNotes, setFlashcardsFromNotes] = useState<GenerateFlashcardsOutputFromNotes | null>(null);

  const { toast } = useToast();
  const { isListening, transcript, startListening, stopListening, browserSupportsSpeechRecognition, error: voiceError } = useVoiceRecognition();
  const { speak, cancel, isSpeaking: isTTSSpeaking, supportedVoices, selectedVoice, setSelectedVoiceURI, setVoicePreference } = useTTS();
  const { playSound: playClickSound } = useSound('/sounds/ting.mp3', 0.3);

  const pageTitleSpokenRef = useRef(false);
  const voicePreferenceWasSetRef = useRef(false);
  const generatingMessageSpokenRef = useRef(false);

  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(formSchema),
  });
  
  const topicValue = watch('topic');
  
  useEffect(() => {
    if (transcript) {
      setValue('topic', transcript);
    }
  }, [transcript, setValue]);

  useEffect(() => {
    if (supportedVoices.length > 0 && !voicePreferenceWasSetRef.current) {
      setVoicePreference('zia'); 
      voicePreferenceWasSetRef.current = true;
    }
  }, [supportedVoices, setVoicePreference]);

  useEffect(() => {
    if (selectedVoice && !isTTSSpeaking && !pageTitleSpokenRef.current && !isLoading && !notes) {
      speak(PAGE_TITLE);
      pageTitleSpokenRef.current = true;
    }
  }, [selectedVoice, isTTSSpeaking, speak, isLoading, notes]);

  useEffect(() => {
    if (isLoading && !generatingMessageSpokenRef.current && selectedVoice && !isTTSSpeaking) {
      speak("Generating study materials. Please wait.");
      generatingMessageSpokenRef.current = true;
    }
    if (!isLoading && generatingMessageSpokenRef.current) { 
      generatingMessageSpokenRef.current = false; 
    }
  }, [isLoading, selectedVoice, isTTSSpeaking, speak]);


  const onSubmit: SubmitHandler<FormData> = async (data) => {
    playClickSound();
    setIsLoading(true);
    setNotes(null);
    setQuizFromNotes(null); 
    setFlashcardsFromNotes(null); 
    
    if (selectedVoice && !isTTSSpeaking) {
      speak("Generating study materials. Please wait.");
    }

    try {
      const result = await generateStudyNotes({ topic: data.topic });
      setNotes(result);
      toast({ title: 'Notes Generated!', description: 'Study notes are ready.' });
      if (selectedVoice && !isTTSSpeaking) {
        speak("Notes ready!");
      }

      if (typeof window !== 'undefined') {
        const currentTopicsJSON = localStorage.getItem(RECENT_TOPICS_LS_KEY);
        let currentTopics: string[] = currentTopicsJSON ? JSON.parse(currentTopicsJSON) : [];
        currentTopics = [data.topic, ...currentTopics.filter(t => t !== data.topic)].slice(0, MAX_RECENT_TOPICS);
        localStorage.setItem(RECENT_TOPICS_LS_KEY, JSON.stringify(currentTopics));
      }

    } catch (error) {
      console.error('Error generating notes:', error);
      toast({ title: 'Error', description: 'Failed to generate notes. Please try again.', variant: 'destructive' });
      if (selectedVoice && !isTTSSpeaking) {
        speak("Sorry, there was an error generating notes.");
      }
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleSpeakNotes = () => {
    playClickSound();
    if (notes?.notes) {
      if (isTTSSpeaking) {
        cancel();
      } else {
        const notesForSpeech = notes.notes.replace(/\[VISUAL_PROMPT: ([^\]]+)\]/g, '(Visual aid for: $1)');
        speak(notesForSpeech);
      }
    }
  };

  const handleCancelSpeak = () => {
    playClickSound();
    cancel();
  }

  const renderMarkdownWithPlaceholders = (markdownText: string) => {
    const parts = markdownText.split(/(\[VISUAL_PROMPT: [^\]]+\])/g);
    return parts.map((part, index) => {
      const match = part.match(/\[VISUAL_PROMPT: ([^\]]+)\]/);
      if (match) {
        const query = match[1];
        return (
          <Link
            key={index}
            href={`https://www.google.com/search?tbm=isch&q=${encodeURIComponent(query)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 px-2 py-1 my-2 text-sm border rounded-md border-primary/50 bg-primary/10 text-primary hover:bg-primary/20"
            data-ai-hint={query.toLowerCase().split(' ').slice(0,2).join(' ')}
          >
            <Search className="w-3 h-3" />
            Visual for: {query}
          </Link>
        );
      }
      return <ReactMarkdown key={index} className="prose dark:prose-invert max-w-none">{part}</ReactMarkdown>;
    });
  };

  const handleDownloadNotes = () => {
    playClickSound();
    if (notes?.notes) {
      let plainText = notes.notes;
      plainText = plainText.replace(/\[VISUAL_PROMPT: [^\]]+\]/g, ''); 
      plainText = plainText.replace(/^#+\s*/gm, ''); 
      plainText = plainText.replace(/^[*-]\s*/gm, ''); 
      plainText = plainText.replace(/(\*\*|__)(.*?)\1/g, '$2'); 
      plainText = plainText.replace(/(\*|_)(.*?)\1/g, '$2'); 
      plainText = plainText.replace(/`([^`]+)`/g, '$1'); 

      const blob = new Blob([plainText], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${topicValue || 'study-notes'}.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast({ title: "Notes Downloaded!", description: "Plain text version saved."});
      if (selectedVoice && !isTTSSpeaking) {
        speak("Notes downloaded!");
      }
    }
  };

  const handleGenerateQuizFromNotes = async () => {
    playClickSound();
    if (!notes?.notes) return;
    setIsGeneratingQuiz(true);
     if (selectedVoice && !isTTSSpeaking) {
      speak("Generating quiz from notes. Please wait.");
    }
    try {
      const result = await generateQuizFromNotes({ notesContent: notes.notes, numQuestions: 30 });
      setQuizFromNotes(result); 
      console.log("Generated Quiz from Notes:", result);
      toast({ title: "Quiz Generated from Notes!", description: `${result.quiz.length} questions created.` });
      if (selectedVoice && !isTTSSpeaking) {
        speak("Quiz ready!");
      }
    } catch (error) {
      console.error("Error generating quiz from notes:", error);
      toast({ title: "Quiz Generation Error", description: "Failed to generate quiz from notes.", variant: "destructive" });
       if (selectedVoice && !isTTSSpeaking) {
        speak("Sorry, there was an error generating the quiz.");
      }
    } finally {
      setIsGeneratingQuiz(false);
    }
  };

  const handleGenerateFlashcardsFromNotes = async () => {
    playClickSound();
    if (!notes?.notes) return;
    setIsGeneratingFlashcards(true);
     if (selectedVoice && !isTTSSpeaking) {
      speak("Generating flashcards from notes. Please wait.");
    }
    try {
      const result = await generateFlashcardsFromNotes({ notesContent: notes.notes, numFlashcards: 20 });
      setFlashcardsFromNotes(result); 
      console.log("Generated Flashcards from Notes:", result);
      toast({ title: "Flashcards Generated from Notes!", description: `${result.flashcards.length} flashcards created.` });
      if (selectedVoice && !isTTSSpeaking) {
        speak("Flashcards ready!");
      }
    } catch (error) {
      console.error("Error generating flashcards from notes:", error);
      toast({ title: "Flashcard Generation Error", description: "Failed to generate flashcards from notes.", variant: "destructive" });
       if (selectedVoice && !isTTSSpeaking) {
        speak("Sorry, there was an error generating flashcards.");
      }
    } finally {
      setIsGeneratingFlashcards(false);
    }
  };

  const handleMicClick = () => {
    playClickSound();
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  return (
    <div className="container mx-auto max-w-4xl px-4 py-8 space-y-8">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-2xl md:text-3xl text-primary font-bold">
            <FileText className="w-7 h-7" />
            {PAGE_TITLE}
          </CardTitle>
          <CardDescription>Enter a topic to generate comprehensive study notes using AI.</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit(onSubmit)}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="topic">Topic</Label>
              <div className="flex gap-2">
                <Input
                  id="topic"
                  placeholder="e.g., Photosynthesis, The French Revolution, Quantum Physics"
                  {...register('topic')}
                  className={errors.topic ? 'border-destructive transition-colors duration-200 ease-in-out' : 'transition-colors duration-200 ease-in-out'}
                />
                {browserSupportsSpeechRecognition && (
                  <Button type="button" variant="outline" size="icon" onClick={handleMicClick} disabled={isLoading}>
                    <Mic className={`w-5 h-5 ${isListening ? 'text-destructive animate-pulse' : ''}`} />
                  </Button>
                )}
              </div>
              {errors.topic && <p className="text-sm text-destructive">{errors.topic.message}</p>}
              {voiceError && <p className="text-sm text-destructive">Voice input error: {voiceError}</p>}
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Generate Notes
            </Button>
          </CardFooter>
        </form>
      </Card>

      {isLoading && (
         <div className="flex justify-center items-center py-10">
            <Loader2 className="w-12 h-12 animate-spin text-primary" />
            <p className="ml-4 text-lg text-muted-foreground">Generating your notes...</p>
        </div>
      )}

      {notes && !isLoading && (
        <Card>
          <CardHeader className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <CardTitle className="text-xl font-semibold text-primary">Generated Study Notes for: {topicValue}</CardTitle>
              <CardDescription>Review your notes below. Use the controls to listen or download.</CardDescription>
            </div>
            <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
               <Select onValueChange={(value) => { playClickSound(); setVoicePreference(value as 'male' | 'female' | 'kai' | 'zia'); }} defaultValue={selectedVoice?.name.toLowerCase().includes('zia') ? 'zia' : selectedVoice?.name.toLowerCase().includes('kai') ? 'kai' : selectedVoice?.name.toLowerCase().includes('female') ? 'female' : 'male'}>
                <SelectTrigger className="w-full sm:w-[150px] text-xs">
                  <SelectValue placeholder="Voice Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="female">Female (Default)</SelectItem>
                  <SelectItem value="male">Male (Default)</SelectItem>
                  <SelectItem value="zia">Zia (Female)</SelectItem>
                  <SelectItem value="kai">Kai (Male)</SelectItem>
                </SelectContent>
              </Select>
              <Select onValueChange={(uri) => {playClickSound(); setSelectedVoiceURI(uri);}} value={selectedVoice?.voiceURI}>
                <SelectTrigger className="w-full sm:w-[180px] text-xs">
                  <SelectValue placeholder="Select Voice Engine" />
                </SelectTrigger>
                <SelectContent>
                  {supportedVoices.length > 0 ? supportedVoices.map(voice => (
                    <SelectItem key={voice.voiceURI} value={voice.voiceURI} className="text-xs">
                      {voice.name} ({voice.lang})
                    </SelectItem>
                  )) : <SelectItem value="no-voices" disabled className="text-xs">No voices available</SelectItem>}
                </SelectContent>
              </Select>
              <Button variant="outline" size="icon" onClick={handleSpeakNotes} disabled={!notes?.notes || (isTTSSpeaking && !(typeof window !== 'undefined' && window.speechSynthesis && window.speechSynthesis.paused))} title={isTTSSpeaking && !(typeof window !== 'undefined' && window.speechSynthesis && window.speechSynthesis.paused) ? "Pause Notes" : "Play Notes"}>
                 {isTTSSpeaking && !(typeof window !== 'undefined' && window.speechSynthesis && window.speechSynthesis.paused) ? <PauseCircle className="w-5 h-5" /> : <PlayCircle className="w-5 h-5" />}
              </Button>
              {isTTSSpeaking && (
                <Button variant="outline" size="icon" onClick={handleCancelSpeak} title="Stop Speaking">
                  <StopCircle className="w-5 h-5" />
                </Button>
              )}
               <Button variant="outline" size="icon" onClick={handleDownloadNotes} title="Download Notes">
                <Download className="w-5 h-5" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="prose dark:prose-invert max-w-none">
            {renderMarkdownWithPlaceholders(notes.notes)}
          </CardContent>
          <CardFooter className="flex flex-col sm:flex-row gap-2 pt-4 border-t mt-4">
            <Button 
              onClick={handleGenerateQuizFromNotes} 
              disabled={isGeneratingQuiz || !notes?.notes}
              className="w-full sm:w-auto"
            >
              {isGeneratingQuiz ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <HelpCircleIcon className="w-4 h-4 mr-2"/>}
              Generate 30-Question Quiz
            </Button>
            <Button 
              onClick={handleGenerateFlashcardsFromNotes} 
              disabled={isGeneratingFlashcards || !notes?.notes}
              className="w-full sm:w-auto"
            >
              {isGeneratingFlashcards ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <ListChecksIcon className="w-4 h-4 mr-2"/>}
              Generate 20 Flashcards
            </Button>
          </CardFooter>
        </Card>
      )}
    </div>
  );
}
