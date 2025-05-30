
"use client";

import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ChatMessage } from '@/components/features/chatbot/ChatMessage';
import { ChatInput } from '@/components/features/chatbot/ChatInput';
import type { ChatMessage as ChatMessageType } from '@/lib/types';
import { meguminChatbot, type MeguminChatbotInput } from '@/ai/flows/ai-chatbot';
import { Bot, PlayCircle, PauseCircle, StopCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useSound } from '@/hooks/useSound';
import { useTTS } from '@/hooks/useTTS';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from '@/components/ui/button';

const PAGE_TITLE = "Megumin AI: Your Witty Companion";
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
  const voicePreferenceWasSetRef = useRef(false); // For main page title voice preference
  const meguminVoicePreferenceSetRef = useRef(false); // For Megumin's replies voice preference
  const initialGreetingSpokenRef = useRef(false);
  const currentSpokenMessageRef = useRef<string | null>(null);

  // Effect for page title voice preference
  useEffect(() => {
    if (supportedVoices.length > 0 && !voicePreferenceWasSetRef.current) {
      setVoicePreference('kai'); // Default main page announcement to Kai
      voicePreferenceWasSetRef.current = true;
    }
  }, [supportedVoices, setVoicePreference]);

  // Effect for Megumin's replies voice preference (independent of page title voice)
  useEffect(() => {
    if (supportedVoices.length > 0 && !meguminVoicePreferenceSetRef.current && voicePreference !== 'megumin') {
      // This will be set by the UI dropdown, but as a fallback, if the user hasn't touched it
      // we ensure Megumin's preference is set once if possible
      if (!voicePreference || voicePreference !== 'megumin') { 
          // No, this is wrong. The UI dropdown will handle setting Megumin's preference.
          // This effect is just to ensure a voice is available.
      }
      // The dropdown itself will call setVoicePreference('megumin' or 'kai') for the chatbot's replies.
      meguminVoicePreferenceSetRef.current = true; 
    }
  }, [supportedVoices, voicePreference]);


  // Effect for speaking the page title
  useEffect(() => {
    let isMounted = true;
    if (isMounted && selectedVoice && !isSpeaking && !isPaused && !pageTitleSpokenRef.current) {
      // Check if current preference is Kai for page title. If not, temporarily switch for title.
      const originalPreference = voicePreference;
      if (originalPreference !== 'kai') {
        setVoicePreference('kai'); // Ensure Kai for page title
         // We need to wait for this preference to apply and selectedVoice to update
        setTimeout(() => {
            if (isMounted && selectedVoice?.name.toLowerCase().includes('kai') && !isSpeaking && !isPaused && !pageTitleSpokenRef.current) {
                 speak(PAGE_TITLE);
                 pageTitleSpokenRef.current = true;
                 setVoicePreference(originalPreference); // Revert to original after speaking title
            } else if (isMounted && !isSpeaking && !isPaused && !pageTitleSpokenRef.current) {
                // Fallback if Kai couldn't be set quickly, speak with current selectedVoice
                speak(PAGE_TITLE);
                pageTitleSpokenRef.current = true;
                setVoicePreference(originalPreference);
            }
        }, 100); // Small delay
      } else {
        speak(PAGE_TITLE);
        pageTitleSpokenRef.current = true;
      }
    }
    return () => {
      isMounted = false;
      // Optional: cancelTTS() if speech should stop on unmount
    };
  }, [selectedVoice, isSpeaking, isPaused, speak, voicePreference, setVoicePreference]);


  useEffect(() => {
    if (scrollAreaRef.current) {
      const viewport = scrollAreaRef.current.querySelector('div[data-radix-scroll-area-viewport]');
      if (viewport) viewport.scrollTop = viewport.scrollHeight;
    }
  }, [messages]);

  // Effect for initial greeting
  useEffect(() => {
    const initialGreeting: ChatMessageType = {
      id: 'initial-greeting', role: 'assistant',
      content: "Kazuma, Kazuma! It's me, Megumin, the greatest archwizard of the Crimson Demon Clan! What explosive adventure shall we embark on today? Ask me anything!",
      timestamp: new Date()
    };
    setMessages([initialGreeting]);

    if (selectedVoice && voicePreference === 'megumin' && !initialGreetingSpokenRef.current && !isSpeaking && !isPaused) {
      currentSpokenMessageRef.current = initialGreeting.content;
      speak(initialGreeting.content);
      initialGreetingSpokenRef.current = true;
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedVoice, voicePreference]); // Ensure speak dependency is present if used

  const handleSendMessage = async (messageText: string, image?: string) => {
    if (!messageText.trim() && !image) return;
    cancelTTS(); 

    const userMessage: ChatMessageType = { id: Date.now().toString() + '-user', role: 'user', content: messageText, image: image, timestamp: new Date() };
    const typingIndicator: ChatMessageType = { id: TYPING_INDICATOR_ID, role: 'assistant', content: "Megumin is conjuring a response...", timestamp: new Date(), type: 'typing_indicator' };

    setMessages(prev => [...prev, userMessage, typingIndicator]);
    setIsLoading(true);

    try {
      const input: MeguminChatbotInput = { message: messageText };
      if (image) input.image = image;
      const response = await meguminChatbot(input);

      const assistantMessage: ChatMessageType = { id: Date.now().toString() + '-assistant', role: 'assistant', content: response.response, timestamp: new Date() };

      setMessages(prev => prev.filter(msg => msg.id !== TYPING_INDICATOR_ID));
      setMessages(prev => [...prev, assistantMessage]);

      // Use the voicePreference which is controlled by the dropdown for Megumin's replies
      if (selectedVoice && voicePreference && !isSpeaking && !isPaused) { 
        currentSpokenMessageRef.current = assistantMessage.content;
        speak(assistantMessage.content);
      }
    } catch (error) {
      console.error('Error sending message to chatbot:', error);
      toast({ title: "Chatbot Error", description: "Megumin is busy casting Explosion magic! Please try again later.", variant: "destructive" });
      const errorMessage: ChatMessageType = { id: Date.now().toString() + '-error', role: 'system', content: "Sorry, I couldn't process that. My explosion magic might be on cooldown!", timestamp: new Date() };
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

    if (isSpeaking && !isPaused) pauseTTS();
    else if (isPaused) resumeTTS();
    else speak(textToPlay);
  };

  const handleStopTTS = () => { playClickSound(); cancelTTS(); };
  
  // Handler for the voice preference dropdown specific to Megumin's replies
  const handleMeguminVoicePreferenceChange = (value: string) => {
    playClickSound();
    setVoicePreference(value as 'megumin' | 'kai' | null);
    // This will trigger the useTTS hook to repopulate and select the voice.
    // If a message is currently being spoken, it might get interrupted/restarted if the voice changes.
    // Consider cancelling current speech before changing preference if that's desired.
    // cancelTTS(); 
  };


  return (
    <Card className="h-[calc(100vh-10rem)] md:h-[calc(100vh-8rem)] flex flex-col">
      <CardHeader className="border-b">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
            <div className="flex items-center gap-3">
                <Bot className="h-7 w-7 text-primary" />
                <div>
                    <CardTitle className="text-xl sm:text-2xl font-bold text-primary">{PAGE_TITLE}</CardTitle>
                    <CardDescription>Your playful AI assistant. Try asking her to "sing a song about explosions!"</CardDescription>
                </div>
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto pt-2 sm:pt-0">
              <Select
                value={voicePreference || 'megumin'} // Default to megumin for her replies
                onValueChange={handleMeguminVoicePreferenceChange}
              >
                <SelectTrigger className="w-auto text-xs h-8"> <SelectValue placeholder="Voice" /> </SelectTrigger>
                <SelectContent>
                  <SelectItem value="megumin">Megumin</SelectItem>
                  <SelectItem value="kai">Kai</SelectItem>
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
