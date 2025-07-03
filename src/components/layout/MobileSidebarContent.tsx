
"use client";

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase/config';
import { useToast } from '@/hooks/use-toast';
import { useSound } from '@/hooks/useSound';

import { NAV_ITEMS, APP_NAME } from '@/lib/constants';
import { Logo } from '@/components/icons/Logo';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { LogOut, UserCircle, ShieldQuestion } from 'lucide-react';
import { ScrollArea } from '../ui/scroll-area';
import { SidebarNav } from './SidebarNav';

export function MobileSidebarContent() {
  const pathname = usePathname();
  const { user } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const { playSound: playClickSound } = useSound('/sounds/ting.mp3', 0.2);

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
  
  const getUserFirstName = () => {
    if (!user) return "User";
    if (user.isAnonymous) return "Guest User";
    if (user.displayName) return user.displayName;
    if (user.email) return user.email.split('@')[0];
    return "User";
  };
  const userName = getUserFirstName();

  return (
    <>
      <div className="flex h-16 items-center border-b px-4">
          <Link href="/" className="flex items-center gap-2.5 font-semibold">
              <Logo size={32} />
              <span className="font-bold text-xl text-foreground">{APP_NAME}</span>
          </Link>
      </div>
      <ScrollArea className="flex-1">
          <SidebarNav items={NAV_ITEMS} />
      </ScrollArea>
      <div className="mt-auto p-4 border-t">
          {user ? (
              <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                      <Avatar className="h-9 w-9">
                          <AvatarImage src={user.photoURL || undefined} alt="User Avatar" />
                          <AvatarFallback>
                              {user.isAnonymous ? <ShieldQuestion /> : user.displayName ? user.displayName.charAt(0) : <UserCircle />}
                          </AvatarFallback>
                      </Avatar>
                      <span className="text-sm font-medium truncate">{userName}</span>
                  </div>
                  <Button variant="ghost" size="icon" onClick={handleSignOut} title="Sign Out">
                      <LogOut className="h-4 w-4" />
                  </Button>
              </div>
          ) : (
              <Button asChild className="w-full">
                  <Link href="/sign-in">Sign In</Link>
              </Button>
          )}
      </div>
    </>
  );
}
