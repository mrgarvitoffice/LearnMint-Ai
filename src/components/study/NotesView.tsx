
"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Download, PlayCircle, PauseCircle, StopCircle, Loader2 } from 'lucide-react'; // Added Loader2
import { useTTS } from '@/hooks/useTTS';
import { useSound } from '@/hooks/useSound';
import { useToast } from '@/hooks/use-toast';
import AiGeneratedImage from './AiGeneratedImage'; // Assuming this component exists

interface NotesViewProps {
  notesContent: string | null;
  topic: string;
}

const NotesView: React.FC<NotesViewProps> = ({ notesContent, topic }) => {
  const {
    speak,
    pauseTTS,
    resumeTTS,
    cancelTTS,
    isSpeaking,
    isPaused,
    selectedVoice,
    setSelectedVoiceURI,
    setVoicePreference,
    supportedVoices,
    voicePreference
  } = useTTS();
  const { playSound: playClickSound } = useSound('/sounds/ting.mp3', 0.3);
  const { toast } = useToast();

  const notesContentRef = useRef<HTMLDivElement>(null);
  const voicePreferenceWasSetRef = useRef(false);

  useEffect(() => {
    if (supportedVoices.length > 0 && !voicePreferenceWasSetRef.current) {
      setVoicePreference('zia'); // Default to Zia/female for notes
      voicePreferenceWasSetRef.current = true;
    }
  }, [supportedVoices, setVoicePreference]);


  const handlePlaybackControl = useCallback(() => {
    playClickSound();
    if (!notesContent) {
        toast({title: "No Content", description: "Nothing to speak.", variant: "destructive"});
        return;
    }
    
    const textToSpeak = notesContentRef.current?.innerText || 
                        notesContent.replace(/\[VISUAL_PROMPT:[^\]]+\]/g, ''); 

    if (isSpeaking && !isPaused) {
      pauseTTS();
    } else if (isPaused) {
      resumeTTS();
    } else {
      speak(textToSpeak);
    }
  }, [playClickSound, notesContent, isSpeaking, isPaused, pauseTTS, resumeTTS, speak, toast]);

  const handleStopTTS = useCallback(() => {
    playClickSound();
    cancelTTS();
  }, [playClickSound, cancelTTS]);

  const handleDownloadNotes = () => {
    playClickSound();
    if (!notesContent) {
      toast({ title: "No Notes", description: "Nothing to download.", variant: "destructive" });
      return;
    }
    const plainText = notesContent
      .replace(/\[VISUAL_PROMPT:[^\]]+\]/g, '')
      .replace(/#{1,6}\s?/g, '')
      .replace(/(\*|-)\s/g, '')
      .replace(/(\*\*|__)(.*?)\1/g, '$2')
      .replace(/(\*|_)(.*?)\1/g, '$2')
      .replace(/`{1,3}(.*?)`{1,3}/g, '$1')
      .replace(/<[^>]+>/g, '') 
      .replace(/(\r\n|\n|\r)/gm, "\n") 
      .replace(/\n{3,}/g, "\n\n"); 

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
    if(selectedVoice && !isSpeaking && !isPaused) speak("Notes downloaded!");
  };
  
  const renderMarkdownWithPlaceholders = (markdownContent: string) => {
    if (!markdownContent) return null;
    // Split by the visual prompt pattern, keeping the delimiter
    const parts = markdownContent.split(/(\[VISUAL_PROMPT:[^\]]+\])/g);
    return parts.map((part, index) => {
      if (part.startsWith('[VISUAL_PROMPT:')) {
        const promptText = part.substring('[VISUAL_PROMPT:'.length, part.length - 1).trim();
        return <AiGeneratedImage key={`vis-${index}`} promptText={promptText} />;
      }
      return <ReactMarkdown key={`md-${index}`} remarkPlugins={[remarkGfm]} className="prose prose-sm sm:prose-base dark:prose-invert max-w-none break-words">{part}</ReactMarkdown>;
    });
  };


  if (!notesContent) { // This handles null or empty string
    return (
      <Card className="shadow-lg flex-1 flex flex-col min-h-0">
        <CardHeader>
          <CardTitle className="text-lg md:text-xl text-primary font-semibold">Study Notes for: {topic}</CardTitle>
        </CardHeader>
        <CardContent className="flex-1 flex items-center justify-center">
          <p className="text-muted-foreground">No notes available for this topic yet, or an error occurred.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-lg flex-1 flex flex-col min-h-0">
      <CardHeader className="sticky top-0 bg-background/90 backdrop-blur-sm z-10 border-b">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <CardTitle className="text-base md:text-lg text-primary font-semibold flex items-center gap-2 truncate">
            Notes: {topic}
          </CardTitle>
          <div className="flex items-center gap-2 flex-wrap">
            <Select
              value={voicePreference || ''}
              onValueChange={(value) => { playClickSound(); setVoicePreference(value as 'kai' | 'zia' | null);}}
            >
              <SelectTrigger className="w-auto text-xs h-8"> <SelectValue placeholder="Voice" /> </SelectTrigger>
              <SelectContent>
                <SelectItem value="zia">Zia</SelectItem>
                <SelectItem value="kai">Kai</SelectItem>
              </SelectContent>
            </Select>
             {/* Optional: Detailed voice engine selector if needed
            <Select onValueChange={(uri) => {playClickSound(); setSelectedVoiceURI(uri);}} value={selectedVoice?.voiceURI}>
              <SelectTrigger className="w-auto text-xs h-8"> <SelectValue placeholder="Voice Engine" /> </SelectTrigger>
              <SelectContent>
                {supportedVoices.length > 0 ? supportedVoices.map(voice => (
                  <SelectItem key={voice.voiceURI} value={voice.voiceURI} className="text-xs"> {voice.name} ({voice.lang})</SelectItem>
                )) : <SelectItem value="no-voices" disabled className="text-xs">No voices</SelectItem>}
              </SelectContent>
            </Select>
            */}
            <Button onClick={handlePlaybackControl} variant="outline" size="icon" className="h-8 w-8" title={isSpeaking && !isPaused ? "Pause Notes" : isPaused ? "Resume Notes" : "Speak Notes"}>
              {isSpeaking && !isPaused ? <PauseCircle className="h-4 w-4" /> : <PlayCircle className="h-4 w-4" />}
            </Button>
            <Button onClick={handleStopTTS} variant="outline" size="icon" className="h-8 w-8" title="Stop Speaking" disabled={!isSpeaking && !isPaused}>
              <StopCircle className="h-4 w-4" />
            </Button>
            <Button onClick={handleDownloadNotes} variant="outline" size="sm" className="h-8 text-xs"><Download className="mr-1.5 h-3.5 w-3.5"/>Download</Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex-1 overflow-hidden p-0">
        <ScrollArea className="h-full w-full p-1 sm:p-4 bg-muted/20" >
           <div ref={notesContentRef}>
            {renderMarkdownWithPlaceholders(notesContent)}
           </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

export default NotesView;

    