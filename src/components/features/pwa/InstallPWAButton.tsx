
"use client";

import { Button } from "@/components/ui/button";
import { DownloadCloud } from "lucide-react";
import { useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { useSound } from '@/hooks/useSound';

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
      setInstallPrompt(event as BeforeInstallPromptEvent);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    // Check if the app is already installed
    if (typeof window !== "undefined" && window.matchMedia('(display-mode: standalone)').matches) {
        // Already in PWA mode, don't show install button
        setInstallPrompt(null);
    }

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    playClickSound();
    if (!installPrompt) {
      toast({
        title: "App Cannot Be Installed Now",
        description: "The app may already be installed, or your browser doesn't support this action at the moment. Try adding to home screen from browser menu.",
        variant: "default",
      });
      return;
    }
    installPrompt.prompt();
    const { outcome } = await installPrompt.userChoice;
    if (outcome === 'accepted') {
      toast({ title: "Installation Successful!", description: `${process.env.NEXT_PUBLIC_APP_NAME || 'LearnMint'} has been added to your device.` });
    } else {
      toast({ title: "Installation Cancelled", description: "You can install the app later from the browser menu.", variant: "default" });
    }
    setInstallPrompt(null); // Prompt can only be used once
  };

  // Don't show button if app can't be installed or is already installed (or prompt not captured)
  if (!installPrompt) {
    return null; 
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleInstallClick}
      className="border-primary/50 text-primary hover:bg-primary/10 hover:text-primary"
      title="Install LearnMint App"
    >
      <DownloadCloud className="h-4 w-4 mr-2" />
      Install App
    </Button>
  );
}
