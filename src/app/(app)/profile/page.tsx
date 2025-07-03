
"use client";

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useSound } from '@/hooks/useSound';
import { UserCircle, ShieldQuestion, ChevronRight, UserPlus, LogIn } from 'lucide-react';
import { NAV_ITEMS } from '@/lib/constants';
import type { NavItem } from '@/lib/constants';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

const FeatureLink: React.FC<{ item: NavItem; onClick?: () => void }> = ({ item, onClick }) => (
  <Link href={item.href} passHref legacyBehavior>
    <a
      onClick={onClick}
      className="flex items-center justify-between p-4 border-b transition-colors hover:bg-muted/50"
    >
      <div className="flex items-center gap-4">
        <item.icon className="h-6 w-6 text-primary/80" />
        <div>
          <h3 className="font-semibold text-foreground">{item.title}</h3>
          {item.description && <p className="text-xs text-muted-foreground">{item.description}</p>}
        </div>
      </div>
      <ChevronRight className="h-5 w-5 text-muted-foreground" />
    </a>
  </Link>
);


export default function ProfilePage() {
  const { user } = useAuth();
  const router = useRouter();
  const { playSound: playClickSound } = useSound('/sounds/ting.mp3', 0.3);

  const getUserFirstName = () => {
    if (!user) return "User";
    if (user.displayName) return user.displayName.split(' ')[0];
    if (user.email) {
      const emailName = user.email.split('@')[0];
      return emailName.charAt(0).toUpperCase() + emailName.slice(1);
    }
    return "User";
  };
  const firstName = getUserFirstName();

  if (!user) {
    return (
      <div className="container mx-auto max-w-xl py-8 text-center">
        <Card>
          <CardHeader>
            <CardTitle>Access Denied</CardTitle>
          </CardHeader>
          <CardContent>
            <p>You need to be signed in to view this page.</p>
            <Button asChild className="mt-4">
              <Link href="/sign-in">Go to Sign In</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const isGuest = user?.isAnonymous;

  if (isGuest) {
    return (
      <div className="container mx-auto max-w-xl py-8 text-center">
        <Card className="shadow-xl bg-card/90 backdrop-blur-sm">
            <CardHeader>
                <UserCircle className="mx-auto h-24 w-24 text-primary/80" />
                <CardTitle className="text-3xl font-bold text-primary mt-4">You are a Guest</CardTitle>
                <CardDescription className="text-base text-muted-foreground mt-1">
                    Sign up to save your progress and unlock all features.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 p-6">
                <Button asChild className="w-full" size="lg">
                    <Link href="/sign-up">
                        <UserPlus className="mr-2 h-4 w-4" />
                        Create a Free Account
                    </Link>
                </Button>
                <Button asChild variant="outline" className="w-full" size="lg">
                    <Link href="/sign-in">
                        <LogIn className="mr-2 h-4 w-4" />
                        Sign In to an Existing Account
                    </Link>
                </Button>
            </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-2xl px-4 py-8 space-y-6">
      <Card className="shadow-xl bg-card/90 backdrop-blur-sm text-center">
        <CardHeader>
          <Avatar className="h-24 w-24 border-4 border-primary/50 mx-auto mb-3 shadow-md">
            <AvatarImage src={user.photoURL || undefined} alt={user.displayName || "User Avatar"} data-ai-hint="profile picture" />
            <AvatarFallback className="text-4xl bg-muted">
              {firstName ? firstName.charAt(0).toUpperCase() : <UserCircle className="h-12 w-12" />}
            </AvatarFallback>
          </Avatar>
          <CardTitle className="text-3xl md:text-4xl font-bold text-primary">
            Hi, {firstName}!
          </CardTitle>
          <CardDescription className="text-base text-muted-foreground mt-1">
            Manage your account and explore all features from here.
          </CardDescription>
        </CardHeader>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-xl">All Features</CardTitle></CardHeader>
        <CardContent className="p-0">
          <div className="border-t">
            {NAV_ITEMS.map((item) => (
              item.children ? (
                <Accordion key={item.title} type="single" collapsible className="w-full">
                  <AccordionItem value={item.title} className="border-b">
                    <AccordionTrigger className="p-4 hover:bg-muted/50">
                      <div className="flex items-center gap-4">
                        <item.icon className="h-6 w-6 text-primary/80" />
                        <div>
                          <h3 className="font-semibold text-foreground text-left">{item.title}</h3>
                          {item.description && <p className="text-xs text-muted-foreground text-left">{item.description}</p>}
                        </div>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="bg-muted/20 pl-8 pb-0">
                      {item.children.map(child => <FeatureLink key={child.href} item={child} onClick={playClickSound} />)}
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              ) : (
                <FeatureLink key={item.href} item={item} onClick={playClickSound} />
              )
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
