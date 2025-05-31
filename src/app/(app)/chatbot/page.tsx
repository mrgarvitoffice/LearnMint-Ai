
"use client";

import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ChatMessage } from '@/components/features/chatbot/ChatMessage';
import { ChatInput } from '@/components/features/chatbot/ChatInput';
import type { ChatMessage as ChatMessageType } from '@/lib/types';
import { kazumaChatbot, type KazumaChatbotInput } from '@/ai/flows/ai-chatbot';
import { meguminChatbot, type MeguminChatbotInput } from '@/ai/flows/megumin-chatbot'; // Import Megumin's flow
import { Bot, PlayCircle, PauseCircle, StopCircle, Wand2, Users } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useSound } from '@/hooks/useSound';
import { useTTS } from '@/hooks/useTTS';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'; // Import Avatar components

const PAGE_TITLE_CHATBOT = "AI Chat Central";
const TYPING_INDICATOR_ID = 'typing-indicator';

type ChatbotCharacter = 'kazuma' | 'megumin';

export default function ChatbotPage() {
  const [messages, setMessages] = useState<ChatMessageType[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedCharacter, setSelectedCharacter] = useState<ChatbotCharacter>('kazuma');
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
  const currentSpokenMessageRef = useRef<string | null>(null);
  const initialGreetingSpokenRef = useRef(false);

  // Set a general voice preference for page announcements first
  useEffect(() => {
    if (supportedVoices.length > 0 && !voicePreferenceWasSetRef.current) {
      setVoicePreference('luma'); // Default to Luma (female) for page announcements
      voicePreferenceWasSetRef.current = true;
    }
  }, [supportedVoices, setVoicePreference]);

  // Speak page title once the general voice preference is set
  useEffect(() => {
    let isMounted = true;
    if (isMounted && selectedVoice && voicePreference === 'luma' && !isSpeaking && !isPaused && !pageTitleSpokenRef.current) {
      speak(PAGE_TITLE_CHATBOT);
      pageTitleSpokenRef.current = true;
    }
    return () => { isMounted = false; };
  }, [selectedVoice, voicePreference, isSpeaking, isPaused, speak]);


  // Handle character-specific setup (greeting, voice) when selectedCharacter changes
  useEffect(() => {
    cancelTTS(); // Stop any previous TTS
    initialGreetingSpokenRef.current = false; // Allow new greeting to be spoken
    let greetingText = "";
    let characterVoicePref: 'kai' | 'luma' | null = null; // Luma as a stand-in for Megumin's voice

    if (selectedCharacter === 'kazuma') {
      greetingText = "Yo. Kazuma here. Don't expect too much, but I guess I can answer your questions or whatever. Just try not to get us into too much trouble, okay?";
      characterVoicePref = 'kai';
    } else if (selectedCharacter === 'megumin') {
      greetingText = "Waga na wa Megumin! Arch Wizard of the Crimson Demons and master of EXPLOSION magic! Ask me anything, but prepare for an EXPLOSIVE answer!";
      characterVoicePref = 'luma'; // Or 'shimmer' if you find it, for now use 'luma' for Megumin
    }

    setVoicePreference(characterVoicePref); // Set the character's preferred voice

    const initialGreetingMessage: ChatMessageType = {
      id: `${selectedCharacter}-initial-greeting`, role: 'assistant',
      content: greetingText, timestamp: new Date()
    };
    setMessages([initialGreetingMessage]);

    // Delay speaking the greeting slightly to allow voice preference to apply
    const speakGreetingTimeout = setTimeout(() => {
        if (selectedVoice && voicePreference === characterVoicePref && !initialGreetingSpokenRef.current && !isSpeaking && !isPaused) {
            currentSpokenMessageRef.current = greetingText;
            speak(greetingText);
            initialGreetingSpokenRef.current = true;
        }
    }, 200);
    
    return () => clearTimeout(speakGreetingTimeout);

  }, [selectedCharacter, speak, cancelTTS, setVoicePreference, selectedVoice, voicePreference, isSpeaking, isPaused]);


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
    const typingIndicatorMessage = selectedCharacter === 'kazuma'
      ? "Kazuma is thinking... (probably about how much effort this is)"
      : "Megumin is chanting an EXPLOSIVE incantation...";
    const typingIndicator: ChatMessageType = { id: TYPING_INDICATOR_ID, role: 'assistant', content: typingIndicatorMessage, timestamp: new Date(), type: 'typing_indicator' };

    setMessages(prev => [...prev, userMessage, typingIndicator]);
    setIsLoading(true);

    try {
      const input: KazumaChatbotInput | MeguminChatbotInput = { message: messageText };
      if (image) input.image = image;

      const response = selectedCharacter === 'kazuma'
        ? await kazumaChatbot(input as KazumaChatbotInput)
        : await meguminChatbot(input as MeguminChatbotInput);

      const assistantMessage: ChatMessageType = { id: Date.now().toString() + '-assistant', role: 'assistant', content: response.response, timestamp: new Date() };

      setMessages(prev => prev.filter(msg => msg.id !== TYPING_INDICATOR_ID));
      setMessages(prev => [...prev, assistantMessage]);

      const characterVoicePref = selectedCharacter === 'kazuma' ? 'kai' : 'luma';
      if (selectedVoice && voicePreference === characterVoicePref && !isSpeaking && !isPaused) {
        currentSpokenMessageRef.current = assistantMessage.content;
        speak(assistantMessage.content);
      }
    } catch (error) {
      console.error('Error sending message to chatbot:', error);
      const errorText = selectedCharacter === 'kazuma' ? "Kazuma's probably slacking off. Try again later." : "Megumin's spell backfired! Try again.";
      toast({ title: "Chatbot Error", description: errorText, variant: "destructive" });
      const errorMessageContent = selectedCharacter === 'kazuma' ? "Oi, something went wrong. Not my fault, probably." : "My EXPLOSION magic... it failed! This is unheard of!";
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
    if (selectedCharacter === 'kazuma') return "/images/kazuma-dp.jpg";
    // For Megumin, you'll need to add 'megumin-dp.jpg' to public/images
    // Using Kazuma's as a placeholder with data-ai-hint for now
    return "/images/kazuma-dp.jpg"; // Placeholder for Megumin
  };
  
  const getCurrentCharacterAIName = () => selectedCharacter === 'kazuma' ? 'Kazuma AI' : 'Megumin AI';
  const getCurrentCharacterAIDescription = () => selectedCharacter === 'kazuma' ? 'Your pragmatic (and slightly reluctant) AI companion.' : 'The Arch Wizard of EXPLOSION!';
  const getCurrentCharacterAvatarHint = () => selectedCharacter === 'kazuma' ? 'Kazuma Satou' : 'Megumin';


  return (
    <Card className="h-[calc(100vh-10rem)] md:h-[calc(100vh-8rem)] flex flex-col">
      <CardHeader className="border-b">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
            <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10 sm:h-12 sm:w-12 border-2 border-primary/30">
                  <AvatarImage src={getCurrentCharacterAvatar()} alt={`${selectedCharacter} avatar`} data-ai-hint={getCurrentCharacterAvatarHint()} />
                  <AvatarFallback>
                    {selectedCharacter === 'kazuma' ? <Bot /> : <Wand2 />}
                  </AvatarFallback>
                </Avatar>
                <div>
                    <CardTitle className="text-xl sm:text-2xl font-bold text-primary">{getCurrentCharacterAIName()}</CardTitle>
                    <CardDescription>{getCurrentCharacterAIDescription()}</CardDescription>
                </div>
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto pt-2 sm:pt-0">
              <Select value={selectedCharacter} onValueChange={handleCharacterChange}>
                <SelectTrigger className="w-auto text-xs h-8 min-w-[100px]">
                  <Users className="h-3.5 w-3.5 mr-1.5 opacity-70"/>
                  <SelectValue placeholder="Character" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="kazuma">Kazuma</SelectItem>
                  <SelectItem value="megumin">Megumin</SelectItem>
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
  );
}


    