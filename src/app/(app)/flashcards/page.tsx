
"use client";

import { useState, useRef, useEffect, type ChangeEvent } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Loader2, Sparkles, AudioLines, Mic, Volume2, Layers, FileText, Image as ImageIcon, XCircle } from 'lucide-react';
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
  const audioPlayerRef = useRef<HTMLAudioElement>(null);

  const { mutate: generate, isPending: isLoading } = useMutation({
    mutationFn: generateAudioFlashcardsAction,
    onSuccess: (data) => {
      if (!data.flashcards || data.flashcards.length === 0) {
        toast({ title: "Generation Issue", description: "The AI generated no flashcards for this topic.", variant: 'default' });
        setGeneratedContent(null);
        return;
      }
      setGeneratedContent(data);
      toast({ title: "Generation Complete!", description: `${data.flashcards.length} flashcards created.${data.audioDataUri ? ' Audio is ready.' : ' Audio generation failed.'}` });
      if(data.audioDataUri && audioPlayerRef.current) {
        audioPlayerRef.current.load();
        audioPlayerRef.current.play().catch(e => console.error("Audio autoplay failed:", e));
      }
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
    setGeneratedContent(null);
    generate({ topic, numFlashcards });
  };
  
  const handleMicClick = () => {
    playClickSound();
    if (isListening) stopListening();
    else startListening();
  };
  
  useEffect(() => { if (transcript) setTopic(transcript); }, [transcript]);

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
          {generatedContent.audioDataUri && (
            <div className="mb-6">
              <Alert>
                <Volume2 className="h-4 w-4" />
                <AlertTitle>{t('audioFactory.audio')}</AlertTitle>
                <AlertDescription>Press play to listen to all flashcards.</AlertDescription>
              </Alert>
              <audio ref={audioPlayerRef} controls src={generatedContent.audioDataUri} className="w-full mt-3" />
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

// Sub-component for Text Audio Summary
function TextAudioSummarizer() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const { playSound: playActionSound } = useSound('/sounds/custom-sound-2.mp3', 0.4);
  const { playSound: playClickSound } = useSound('/sounds/ting.mp3', 0.3);
  const [textInput, setTextInput] = useState('');
  const [generatedContent, setGeneratedContent] = useState<GenerateAudioSummaryOutput | null>(null);

  const { isListening, transcript, startListening, stopListening, browserSupportsSpeechRecognition } = useVoiceRecognition();
  useEffect(() => { if (transcript) setTextInput(transcript); }, [transcript]);

  const { mutate: generate, isPending: isLoading } = useMutation({
    mutationFn: generateAudioSummaryAction,
    onSuccess: (data) => {
      setGeneratedContent(data);
      toast({ title: "Summary Complete!", description: "AI has generated a summary and audio for your text."});
    },
    onError: (error) => {
      toast({ title: "Summary Failed", description: error.message, variant: "destructive" });
    }
  });

  const handleGenerate = () => {
    playActionSound();
    if (textInput.trim().length < 50) {
      toast({ title: "Text Too Short", description: "Please provide at least 50 characters to summarize.", variant: "destructive" });
      return;
    }
    generate({ text: textInput });
  };
  
  const handleMicClick = () => {
    playClickSound();
    if (isListening) stopListening();
    else startListening();
  };

  return (
    <Card className="shadow-lg border-none">
      <CardHeader>
        <CardTitle>Text Audio Summarizer</CardTitle>
        <CardDescription>Paste your notes, or dictate them, to get a spoken summary.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="text-input">Your Text</Label>
          <div className="relative">
             <Textarea 
              id="text-input" 
              placeholder="Paste your content here (minimum 50 characters) or use the mic..." 
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              rows={8}
              disabled={isLoading}
              className="pr-12"
            />
             {browserSupportsSpeechRecognition && (
                <Button 
                    type="button"
                    variant="ghost" 
                    size="icon" 
                    onClick={handleMicClick} 
                    disabled={isLoading} 
                    className="absolute bottom-2 right-2"
                    title="Use voice input"
                >
                    <Mic className={`h-5 w-5 ${isListening ? 'text-destructive animate-pulse' : ''}`} />
                </Button>
            )}
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex-col items-center gap-4">
        <Button onClick={handleGenerate} disabled={textInput.trim().length < 50 || isLoading}>
          {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
          {t('audioFactory.generate')} Summary
        </Button>
        {isLoading && <p className="text-sm text-muted-foreground">{t('audioFactory.generating')}</p>}
        {generatedContent && (
          <div className="w-full space-y-4 pt-4 border-t">
            <h3 className="font-semibold">{t('audioFactory.summary')}</h3>
            <p className="text-sm text-muted-foreground bg-muted p-3 rounded-md">{generatedContent.summary}</p>
            <h3 className="font-semibold">{t('audioFactory.audio')}</h3>
            <audio controls src={generatedContent.audioDataUri} className="w-full" />
          </div>
        )}
      </CardFooter>
    </Card>
  );
}


// Sub-component for Image Audio Summary
function ImageAudioSummarizer() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const { playSound: playActionSound } = useSound('/sounds/custom-sound-2.mp3', 0.4);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageData, setImageData] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [generatedContent, setGeneratedContent] = useState<GenerateAudioSummaryOutput | null>(null);

  const { mutate: generate, isPending: isLoading } = useMutation({
    mutationFn: generateAudioSummaryAction,
    onSuccess: (data) => {
      setGeneratedContent(data);
      toast({ title: "Summary Complete!", description: "AI has generated a summary and audio for your image."});
    },
    onError: (error) => {
      toast({ title: "Summary Failed", description: error.message, variant: "destructive" });
    }
  });

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
        toast({ title: t('audioFactory.invalidFileType'), variant: "destructive" });
        return;
    }
    if (file.size > 2 * 1024 * 1024) { // 2MB limit
      toast({ title: t('audioFactory.imageTooLarge'), variant: "destructive" });
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
      setImageData(reader.result as string);
      setGeneratedContent(null);
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveImage = () => {
    setImagePreview(null);
    setImageData(null);
    setGeneratedContent(null);
    if(fileInputRef.current) fileInputRef.current.value = "";
  }

  const handleGenerate = () => {
    playActionSound();
    if (!imageData) return;
    generate({ imageDataUri: imageData });
  };

  return (
    <Card className="shadow-lg border-none">
       <CardHeader>
        <CardTitle>{t('audioFactory.image.title')}</CardTitle>
        <CardDescription>{t('audioFactory.image.description')}</CardDescription>
      </CardHeader>
       <CardContent className="space-y-4">
        <input type="file" accept="image/*" ref={fileInputRef} onChange={handleFileChange} className="hidden" />
        <Button onClick={() => fileInputRef.current?.click()} variant="outline">
            <ImageIcon className="mr-2 h-4 w-4" /> {t('audioFactory.uploadImage')}
        </Button>
        {imagePreview && (
             <div className="relative w-40 h-40 mx-auto">
                <NextImage src={imagePreview} alt="Selected preview" layout="fill" objectFit="cover" className="rounded-md border-2 border-primary/50" />
                <Button type="button" variant="ghost" size="icon" onClick={handleRemoveImage} className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-destructive text-destructive-foreground">
                    <XCircle className="w-4 h-4" />
                </Button>
            </div>
        )}
      </CardContent>
      <CardFooter className="flex-col items-center gap-4">
        <Button onClick={handleGenerate} disabled={!imageData || isLoading}>
          {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
          {t('audioFactory.generate')} Summary
        </Button>
         {isLoading && <p className="text-sm text-muted-foreground">{t('audioFactory.generating')}</p>}
         {generatedContent && (
             <div className="w-full space-y-4 pt-4 border-t">
                <h3 className="font-semibold">{t('audioFactory.summary')}</h3>
                <p className="text-sm text-muted-foreground bg-muted p-3 rounded-md">{generatedContent.summary}</p>
                <h3 className="font-semibold">{t('audioFactory.audio')}</h3>
                <audio controls src={generatedContent.audioDataUri} className="w-full" />
             </div>
         )}
      </CardFooter>
    </Card>
  );
}

// Sub-component for PDF Audio Summary
function PdfAudioSummarizer() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const { playSound: playActionSound } = useSound('/sounds/custom-sound-2.mp3', 0.4);
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [extractedText, setExtractedText] = useState<string | null>(null);
  const [isExtracting, setIsExtracting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [generatedContent, setGeneratedContent] = useState<GenerateAudioSummaryOutput | null>(null);

  const { mutate: generate, isPending: isLoading } = useMutation({
    mutationFn: generateAudioSummaryAction,
    onSuccess: (data) => {
      setGeneratedContent(data);
      toast({ title: "Summary Complete!", description: "AI has generated a summary and audio for your PDF."});
    },
    onError: (error) => {
      toast({ title: "Summary Failed", description: error.message, variant: "destructive" });
    }
  });

  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
        toast({ title: t('audioFactory.invalidFileType'), variant: "destructive" });
        return;
    }
    if (file.size > 5 * 1024 * 1024) { // 5MB limit
        toast({ title: t('audioFactory.pdfTooLarge'), variant: "destructive" });
        return;
    }
    setPdfFile(file);
    setGeneratedContent(null);
    setIsExtracting(true);
    try {
        const text = await extractTextFromPdf(file);
        setExtractedText(text);
        toast({title: "PDF Processed", description: "Text extracted successfully. You can now generate the summary."});
    } catch (err) {
        toast({ title: t('audioFactory.pdfExtractError'), variant: "destructive" });
        console.error(err);
        setExtractedText(null);
        setPdfFile(null);
    } finally {
        setIsExtracting(false);
    }
  };
  
  const handleGenerate = () => {
    playActionSound();
    if (!extractedText) return;
    generate({ text: extractedText });
  };

  return (
    <Card className="shadow-lg border-none">
       <CardHeader>
        <CardTitle>{t('audioFactory.pdf.title')}</CardTitle>
        <CardDescription>{t('audioFactory.pdf.description')}</CardDescription>
      </CardHeader>
       <CardContent className="space-y-4">
        <input type="file" accept="application/pdf" ref={fileInputRef} onChange={handleFileChange} className="hidden" />
        <Button onClick={() => fileInputRef.current?.click()} variant="outline" disabled={isExtracting}>
            {isExtracting ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <FileText className="mr-2 h-4 w-4" />}
            {t('audioFactory.uploadPdf')}
        </Button>
        {pdfFile && <p className="text-sm text-muted-foreground">Selected: {pdfFile.name}</p>}
      </CardContent>
       <CardFooter className="flex-col items-center gap-4">
        <Button onClick={handleGenerate} disabled={!extractedText || isLoading || isExtracting}>
          {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
          {t('audioFactory.generate')} Summary
        </Button>
         {(isLoading || isExtracting) && <p className="text-sm text-muted-foreground">{isExtracting ? "Extracting text..." : t('audioFactory.generating')}</p>}
         {generatedContent && (
             <div className="w-full space-y-4 pt-4 border-t">
                <h3 className="font-semibold">{t('audioFactory.summary')}</h3>
                <p className="text-sm text-muted-foreground bg-muted p-3 rounded-md">{generatedContent.summary}</p>
                <h3 className="font-semibold">{t('audioFactory.audio')}</h3>
                <audio controls src={generatedContent.audioDataUri} className="w-full" />
             </div>
         )}
      </CardFooter>
    </Card>
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
      
      <Tabs defaultValue="flashcards" orientation="vertical" className="w-full grid grid-cols-1 md:grid-cols-[auto_1fr] gap-8">
        <TabsList className="grid w-full grid-cols-2 gap-4 md:w-full md:grid-cols-1 md:justify-start md:h-auto">
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
