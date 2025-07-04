
"use client";

import { useState, useRef, type ChangeEvent, type FormEvent, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Send, Mic, ImageIcon, Loader2, X } from 'lucide-react';
import { useVoiceRecognition } from '@/hooks/useVoiceRecognition';
import { useToast } from '@/hooks/use-toast';
import Image from 'next/image';
import { useSound } from '@/hooks/useSound';
import { Tooltip, TooltipProvider, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { extractTextFromPdf } from '@/lib/utils';

interface ChatInputProps {
  onSendMessage: (message: string, image?: string, pdfFileName?: string) => void;
  isLoading: boolean;
}

export function ChatInput({ onSendMessage, isLoading }: ChatInputProps) {
  const [inputValue, setInputValue] = useState('');
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageData, setImageData] = useState<string | null>(null);
  const [pdfContent, setPdfContent] = useState<string | null>(null);
  const [pdfFileName, setPdfFileName] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const { playSound: playClickSound } = useSound('/sounds/ting.mp3', 0.3);

  const { isListening, transcript, startListening, stopListening, browserSupportsSpeechRecognition, error: voiceError } = useVoiceRecognition();
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
  };

  useEffect(() => { 
    if (transcript) {
      setInputValue(transcript);
    }
  }, [transcript]);

  const handleFileUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    playClickSound();
    const file = e.target.files?.[0];
    if (file) {
      if (file.type.startsWith('image/')) {
        if (file.size > 2 * 1024 * 1024) { // 2MB limit
          toast({ title: "Image too large", description: "Please upload an image smaller than 2MB.", variant: "destructive" });
          return;
        }
        const reader = new FileReader();
        reader.onloadend = () => {
          setImagePreview(reader.result as string);
          setImageData(reader.result as string);
          setPdfContent(null);
          setPdfFileName(null);
        };
        reader.readAsDataURL(file);
      } else if (file.type === 'application/pdf') {
        if (file.size > 5 * 1024 * 1024) { // 5MB limit
          toast({ title: "PDF too large", description: "Please upload a PDF smaller than 5MB.", variant: "destructive" });
          return;
        }
        toast({ title: "Processing PDF...", description: "Extracting text from your document." });
        try {
          const text = await extractTextFromPdf(file);
          setPdfContent(text);
          setPdfFileName(file.name);
          setImageData(null);
          setImagePreview(null);
          toast({ title: "PDF Processed!", description: "Text extracted. It will be sent with your next message." });
        } catch (error) {
          toast({ title: "PDF Error", description: "Could not extract text from the PDF.", variant: "destructive" });
        }
      } else {
        toast({ title: "Unsupported File", description: "Chat currently supports image and PDF uploads.", variant: "default" });
      }
    }
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    playClickSound();
    if (isLoading || (!inputValue.trim() && !imageData && !pdfContent)) return;

    let finalMessage = inputValue.trim();
    if (pdfContent) {
        // Prepend context about the PDF to the message for the AI
        finalMessage = `Regarding the attached document ("${pdfFileName}"), my question is: ${inputValue.trim()}\n\nHere is the full content of the document for your reference:\n\n--- PDF CONTENT START ---\n${pdfContent}\n--- PDF CONTENT END ---`;
    }

    onSendMessage(finalMessage, imageData || undefined, pdfFileName || undefined);

    setInputValue('');
    setImageData(null);
    setImagePreview(null);
    setPdfContent(null);
    setPdfFileName(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = ""; 
    }
  };

  const toggleListening = () => {
    playClickSound();
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };
  
  useEffect(() => {
    if (voiceError) {
      toast({ title: "Voice Input Error", description: voiceError, variant: "destructive" });
    }
  }, [voiceError, toast]);

  const handleRemoveImage = () => {
    playClickSound();
    setImagePreview(null); 
    setImageData(null); 
    if(fileInputRef.current) fileInputRef.current.value = "";
  }
  
  const handleRemovePdf = () => {
    playClickSound();
    setPdfContent(null);
    setPdfFileName(null);
    if (fileInputRef.current) {
        fileInputRef.current.value = "";
    }
  };

  return (
    <div className="bg-background/80 backdrop-blur-md p-4 border-t">
      <form onSubmit={handleSubmit} >
        {imagePreview && (
          <div className="mb-2 relative w-24 h-24">
            <Image src={imagePreview} alt="Preview" layout="fill" objectFit="cover" className="rounded-md" data-ai-hint="image preview" />
            <Button 
              type="button" 
              variant="ghost" 
              size="icon" 
              className="absolute -top-2 -right-2 h-6 w-6 bg-destructive/80 text-destructive-foreground rounded-full"
              onClick={handleRemoveImage}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        )}
         {pdfFileName && (
            <div className="mb-2 flex items-center justify-between gap-2 rounded-md border bg-muted p-2 text-sm text-muted-foreground">
                <div className="flex items-center gap-2 truncate">
                    <ImageIcon className="h-4 w-4 flex-shrink-0" />
                    <span className="truncate font-medium">{pdfFileName}</span>
                </div>
                <Button type="button" variant="ghost" size="icon" className="h-6 w-6 flex-shrink-0" onClick={handleRemovePdf}>
                    <X className="h-4 w-4" />
                </Button>
            </div>
        )}
        <div className="flex items-center gap-2">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button type="button" variant="ghost" size="icon" onClick={() => fileInputRef.current?.click()}>
                  <ImageIcon className="w-5 h-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent><p>Attach Image or PDF</p></TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <input type="file" accept="image/*,application/pdf" ref={fileInputRef} onChange={handleFileUpload} className="hidden" />

          {browserSupportsSpeechRecognition && (
            <Button type="button" variant="ghost" size="icon" onClick={toggleListening} disabled={isLoading}>
              <Mic className={`w-5 h-5 ${isListening ? 'text-destructive animate-pulse' : ''}`} />
              <span className="sr-only">{isListening ? 'Stop Listening' : 'Start Listening'}</span>
            </Button>
          )}

          <Input
            type="text"
            placeholder="Type your message or ask a question..."
            value={inputValue}
            onChange={handleInputChange}
            disabled={isLoading}
            className="flex-1"
          />
          <Button type="submit" size="icon" disabled={isLoading || (!inputValue.trim() && !imageData && !pdfContent)}>
            {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
            <span className="sr-only">Send Message</span>
          </Button>
        </div>
      </form>
    </div>
  );
}
