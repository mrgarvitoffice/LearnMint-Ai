
"use client";

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } // Removed useSearchParams as it's not used in this version
from 'next/navigation';
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
import type { GenerateQuizOutput } from '@/ai/flows/generate-quiz';
import { generateFlashcardsFromNotes, type GenerateFlashcardsFromNotesInput } from '@/ai/flows/generate-flashcards-from-notes';
import type { GenerateFlashcardsOutput } from '@/ai/flows/generate-flashcards';

const PAGE_TITLE = "Generate Topper Notes";
const LOCAL_STORAGE_RECENT_TOPICS_KEY = "recentLearnMintTopics";

interface AiGeneratedImageProps {
  promptText: string;
}

function AiGeneratedImage({ promptText }: AiGeneratedImageProps) {
  const googleImagesUrl = `https://www.google.com/search?tbm=isch&q=${encodeURIComponent(promptText)}`;
  // Using a more descriptive placeholder text if prompt is long
  const placeholderText = promptText.length > 40 ? promptText.substring(0, 37) + "..." : promptText;
  const placeholderUrl = `https://placehold.co/600x400.png?text=${encodeURIComponent(placeholderText)}`;
  
  // Generate a simple 2-word hint for data-ai-hint
  const hintKeywords = promptText.toLowerCase().split(/\s+/).slice(0, 2).join(" ");

  return (
    <div className="my-6 p-4 border border-dashed border-primary/50 rounded-lg bg-card/50 text-center shadow-md">
      <p className="text-xs text-muted-foreground mb-1 uppercase tracking-wider">Visual Aid Suggested</p>
      <p className="font-semibold text-primary mb-3">{promptText}</p>
      <div className="aspect-video bg-muted rounded overflow-hidden flex items-center justify-center mb-3 ring-1 ring-border">
        <img
            src={placeholderUrl}
            alt={`Placeholder: ${promptText}`}
            className="max-w-full max-h-full object-contain"
            data-ai-hint={hintKeywords}
        />
      </div>
      <Button variant="outline" size="sm" asChild className="text-sm">
        <a href={googleImagesUrl} target="_blank" rel="noopener noreferrer">
          <Sparkles className="mr-2 h-3.5 w-3.5" /> Search on Google Images
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

  const router = useRouter();
  const { toast } = useToast();
  const { playSound: playClickSound } = useSound('/sounds/ting.mp3', 0.3);

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

  const pageTitleSpokenRef = useRef(false);
  const voicePreferenceWasSetRef = useRef(false);
  const generatingNotesMessageSpokenRef = useRef(false);
  const notesReadyMessageSpokenRef = useRef(false);
  const notesContentRef = useRef<HTMLDivElement>(null);
  const [speechState, setSpeechState] = useState<'idle' | 'playing' | 'paused'>('idle');


  useEffect(() => {
    if (supportedVoices.length > 0 && !voicePreferenceWasSetRef.current) {
      setVoicePreference('zia'); 
      voicePreferenceWasSetRef.current = true;
    }
  }, [supportedVoices, setVoicePreference]);

  useEffect(() => {
    let isMounted = true;
    if (isMounted && selectedVoice && !isTTSSpeaking && !pageTitleSpokenRef.current && !isLoadingNotes && !generatedNotesContent) {
      speak(PAGE_TITLE);
      pageTitleSpokenRef.current = true;
    }
    return () => {
      isMounted = false;
      // Optional: Cancel speech if this specific announcement was playing and component unmounts
      // if (isTTSSpeaking && pageTitleSpokenRef.current && !isLoadingNotes && !generatedNotesContent) {
      //  cancelTTS();
      // }
    };
  }, [selectedVoice, speak, isTTSSpeaking, isLoadingNotes, generatedNotesContent]);


  useEffect(() => {
    if (transcript) {
      setTopic(transcript);
    }
  }, [transcript]);

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
    setGeneratedQuizData(null); // Clear previous quiz
    setGeneratedFlashcardsData(null); // Clear previous flashcards
    setIsLoadingNotes(true);
    generatingNotesMessageSpokenRef.current = false;
    notesReadyMessageSpokenRef.current = false;

    if (selectedVoice && !isTTSSpeaking && !generatingNotesMessageSpokenRef.current) {
      speak("Generating study materials. Please wait.");
      generatingNotesMessageSpokenRef.current = true;
    }

    try {
      const result = await generateStudyNotes({ topic: topic.trim() });
      if (result && result.notes) {
        setGeneratedNotesContent(result.notes);
        if (selectedVoice && !isTTSSpeaking && !notesReadyMessageSpokenRef.current) {
          speak("Notes ready!");
          notesReadyMessageSpokenRef.current = true;
        }
        toast({ title: "Notes Generated!", description: "Your study notes are ready." });

        // Save to recent topics
        try {
          const storedTopics = localStorage.getItem(LOCAL_STORAGE_RECENT_TOPICS_KEY);
          let recentTopicsArray: string[] = storedTopics ? JSON.parse(storedTopics) : [];
          const trimmedTopic = topic.trim();
          // Add to front and ensure no duplicates before slicing
          recentTopicsArray = [trimmedTopic, ...recentTopicsArray.filter(t => t !== trimmedTopic)];
          recentTopicsArray = recentTopicsArray.slice(0, 10); // Keep last 10
          localStorage.setItem(LOCAL_STORAGE_RECENT_TOPICS_KEY, JSON.stringify(recentTopicsArray));
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
      generatingNotesMessageSpokenRef.current = false; 
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
    if(selectedVoice && !isTTSSpeaking) speak("Generating quiz from your notes...");

    try {
        const input: GenerateQuizFromNotesInput = { notesContent: generatedNotesContent, numQuestions: 30 };
        const result = await generateQuizFromNotes(input);
        setGeneratedQuizData(result.quiz);
        toast({ title: "Quiz Generated!", description: "Quiz based on your notes is ready." });
        if(selectedVoice && !isTTSSpeaking) speak("Quiz from notes is ready!");
    } catch (err: any) {
        const errorMessage = err.message || "Failed to generate quiz from notes.";
        setErrorQuizFromNotes(errorMessage);
        toast({ title: "Quiz Generation Error", description: errorMessage, variant: "destructive" });
        if(selectedVoice && !isTTSSpeaking) speak("Sorry, there was an error generating the quiz from notes.");
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
    if(selectedVoice && !isTTSSpeaking) speak("Generating flashcards from your notes...");
    
    try {
        const input: GenerateFlashcardsFromNotesInput = { notesContent: generatedNotesContent, numFlashcards: 20 };
        const result = await generateFlashcardsFromNotes(input);
        setGeneratedFlashcardsData(result.flashcards);
        toast({ title: "Flashcards Generated!", description: "Flashcards based on your notes are ready." });
        if(selectedVoice && !isTTSSpeaking) speak("Flashcards from notes are ready!");
    } catch (err: any) {
        const errorMessage = err.message || "Failed to generate flashcards from notes.";
        setErrorFlashcardsFromNotes(errorMessage);
        toast({ title: "Flashcard Generation Error", description: errorMessage, variant: "destructive" });
        if(selectedVoice && !isTTSSpeaking) speak("Sorry, there was an error generating flashcards from notes.");
    } finally {
        setIsLoadingFlashcardsFromNotes(false);
    }
  };

  const renderMarkdownWithPlaceholders = (markdownContent: string) => {
    // This is a simplified placeholder. A more robust solution would parse the Markdown AST.
    // For now, we'll use a regex-based approach which might have limitations.
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


  const handleSpeakNotes = () => {
    playClickSound();
    if (!generatedNotesContent) return;

    if (speechState === 'playing') {
        cancelTTS(); // This should also trigger onend/onerror which sets isSpeaking to false
        setSpeechState('paused'); // Manually set our local state
    } else if (speechState === 'paused') {
        if (typeof window !== 'undefined' && window.speechSynthesis) {
            // The Web Speech API doesn't have a 'resume' for a specific utterance if it was fully cancelled.
            // We need to restart the speech from the current point or from the beginning.
            // For simplicity, let's restart from the beginning.
            // A more complex solution would track the last spoken position.
            const textToSpeak = notesContentRef.current?.innerText || generatedNotesContent;
            speak(textToSpeak);
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
    if (!isTTSSpeaking && (speechState === 'playing' || speechState === 'paused')) {
        setSpeechState('idle');
    }
  }, [isTTSSpeaking, speechState]);


  return (
    <div className="container mx-auto max-w-4xl px-4 py-8 space-y-8">
      <Card className="w-full shadow-xl">
        <CardHeader className="text-center">
          <div className="inline-block p-3 bg-primary/80 rounded-full mb-4 mx-auto">
            <GraduationCap className="w-10 h-10 text-primary-foreground" />
          </div>
          <CardTitle className="text-3xl md:text-4xl font-bold text-primary">{PAGE_TITLE}</CardTitle>
          <CardDescription className="text-lg text-muted-foreground">
            Enter an academic topic. LearnMint AI will generate "topper" notes, and then you can create a quiz or flashcards.
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
          {errorNotes && <Alert variant="destructive" className="mt-4"><AlertTriangle className="h-4 w-4"/><AlertTitle>Error Generating Notes</AlertTitle><AlertDescription>{errorNotes}</AlertDescription></Alert>}
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
          <CardHeader>
            <Skeleton className="h-8 w-3/4" />
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            <Skeleton className="h-6 w-1/2" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-20 w-full mt-4" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
          </CardContent>
        </Card>
      )}

      {generatedNotesContent && !isLoadingNotes && (
        <Card className="mt-8 shadow-lg">
          <CardHeader>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <CardTitle className="text-xl md:text-2xl text-primary font-semibold flex items-center gap-2">
                <BookOpenText className="w-6 h-6"/> Study Notes for: {topic}
              </CardTitle>
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
            
            {errorQuizFromNotes && <Alert variant="destructive" className="mt-4"><AlertTriangle className="h-4 w-4"/><AlertTitle>Quiz Generation Error</AlertTitle><AlertDescription>{errorQuizFromNotes}</AlertDescription></Alert>}
            {errorFlashcardsFromNotes && <Alert variant="destructive" className="mt-4"><AlertTriangle className="h-4 w-4"/><AlertTitle>Flashcard Generation Error</AlertTitle><AlertDescription>{errorFlashcardsFromNotes}</AlertDescription></Alert>}
          </CardContent>
        </Card>
      )}

      {/* Conditional rendering for Quiz */}
      {generatedQuizData && !isLoadingQuizFromNotes && (
        <Card className="mt-6 shadow-lg">
          <CardHeader><CardTitle className="text-lg md:text-xl text-accent font-semibold flex items-center gap-2"><Brain className="w-5 h-5"/>Generated Quiz (Up to 30 Questions)</CardTitle></CardHeader>
          <CardContent>
            <ScrollArea className="h-[400px] p-3 border rounded-md bg-muted/20">
              {generatedQuizData.map((q, index) => (
                <div key={index} className="mb-4 p-3 border-b border-border/50">
                  <p className="font-semibold text-primary">Q{index + 1}: {q.question}</p>
                  <ul className="list-disc list-inside ml-4 text-sm space-y-1 mt-1">
                    {q.options.map((opt, i) => <li key={i} className={opt === q.answer ? 'text-green-400 font-medium' : 'text-foreground/80'}>{opt}</li>)}
                  </ul>
                  <p className="text-xs text-muted-foreground mt-1">Correct Answer: <span className="text-green-500">{q.answer}</span></p>
                  {q.explanation && <p className="text-xs text-amber-400/90 mt-1">Explanation: {q.explanation}</p>}
                </div>
              ))}
            </ScrollArea>
          </CardContent>
        </Card>
      )}
      
      {/* Conditional rendering for Flashcards */}
      {generatedFlashcardsData && !isLoadingFlashcardsFromNotes && (
         <Card className="mt-6 shadow-lg">
          <CardHeader><CardTitle className="text-lg md:text-xl text-accent font-semibold flex items-center gap-2"><ListChecks className="w-5 h-5"/>Generated Flashcards (Up to 20 Cards)</CardTitle></CardHeader>
          <CardContent>
             <ScrollArea className="h-[400px] p-3 border rounded-md bg-muted/20">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {generatedFlashcardsData.map((fc, index) => (
                    <Card key={index} className="p-4 bg-card/80 border border-border/50">
                      <p className="font-semibold text-primary text-base">{fc.term}</p>
                      <p className="text-sm mt-1 text-foreground/90">{fc.definition}</p>
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
