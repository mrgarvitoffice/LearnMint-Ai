
"use client";

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase/config';
import { useToast } from '@/hooks/use-toast';
import { useSound } from '@/hooks/useSound';
import { 
  LogOut, UserCircle, LogIn, ShieldQuestion, CalendarCheck2, AtSign, Fingerprint, 
  LayoutDashboard, Library as LibraryIcon, Newspaper, Calculator as CalculatorIcon, 
  ChevronRight, FileText, TestTubeDiagonal, Sparkles
} from 'lucide-react';
import { format } from 'date-fns'; 

interface FeatureLinkProps {
  href: string;
  icon: React.ElementType;
  title: string;
  description: string;
  onClick?: () => void;
}

const FeatureLink: React.FC<FeatureLinkProps> = ({ href, icon: Icon, title, description, onClick }) => (
  <Link href={href} passHref legacyBehavior>
    <a
      onClick={onClick}
      className="block p-4 border rounded-lg hover:bg-muted/50 hover:shadow-lg transition-all duration-200 group space-y-1.5 transform hover:scale-[1.02]"
    >
      <div className="flex items-center gap-3 mb-1">
        <Icon className="h-7 w-7 text-primary/90 group-hover:text-primary transition-colors" />
        <h3 className="text-md font-semibold text-foreground group-hover:text-primary transition-colors">{title}</h3>
      </div>
      <p className="text-xs text-muted-foreground pl-[calc(1.75rem_+_0.75rem)] group-hover:text-foreground/90 transition-colors">{description}</p>
    </a>
  </Link>
);


export default function ProfilePage() {
  const { user } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const { playSound: playClickSound } = useSound('/sounds/ting.mp3', 0.3);

  const handleSignOut = async () => {
    playClickSound();
    try {
      await signOut(auth);
      toast({ title: 'Signed Out', description: 'You have been successfully signed out.' });
      router.push('/sign-in');
    } catch (error) {
      console.error("Error signing out: ", error);
      toast({ title: 'Sign Out Failed', description: 'Could not sign out. Please try again.', variant: 'destructive' });
    }
  };

  const handleSignInRedirect = () => {
    playClickSound();
    router.push('/sign-in');
  };

  const getUserFirstName = () => {
    if (!user) return "User";
    if (user.isAnonymous) return "Guest";
    if (user.displayName) {
      const nameParts = user.displayName.split(' ');
      return nameParts[0];
    }
    if (user.email) {
      const emailName = user.email.split('@')[0];
      return emailName.charAt(0).toUpperCase() + emailName.slice(1);
    }
    return "User";
  };
  const firstName = getUserFirstName();

  const getAccountType = () => {
    if (!user) return "N/A";
    if (user.isAnonymous) return "Anonymous Guest";
    if (user.providerData && user.providerData.length > 0) {
      const provider = user.providerData[0].providerId;
      if (provider === 'password') return "Email Account";
      if (provider === 'google.com') return "Google Account";
      return provider; 
    }
    return "Standard Account";
  };

  const creationTime = user?.metadata.creationTime 
    ? format(new Date(user.metadata.creationTime), "PPPp") 
    : "N/A";

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

  return (
    <div className="container mx-auto max-w-2xl px-4 py-8 space-y-8">
      <Card className="shadow-xl bg-card/90 backdrop-blur-sm text-center">
        <CardHeader>
          <Avatar className="h-20 w-20 md:h-24 md:w-24 border-4 border-primary/50 mx-auto mb-3 shadow-md">
            <AvatarImage src={user.photoURL || undefined} alt={user.displayName || "User Avatar"} />
            <AvatarFallback className="text-3xl md:text-4xl bg-muted">
              {user.isAnonymous ? <ShieldQuestion className="h-10 w-10 md:h-12 md:w-12" /> :
                firstName ? firstName.charAt(0).toUpperCase() : <UserCircle className="h-10 w-10 md:h-12 md:w-12" />}
            </AvatarFallback>
          </Avatar>
          <CardTitle className="text-3xl md:text-4xl font-bold text-primary">
            Hi, {firstName}!
          </CardTitle>
          <CardDescription className="text-base text-muted-foreground mt-1">
            Welcome to your LearnMint profile. Manage your journey here.
          </CardDescription>
        </CardHeader>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Your Account Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {!user.isAnonymous && user.email && (
            <div className="flex items-start gap-3 p-3 bg-muted/40 rounded-md">
              <AtSign className="h-5 w-5 text-primary/80 mt-0.5 shrink-0" />
              <div>
                <span className="font-medium text-sm">Email Address:</span>
                <p className="text-sm text-muted-foreground">{user.email}</p>
              </div>
            </div>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <div className="flex items-start gap-3 p-3 bg-muted/40 rounded-md">
              <Fingerprint className="h-5 w-5 text-primary/80 mt-0.5 shrink-0" />
              <div>
                <span className="font-medium">Account Type:</span>
                <p className="text-muted-foreground">{getAccountType()}</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 bg-muted/40 rounded-md">
              <CalendarCheck2 className="h-5 w-5 text-primary/80 mt-0.5 shrink-0" />
              <div>
                <span className="font-medium">Joined LearnMint:</span>
                <p className="text-muted-foreground">{creationTime}</p>
              </div>
            </div>
            {!user.isAnonymous && (
              <div className="flex items-start gap-3 p-3 bg-muted/40 rounded-md sm:col-span-2">
                <Fingerprint className="h-5 w-5 text-primary/80 opacity-60 mt-0.5 shrink-0" />
                <div>
                  <span className="font-medium">User ID (for reference):</span>
                  <p className="text-xs text-muted-foreground/80 break-all">{user.uid}</p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-xl flex items-center gap-2"><Sparkles className="h-5 w-5 text-accent"/>Explore LearnMint Features</CardTitle>
          <CardDescription>Dive into your favorite tools and resources.</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FeatureLink
            href="/notes"
            icon={FileText}
            title="Craft Your Study Notes"
            description="AI-powered, detailed notes on any topic. Like having a top student by your side!"
            onClick={playClickSound}
          />
          <FeatureLink
            href="/custom-test"
            icon={TestTubeDiagonal}
            title="Design Your Ultimate Test"
            description="Tailor exams with specific topics, difficulty, and timers for focused preparation."
            onClick={playClickSound}
          />
          <FeatureLink
            href="/news"
            icon={Newspaper}
            title="Stay Informed, Stay Ahead"
            description="Your daily dose of global news, filterable to keep you updated on what matters."
            onClick={playClickSound}
          />
          <FeatureLink
            href="/library"
            icon={LibraryIcon}
            title="Expand Your Knowledge Base"
            description="Explore curated textbooks, search YouTube &amp; Google Books, and discover daily math facts."
            onClick={playClickSound}
          />
          <FeatureLink
            href="/calculator"
            icon={CalculatorIcon}
            title="Precision at Your Fingertips"
            description="Solve complex equations and convert various units with ease and accuracy."
            onClick={playClickSound}
          />
           <FeatureLink
            href="/"
            icon={LayoutDashboard}
            title="Return to Dashboard"
            description="Navigate back to the main dashboard to see an overview of all features."
            onClick={playClickSound}
          />
        </CardContent>
        <CardFooter className="mt-2">
          {user.isAnonymous ? (
            <Button onClick={handleSignInRedirect} className="w-full" variant="default" size="lg">
              <LogIn className="mr-2 h-5 w-5" /> Sign In / Sign Up to Save Progress
            </Button>
          ) : (
            <Button onClick={handleSignOut} className="w-full" variant="destructive" size="lg">
              <LogOut className="mr-2 h-5 w-5" /> Sign Out
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}
