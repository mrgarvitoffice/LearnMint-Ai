import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Image from 'next/image';
import type { LucideIcon } from 'lucide-react';
import { ExternalLink } from 'lucide-react';

interface ResourceCardProps {
  title: string;
  description: string;
  link: string;
  imageUrl?: string;
  dataAiHint?: string;
  icon?: LucideIcon;
  linkText?: string;
}

export function ResourceCard({ title, description, link, imageUrl, icon: Icon, linkText = "Learn More", dataAiHint }: ResourceCardProps) {
  return (
    <Card className="flex flex-col h-full overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300">
      {imageUrl && (
        <div className="relative w-full h-40">
          <Image 
            src={imageUrl} 
            alt={title} 
            layout="fill" 
            objectFit="cover" 
            data-ai-hint={dataAiHint || title.toLowerCase().split(" ").slice(0,2).join(" ")}
            onError={(e) => { (e.target as HTMLImageElement).src = `https://placehold.co/300x200.png?text=${encodeURIComponent(title)}`; }}
          />
        </div>
      )}
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center gap-2">
          {Icon && <Icon className="w-5 h-5 text-primary" />}
          {title}
        </CardTitle>
        <CardDescription className="text-xs pt-1">{description}</CardDescription>
      </CardHeader>
      <CardContent className="flex-grow" /> {/* Spacer */}
      <CardFooter>
        <Button asChild variant="outline" size="sm" className="w-full">
          <a href={link} target="_blank" rel="noopener noreferrer">
            {linkText} <ExternalLink className="w-4 h-4 ml-2" />
          </a>
        </Button>
      </CardFooter>
    </Card>
  );
}
