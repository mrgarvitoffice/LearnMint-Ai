
"use client";

import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ChatMessage } from '@/components/features/chatbot/ChatMessage';
import { ChatInput } from '@/components/features/chatbot/ChatInput';
import type { ChatMessage as ChatMessageType } from '@/lib/types';
import { kazumaChatbot, type KazumaChatbotInput } from '@/ai/flows/ai-chatbot'; // Updated import
import { Bot, PlayCircle, PauseCircle, StopCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useSound } from '@/hooks/useSound';
import { useTTS } from '@/hooks/useTTS';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from '@/components/ui/button';

const PAGE_TITLE = "Kazuma AI: Your (Reluctant) Companion"; // Updated title
const TYPING_INDICATOR_ID = 'typing-indicator';

export default function ChatbotPage() {
  const [messages, setMessages] = useState<ChatMessageType[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const { playSound: playClickSound } = useSound('/sounds/ting.mp3', 0.3);

  const {
    speak,
    pauseTTS,
    resumeTTS,
    cancelTTS,
    isSpeaking,
    isPaused,
    supportedVoices,
    selectedVoice,
    setVoicePreference,
    voicePreference
  } = useTTS();

  const pageTitleSpokenRef = useRef(false);
  const voicePreferenceWasSetRef = useRef(false);
  const chatbotVoicePreferenceSetRef = useRef(false);
  const initialGreetingSpokenRef = useRef(false);
  const currentSpokenMessageRef = useRef<string | null>(null);

  useEffect(() => {
    if (supportedVoices.length > 0 && !voicePreferenceWasSetRef.current) {
      setVoicePreference('luma'); // Page title still uses default (female-implied) preference
      voicePreferenceWasSetRef.current = true;
    }
  }, [supportedVoices, setVoicePreference]);

  useEffect(() => {
    // Set the voice preference for Kazuma's replies specifically
    if (supportedVoices.length > 0 && !chatbotVoicePreferenceSetRef.current) {
        setVoicePreference('kai'); // Kazuma's replies should default to Kai (male)
        chatbotVoicePreferenceSetRef.current = true;
    }
  }, [supportedVoices, setVoicePreference]);


  useEffect(() => {
    let isMounted = true;
    if (isMounted && selectedVoice && !isSpeaking && !isPaused && !pageTitleSpokenRef.current) {
      speak(PAGE_TITLE);
      pageTitleSpokenRef.current = true;
    }
    return () => {
      isMounted = false;
    };
  }, [selectedVoice, isSpeaking, isPaused, speak]);


  useEffect(() => {
    if (scrollAreaRef.current) {
      const viewport = scrollAreaRef.current.querySelector('div[data-radix-scroll-area-viewport]');
      if (viewport) viewport.scrollTop = viewport.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    const initialGreeting: ChatMessageType = {
      id: 'initial-greeting', role: 'assistant',
      content: "Yo. Kazuma here. Don't expect too much, but I guess I can answer your questions or whatever. Just try not to get us into too much trouble, okay?", // Updated greeting
      timestamp: new Date()
    };
    setMessages([initialGreeting]);

    // Speak initial greeting only if voice is 'kai' and conditions met
    if (selectedVoice && voicePreference === 'kai' && !initialGreetingSpokenRef.current && !isSpeaking && !isPaused) {
      currentSpokenMessageRef.current = initialGreeting.content;
      speak(initialGreeting.content);
      initialGreetingSpokenRef.current = true;
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run once on mount

  useEffect(() => {
    if (messages.length === 1 && messages[0].id === 'initial-greeting' &&
        selectedVoice && voicePreference === 'kai' && 
        !initialGreetingSpokenRef.current && !isSpeaking && !isPaused) {
      
      currentSpokenMessageRef.current = messages[0].content;
      speak(messages[0].content);
      initialGreetingSpokenRef.current = true;
    }
  }, [selectedVoice, voicePreference, messages, speak, isSpeaking, isPaused]);


  const handleSendMessage = async (messageText: string, image?: string) => {
    if (!messageText.trim() && !image) return;
    cancelTTS(); 

    const userMessage: ChatMessageType = { id: Date.now().toString() + '-user', role: 'user', content: messageText, image: image, timestamp: new Date() };
    const typingIndicator: ChatMessageType = { id: TYPING_INDICATOR_ID, role: 'assistant', content: "Kazuma is thinking... (probably about how much effort this is)", timestamp: new Date(), type: 'typing_indicator' };

    setMessages(prev => [...prev, userMessage, typingIndicator]);
    setIsLoading(true);

    try {
      const input: KazumaChatbotInput = { message: messageText };
      if (image) input.image = image;
      const response = await kazumaChatbot(input); // Use kazumaChatbot

      const assistantMessage: ChatMessageType = { id: Date.now().toString() + '-assistant', role: 'assistant', content: response.response, timestamp: new Date() };

      setMessages(prev => prev.filter(msg => msg.id !== TYPING_INDICATOR_ID));
      setMessages(prev => [...prev, assistantMessage]);

      // Speak assistant's message using Kazuma's voice preference
      if (selectedVoice && voicePreference === 'kai' && !isSpeaking && !isPaused) { 
        currentSpokenMessageRef.current = assistantMessage.content;
        speak(assistantMessage.content);
      }
    } catch (error) {
      console.error('Error sending message to chatbot:', error);
      toast({ title: "Chatbot Error", description: "Kazuma's probably slacking off. Try again later.", variant: "destructive" });
      const errorMessage: ChatMessageType = { id: Date.now().toString() + '-error', role: 'system', content: "Oi, something went wrong. Not my fault, probably.", timestamp: new Date() };
      setMessages(prev => prev.filter(msg => msg.id !== TYPING_INDICATOR_ID));
      setMessages(prev => [...prev, errorMessage]);
    } finally { setIsLoading(false); }
  };

  const handlePlaybackControl = () => {
    playClickSound();
    let textToPlay = currentSpokenMessageRef.current;
    if (!textToPlay && messages.length > 0) {
      const lastAssistantMessage = [...messages].reverse().find(m => m.role === 'assistant' && m.type !== 'typing_indicator');
      if (lastAssistantMessage) textToPlay = lastAssistantMessage.content;
    }
    if (!textToPlay && messages.length > 0 && messages[0].role === 'assistant') { 
        textToPlay = messages[0].content;
    }
    if (!textToPlay) return;

    if (selectedVoice && !isSpeaking && !isPaused) speak(textToPlay);
    else if (isSpeaking && !isPaused) pauseTTS();
    else if (isPaused) resumeTTS();
  };

  const handleStopTTS = () => { playClickSound(); cancelTTS(); };
  
  const handleChatbotVoicePreferenceChange = (value: string) => {
    playClickSound();
    setVoicePreference(value as 'luma' | 'kai' | null);
  };

  const getSelectedDropdownValue = () => {
    if (voicePreference) return voicePreference;
    // Infer preference from selectedVoice name if voicePreference is null for Kazuma's context
    if (selectedVoice?.name.toLowerCase().includes('kai')) return 'kai';
    if (selectedVoice?.name.toLowerCase().includes('luma')) return 'luma'; // Should be 'kai' if that's the intended character voice
    return 'kai'; // Default UI selection to Kai for Kazuma
  };


  return (
    <Card className="h-[calc(100vh-10rem)] md:h-[calc(100vh-8rem)] flex flex-col">
      <CardHeader className="border-b">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
            <div className="flex items-center gap-3">
                <Bot className="h-7 w-7 text-primary" />
                <div>
                    <CardTitle className="text-xl sm:text-2xl font-bold text-primary">{PAGE_TITLE}</CardTitle>
                    <CardDescription>Your pragmatic (and slightly reluctant) AI companion.</CardDescription>
                </div>
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto pt-2 sm:pt-0">
              <Select
                value={getSelectedDropdownValue()} 
                onValueChange={handleChatbotVoicePreferenceChange}
              >
                <SelectTrigger className="w-auto text-xs h-8"> <SelectValue placeholder="Voice" /> </SelectTrigger>
                <SelectContent>
                  <SelectItem value="kai">Kai</SelectItem>
                  <SelectItem value="luma">Luma</SelectItem>
                </SelectContent>
              </Select>

              <Button onClick={handlePlaybackControl} variant="outline" size="icon" className="h-8 w-8" title={isSpeaking && !isPaused ? "Pause Speech" : isPaused ? "Resume Speech" : "Play Last Message"}>
                {isSpeaking && !isPaused ? <PauseCircle className="h-4 w-4" /> : <PlayCircle className="h-4 w-4" />}
              </Button>
              <Button onClick={handleStopTTS} variant="outline" size="icon" className="h-8 w-8" title="Stop Speech" disabled={!isSpeaking && !isPaused}>
                <StopCircle className="h-4 w-4" />
              </Button>
            </div>
        </div>
      </CardHeader>
      <CardContent className="flex-1 overflow-hidden p-0">
        <ScrollArea className="h-full p-4" ref={scrollAreaRef}>
          <div className="space-y-4 pb-4">
            {messages.map((msg) => <ChatMessage key={msg.id} message={msg} />)}
          </div>
        </ScrollArea>
      </CardContent>
      <ChatInput onSendMessage={handleSendMessage} isLoading={isLoading} />
    </Card>
  );
}
