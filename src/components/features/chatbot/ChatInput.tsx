
"use client";

import { useState, useRef, type ChangeEvent, type FormEvent, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Send, Mic, ImageIcon, Loader2, X } from 'lucide-react';
import { useVoiceRecognition } from '@/hooks/useVoiceRecognition';
import { useToast } from '@/hooks/use-toast';
import Image from 'next/image';
import { useSound } from '@/hooks/useSound';


interface ChatInputProps {
  onSendMessage: (message: string, image?: string) => void;
  isLoading: boolean;
}

export function ChatInput({ onSendMessage, isLoading }: ChatInputProps) {
  const [inputValue, setInputValue] = useState('');
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageData, setImageData] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const { playSound: playClickSound } = useSound('/sounds/ting.mp3', 0.3);

  const { isListening, transcript, startListening, stopListening, browserSupportsSpeechRecognition, error: voiceError } = useVoiceRecognition();
  
  useEffect(() => { 
    if (transcript) {
      setInputValue(transcript);
    }
  }, [transcript]);

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
  };

  const handleImageUpload = (e: ChangeEvent<HTMLInputElement>) => {
    playClickSound();
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) { // 2MB limit
        toast({ title: "Image too large", description: "Please upload an image smaller than 2MB.", variant: "destructive" });
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
        setImageData(reader.result as string); 
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    playClickSound();
    if (isLoading || (!inputValue.trim() && !imageData)) return;
    onSendMessage(inputValue.trim(), imageData || undefined);
    setInputValue('');
    setImageData(null);
    setImagePreview(null);
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

  const handleImageIconClick = () => {
    playClickSound();
    fileInputRef.current?.click();
  }

  return (
    <form onSubmit={handleSubmit} className="sticky bottom-0 bg-background/80 backdrop-blur-md p-4 border-t">
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
      <div className="flex items-center gap-2">
        <Button type="button" variant="ghost" size="icon" onClick={handleImageIconClick} disabled={isLoading}>
          <ImageIcon className="w-5 h-5" />
          <span className="sr-only">Upload Image</span>
        </Button>
        <input type="file" accept="image/*" ref={fileInputRef} onChange={handleImageUpload} className="hidden" />

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
        <Button type="submit" size="icon" disabled={isLoading || (!inputValue.trim() && !imageData)}>
          {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
          <span className="sr-only">Send Message</span>
        </Button>
      </div>
    </form>
  );
}
