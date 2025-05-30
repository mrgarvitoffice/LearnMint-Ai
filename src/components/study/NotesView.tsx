
"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Download, PlayCircle, PauseCircle, StopCircle } from 'lucide-react';
import { useTTS } from '@/hooks/useTTS';
import { useSound } from '@/hooks/useSound';
import { useToast } from '@/hooks/use-toast';
import AiGeneratedImage from './AiGeneratedImage'; // Ensure this path is correct

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
    setVoicePreference,
    voicePreference,
    supportedVoices
  } = useTTS();
  const { playSound: playClickSound } = useSound('/sounds/ting.mp3', 0.3);
  const { toast } = useToast();

  const [cleanedNotesForTTS, setCleanedNotesForTTS] = useState<string>("");
  const voicePreferenceWasSetRef = useRef(false);

  useEffect(() => {
    if (supportedVoices.length > 0 && !voicePreferenceWasSetRef.current) {
        setVoicePreference('luma'); 
        voicePreferenceWasSetRef.current = true;
    }
  }, [supportedVoices, setVoicePreference]);

  useEffect(() => {
    if (notesContent) {
      const textForSpeech = notesContent
        .replace(/\[VISUAL_PROMPT:[^\]]+\]/gi, "(A visual aid is suggested here in the notes.)") 
        .replace(/#+\s*/g, '') 
        .replace(/(\*\*|__)(.*?)\1/g, '$2') 
        .replace(/(\*|_)(.*?)\1/g, '$2')
        .replace(/---|===/g, ''); // Remove horizontal rules
      setCleanedNotesForTTS(textForSpeech);
    }
  }, [notesContent]);

  const handlePlaybackControl = useCallback(() => {
    playClickSound();
    if (!cleanedNotesForTTS) {
        toast({title: "No Content", description: "Nothing to speak.", variant: "destructive"});
        return;
    }
    if (isSpeaking && !isPaused) pauseTTS();
    else if (isPaused) resumeTTS();
    else speak(cleanedNotesForTTS);
  }, [playClickSound, cleanedNotesForTTS, isSpeaking, isPaused, pauseTTS, resumeTTS, speak, toast]);

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
      .replace(/\n{3,}/g, "\n\n")
      .replace(/---|===/g, ''); // Remove horizontal rules

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
    if (selectedVoice && !isSpeaking && !isPaused) speak("Notes downloaded!");
  };
  
  const customRenderers = {
    p: (props: any) => {
      const childrenArray = React.Children.toArray(props.children);
      const newChildren = childrenArray.map((child, index) => {
        if (typeof child === 'string' && child.includes('[VISUAL_PROMPT:')) {
          const parts = child.split(/(\[VISUAL_PROMPT:[^\]]+\])/g);
          return parts.map((part, partIndex) => {
            if (part.startsWith('[VISUAL_PROMPT:')) {
              const promptText = part.substring('[VISUAL_PROMPT:'.length, part.length - 1).trim();
              return <AiGeneratedImage key={`vis-${index}-${partIndex}`} promptText={promptText} />;
            }
            return part;
          });
        }
        return child;
      }).flat();
      return <p {...props} className="my-2">{newChildren}</p>;
    },
    // Basic styling for headings, lists, etc. can be enhanced in globals.css with .prose
  };

  const getSelectedDropdownValue = () => {
    if (voicePreference) return voicePreference;
    if (selectedVoice?.name.toLowerCase().includes('luma') || selectedVoice?.name.toLowerCase().includes('zia') || selectedVoice?.name.toLowerCase().includes('female')) return 'luma';
    if (selectedVoice?.name.toLowerCase().includes('kai') || selectedVoice?.name.toLowerCase().includes('male')) return 'kai';
    return 'luma';
  };

  return (
    <Card className="shadow-lg flex-1 flex flex-col min-h-0">
      <CardHeader className="sticky top-0 bg-background/90 backdrop-blur-sm z-10 border-b">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <CardTitle className="text-base md:text-lg text-primary font-semibold flex items-center gap-2 truncate">
            Notes: {topic}
          </CardTitle>
          <div className="flex items-center gap-2 flex-wrap">
            <Select
              value={getSelectedDropdownValue()}
              onValueChange={(value) => { playClickSound(); setVoicePreference(value as 'luma' | 'kai' | null);}}
            >
              <SelectTrigger className="w-auto text-xs h-8"> <SelectValue placeholder="Voice" /> </SelectTrigger>
              <SelectContent>
                <SelectItem value="luma">Luma</SelectItem>
                <SelectItem value="kai">Kai</SelectItem>
              </SelectContent>
            </Select>
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
           <div>
            <ReactMarkdown 
                remarkPlugins={[remarkGfm]}
                components={customRenderers}
                className="prose prose-sm sm:prose-base dark:prose-invert max-w-none break-words"
            >
                {notesContent || "No notes to display."}
            </ReactMarkdown>
           </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

export default NotesView;
