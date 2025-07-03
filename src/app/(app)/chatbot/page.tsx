
"use client";

import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ChatMessage } from '@/components/features/chatbot/ChatMessage';
import { ChatInput } from '@/components/features/chatbot/ChatInput';
import type { ChatMessage as ChatMessageType } from '@/lib/types';
import { gojoChatbot, type GojoChatbotInput } from '@/ai/flows/ai-chatbot';
import { holoChatbot, type HoloChatbotInput } from '@/ai/flows/holo-chatbot';
import { Bot, PlayCircle, PauseCircle, StopCircle, Wand2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useSound } from '@/hooks/useSound';
import { useTTS } from '@/hooks/useTTS';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

const TYPING_INDICATOR_ID = 'typing-indicator';

type ChatbotCharacter = 'gojo' | 'holo';

export default function ChatbotPage() {
  const [messages, setMessages] = useState<ChatMessageType[]>([]);
  const [isAiResponding, setIsAiResponding] = useState(false);
  const [selectedCharacter, setSelectedCharacter] = useState<ChatbotCharacter>('gojo');
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
    setVoicePreference,
  } = useTTS();

  const currentSpokenMessageRef = useRef<string | null>(null);

  useEffect(() => {
    // This effect runs when the selected character changes.
    // It cancels any ongoing speech, sets the new voice preference,
    // and sends the character's initial greeting message.
    cancelTTS();
    setVoicePreference(selectedCharacter);

    const greetingText = selectedCharacter === 'gojo'
      ? "Yo! Took you long enough. Thought I’d have to go fight boredom without you."
      : "Ah, the little one returns. Have you come to bask in my brilliance again?";

    const initialGreetingMessage: ChatMessageType = {
      id: `${selectedCharacter}-initial-greeting-${Date.now()}`, role: 'assistant',
      content: greetingText, timestamp: new Date()
    };
    
    setMessages([initialGreetingMessage]);
    
    // Speak the greeting automatically
    currentSpokenMessageRef.current = greetingText;
    speak(greetingText, { priority: 'essential' });

  }, [selectedCharacter, cancelTTS, setVoicePreference, setMessages, speak]);


  useEffect(() => {
    // Cleanup function to cancel TTS when the component unmounts.
    return () => {
      cancelTTS();
    };
  }, [cancelTTS]);


  useEffect(() => {
    // Automatically scroll to the bottom of the chat messages when a new message is added.
    if (scrollAreaRef.current) {
      const viewport = scrollAreaRef.current.querySelector('div[data-radix-scroll-area-viewport]');
      if (viewport) viewport.scrollTop = viewport.scrollHeight;
    }
  }, [messages]);

  const handleSendMessage = async (messageText: string, image?: string) => {
    if (!messageText.trim() && !image) return;
    
    cancelTTS(); // Stop any currently playing speech before sending a new message.

    const userMessage: ChatMessageType = { id: Date.now().toString() + '-user', role: 'user', content: messageText, image: image, timestamp: new Date() };
    const typingIndicatorMessage = selectedCharacter === 'gojo'
      ? "Gojo is contemplating..."
      : "Holo is contemplating her wisdom...";
    const typingIndicator: ChatMessageType = { id: TYPING_INDICATOR_ID, role: 'assistant', content: typingIndicatorMessage, timestamp: new Date(), type: 'typing_indicator' };

    setMessages(prev => [...prev, userMessage, typingIndicator]);
    setIsAiResponding(true);

    try {
      const input: GojoChatbotInput | HoloChatbotInput = { message: messageText };
      if (image) input.image = image;

      const response = selectedCharacter === 'gojo'
        ? await gojoChatbot(input as GojoChatbotInput)
        : await holoChatbot(input as HoloChatbotInput);

      const assistantMessage: ChatMessageType = { id: Date.now().toString() + '-assistant', role: 'assistant', content: response.response, timestamp: new Date() };

      setMessages(prev => prev.filter(msg => msg.id !== TYPING_INDICATOR_ID));
      setMessages(prev => [...prev, assistantMessage]);

      currentSpokenMessageRef.current = assistantMessage.content;
      speak(assistantMessage.content, { priority: 'essential' });
      
    } catch (error) {
      console.error('Error sending message to chatbot:', error);
      const errorText = selectedCharacter === 'gojo' ? "Hoh? Something went wrong. Let's try that again." : "Hmph. My wisdom must have been too much for this device. Try again.";
      toast({ title: "Chatbot Error", description: errorText, variant: "destructive" });
      const errorMessageContent = selectedCharacter === 'gojo' ? "My technique must've fizzled. Ask again, I wasn't paying attention." : "My thoughts must have wandered to a distant harvest. Ask again.";
      const errorMessage: ChatMessageType = { id: Date.now().toString() + '-error', role: 'system', content: errorMessageContent, timestamp: new Date() };
      setMessages(prev => prev.filter(msg => msg.id !== TYPING_INDICATOR_ID));
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsAiResponding(false);
    }
  };

  const handlePlaybackControl = () => {
    playClickSound();
    if (isSpeaking && !isPaused) {
        pauseTTS();
        return;
    }
    if (isPaused) {
        resumeTTS();
        return;
    }
    
    // If not speaking, play the last assistant message
    let textToPlay = currentSpokenMessageRef.current;
    if (!textToPlay) {
      const lastAssistantMessage = [...messages].reverse().find(m => m.role === 'assistant' && m.type !== 'typing_indicator');
      if (lastAssistantMessage) textToPlay = lastAssistantMessage.content;
    }
    
    if (textToPlay) {
        speak(textToPlay, { priority: 'essential' });
    }
  };

  const handleStopTTS = () => { playClickSound(); cancelTTS(); };

  const handleCharacterChange = (newCharacter: ChatbotCharacter) => {
    if (newCharacter === selectedCharacter) return;
    playClickSound();
    setSelectedCharacter(newCharacter);
  };

  const getCurrentCharacterAvatar = () => {
    if (selectedCharacter === 'gojo') return "/images/gojo-dp.jpg";
    return "/images/holo-dp.jpg"; 
  };
  
  const getCurrentCharacterAIName = () => selectedCharacter === 'gojo' ? 'Gojo AI' : 'Holo AI';
  const getCurrentCharacterAIDescription = () => selectedCharacter === 'gojo' ? 'The Honored One is here to help.' : 'The Wise Wolf of Yoitsu.';
  const getCurrentCharacterAvatarHint = () => selectedCharacter === 'gojo' ? 'Gojo Satoru' : 'Holo wise wolf';

  return (
    <div className="container mx-auto p-2 sm:p-4 md:p-6 lg:p-8 h-full flex flex-col">
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
              <div className="flex items-center gap-1.5 p-1 bg-muted rounded-lg">
                <Button 
                  onClick={() => handleCharacterChange('gojo')} 
                  variant={selectedCharacter === 'gojo' ? 'default' : 'ghost'} 
                  size="sm"
                  className="text-xs h-7 px-3"
                >
                  Gojo
                </Button>
                <Button 
                  onClick={() => handleCharacterChange('holo')} 
                  variant={selectedCharacter === 'holo' ? 'default' : 'ghost'} 
                  size="sm"
                  className="text-xs h-7 px-3"
                >
                  Holo
                </Button>
              </div>

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
      <ChatInput onSendMessage={handleSendMessage} isLoading={isAiResponding} />
    </Card>
    </div>
  );
}
