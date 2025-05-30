
"use client";

import { useState, useEffect, useCallback, useRef } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from '@/components/ui/skeleton';
import { GraduationCap, Mic, Sparkles, Loader2, BookOpenText, HelpCircle, ListChecks, Download, Volume2, PlayCircle, PauseCircle, StopCircle, AlertTriangle } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

import { useVoiceRecognition } from '@/hooks/useVoiceRecognition';
import { useTTS } from '@/hooks/useTTS';
import { useSound } from '@/hooks/useSound';
import { useToast } from '@/hooks/use-toast';

import { generateStudyNotes, type GenerateStudyNotesInput, type GenerateStudyNotesOutput } from '@/ai/flows/generate-study-notes';
import { generateQuizFromNotes, type GenerateQuizFromNotesInput } from '@/ai/flows/generate-quiz-from-notes';
import type { GenerateQuizOutput } from '@/ai/flows/generate-quiz'; // Using the shared output type
import { generateFlashcardsFromNotes, type GenerateFlashcardsFromNotesInput } from '@/ai/flows/generate-flashcards-from-notes';
import type { GenerateFlashcardsOutput } from '@/ai/flows/generate-flashcards'; // Using the shared output type

const PAGE_TITLE = "Generate Topper Notes";
const LOCAL_STORAGE_RECENT_TOPICS_KEY = "recentLearnMintTopics";

interface AiGeneratedImageProps {
  promptText: string;
}

function AiGeneratedImage({ promptText }: AiGeneratedImageProps) {
  const googleImagesUrl = `https://www.google.com/search?tbm=isch&q=${encodeURIComponent(promptText)}`;
  const placeholderUrl = `https://placehold.co/600x400.png?text=${encodeURIComponent(promptText.substring(0,30))}`;
  return (
    <div className="my-4 p-4 border rounded-lg bg-muted/30 text-center">
      <p className="text-sm text-muted-foreground mb-2">Visual Prompt:</p>
      <p className="font-semibold mb-3">{promptText}</p>
      <div className="aspect-video bg-muted rounded overflow-hidden flex items-center justify-center mb-3">
        <img 
            src={placeholderUrl} 
            alt={`Placeholder for: ${promptText}`} 
            className="max-w-full max-h-full object-contain"
            data-ai-hint={promptText.toLowerCase().split(" ").slice(0,2).join(" ")}
        />
      </div>
      <Button variant="outline" size="sm" asChild>
        <a href={googleImagesUrl} target="_blank" rel="noopener noreferrer">
          Search on Google Images <Sparkles className="ml-2 h-4 w-4" />
        </a>
      </Button>
    </div>
  );
}

export default function NotesPage() {
  const [topic, setTopic] = useState<string>("");
  const [isLoadingNotes, setIsLoadingNotes] = useState<boolean>(false);
  const [errorNotes, setErrorNotes] = useState<string | null>(null);
  const [generatedNotesContent, setGeneratedNotesContent] = useState<string | null>(null);

  const [isLoadingQuizFromNotes, setIsLoadingQuizFromNotes] = useState<boolean>(false);
  const [generatedQuizData, setGeneratedQuizData] = useState<GenerateQuizOutput['quiz'] | null>(null);
  const [errorQuizFromNotes, setErrorQuizFromNotes] = useState<string | null>(null);

  const [isLoadingFlashcardsFromNotes, setIsLoadingFlashcardsFromNotes] = useState<boolean>(false);
  const [generatedFlashcardsData, setGeneratedFlashcardsData] = useState<GenerateFlashcardsOutput['flashcards'] | null>(null);
  const [errorFlashcardsFromNotes, setErrorFlashcardsFromNotes] = useState<string | null>(null);
  
  const [activeTab, setActiveTab] = useState<string>("notes");


  const pageTitleSpokenRef = useRef(false);
  const voicePreferenceWasSetRef = useRef(false);
  const generatingNotesSpokenRef = useRef(false);
  const notesReadySpokenRef = useRef(false);
  const notesContentRef = useRef<HTMLDivElement>(null); // For TTS content

  const { toast } = useToast();
  const { playSound: playClickSound } = useSound('/sounds/ting.mp3');
  const { 
    speak, 
    cancel: cancelTTS, 
    isSpeaking: isTTSSpeaking, 
    selectedVoice, 
    setSelectedVoiceURI,
    setVoicePreference, 
    supportedVoices 
  } = useTTS();

  const {
    isListening,
    transcript,
    startListening,
    stopListening,
    browserSupportsSpeechRecognition: hasRecognitionSupport,
    error: voiceError,
  } = useVoiceRecognition();

  // Effect to set default TTS voice preference
  useEffect(() => {
    if (supportedVoices.length > 0 && !voicePreferenceWasSetRef.current) {
      setVoicePreference('zia'); 
      voicePreferenceWasSetRef.current = true;
    }
  }, [supportedVoices, setVoicePreference]);

  // Effect to speak page title
  useEffect(() => {
    if (selectedVoice && !isTTSSpeaking && !pageTitleSpokenRef.current && !isLoadingNotes && !generatedNotesContent) {
      speak(PAGE_TITLE);
      pageTitleSpokenRef.current = true;
    }
  }, [selectedVoice, isTTSSpeaking, speak, isLoadingNotes, generatedNotesContent]);

  // Effect to update topic from voice transcript
  useEffect(() => {
    if (transcript) {
      setTopic(transcript);
    }
  }, [transcript]);

  // Effect to show voice recognition errors
  useEffect(() => {
    if (voiceError) {
      toast({ title: "Voice Error", description: voiceError, variant: "destructive" });
      setErrorNotes(`Voice input error: ${voiceError}`);
    }
  }, [voiceError, toast]);

  const handleVoiceCommand = useCallback(() => {
    playClickSound();
    if (isListening) {
      stopListening();
    } else {
      setTopic(""); 
      startListening();
    }
  }, [isListening, startListening, stopListening, playClickSound]);

  const handleGenerateNotes = useCallback(async () => {
    playClickSound();
    if (topic.trim().length < 3) {
      setErrorNotes("Please enter a topic with at least 3 characters.");
      toast({ title: "Invalid Topic", description: "Topic must be at least 3 characters long.", variant: "destructive" });
      return;
    }
    setErrorNotes(null);
    setGeneratedNotesContent(null);
    setGeneratedQuizData(null);
    setGeneratedFlashcardsData(null);
    setIsLoadingNotes(true);
    generatingNotesSpokenRef.current = false;
    notesReadySpokenRef.current = false;

    if (selectedVoice && !isTTSSpeaking && !generatingNotesSpokenRef.current) {
      speak("Generating study materials, please wait.");
      generatingNotesSpokenRef.current = true;
    }

    try {
      const result = await generateStudyNotes({ topic: topic.trim() });
      if (result && result.notes) {
        setGeneratedNotesContent(result.notes);
        setActiveTab("notes"); // Switch to notes tab
        if (selectedVoice && !isTTSSpeaking && !notesReadySpokenRef.current) {
          speak("Notes ready!");
          notesReadySpokenRef.current = true;
        }
        toast({ title: "Notes Generated!", description: "Your study notes are ready." });

        // Save to recent topics
        try {
          const storedTopics = localStorage.getItem(LOCAL_STORAGE_RECENT_TOPICS_KEY);
          let recentTopicsArray: string[] = storedTopics ? JSON.parse(storedTopics) : [];
          const trimmedTopic = topic.trim();
          if (!recentTopicsArray.includes(trimmedTopic)) {
            recentTopicsArray.unshift(trimmedTopic);
            recentTopicsArray = recentTopicsArray.slice(0, 10); // Keep last 10
            localStorage.setItem(LOCAL_STORAGE_RECENT_TOPICS_KEY, JSON.stringify(recentTopicsArray));
          }
        } catch (e) {
          console.error("Failed to save recent topic to localStorage", e);
        }
      } else {
        throw new Error("AI returned empty or invalid notes data.");
      }
    } catch (err: any) {
      console.error("Error generating notes:", err);
      const errorMessage = err.message || "Failed to generate notes. Please try again.";
      setErrorNotes(errorMessage);
      toast({ title: "Notes Generation Error", description: errorMessage, variant: "destructive" });
      if(selectedVoice && !isTTSSpeaking) speak("Sorry, there was an error generating notes.");
    } finally {
      setIsLoadingNotes(false);
      generatingNotesSpokenRef.current = false; 
    }
  }, [topic, toast, playClickSound, speak, selectedVoice, isTTSSpeaking]);

  const handleGenerateQuizFromNotes = async () => {
    playClickSound();
    if (!generatedNotesContent) {
        toast({ title: "No Notes", description: "Please generate notes first to create a quiz from them.", variant: "destructive"});
        return;
    }
    setIsLoadingQuizFromNotes(true);
    setErrorQuizFromNotes(null);
    setGeneratedQuizData(null);
    if(selectedVoice && !isTTSSpeaking) speak("Generating quiz from notes...");

    try {
        const input: GenerateQuizFromNotesInput = { notesContent: generatedNotesContent, numQuestions: 30 };
        const result = await generateQuizFromNotes(input);
        setGeneratedQuizData(result.quiz);
        setActiveTab("quiz");
        toast({ title: "Quiz Generated!", description: "Quiz based on your notes is ready." });
        if(selectedVoice && !isTTSSpeaking) speak("Quiz from notes is ready!");
    } catch (err: any) {
        const errorMessage = err.message || "Failed to generate quiz from notes.";
        setErrorQuizFromNotes(errorMessage);
        toast({ title: "Quiz Generation Error", description: errorMessage, variant: "destructive" });
        if(selectedVoice && !isTTSSpeaking) speak("Sorry, there was an error generating the quiz.");
    } finally {
        setIsLoadingQuizFromNotes(false);
    }
  };

  const handleGenerateFlashcardsFromNotes = async () => {
    playClickSound();
    if (!generatedNotesContent) {
        toast({ title: "No Notes", description: "Please generate notes first to create flashcards from them.", variant: "destructive"});
        return;
    }
    setIsLoadingFlashcardsFromNotes(true);
    setErrorFlashcardsFromNotes(null);
    setGeneratedFlashcardsData(null);
    if(selectedVoice && !isTTSSpeaking) speak("Generating flashcards from notes...");
    
    try {
        const input: GenerateFlashcardsFromNotesInput = { notesContent: generatedNotesContent, numFlashcards: 20 };
        const result = await generateFlashcardsFromNotes(input);
        setGeneratedFlashcardsData(result.flashcards);
        setActiveTab("flashcards");
        toast({ title: "Flashcards Generated!", description: "Flashcards based on your notes are ready." });
        if(selectedVoice && !isTTSSpeaking) speak("Flashcards from notes are ready!");
    } catch (err: any) {
        const errorMessage = err.message || "Failed to generate flashcards from notes.";
        setErrorFlashcardsFromNotes(errorMessage);
        toast({ title: "Flashcard Generation Error", description: errorMessage, variant: "destructive" });
        if(selectedVoice && !isTTSSpeaking) speak("Sorry, there was an error generating flashcards.");
    } finally {
        setIsLoadingFlashcardsFromNotes(false);
    }
  };
  
  const renderMarkdownWithPlaceholders = (markdownContent: string) => {
    const parts = markdownContent.split(/(\[VISUAL_PROMPT:[^\]]+\])/g);
    return parts.map((part, index) => {
      if (part.startsWith('[VISUAL_PROMPT:')) {
        const promptText = part.substring('[VISUAL_PROMPT:'.length, part.length - 1);
        return <AiGeneratedImage key={`vis-${index}`} promptText={promptText} />;
      }
      return <ReactMarkdown key={`md-${index}`} remarkPlugins={[remarkGfm]} className="prose prose-sm sm:prose-base dark:prose-invert max-w-none break-words">{part}</ReactMarkdown>;
    });
  };

  const handleDownloadNotes = () => {
    playClickSound();
    if (!generatedNotesContent) {
      toast({ title: "No Notes", description: "Nothing to download.", variant: "destructive" });
      return;
    }
    const plainText = generatedNotesContent
      .replace(/\[VISUAL_PROMPT:[^\]]+\]/g, '') 
      .replace(/#{1,6}\s?/g, '')       
      .replace(/(\*\*|__)(.*?)\1/g, '$2') 
      .replace(/(\*|_)(.*?)\1/g, '$2')   
      .replace(/`{1,3}(.*?)`{1,3}/g, '$1') 
      .replace(/~(\~(.*?)\~)~/g, '$2')  
      .replace(/^>\s?/gm, '')           
      .replace(/!\[.*?\]\(.*?\)/g, '')  
      .replace(/\[.*?\]\(.*?\)/g, ''); 

    const blob = new Blob([plainText], { type: 'text/plain;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `${topic.replace(/\s+/g, '_')}_notes.txt`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast({ title: "Notes Downloaded", description: "Notes saved as a .txt file." });
    if(selectedVoice && !isTTSSpeaking) speak("Notes downloaded!");
  };

  const [speechState, setSpeechState] = useState<'idle' | 'playing' | 'paused'>('idle');

  const handleSpeakNotes = () => {
    playClickSound();
    if (!generatedNotesContent) return;

    if (speechState === 'playing') {
        cancelTTS();
        setSpeechState('paused');
    } else if (speechState === 'paused') {
        if (typeof window !== 'undefined' && window.speechSynthesis) {
            window.speechSynthesis.resume();
            setSpeechState('playing');
        }
    } else { // 'idle'
        const textToSpeak = notesContentRef.current?.innerText || generatedNotesContent;
        speak(textToSpeak);
        setSpeechState('playing');
    }
  };

  const handleStopSpeakNotes = () => {
    playClickSound();
    cancelTTS();
    setSpeechState('idle');
  };

  useEffect(() => {
    // Update speechState if TTS finishes naturally or is cancelled by another source
    if (!isTTSSpeaking && speechState === 'playing') {
        setSpeechState('idle');
    }
  }, [isTTSSpeaking, speechState]);


  return (
    <div className="container mx-auto max-w-4xl px-4 py-8 space-y-8">
      <Card className="w-full shadow-xl">
        <CardHeader>
          <div className="flex items-center justify-center mb-4">
            <GraduationCap className="h-10 w-10 text-primary" />
          </div>
          <CardTitle className="text-center text-2xl sm:text-3xl font-bold text-primary">{PAGE_TITLE}</CardTitle>
          <CardDescription className="text-center text-sm sm:text-base text-muted-foreground">
            Enter an academic topic. LearnMint AI will generate notes, and then you can create quizzes and flashcards.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6 p-6">
          <div className="relative">
            <Input
              id="topicInput"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="e.g., Quantum Physics, Cell Biology"
              className="text-base sm:text-lg py-3 px-4 pr-12 transition-colors duration-200 ease-in-out"
              aria-label="Study Topic"
              onKeyDown={(e) => e.key === 'Enter' && !isLoadingNotes && topic.trim().length >=3 && handleGenerateNotes()}
            />
            {hasRecognitionSupport && (
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8"
                onClick={handleVoiceCommand}
                disabled={isLoadingNotes || isListening}
                aria-label="Use Voice Input"
                title="Use Voice Input"
              >
                <Mic className={`h-5 w-5 ${isListening ? 'text-destructive animate-pulse' : 'text-muted-foreground hover:text-primary'}`} />
              </Button>
            )}
          </div>
          {errorNotes && <Alert variant="destructive" className="mt-4"><AlertTriangle className="h-4 w-4"/><AlertTitle>Error</AlertTitle><AlertDescription>{errorNotes}</AlertDescription></Alert>}
          <Button
            onClick={handleGenerateNotes}
            disabled={isLoadingNotes || topic.trim().length < 3}
            className="w-full text-base sm:text-lg py-3 group bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 text-primary-foreground shadow-lg transition-all duration-300 ease-in-out hover:shadow-primary/50 active:scale-95"
            size="lg"
          >
            {isLoadingNotes ? (
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            ) : (
              <Sparkles className="mr-2 h-5 w-5 transition-transform duration-300 group-hover:rotate-[360deg] group-hover:scale-125" />
            )}
            {isLoadingNotes ? "Generating Notes..." : "Get Topper Notes"}
          </Button>
        </CardContent>
      </Card>

      {isLoadingNotes && (
        <Card>
          <CardContent className="p-6 space-y-4">
            <Skeleton className="h-8 w-1/2" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
          </CardContent>
        </Card>
      )}

      {generatedNotesContent && !isLoadingNotes && (
        <Card className="mt-8">
          <CardHeader>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <CardTitle className="text-xl text-primary">Study Materials for: {topic}</CardTitle>
              <div className="flex items-center gap-2 flex-wrap">
                <Select onValueChange={(value) => setVoicePreference(value as 'male' | 'female' | 'kai' | 'zia')} defaultValue={selectedVoice?.name.toLowerCase().includes('zia') ? 'zia' : selectedVoice?.name.toLowerCase().includes('kai')? 'kai' : selectedVoice?.name.toLowerCase().includes('female') ? 'female' : 'male'}>
                    <SelectTrigger className="w-auto text-xs h-8"> <SelectValue placeholder="Voice Type" /> </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="zia">Zia (Female)</SelectItem>
                        <SelectItem value="kai">Kai (Male)</SelectItem>
                        <SelectItem value="female">Female (Default)</SelectItem>
                        <SelectItem value="male">Male (Default)</SelectItem>
                    </SelectContent>
                </Select>
                <Select onValueChange={setSelectedVoiceURI} value={selectedVoice?.voiceURI}>
                    <SelectTrigger className="w-auto text-xs h-8"> <SelectValue placeholder="Select Voice Engine" /> </SelectTrigger>
                    <SelectContent>
                    {supportedVoices.length > 0 ? supportedVoices.map(voice => (
                        <SelectItem key={voice.voiceURI} value={voice.voiceURI} className="text-xs"> {voice.name} ({voice.lang})</SelectItem>
                    )) : <SelectItem value="no-voices" disabled className="text-xs">No voices</SelectItem>}
                    </SelectContent>
                </Select>
                <Button onClick={handleSpeakNotes} variant="outline" size="icon" className="h-8 w-8" title={speechState === 'playing' ? "Pause Notes" : speechState === 'paused' ? "Resume Notes" : "Speak Notes"}>
                    {speechState === 'playing' ? <PauseCircle className="h-4 w-4" /> : <PlayCircle className="h-4 w-4" />}
                </Button>
                <Button onClick={handleStopSpeakNotes} variant="outline" size="icon" className="h-8 w-8" title="Stop Speaking" disabled={speechState === 'idle'}>
                    <StopCircle className="h-4 w-4" />
                </Button>
                <Button onClick={handleDownloadNotes} variant="outline" size="sm" className="h-8 text-xs"><Download className="mr-1.5 h-3.5 w-3.5"/>Download Notes</Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[500px] w-full p-4 border rounded-md bg-muted/20" ref={notesContentRef}>
              {renderMarkdownWithPlaceholders(generatedNotesContent)}
            </ScrollArea>

            <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Button onClick={handleGenerateQuizFromNotes} disabled={isLoadingQuizFromNotes || isLoadingNotes} className="w-full">
                {isLoadingQuizFromNotes ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <HelpCircle className="mr-2 h-4 w-4"/>}
                Generate 30-Question Quiz
              </Button>
              <Button onClick={handleGenerateFlashcardsFromNotes} disabled={isLoadingFlashcardsFromNotes || isLoadingNotes} className="w-full">
                 {isLoadingFlashcardsFromNotes ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <ListChecks className="mr-2 h-4 w-4"/>}
                Generate 20 Flashcards
              </Button>
            </div>
            
            {errorQuizFromNotes && <Alert variant="destructive" className="mt-4"><AlertTriangle className="h-4 w-4"/><AlertTitle>Quiz Error</AlertTitle><AlertDescription>{errorQuizFromNotes}</AlertDescription></Alert>}
            {errorFlashcardsFromNotes && <Alert variant="destructive" className="mt-4"><AlertTriangle className="h-4 w-4"/><AlertTitle>Flashcard Error</AlertTitle><AlertDescription>{errorFlashcardsFromNotes}</AlertDescription></Alert>}

          </CardContent>
        </Card>
      )}

      {generatedQuizData && !isLoadingQuizFromNotes && (
        <Card className="mt-6">
          <CardHeader><CardTitle className="text-lg text-accent">Generated Quiz (30 Questions)</CardTitle></CardHeader>
          <CardContent>
            <ScrollArea className="h-[400px] p-3 border rounded">
              {generatedQuizData.map((q, index) => (
                <div key={index} className="mb-4 p-3 border-b">
                  <p className="font-semibold">Q{index + 1}: {q.question}</p>
                  <ul className="list-disc list-inside ml-4 text-sm">
                    {q.options.map((opt, i) => <li key={i} className={opt === q.answer ? 'text-green-400 font-medium' : ''}>{opt}</li>)}
                  </ul>
                  <p className="text-xs text-muted-foreground mt-1">Answer: {q.answer}</p>
                  {q.explanation && <p className="text-xs text-amber-300/80 mt-1">Explanation: {q.explanation}</p>}
                </div>
              ))}
            </ScrollArea>
          </CardContent>
        </Card>
      )}
      
      {generatedFlashcardsData && !isLoadingFlashcardsFromNotes && (
         <Card className="mt-6">
          <CardHeader><CardTitle className="text-lg text-accent">Generated Flashcards (20 Cards)</CardTitle></CardHeader>
          <CardContent>
             <ScrollArea className="h-[400px] p-3 border rounded">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {generatedFlashcardsData.map((fc, index) => (
                    <Card key={index} className="p-4 bg-secondary/30">
                    <p className="font-semibold text-primary">{fc.term}</p>
                    <p className="text-sm mt-1">{fc.definition}</p>
                    </Card>
                ))}
                </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}

    </div>
  );
}


    