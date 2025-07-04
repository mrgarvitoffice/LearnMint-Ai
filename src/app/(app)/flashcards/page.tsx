
"use client";

import { useState, useRef, useEffect, type ChangeEvent } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Loader2, Sparkles, AudioLines, Mic, Layers, FileText, Image as ImageIcon, XCircle, PlayCircle, PauseCircle, StopCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useSound } from '@/hooks/useSound';
import { useVoiceRecognition } from '@/hooks/useVoiceRecognition';
import { generateAudioFlashcardsAction, generateAudioSummaryAction } from '@/lib/actions';
import type { GenerateAudioFlashcardsOutput, GenerateAudioSummaryOutput } from '@/lib/types';
import { ScrollArea } from '@/components/ui/scroll-area';
import FlashcardItem from '@/components/study/FlashcardItem';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useTranslation } from '@/hooks/useTranslation';
import NextImage from 'next/image';
import { extractTextFromPdf } from '@/lib/utils';
import { Textarea } from '@/components/ui/textarea';
import { useTTS } from '@/hooks/useTTS';

// Sub-component for Audio Flashcards
function AudioFlashcardsGenerator() {
  const { t } = useTranslation();
  const [topic, setTopic] = useState('');
  const [numFlashcards, setNumFlashcards] = useState(10);
  const [generatedContent, setGeneratedContent] = useState<GenerateAudioFlashcardsOutput | null>(null);
  
  const { toast } = useToast();
  const { playSound: playActionSound } = useSound('/sounds/custom-sound-2.mp3', 0.4);
  const { playSound: playClickSound } = useSound('/sounds/ting.mp3', 0.3);
  const { isListening, transcript, startListening, stopListening, browserSupportsSpeechRecognition } = useVoiceRecognition();
  const { speak, cancelTTS, isSpeaking, isPaused, pauseTTS, resumeTTS, isLoading: isTTSLoading } = useTTS();

  const { mutate: generate, isPending: isLoading } = useMutation({
    mutationFn: generateAudioFlashcardsAction,
    onSuccess: (data) => {
      if (!data.flashcards || data.flashcards.length === 0) {
        toast({ title: "Generation Issue", description: "The AI generated no flashcards for this topic.", variant: 'default' });
        setGeneratedContent(null);
        return;
      }
      setGeneratedContent(data);
      toast({ title: "Generation Complete!", description: `${data.flashcards.length} flashcards created. You can now use the 'Read Aloud' feature.` });
    },
    onError: (error) => {
      toast({ title: "Generation Failed", description: error.message, variant: "destructive" });
      setGeneratedContent(null);
    }
  });

  const handleGenerate = () => {
    playActionSound();
    if (topic.trim().length < 3) {
      toast({ title: "Invalid Topic", description: "Topic must be at least 3 characters long.", variant: "destructive" });
      return;
    }
    cancelTTS();
    setGeneratedContent(null);
    generate({ topic, numFlashcards });
  };
  
  const handleMicClick = () => {
    playClickSound();
    if (isListening) stopListening();
    else startListening();
  };
  
  useEffect(() => { if (transcript) setTopic(transcript); }, [transcript]);

  const handleReadAllFlashcards = () => {
    playClickSound();
    if (!generatedContent || generatedContent.flashcards.length === 0) return;
    const textToRead = generatedContent.flashcards.map(fc => `Term: ${fc.term}. Definition: ${fc.definition}`).join('\n\n');
    speak(textToRead, { priority: 'essential' });
  }

  const handlePlaybackControl = () => {
    if (isSpeaking && !isPaused) pauseTTS();
    else if (isPaused) resumeTTS();
    else handleReadAllFlashcards();
  }

  return (
    <Card className="shadow-lg border-none">
      <CardHeader>
        <CardTitle>{t('audioFactory.flashcards.title')}</CardTitle>
        <CardDescription>{t('audioFactory.flashcards.description')}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="topic-input">{t('audioFactory.topic')}</Label>
          <div className="flex gap-2">
            <Input id="topic-input" placeholder="e.g., The French Revolution" value={topic} onChange={(e) => setTopic(e.target.value)} disabled={isLoading} />
            {browserSupportsSpeechRecognition && (
              <Button variant="outline" size="icon" onClick={handleMicClick} disabled={isLoading}>
                <Mic className={`h-5 w-5 ${isListening ? 'text-destructive animate-pulse' : ''}`} />
              </Button>
            )}
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="num-flashcards">{t('audioFactory.numFlashcards')}: {numFlashcards}</Label>
          <Slider id="num-flashcards" min={5} max={15} step={1} value={[numFlashcards]} onValueChange={(value) => setNumFlashcards(value[0])} disabled={isLoading} />
        </div>
      </CardContent>
      <CardFooter className="justify-center">
        <Button size="lg" onClick={handleGenerate} disabled={isLoading}>
          {isLoading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Sparkles className="mr-2 h-5 w-5" />}
          {t('audioFactory.generate')} Flashcards
        </Button>
      </CardFooter>
      {isLoading && (
        <CardContent className="text-center py-6">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
          <p className="mt-3 text-muted-foreground">{t('audioFactory.generating')}</p>
        </CardContent>
      )}
      {generatedContent && (
        <CardContent>
          <CardTitle className="mb-4 text-lg">Generated Content</CardTitle>
          {generatedContent.flashcards.length > 0 && (
            <div className="mb-6 flex items-center gap-2">
              <Button onClick={handlePlaybackControl} disabled={isTTSLoading}>
                {isTTSLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin"/> : isSpeaking && !isPaused ? <PauseCircle className="h-4 w-4 mr-2"/> : <PlayCircle className="h-4 w-4 mr-2"/>}
                {isSpeaking && !isPaused ? "Pause" : isPaused ? "Resume" : "Read Aloud"}
              </Button>
              {(isSpeaking || isPaused) && (
                <Button onClick={cancelTTS} variant="ghost" size="icon"><StopCircle className="h-5 w-5" /></Button>
              )}
            </div>
          )}
          <ScrollArea className="h-[500px] w-full pr-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {generatedContent.flashcards.map((card, index) => (
                      <FlashcardItem key={index} flashcard={card} isCurrent={false} className="h-56" />
                  ))}
              </div>
          </ScrollArea>
        </CardContent>
      )}
    </Card>
  );
}

// Abstracted component for Summarizers to reduce repetition
function AudioSummarizer({
  title, description, inputType,
  generateAction, validateInput,
  children
}: {
  title: string, description: string, inputType: 'text' | 'image' | 'pdf',
  generateAction: (input: any) => void, validateInput: () => boolean,
  children: React.ReactNode
}) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const { playSound: playActionSound } = useSound('/sounds/custom-sound-2.mp3', 0.4);
  const [generatedContent, setGeneratedContent] = useState<GenerateAudioSummaryOutput | null>(null);

  const { speak, cancelTTS, isSpeaking, isPaused, pauseTTS, resumeTTS, isLoading: isTTSLoading } = useTTS();
  const { mutate: generate, isPending: isLoading } = useMutation({
    mutationFn: generateAudioSummaryAction,
    onSuccess: (data) => {
      setGeneratedContent(data);
      toast({ title: "Summary Complete!", description: `AI has generated a summary for your ${inputType}.`});
    },
    onError: (error) => {
      toast({ title: "Summary Failed", description: error.message, variant: "destructive" });
    }
  });

  const handleGenerate = () => {
    playActionSound();
    if (!validateInput()) return;
    cancelTTS();
    generateAction(generate);
  };
  
  const handleReadAloud = () => {
    if (!generatedContent?.summary) return;
    speak(generatedContent.summary, {priority: 'essential'});
  }
  
  const handlePlaybackControl = () => {
    if (isSpeaking && !isPaused) pauseTTS();
    else if (isPaused) resumeTTS();
    else handleReadAloud();
  }

  return (
    <Card className="shadow-lg border-none">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {children}
      </CardContent>
      <CardFooter className="flex-col items-center gap-4">
        <Button onClick={handleGenerate} disabled={isLoading}>
          {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
          {t('audioFactory.generate')} Summary
        </Button>
        {isLoading && <p className="text-sm text-muted-foreground">{t('audioFactory.generating')}</p>}
        {generatedContent && (
          <div className="w-full space-y-4 pt-4 border-t">
            <h3 className="font-semibold">{t('audioFactory.summary')}</h3>
            <p className="text-sm text-muted-foreground bg-muted p-3 rounded-md">{generatedContent.summary}</p>
            <div className="flex items-center gap-2">
              <Button onClick={handlePlaybackControl} disabled={isTTSLoading}>
                {isTTSLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin"/> : isSpeaking && !isPaused ? <PauseCircle className="h-4 w-4 mr-2"/> : <PlayCircle className="h-4 w-4 mr-2"/>}
                {isSpeaking && !isPaused ? "Pause" : isPaused ? "Resume" : "Read Aloud"}
              </Button>
               {(isSpeaking || isPaused) && (
                <Button onClick={cancelTTS} variant="ghost" size="icon"><StopCircle className="h-5 w-5" /></Button>
              )}
            </div>
          </div>
        )}
      </CardFooter>
    </Card>
  );
}

function TextAudioSummarizer() {
  const [textInput, setTextInput] = useState('');
  const { toast } = useToast();
  const { isListening, transcript, startListening, stopListening, browserSupportsSpeechRecognition } = useVoiceRecognition();
  useEffect(() => { if (transcript) setTextInput(transcript); }, [transcript]);
  const handleMicClick = () => isListening ? stopListening() : startListening();

  return (
    <AudioSummarizer
      title="Text Audio Summarizer"
      description="Paste your notes, or dictate them, to get a spoken summary."
      inputType="text"
      validateInput={() => {
        if (textInput.trim().length < 50) {
          toast({ title: "Text Too Short", description: "Please provide at least 50 characters to summarize.", variant: "destructive" });
          return false;
        }
        return true;
      }}
      generateAction={(generate) => generate({ text: textInput })}
    >
      <div className="space-y-2">
        <Label htmlFor="text-input">Your Text</Label>
        <div className="relative">
          <Textarea id="text-input" placeholder="Paste your content here (minimum 50 characters) or use the mic..." value={textInput} onChange={(e) => setTextInput(e.target.value)} rows={8} className="pr-12" />
          {browserSupportsSpeechRecognition && (
            <Button type="button" variant="ghost" size="icon" onClick={handleMicClick} className="absolute bottom-2 right-2" title="Use voice input">
              <Mic className={`h-5 w-5 ${isListening ? 'text-destructive animate-pulse' : ''}`} />
            </Button>
          )}
        </div>
      </div>
    </AudioSummarizer>
  );
}

function ImageAudioSummarizer() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageData, setImageData] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { toast({ title: t('audioFactory.invalidFileType'), variant: "destructive" }); return; }
    if (file.size > 2 * 1024 * 1024) { toast({ title: t('audioFactory.imageTooLarge'), variant: "destructive" }); return; }
    const reader = new FileReader();
    reader.onloadend = () => { setImagePreview(reader.result as string); setImageData(reader.result as string); };
    reader.readAsDataURL(file);
  };
  const handleRemoveImage = () => { setImagePreview(null); setImageData(null); if(fileInputRef.current) fileInputRef.current.value = ""; }

  return (
     <AudioSummarizer
      title={t('audioFactory.image.title')}
      description={t('audioFactory.image.description')}
      inputType="image"
      validateInput={() => !!imageData}
      generateAction={(generate) => generate({ imageDataUri: imageData })}
    >
      <input type="file" accept="image/*" ref={fileInputRef} onChange={handleFileChange} className="hidden" />
      <Button onClick={() => fileInputRef.current?.click()} variant="outline"><ImageIcon className="mr-2 h-4 w-4" /> {t('audioFactory.uploadImage')}</Button>
      {imagePreview && (
        <div className="relative w-40 h-40 mx-auto">
          <NextImage src={imagePreview} alt="Selected preview" layout="fill" objectFit="cover" className="rounded-md border-2 border-primary/50" />
          <Button type="button" variant="ghost" size="icon" onClick={handleRemoveImage} className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-destructive text-destructive-foreground"><XCircle className="w-4 h-4" /></Button>
        </div>
      )}
    </AudioSummarizer>
  );
}

function PdfAudioSummarizer() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [extractedText, setExtractedText] = useState<string | null>(null);
  const [isExtracting, setIsExtracting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.type !== 'application/pdf') { toast({ title: t('audioFactory.invalidFileType'), variant: "destructive" }); return; }
    if (file.size > 5 * 1024 * 1024) { toast({ title: t('audioFactory.pdfTooLarge'), variant: "destructive" }); return; }
    setPdfFile(file);
    setIsExtracting(true);
    try {
      const text = await extractTextFromPdf(file);
      setExtractedText(text);
      toast({title: "PDF Processed", description: "Text extracted successfully."});
    } catch (err) {
      toast({ title: t('audioFactory.pdfExtractError'), variant: "destructive" });
      setExtractedText(null); setPdfFile(null);
    } finally {
      setIsExtracting(false);
    }
  };

  return (
    <AudioSummarizer
      title={t('audioFactory.pdf.title')}
      description={t('audioFactory.pdf.description')}
      inputType="pdf"
      validateInput={() => !!extractedText}
      generateAction={(generate) => generate({ text: extractedText })}
    >
      <input type="file" accept="application/pdf" ref={fileInputRef} onChange={handleFileChange} className="hidden" />
      <Button onClick={() => fileInputRef.current?.click()} variant="outline" disabled={isExtracting}>
        {isExtracting ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <FileText className="mr-2 h-4 w-4" />} {t('audioFactory.uploadPdf')}
      </Button>
      {pdfFile && <p className="text-sm text-muted-foreground">Selected: {pdfFile.name}</p>}
      {isExtracting && <p className="text-sm text-muted-foreground">Extracting text...</p>}
    </AudioSummarizer>
  );
}


export default function AudioFactoryPage() {
  const { t } = useTranslation();
  return (
    <div className="container mx-auto max-w-4xl px-4 py-8 space-y-8">
      <Card className="shadow-xl bg-card/90 backdrop-blur-sm">
        <CardHeader className="text-center">
          <div className="flex items-center justify-center mb-4"><AudioLines className="h-12 w-12 text-primary" /></div>
          <CardTitle className="text-xl sm:text-2xl font-bold text-primary">{t('audioFactory.title')}</CardTitle>
          <CardDescription>
            {t('audioFactory.description')}
          </CardDescription>
        </CardHeader>
      </Card>
      
      <Tabs defaultValue="flashcards" orientation="vertical" className="w-full grid grid-cols-1 md:grid-cols-[auto_1fr] gap-6 md:gap-8">
        <TabsList className="grid w-full grid-cols-1 justify-start h-auto gap-2">
          <TabsTrigger value="flashcards">{t('audioFactory.tabs.flashcards')}</TabsTrigger>
          <TabsTrigger value="text-summary">Text Summary</TabsTrigger>
          <TabsTrigger value="image-summary">{t('audioFactory.tabs.image')}</TabsTrigger>
          <TabsTrigger value="pdf-summary">{t('audioFactory.tabs.pdf')}</TabsTrigger>
        </TabsList>
        
        <div className="flex-1 min-w-0">
            <TabsContent value="flashcards" className="mt-0">
              <AudioFlashcardsGenerator />
            </TabsContent>
            <TabsContent value="text-summary" className="mt-0">
              <TextAudioSummarizer />
            </TabsContent>
            <TabsContent value="image-summary" className="mt-0">
              <ImageAudioSummarizer />
            </TabsContent>
            <TabsContent value="pdf-summary" className="mt-0">
              <PdfAudioSummarizer />
            </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}
