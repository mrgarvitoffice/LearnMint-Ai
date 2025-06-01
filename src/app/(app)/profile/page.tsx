
"use client";

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
// Removed ThemeToggle and InstallPWAButton imports as they are no longer directly on this page
import { signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase/config';
import { useToast } from '@/hooks/use-toast';
import { useSound } from '@/hooks/useSound';
import { LogOut, UserCircle, LogIn, ShieldQuestion, CalendarCheck2, AtSign, Fingerprint, LayoutDashboard, Library as LibraryIcon, Newspaper, Calculator as CalculatorIcon, ChevronRight } from 'lucide-react'; // Added new icons
import { format } from 'date-fns'; 

const PAGE_TITLE = "User Profile";

interface ProfileLinkItemProps {
  href: string;
  icon: React.ElementType;
  label: string;
  onClick?: () => void;
}

const ProfileLinkItem: React.FC<ProfileLinkItemProps> = ({ href, icon: Icon, label, onClick }) => (
  <Link href={href} passHref legacyBehavior>
    <a
      onClick={onClick}
      className="flex items-center justify-between p-3.5 border rounded-lg hover:bg-muted/50 transition-colors duration-150 group"
    >
      <div className="flex items-center gap-3">
        <Icon className="h-5 w-5 text-primary/90 group-hover:text-primary" />
        <span className="text-sm font-medium text-foreground group-hover:text-primary">{label}</span>
      </div>
      <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary" />
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
      <Card className="shadow-xl bg-card/90 backdrop-blur-sm">
        <CardHeader className="text-center">
          <UserCircle className="h-16 w-16 text-primary mx-auto mb-4" />
          <CardTitle className="text-2xl font-bold text-primary">{PAGE_TITLE}</CardTitle>
          <CardDescription>View your account details and manage preferences.</CardDescription>
        </CardHeader>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Profile Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center gap-4">
            <Avatar className="h-20 w-20 border-2 border-primary">
              <AvatarImage src={user.photoURL || undefined} alt={user.displayName || "User Avatar"} />
              <AvatarFallback className="text-2xl bg-muted">
                {user.isAnonymous ? <ShieldQuestion className="h-10 w-10" /> : 
                 user.displayName ? user.displayName.charAt(0).toUpperCase() : 
                 user.email ? user.email.charAt(0).toUpperCase() : <UserCircle className="h-10 w-10" />}
              </AvatarFallback>
            </Avatar>
            <div>
              <h2 className="text-2xl font-semibold">{user.isAnonymous ? "Guest User" : (user.displayName || user.email?.split('@')[0] || "Valued User")}</h2>
              {!user.isAnonymous && user.email && <p className="text-sm text-muted-foreground flex items-center gap-1.5"><AtSign className="h-3.5 w-3.5"/>{user.email}</p>}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <div className="flex items-start gap-2 p-3 bg-muted/50 rounded-md">
              <Fingerprint className="h-5 w-5 text-primary/80 mt-0.5 shrink-0" />
              <div>
                <span className="font-medium">Account Type:</span>
                <p className="text-muted-foreground">{getAccountType()}</p>
              </div>
            </div>
            <div className="flex items-start gap-2 p-3 bg-muted/50 rounded-md">
              <CalendarCheck2 className="h-5 w-5 text-primary/80 mt-0.5 shrink-0" />
              <div>
                <span className="font-medium">Joined:</span>
                <p className="text-muted-foreground">{creationTime}</p>
              </div>
            </div>
            {!user.isAnonymous && (
              <div className="flex items-start gap-2 p-3 bg-muted/50 rounded-md sm:col-span-2">
                <Fingerprint className="h-5 w-5 text-primary/80 opacity-50 mt-0.5 shrink-0" />
                <div>
                  <span className="font-medium">User ID:</span>
                  <p className="text-xs text-muted-foreground break-all">{user.uid}</p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Quick Links & Actions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <ProfileLinkItem href="/" icon={LayoutDashboard} label="Go to Dashboard" onClick={playClickSound} />
          <ProfileLinkItem href="/library" icon={LibraryIcon} label="My Library" onClick={playClickSound} />
          <ProfileLinkItem href="/news" icon={Newspaper} label="Daily News" onClick={playClickSound} />
          <ProfileLinkItem href="/calculator" icon={CalculatorIcon} label="Calculator" onClick={playClickSound} />
          {/* Add more professional links here if needed */}
        </CardContent>
        <CardFooter>
          {user.isAnonymous ? (
            <Button onClick={handleSignInRedirect} className="w-full" variant="default">
              <LogIn className="mr-2 h-4 w-4" /> Sign In / Sign Up
            </Button>
          ) : (
            <Button onClick={handleSignOut} className="w-full" variant="destructive">
              <LogOut className="mr-2 h-4 w-4" /> Sign Out
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}

    