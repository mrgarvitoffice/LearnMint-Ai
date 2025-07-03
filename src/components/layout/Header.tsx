
"use client";

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTheme } from "next-themes";
import { useAuth } from '@/contexts/AuthContext';
import { useSettings } from '@/contexts/SettingsContext';
import { useSound } from '@/hooks/useSound';
import { useToast } from '@/hooks/use-toast';
import { auth } from '@/lib/firebase/config';
import { signOut } from 'firebase/auth';

import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger, DropdownMenuSub, DropdownMenuSubTrigger, DropdownMenuSubContent, DropdownMenuRadioGroup, DropdownMenuRadioItem } from '@/components/ui/dropdown-menu';
import { Logo } from '@/components/icons/Logo';
import { Settings, LogOut, Sun, Moon, Volume2, Volume1, VolumeX, Languages, CaseSensitive, Menu, Flame, Bell, ShieldCheck, AudioLines, Search, User, ShieldQuestion, UserCircle } from 'lucide-react';
import { APP_NAME, TTS_LANGUAGES } from '@/lib/constants';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { MobileSidebarContent } from './MobileSidebarContent';
import { Input } from '../ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Tooltip, TooltipProvider, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

export function Header() {
  const { playSound: playClickSound } = useSound('/sounds/ting.mp3', 0.2);
  const router = useRouter();
  const { toast } = useToast();
  const { user } = useAuth();
  const { theme, setTheme } = useTheme();
  const { soundMode, cycleSoundMode, fontSize, setFontSize, language, setLanguage } = useSettings();

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

  const handleCycleSoundMode = () => {
    playClickSound();
    cycleSoundMode();
  };
  
  const handleFontSizeChange = (value: string) => {
    playClickSound();
    setFontSize(value as any);
  };
  
  const handleLanguageChange = (value: string) => {
    playClickSound();
    setLanguage(value);
  };
  
  const getSoundModeIconAndText = () => {
    switch (soundMode) {
      case 'full': return { icon: <Volume2 className="mr-2 h-4 w-4" />, text: "Sound: Full" };
      case 'essential': return { icon: <Volume1 className="mr-2 h-4 w-4" />, text: "Sound: Essential" };
      case 'muted': return { icon: <VolumeX className="mr-2 h-4 w-4" />, text: "Sound: Muted" };
    }
  };

  const getUserFirstName = () => {
    if (!user) return "User";
    if (user.isAnonymous) return "Guest";
    if (user.displayName) return user.displayName.split(' ')[0];
    if (user.email) {
      const emailName = user.email.split('@')[0];
      return emailName.charAt(0).toUpperCase() + emailName.slice(1);
    }
    return "User";
  };
  const firstName = getUserFirstName();

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-4 border-b bg-background/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/60 sm:px-6">
      {/* Mobile Header */}
       <div className="flex items-center gap-4 md:hidden">
            <Sheet>
                <SheetTrigger asChild>
                    <Button variant="outline" size="icon">
                        <Menu className="h-5 w-5" />
                        <span className="sr-only">Toggle navigation menu</span>
                    </Button>
                </SheetTrigger>
                <SheetContent side="left" className="flex flex-col p-0 w-64">
                    <MobileSidebarContent />
                </SheetContent>
            </Sheet>
            <Link href="/" className="flex items-center gap-2 font-semibold text-lg" onClick={() => playClickSound()}>
                <Logo size={28} />
                <span>{APP_NAME}</span>
            </Link>
        </div>


      {/* Desktop Header */}
      <div className="hidden md:flex items-center gap-6 flex-1">
        <div className="relative flex-1">
           <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
           <Input placeholder="Search features..." className="pl-9 w-full max-w-xs" />
        </div>

        <Select defaultValue="all">
          <SelectTrigger className="w-[180px] hidden lg:flex">
            <SelectValue placeholder="All Subjects" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Subjects</SelectItem>
            <SelectItem value="physics">Physics</SelectItem>
            <SelectItem value="math">Mathematics</SelectItem>
            <SelectItem value="biology">Biology</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center gap-1.5 sm:gap-2">
         <TooltipProvider>
            <div className="hidden md:flex items-center gap-1.5">
               <Tooltip>
                    <TooltipTrigger asChild><Button variant="ghost" size="icon"><Flame className="h-5 w-5"/></Button></TooltipTrigger>
                    <TooltipContent><p>Streak: 7 Days</p></TooltipContent>
                </Tooltip>
                 <Tooltip>
                    <TooltipTrigger asChild><Button variant="ghost" size="icon"><ShieldCheck className="h-5 w-5"/></Button></TooltipTrigger>
                    <TooltipContent><p>Daily Quests</p></TooltipContent>
                </Tooltip>
                 <Tooltip>
                    <TooltipTrigger asChild><Button variant="ghost" size="icon"><Bell className="h-5 w-5"/></Button></TooltipTrigger>
                    <TooltipContent><p>Notifications</p></TooltipContent>
                </Tooltip>
                 <Tooltip>
                    <TooltipTrigger asChild><Button variant="ghost" size="icon" onClick={handleCycleSoundMode}><Volume2 className="h-5 w-5"/></Button></TooltipTrigger>
                    <TooltipContent><p>Cycle Sound Mode</p></TooltipContent>
                </Tooltip>
            </div>
        </TooltipProvider>

        {user && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                  <Avatar className="h-9 w-9">
                     <AvatarImage src={user.photoURL || undefined} alt={user.displayName || "User Avatar"} data-ai-hint="profile picture" />
                        <AvatarFallback className="bg-muted">
                        {user.isAnonymous ? <ShieldQuestion className="h-5 w-5" /> :
                            firstName ? firstName.charAt(0).toUpperCase() : <UserCircle className="h-5 w-5" />}
                        </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>
                    <p className="font-semibold">{firstName}</p>
                    {!user.isAnonymous && <p className="text-xs text-muted-foreground font-normal">{user.email}</p>}
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                
                <DropdownMenuItem onClick={() => router.push('/profile')} className="md:hidden">
                  <User className="mr-2 h-4 w-4" />
                  <span>Profile & Features</span>
                </DropdownMenuItem>

                <DropdownMenuSub>
                  <DropdownMenuSubTrigger>
                    <CaseSensitive className="mr-2 h-4 w-4" />
                    <span>Font Size</span>
                  </DropdownMenuSubTrigger>
                  <DropdownMenuSubContent>
                      <DropdownMenuRadioGroup value={fontSize} onValueChange={handleFontSizeChange}>
                        <DropdownMenuRadioItem value="small">Small</DropdownMenuRadioItem>
                        <DropdownMenuRadioItem value="normal">Normal</DropdownMenuRadioItem>
                        <DropdownMenuRadioItem value="large">Large</DropdownMenuRadioItem>
                      </DropdownMenuRadioGroup>
                  </DropdownMenuSubContent>
                </DropdownMenuSub>

                <DropdownMenuSub>
                  <DropdownMenuSubTrigger>
                    <Languages className="mr-2 h-4 w-4" />
                    <span>Language</span>
                  </DropdownMenuSubTrigger>
                  <DropdownMenuSubContent>
                      <DropdownMenuRadioGroup value={language} onValueChange={handleLanguageChange}>
                         {TTS_LANGUAGES.map(lang => (
                           <DropdownMenuRadioItem key={lang.value} value={lang.value}>{lang.label}</DropdownMenuRadioItem>
                         ))}
                      </DropdownMenuRadioGroup>
                  </DropdownMenuSubContent>
                </DropdownMenuSub>

                <DropdownMenuItem onClick={handleCycleSoundMode}>
                  {getSoundModeIconAndText().icon}
                  <span>{getSoundModeIconAndText().text}</span>
                </DropdownMenuItem>
                
                <DropdownMenuSeparator />
                
                <DropdownMenuSub>
                   <DropdownMenuSubTrigger>
                     {theme === 'light' ? <Sun className="mr-2 h-4 w-4" /> : <Moon className="mr-2 h-4 w-4" />}
                     <span>Theme</span>
                   </DropdownMenuSubTrigger>
                   <DropdownMenuSubContent>
                         <DropdownMenuItem onClick={() => setTheme("light")}>
                             Light
                         </DropdownMenuItem>
                         <DropdownMenuItem onClick={() => setTheme("dark")}>
                             Dark
                         </DropdownMenuItem>
                         <DropdownMenuItem onClick={() => setTheme("system")}>
                             System
                         </DropdownMenuItem>
                   </DropdownMenuSubContent>
                </DropdownMenuSub>

                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut} className="text-destructive focus:bg-destructive/10 focus:text-destructive">
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Sign Out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
        )}
      </div>
    </header>
  );
}
