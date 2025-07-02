
"use client";

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { APP_NAME } from '@/lib/constants';
import { Logo } from '@/components/icons/Logo';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { UserCircle } from 'lucide-react';
import { useSound } from '@/hooks/useSound';
import { useAuth } from '@/contexts/AuthContext';

export function Header() {
  const router = useRouter();
  const { playSound: playClickSound } = useSound('/sounds/ting.mp3', 0.2);
  const { user } = useAuth();

  const handleProfileClick = () => {
    playClickSound();
    router.push('/profile');
  };

  const getUserFirstName = () => {
    if (!user) return null;
    if (user.isAnonymous) return "Guest";
    if (user.displayName) return user.displayName.split(' ')[0];
    if (user.email) {
      const emailName = user.email.split('@')[0];
      return emailName.charAt(0).toUpperCase() + emailName.slice(1);
    }
    return "User";
  };
  const userFirstName = getUserFirstName();

  return (
    <>
      {/* Combined Logo and Name for both Desktop and Mobile */}
      <Link href="/" className="flex items-center gap-2.5" onClick={() => playClickSound()}>
        <Logo size={32} className="text-primary"/>
        <span className="font-bold text-xl text-foreground">
          {APP_NAME}
        </span>
      </Link>

      <div className="ml-auto flex items-center gap-2 sm:gap-4">
        {userFirstName && (
          <span className="hidden md:flex items-center text-sm text-muted-foreground font-medium">
            Hi, {userFirstName}!
          </span>
        )}

        {/* Profile Avatar */}
        {user && (
          <Button
            variant="ghost"
            className="relative rounded-full w-9 h-9 p-0"
            onClick={handleProfileClick}
            aria-label="View Profile"
          >
            <Avatar className="h-9 w-9 border-2 border-transparent group-hover:border-primary transition-colors">
              <AvatarImage src={user.photoURL || undefined} alt={user.displayName || user.email || "User avatar"} />
              <AvatarFallback>
                <UserCircle className="h-5 w-5 text-muted-foreground" />
              </AvatarFallback>
            </Avatar>
            <span className="sr-only">View Profile</span>
          </Button>
        )}
      </div>
    </>
  );
}
