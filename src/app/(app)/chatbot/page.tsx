
"use client";

import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ChatMessage } from '@/components/features/chatbot/ChatMessage';
import { ChatInput } from '@/components/features/chatbot/ChatInput';
import type { ChatMessage as ChatMessageType } from '@/lib/types';
import { meguminChatbot, type MeguminChatbotInput } from '@/ai/flows/ai-chatbot';
import { Bot } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useSound } from '@/hooks/useSound';
import { useTTS } from '@/hooks/useTTS';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from '@/components/ui/button';

const TYPING_INDICATOR_ID = 'typing-indicator';

export default function ChatbotPage() {
  const [messages, setMessages] = useState<ChatMessageType[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const { playSound: playMessageSound } = useSound('/sounds/ting.mp3', 0.3);
  const { speak, cancel, isSpeaking, supportedVoices, selectedVoice, setSelectedVoiceURI, setVoicePreference } = useTTS();
  const initialGreetingSpokenRef = useRef(false);
  const voicePreferenceWasSetRef = useRef(false);

  useEffect(() => {
    if (supportedVoices.length > 0 && !voicePreferenceWasSetRef.current) {
      setVoicePreference('female'); // Default to female for chatbot replies
      voicePreferenceWasSetRef.current = true;
    }
  }, [supportedVoices, setVoicePreference]);

  useEffect(() => {
    // Scroll to bottom when new messages are added
    if (scrollAreaRef.current) {
      const viewport = scrollAreaRef.current.querySelector('div[data-radix-scroll-area-viewport]');
      if (viewport) {
        viewport.scrollTop = viewport.scrollHeight;
      }
    }
  }, [messages]);
  
  useEffect(() => {
    const initialGreeting: ChatMessageType = { 
      id: 'initial-greeting', 
      role: 'assistant', 
      content: "Kazuma, Kazuma! It's me, Megumin, the greatest archwizard of the Crimson Demon Clan! What explosive adventure shall we embark on today? Ask me anything!", 
      timestamp: new Date() 
    };
    setMessages([initialGreeting]);

    if (selectedVoice && !initialGreetingSpokenRef.current && !isSpeaking) {
      speak(initialGreeting.content);
      initialGreetingSpokenRef.current = true;
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedVoice]); // Rerun if selectedVoice changes initially, speak depends on selectedVoice

  const handleSendMessage = async (messageText: string, image?: string) => {
    if (!messageText.trim() && !image) return;

    const userMessage: ChatMessageType = {
      id: Date.now().toString() + '-user',
      role: 'user',
      content: messageText,
      image: image,
      timestamp: new Date(),
    };
    
    const typingIndicator: ChatMessageType = {
      id: TYPING_INDICATOR_ID,
      role: 'assistant',
      content: "Megumin is conjuring a response...",
      timestamp: new Date(),
      type: 'typing_indicator',
    };

    setMessages(prev => [...prev, userMessage, typingIndicator]);
    setIsLoading(true);

    try {
      const input: MeguminChatbotInput = { message: messageText };
      if (image) {
        input.image = image;
      }
      const response = await meguminChatbot(input);
      
      const assistantMessage: ChatMessageType = {
        id: Date.now().toString() + '-assistant',
        role: 'assistant',
        content: response.response,
        timestamp: new Date(),
      };
      
      setMessages(prev => prev.filter(msg => msg.id !== TYPING_INDICATOR_ID)); // Remove typing indicator
      setMessages(prev => [...prev, assistantMessage]);
      playMessageSound();
      if (selectedVoice && !isSpeaking) {
        speak(assistantMessage.content);
      }

    } catch (error) {
      console.error('Error sending message to chatbot:', error);
      toast({ title: "Chatbot Error", description: "Megumin is busy casting Explosion magic! Please try again later.", variant: "destructive" });
      const errorMessage: ChatMessageType = {
        id: Date.now().toString() + '-error',
        role: 'system',
        content: "Sorry, I couldn't process that. My explosion magic might be on cooldown!",
        timestamp: new Date(),
      };
      setMessages(prev => prev.filter(msg => msg.id !== TYPING_INDICATOR_ID)); // Remove typing indicator
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="h-[calc(100vh-10rem)] md:h-[calc(100vh-8rem)] flex flex-col">
      <CardHeader>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
            <div>
                <CardTitle className="flex items-center gap-2 text-2xl">
                <Bot className="w-7 h-7 text-primary" />
                Chat with Megumin
                </CardTitle>
                <CardDescription>Your playful AI assistant. Try asking her to "sing a song about explosions!"</CardDescription>
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Select onValueChange={(value) => setVoicePreference(value as 'male' | 'female' | 'kai' | 'zia')}>
                <SelectTrigger className="w-full sm:w-[150px] text-xs">
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
                <SelectTrigger className="w-full sm:w-[180px] text-xs">
                  <SelectValue placeholder="Select Voice Engine" />
                </SelectTrigger>
                <SelectContent>
                  {supportedVoices.length > 0 ? supportedVoices.map(voice => (
                    <SelectItem key={voice.voiceURI} value={voice.voiceURI} className="text-xs">
                      {voice.name} ({voice.lang})
                    </SelectItem>
                  )) : <SelectItem value="no-voices" disabled className="text-xs">No voices available</SelectItem>}
                </SelectContent>
              </Select>
               <Button variant="outline" size="icon" onClick={cancel} disabled={!isSpeaking} className="h-8 w-8">
                 <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="6" y="6" width="12" height="12"></rect></svg>
               </Button>
            </div>
        </div>
      </CardHeader>
      <CardContent className="flex-1 overflow-hidden p-0">
        <ScrollArea className="h-full p-4" ref={scrollAreaRef}>
          <div className="space-y-4">
            {messages.map((msg) => (
              <ChatMessage key={msg.id} message={msg} />
            ))}
          </div>
        </ScrollArea>
      </CardContent>
      <ChatInput onSendMessage={handleSendMessage} isLoading={isLoading} />
    </Card>
  );
}
