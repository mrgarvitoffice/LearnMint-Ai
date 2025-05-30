import type { ChatMessage as ChatMessageType } from '@/lib/types';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Bot, User } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import Image from 'next/image';

interface ChatMessageProps {
  message: ChatMessageType;
}

export function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.role === 'user';
  const alignment = isUser ? 'items-end' : 'items-start';
  const bubbleColor = isUser ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground';
  
  return (
    <div className={cn('flex flex-col gap-2 py-3', alignment)}>
      <div className={cn('flex gap-3 items-start', isUser ? 'flex-row-reverse' : 'flex-row')}>
        <Avatar className="h-8 w-8">
          <AvatarImage src={isUser ? undefined : `https://placehold.co/40x40.png?text=AI`} />
          <AvatarFallback>{isUser ? <User /> : <Bot />}</AvatarFallback>
        </Avatar>
        <div className={cn('max-w-[75%] rounded-lg px-4 py-3 shadow-md', bubbleColor)}>
          {message.image && message.role === 'user' && (
            <div className="mb-2">
              <Image 
                src={message.image} 
                alt="User uploaded image" 
                width={200} 
                height={200} 
                className="rounded-md object-cover"
                data-ai-hint="user image"
              />
            </div>
          )}
          <ReactMarkdown
            className="prose prose-sm dark:prose-invert max-w-none"
            components={{
              p: ({node, ...props}) => <p className="mb-0 last:mb-0" {...props} />
            }}
          >
            {message.content}
          </ReactMarkdown>
        </div>
      </div>
      <p className={cn('text-xs text-muted-foreground/70', isUser ? 'text-right' : 'text-left', 'px-12')}>
        {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
      </p>
    </div>
  );
}
