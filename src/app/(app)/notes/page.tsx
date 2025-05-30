"use client";

import { useState } from 'react';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import ReactMarkdown from 'react-markdown';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { generateStudyNotes, type GenerateStudyNotesOutput } from '@/ai/flows/generate-study-notes';
import { Loader2, FileText, Search, Volume2, Mic, PlayCircle, PauseCircle, StopCircle } from 'lucide-react';
import { useVoiceRecognition } from '@/hooks/useVoiceRecognition';
import { useTTS } from '@/hooks/useTTS';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import Link from 'next/link';

const formSchema = z.object({
  topic: z.string().min(3, { message: 'Topic must be at least 3 characters long.' }),
});
type FormData = z.infer<typeof formSchema>;

export default function NotesPage() {
  const [notes, setNotes] = useState<GenerateStudyNotesOutput | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { isListening, transcript, startListening, stopListening, browserSupportsSpeechRecognition, error: voiceError } = useVoiceRecognition();
  const { speak, cancel, isSpeaking, supportedVoices, selectedVoice, setSelectedVoiceURI, setVoicePreference } = useTTS();


  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(formSchema),
  });
  
  const topicValue = watch('topic');

  useState(() => {
    if (transcript && isListening) {
      setValue('topic', transcript);
    }
  });
   // Effect to update topic input when transcript changes from voice input
  useEffect(() => {
    if (transcript) { // Only update if transcript is not empty
      setValue('topic', transcript);
    }
  }, [transcript, setValue]);


  const onSubmit: SubmitHandler<FormData> = async (data) => {
    setIsLoading(true);
    setNotes(null);
    try {
      const result = await generateStudyNotes({ topic: data.topic });
      setNotes(result);
      toast({ title: 'Notes Generated!', description: 'Study notes are ready.' });
    } catch (error) {
      console.error('Error generating notes:', error);
      toast({ title: 'Error', description: 'Failed to generate notes. Please try again.', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleSpeakNotes = () => {
    if (notes?.notes) {
      if (isSpeaking) {
        cancel();
      } else {
        speak(notes.notes.replace(/\[Image: ([^\]]+)\]/g, 'Image placeholder for $1.'));
      }
    }
  };

  const renderMarkdownWithPlaceholders = (markdownText: string) => {
    const parts = markdownText.split(/(\[Image: [^\]]+\])/g);
    return parts.map((part, index) => {
      const match = part.match(/\[Image: ([^\]]+)\]/);
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


  return (
    <div className="space-y-8">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-2xl">
            <FileText className="w-7 h-7 text-primary" />
            AI Note Generator
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
                  className={errors.topic ? 'border-destructive' : ''}
                />
                {browserSupportsSpeechRecognition && (
                  <Button type="button" variant="outline" size="icon" onClick={isListening ? stopListening : startListening} disabled={isLoading}>
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

      {notes && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-xl">Generated Study Notes</CardTitle>
              <CardDescription>Topic: {topicValue}</CardDescription>
            </div>
            <div className="flex items-center gap-2">
               <Select onValueChange={(value) => setVoicePreference(value as 'male' | 'female')}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Voice Gender" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="female">Female Voice</SelectItem>
                  <SelectItem value="male">Male Voice</SelectItem>
                </SelectContent>
              </Select>
              <Select onValueChange={setSelectedVoiceURI} value={selectedVoice?.voiceURI}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Select Voice" />
                </SelectTrigger>
                <SelectContent>
                  {supportedVoices.map(voice => (
                    <SelectItem key={voice.voiceURI} value={voice.voiceURI}>
                      {voice.name} ({voice.lang})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button variant="outline" size="icon" onClick={handleSpeakNotes} disabled={!notes?.notes}>
                {isSpeaking ? <PauseCircle className="w-5 h-5" /> : <PlayCircle className="w-5 h-5" />}
              </Button>
              {isSpeaking && (
                <Button variant="outline" size="icon" onClick={cancel}>
                  <StopCircle className="w-5 h-5" />
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="prose dark:prose-invert max-w-none">
            {renderMarkdownWithPlaceholders(notes.notes)}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
