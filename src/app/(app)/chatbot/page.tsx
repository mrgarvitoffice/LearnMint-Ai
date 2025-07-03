
"use client";

import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ChatMessage } from '@/components/features/chatbot/ChatMessage';
import { ChatInput } from '@/components/features/chatbot/ChatInput';
import type { ChatMessage as ChatMessageType } from '@/lib/types';
import { gojoChatbot, type GojoChatbotInput } from '@/ai/flows/ai-chatbot';
import { holoChatbot, type HoloChatbotInput } from '@/ai/flows/megumin-chatbot'; // This file now exports Holo's logic
import { Bot, PlayCircle, PauseCircle, StopCircle, Wand2, Users } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useSound } from '@/hooks/useSound';
import { useTTS } from '@/hooks/useTTS';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

const PAGE_TITLE_CHATBOT = "AI Chat Central";
const TYPING_INDICATOR_ID = 'typing-indicator';

type ChatbotCharacter = 'gojo' | 'holo';

export default function ChatbotPage() {
  const [messages, setMessages] = useState<ChatMessageType[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedCharacter, setSelectedCharacter] = useState<ChatbotCharacter>('gojo');
  const [currentCharacterGreeting, setCurrentCharacterGreeting] = useState<string | null>(null);
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
    voicePreference,
  } = useTTS();

  const pageTitleSpokenRef = useRef(false);
  const voicePreferenceWasSetRef = useRef(false);
  const currentSpokenMessageRef = useRef<string | null>(null);
  const initialGreetingSpokenRef = useRef(false);

  useEffect(() => {
    if (supportedVoices.length > 0 && !voicePreferenceWasSetRef.current) {
      voicePreferenceWasSetRef.current = true;
    }
  }, [supportedVoices, setVoicePreference]);

  useEffect(() => {
    let isMounted = true;
    if (isMounted && selectedVoice && !isSpeaking && !isPaused && !pageTitleSpokenRef.current) {
      const characterExpectedVoicePref = selectedCharacter === 'gojo' ? 'kai' : 'zia';
      if (voicePreference !== characterExpectedVoicePref || !currentCharacterGreeting) {
         speak(PAGE_TITLE_CHATBOT);
      }
      pageTitleSpokenRef.current = true;
    }
    return () => { isMounted = false; };
  }, [selectedVoice, voicePreference, isSpeaking, isPaused, speak, currentCharacterGreeting, selectedCharacter]);

  useEffect(() => {
    cancelTTS();
    initialGreetingSpokenRef.current = false;
    pageTitleSpokenRef.current = true; 
    let greetingText = "";
    let characterVoicePref: 'kai' | 'zia' | null = null;

    if (selectedCharacter === 'gojo') {
      greetingText = "Yo! Took you long enough. Thought I’d have to go fight boredom without you.";
      characterVoicePref = 'kai';
    } else if (selectedCharacter === 'holo') {
      greetingText = "Ah, the little one returns. Have you come to bask in my brilliance again?";
      characterVoicePref = 'zia';
    }
    
    setVoicePreference(characterVoicePref);
    setCurrentCharacterGreeting(greetingText);

    const initialGreetingMessage: ChatMessageType = {
      id: `${selectedCharacter}-initial-greeting-${Date.now()}`, role: 'assistant',
      content: greetingText, timestamp: new Date()
    };
    setMessages([initialGreetingMessage]);

  }, [selectedCharacter, cancelTTS, setVoicePreference]);

  useEffect(() => {
    const characterExpectedVoicePref = selectedCharacter === 'gojo' ? 'kai' : 'zia';
    if (currentCharacterGreeting && !initialGreetingSpokenRef.current && selectedVoice && 
        voicePreference === characterExpectedVoicePref && !isSpeaking && !isPaused) {
      
      currentSpokenMessageRef.current = currentCharacterGreeting;
      
      setTimeout(() => {
        if (currentCharacterGreeting && selectedCharacter === (voicePreference === 'kai' ? 'gojo' : 'holo') && !isSpeaking && !isPaused) {
            speak(currentCharacterGreeting);
        }
      }, 150); 
      initialGreetingSpokenRef.current = true;
    }
  }, [currentCharacterGreeting, selectedVoice, voicePreference, isSpeaking, isPaused, speak, selectedCharacter]);

  useEffect(() => {
    if (scrollAreaRef.current) {
      const viewport = scrollAreaRef.current.querySelector('div[data-radix-scroll-area-viewport]');
      if (viewport) viewport.scrollTop = viewport.scrollHeight;
    }
  }, [messages]);

  const handleSendMessage = async (messageText: string, image?: string) => {
    if (!messageText.trim() && !image) return;
    cancelTTS(); 

    const userMessage: ChatMessageType = { id: Date.now().toString() + '-user', role: 'user', content: messageText, image: image, timestamp: new Date() };
    const typingIndicatorMessage = selectedCharacter === 'gojo'
      ? "Gojo is contemplating..."
      : "Holo is contemplating her wisdom...";
    const typingIndicator: ChatMessageType = { id: TYPING_INDICATOR_ID, role: 'assistant', content: typingIndicatorMessage, timestamp: new Date(), type: 'typing_indicator' };

    setMessages(prev => [...prev, userMessage, typingIndicator]);
    setIsLoading(true);

    try {
      const input: GojoChatbotInput | HoloChatbotInput = { message: messageText };
      if (image) input.image = image;

      const response = selectedCharacter === 'gojo'
        ? await gojoChatbot(input as GojoChatbotInput)
        : await holoChatbot(input as HoloChatbotInput);

      const assistantMessage: ChatMessageType = { id: Date.now().toString() + '-assistant', role: 'assistant', content: response.response, timestamp: new Date() };

      setMessages(prev => prev.filter(msg => msg.id !== TYPING_INDICATOR_ID));
      setMessages(prev => [...prev, assistantMessage]);

      const characterVoicePref = selectedCharacter === 'gojo' ? 'kai' : 'zia';
      if (selectedVoice && voicePreference === characterVoicePref && !isSpeaking && !isPaused) {
        currentSpokenMessageRef.current = assistantMessage.content;
        speak(assistantMessage.content);
      }
    } catch (error) {
      console.error('Error sending message to chatbot:', error);
      const errorText = selectedCharacter === 'gojo' ? "Hoh? Something went wrong. Let's try that again." : "Hmph. My wisdom must have been too much for this device. Try again.";
      toast({ title: "Chatbot Error", description: errorText, variant: "destructive" });
      const errorMessageContent = selectedCharacter === 'gojo' ? "My technique must've fizzled. Ask again, I wasn't paying attention." : "My thoughts must have wandered to a distant harvest. Ask again.";
      const errorMessage: ChatMessageType = { id: Date.now().toString() + '-error', role: 'system', content: errorMessageContent, timestamp: new Date() };
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

    const characterExpectedVoicePref = selectedCharacter === 'gojo' ? 'kai' : 'zia';
    if (voicePreference !== characterExpectedVoicePref) {
        setVoicePreference(characterExpectedVoicePref);
        setTimeout(() => {
            if (selectedVoice && !isSpeaking && !isPaused) speak(textToPlay!);
            else if (isSpeaking && !isPaused) pauseTTS();
            else if (isPaused) resumeTTS();
        }, 100);
        return;
    }

    if (selectedVoice && !isSpeaking && !isPaused) speak(textToPlay);
    else if (isSpeaking && !isPaused) pauseTTS();
    else if (isPaused) resumeTTS();
  };

  const handleStopTTS = () => { playClickSound(); cancelTTS(); };

  const handleCharacterChange = (value: ChatbotCharacter) => {
    playClickSound();
    setSelectedCharacter(value);
  };

  const getCurrentCharacterAvatar = () => {
    if (selectedCharacter === 'gojo') return "/images/gojo-dp.jpg";
    return "/images/holo-dp.jpg"; 
  };
  
  const getCurrentCharacterAIName = () => selectedCharacter === 'gojo' ? 'Gojo AI' : 'Holo AI';
  const getCurrentCharacterAIDescription = () => selectedCharacter === 'gojo' ? 'The Honored One is here to help.' : 'The Wise Wolf of Yoitsu.';
  const getCurrentCharacterAvatarHint = () => selectedCharacter === 'gojo' ? 'Gojo Satoru' : 'Holo wise wolf';

  return (
    <div className="container mx-auto p-4 md:p-6 lg:p-8 h-full flex flex-col">
    <Card className="h-full flex flex-col flex-1">
      <CardHeader className="border-b">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
            <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10 sm:h-12 sm:w-12 border-2 border-primary/30">
                  <AvatarImage src={getCurrentCharacterAvatar()} alt={`${selectedCharacter} avatar`} data-ai-hint={getCurrentCharacterAvatarHint()} />
                  <AvatarFallback>
                    {selectedCharacter === 'gojo' ? <Bot /> : <Wand2 />}
                  </AvatarFallback>
                </Avatar>
                <div>
                    <CardTitle className="text-xl sm:text-2xl font-bold text-primary">{getCurrentCharacterAIName()}</CardTitle>
                    <CardDescription>{getCurrentCharacterAIDescription()}</CardDescription>
                </div>
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto pt-2 sm:pt-0">
              <Select value={selectedCharacter} onValueChange={(val: ChatbotCharacter) => handleCharacterChange(val)}>
                <SelectTrigger className="w-auto text-xs h-8 min-w-[100px]">
                  <Users className="h-3.5 w-3.5 mr-1.5 opacity-70"/>
                  <SelectValue placeholder="Character" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="gojo">Gojo</SelectItem>
                  <SelectItem value="holo">Holo</SelectItem>
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
            {messages.map((msg) => <ChatMessage key={msg.id} message={msg} character={selectedCharacter}/>)}
          </div>
        </ScrollArea>
      </CardContent>
      <ChatInput onSendMessage={handleSendMessage} isLoading={isLoading} />
    </Card>
    </div>
  );
}
