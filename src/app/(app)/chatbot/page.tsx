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


export default function ChatbotPage() {
  const [messages, setMessages] = useState<ChatMessageType[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const { playSound: playMessageSound } = useSound('/sounds/ting.mp3', 0.3);


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
    // Initial greeting from Megumin
    setMessages([
      { 
        id: 'initial-greeting', 
        role: 'assistant', 
        content: "Kazuma, Kazuma! It's me, Megumin, the greatest archwizard of the Crimson Demon Clan! What explosive adventure shall we embark on today? Ask me anything!", 
        timestamp: new Date() 
      }
    ]);
  }, []);


  const handleSendMessage = async (messageText: string, image?: string) => {
    if (!messageText.trim() && !image) return;

    const userMessage: ChatMessageType = {
      id: Date.now().toString() + '-user',
      role: 'user',
      content: messageText,
      image: image,
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    try {
      const input: MeguminChatbotInput = { message: messageText };
      if (image) {
        input.image = image; // Genkit flow expects base64 string
      }
      const response = await meguminChatbot(input);
      
      const assistantMessage: ChatMessageType = {
        id: Date.now().toString() + '-assistant',
        role: 'assistant',
        content: response.response,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, assistantMessage]);
      playMessageSound();

    } catch (error) {
      console.error('Error sending message to chatbot:', error);
      toast({ title: "Chatbot Error", description: "Megumin is busy casting Explosion magic! Please try again later.", variant: "destructive" });
      const errorMessage: ChatMessageType = {
        id: Date.now().toString() + '-error',
        role: 'system',
        content: "Sorry, I couldn't process that. My explosion magic might be on cooldown!",
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="h-[calc(100vh-10rem)] md:h-[calc(100vh-8rem)] flex flex-col"> {/* Adjust height as needed */}
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-2xl">
          <Bot className="w-7 h-7 text-primary" />
          Chat with Megumin
        </CardTitle>
        <CardDescription>Your playful AI assistant. Try asking her to "sing a song about explosions!"</CardDescription>
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
