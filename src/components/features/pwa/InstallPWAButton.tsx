
"use client";

import { Button } from "@/components/ui/button";
import { DownloadCloud } from "lucide-react";
import { useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { useSound } from '@/hooks/useSound';
import { APP_NAME } from "@/lib/constants"; // Ensure APP_NAME is imported

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: "accepted" | "dismissed";
    platform: string;
  }>;
  prompt(): Promise<void>;
}

export default function InstallPWAButton() {
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const { toast } = useToast();
  const { playSound: playClickSound } = useSound('/sounds/ting.mp3', 0.3);

  useEffect(() => {
    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      // Only show the install prompt if the app is not already in standalone mode
      if (!(window.matchMedia && window.matchMedia('(display-mode: standalone)').matches)) {
        setInstallPrompt(event as BeforeInstallPromptEvent);
      } else {
        setInstallPrompt(null); // App is already standalone, no prompt needed
      }
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    
    // Also check on initial load if already standalone
    if (typeof window !== "undefined" && window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) {
        setInstallPrompt(null);
    }

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    playClickSound();
    if (installPrompt) {
      installPrompt.prompt();
      const { outcome } = await installPrompt.userChoice;
      if (outcome === 'accepted') {
        toast({ title: "Installation Successful!", description: `${APP_NAME} has been added to your device.` });
      } else {
        toast({ title: "Installation Cancelled", description: "You can install the app later from the browser menu.", variant: "default" });
      }
      setInstallPrompt(null); // Clear the prompt once used
    } else {
      let description = `The ${APP_NAME} app might already be installed. `;
      if (typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) {
        description = `${APP_NAME} is running as an installed app. No further action needed.`;
      } else if (typeof navigator !== 'undefined' && /(iPad|iPhone|iPod)/g.test(navigator.userAgent) && !('MSStream' in window)) { // Basic iOS check
        description += "On iOS, tap the Share button then 'Add to Home Screen'.";
      } else {
        description += "If your browser supports it, look for an 'Install' or 'Add to Home Screen' option in the browser menu (usually three dots or lines).";
      }
      toast({
        title: "App Installation Info",
        description: description,
        variant: "default",
        duration: 8000,
      });
    }
  };

  // The button will now always render as part of the layout,
  // but its click handler provides guidance if direct install isn't available.
  // It will only be *visually hidden by the browser* if it is truly not applicable (e.g. already installed standalone on some platforms).
  // Or, if we want to strictly hide it if `installPrompt` is null, we can return null.
  // For the user's request of "give install button", we'll keep it visible and let the click handler inform.
  // If the PWA is *truly* installable and the browser fires `beforeinstallprompt`, `installPrompt` will be set, and the button will offer the direct prompt.
  // The custom smaller style is applied here.
  return (
    <Button
      variant="outline"
      onClick={handleInstallClick}
      className="h-8 px-2 py-1 text-xs border-primary/50 text-primary hover:bg-primary/10 hover:text-primary w-full justify-start gap-2 rounded-md" 
      title={`Install ${APP_NAME} App`}
    >
      <DownloadCloud className="h-3.5 w-3.5 mr-1.5" />
      Install App
    </Button>
  );
}
