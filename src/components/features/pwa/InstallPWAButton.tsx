
"use client";

import { Button } from "@/components/ui/button";
import { DownloadCloud } from "lucide-react";
import { useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { useSound } from '@/hooks/useSound';
import { APP_NAME } from "@/lib/constants";

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
      if (!(window.matchMedia && window.matchMedia('(display-mode: standalone)').matches)) {
        setInstallPrompt(event as BeforeInstallPromptEvent);
      } else {
        setInstallPrompt(null);
      }
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

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
      setInstallPrompt(null);
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

  return (
    <Button
      variant="outline"
      onClick={handleInstallClick}
      className="h-8 px-2 py-1 text-xs border-primary/50 text-primary hover:bg-primary/10 hover:text-primary" // Custom smaller size
      title={`Install ${APP_NAME} App`}
    >
      <DownloadCloud className="h-3.5 w-3.5 mr-1.5" /> {/* Slightly smaller icon and margin */}
      Install App
    </Button>
  );
}


    