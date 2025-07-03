
"use client";

import React, { useState, useEffect, useCallback } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Download, PlayCircle, PauseCircle, StopCircle, Loader2 } from 'lucide-react';
import { useTTS } from '@/hooks/useTTS';
import { useSound } from '@/hooks/useSound';
import { useToast } from '@/hooks/use-toast';
import AiGeneratedImage from './AiGeneratedImage';

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
    isLoading: isTTSLoading,
    setVoicePreference,
  } = useTTS();
  const { playSound: playClickSound } = useSound('/sounds/ting.mp3', 0.3);
  const { toast } = useToast();

  const [cleanedNotesForTTS, setCleanedNotesForTTS] = useState<string>("");

  useEffect(() => {
    setVoicePreference('holo');
  }, [setVoicePreference]);

  useEffect(() => {
    if (notesContent) {
      const textForSpeech = notesContent
        .replace(/\[VISUAL_PROMPT:[^\]]+\]/gi, "(A visual aid is suggested here in the notes.)")
        .replace(/#+\s*/g, '')
        .replace(/(\*\*|__)(.*?)\1/g, '$2')
        .replace(/(\*|_)(.*?)\1/g, '$2')
        .replace(/---|===/g, '');
      setCleanedNotesForTTS(textForSpeech);
    } else {
      setCleanedNotesForTTS("");
    }
  }, [notesContent]);
  
  // Cleanup TTS on component unmount
  useEffect(() => {
    return () => {
      cancelTTS();
    }
  }, [cancelTTS]);

  const handlePlaybackControl = useCallback(() => {
    playClickSound();
    if (!cleanedNotesForTTS) {
        toast({title: "No Content", description: "Nothing to speak.", variant: "destructive"});
        return;
    }
    if (isSpeaking && !isPaused) pauseTTS();
    else if (isPaused) resumeTTS();
    else speak(cleanedNotesForTTS, { priority: 'essential' });
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
      .replace(/---|===/g, '');

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
  };

  const customRenderers = {
    p: ({ node, ...props }: any) => {
      const firstChild = node.children[0];
      if (
        node.children.length === 1 &&
        firstChild.type === 'text' &&
        (firstChild.value as string).startsWith('[VISUAL_PROMPT:')
      ) {
        const promptText = (firstChild.value as string)
          .substring('[VISUAL_PROMPT:'.length, firstChild.value.length - 1)
          .trim();
        return <AiGeneratedImage promptText={promptText} />;
      }
      return <p className="my-2 leading-relaxed" {...props} />;
    },
    h1: ({node, ...props}: any) => <h1 className="text-3xl font-bold mt-6 mb-3 pb-2 border-b border-primary/30 text-primary" {...props} />,
    h2: ({node, ...props}: any) => <h2 className="text-2xl font-semibold mt-5 mb-2.5 pb-1 border-b border-primary/20 text-primary/90" {...props} />,
    h3: ({node, ...props}: any) => <h3 className="text-xl font-semibold mt-4 mb-2 text-primary/80" {...props} />,
    h4: ({node, ...props}: any) => <h4 className="text-lg font-semibold mt-3 mb-1.5 text-primary/70" {...props} />,
    ul: ({node, ...props}: any) => <ul className="list-disc pl-5 my-2 space-y-1" {...props} />,
    ol: ({node, ...props}: any) => <ol className="list-decimal pl-5 my-2 space-y-1" {...props} />,
    li: ({node, ...props}: any) => <li className="mb-1" {...props} />,
    blockquote: ({node, ...props}: any) => <blockquote className="border-l-4 border-accent pl-4 py-2 my-3 italic bg-accent/10 text-accent-foreground/90 rounded-r-md" {...props} />,
    code: ({ node, className, children, ...props }: any) => {
        const match = /language-(\w+)/.exec(className || '');
        return match ? (
          <pre className="bg-muted/50 p-3 rounded-md overflow-x-auto text-sm my-2"><code className={className} {...props}>{children}</code></pre>
        ) : (
          <code className="bg-muted/50 px-1 py-0.5 rounded-sm text-sm text-primary" {...props}>{children}</code>
        );
    },
    table: ({node, ...props}: any) => <div className="overflow-x-auto my-3"><table className="table-auto w-full border-collapse border border-border" {...props} /></div>,
    th: ({node, ...props}: any) => <th className="border border-border px-3 py-1.5 bg-muted/40 font-medium text-left" {...props} />,
    td: ({node, ...props}: any) => <td className="border border-border px-3 py-1.5 text-left" {...props} />,
    img: ({ node, ...props }: any) => {
      return <img {...props} className="max-w-full h-auto rounded-lg shadow-md my-4 mx-auto" alt={props.alt || 'AI generated image'} />;
    },
  };

  return (
    <Card className="mt-0 shadow-lg flex-1 flex flex-col min-h-0">
      <CardHeader className="sticky top-0 bg-background/90 backdrop-blur-sm z-10 border-b">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <CardTitle className="text-base md:text-lg text-primary font-semibold flex items-center gap-2 truncate">
            Notes: {topic}
          </CardTitle>
          <div className="flex items-center gap-2 flex-wrap">
            <Button onClick={handlePlaybackControl} variant="outline" size="icon" className="h-8 w-8" title={isTTSLoading ? "Loading Audio..." : isSpeaking && !isPaused ? "Pause Notes" : isPaused ? "Resume Notes" : "Speak Notes"} disabled={isTTSLoading}>
              {isTTSLoading ? <Loader2 className="h-4 w-4 animate-spin"/> : isSpeaking && !isPaused ? <PauseCircle className="h-4 w-4" /> : <PlayCircle className="h-4 w-4" />}
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
