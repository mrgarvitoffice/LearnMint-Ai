
"use client";

import { useState, useEffect } from 'react';
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
import { generateQuizFromNotes } from '@/ai/flows/generate-quiz-from-notes';
import { generateFlashcardsFromNotes } from '@/ai/flows/generate-flashcards-from-notes';
import type { GenerateQuizOutput } from '@/ai/flows/generate-quiz';
import type { GenerateFlashcardsOutput as GenerateFlashcardsOutputFromNotes } from '@/ai/flows/generate-flashcards';
import { Loader2, FileText, Search, Volume2, Mic, PlayCircle, PauseCircle, StopCircle, HelpCircleIcon, ListChecksIcon } from 'lucide-react';
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
  const [isGeneratingQuiz, setIsGeneratingQuiz] = useState(false);
  const [isGeneratingFlashcards, setIsGeneratingFlashcards] = useState(false);
  
  // Placeholders for generated content from notes - full display can be a next step
  const [quizFromNotes, setQuizFromNotes] = useState<GenerateQuizOutput | null>(null);
  const [flashcardsFromNotes, setFlashcardsFromNotes] = useState<GenerateFlashcardsOutputFromNotes | null>(null);

  const { toast } = useToast();
  const { isListening, transcript, startListening, stopListening, browserSupportsSpeechRecognition, error: voiceError } = useVoiceRecognition();
  const { speak, cancel, isSpeaking, supportedVoices, selectedVoice, setSelectedVoiceURI, setVoicePreference } = useTTS();


  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(formSchema),
  });
  
  const topicValue = watch('topic');
  
  useEffect(() => {
    if (transcript) {
      setValue('topic', transcript);
    }
  }, [transcript, setValue]);


  const onSubmit: SubmitHandler<FormData> = async (data) => {
    setIsLoading(true);
    setNotes(null);
    setQuizFromNotes(null); // Reset quiz if new notes are generated
    setFlashcardsFromNotes(null); // Reset flashcards if new notes are generated
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

  const handleGenerateQuizFromNotes = async () => {
    if (!notes?.notes) return;
    setIsGeneratingQuiz(true);
    try {
      const result = await generateQuizFromNotes({ notesContent: notes.notes, numQuestions: 30 });
      setQuizFromNotes(result); // Store for potential future display
      console.log("Generated Quiz from Notes:", result);
      toast({ title: "Quiz Generated from Notes!", description: `${result.quiz.length} questions created.` });
    } catch (error) {
      console.error("Error generating quiz from notes:", error);
      toast({ title: "Quiz Generation Error", description: "Failed to generate quiz from notes.", variant: "destructive" });
    } finally {
      setIsGeneratingQuiz(false);
    }
  };

  const handleGenerateFlashcardsFromNotes = async () => {
    if (!notes?.notes) return;
    setIsGeneratingFlashcards(true);
    try {
      const result = await generateFlashcardsFromNotes({ notesContent: notes.notes, numFlashcards: 20 });
      setFlashcardsFromNotes(result); // Store for potential future display
      console.log("Generated Flashcards from Notes:", result);
      toast({ title: "Flashcards Generated from Notes!", description: `${result.flashcards.length} flashcards created.` });
    } catch (error) {
      console.error("Error generating flashcards from notes:", error);
      toast({ title: "Flashcard Generation Error", description: "Failed to generate flashcards from notes.", variant: "destructive" });
    } finally {
      setIsGeneratingFlashcards(false);
    }
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
          <CardHeader className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <CardTitle className="text-xl">Generated Study Notes</CardTitle>
              <CardDescription>Topic: {topicValue}</CardDescription>
            </div>
            <div className="flex flex-wrap items-center gap-2">
               <Select onValueChange={(value) => setVoicePreference(value as 'male' | 'female' | 'kai' | 'zia')}>
                <SelectTrigger className="w-full sm:w-[150px]">
                  <SelectValue placeholder="Voice Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="female">Female (Default)</SelectItem>
                  <SelectItem value="male">Male (Default)</SelectItem>
                  <SelectItem value="zia">Zia (Female)</SelectItem>
                  <SelectItem value="kai">Kai (Male)</SelectItem>
                </SelectContent>
              </Select>
              <Select onValueChange={setSelectedVoiceURI} value={selectedVoice?.voiceURI}>
                <SelectTrigger className="w-full sm:w-[200px]">
                  <SelectValue placeholder="Select Voice Engine" />
                </SelectTrigger>
                <SelectContent>
                  {supportedVoices.length > 0 ? supportedVoices.map(voice => (
                    <SelectItem key={voice.voiceURI} value={voice.voiceURI}>
                      {voice.name} ({voice.lang})
                    </SelectItem>
                  )) : <SelectItem value="no-voices" disabled>No voices available</SelectItem>}
                </SelectContent>
              </Select>
              <Button variant="outline" size="icon" onClick={handleSpeakNotes} disabled={!notes?.notes || isSpeaking && !window.speechSynthesis.paused}>
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
          <CardFooter className="flex flex-col sm:flex-row gap-2 pt-4">
            <Button 
              onClick={handleGenerateQuizFromNotes} 
              disabled={isGeneratingQuiz || !notes?.notes}
              className="w-full sm:w-auto"
            >
              {isGeneratingQuiz ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <HelpCircleIcon className="w-4 h-4 mr-2"/>}
              Generate 30-Question Quiz from Notes
            </Button>
            <Button 
              onClick={handleGenerateFlashcardsFromNotes} 
              disabled={isGeneratingFlashcards || !notes?.notes}
              className="w-full sm:w-auto"
            >
              {isGeneratingFlashcards ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <ListChecksIcon className="w-4 h-4 mr-2"/>}
              Generate 20 Flashcards from Notes
            </Button>
          </CardFooter>
        </Card>
      )}
    </div>
  );
}
