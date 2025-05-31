
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
      // Only set the prompt if the app is not already in standalone mode
      if (!(window.matchMedia && window.matchMedia('(display-mode: standalone)').matches)) {
        setInstallPrompt(event as BeforeInstallPromptEvent);
      } else {
        setInstallPrompt(null); // App is already installed or in standalone mode
      }
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    // Initial check on mount
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
      setInstallPrompt(null); // Prompt can only be used once
    } else {
      let description = `The ${APP_NAME} app might already be installed. `;
      if (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) {
        description = `${APP_NAME} is running as an installed app.`;
      } else if (/(iPad|iPhone|iPod)/g.test(navigator.userAgent) && !('MSStream' in window)) { // Basic iOS check
        description += "On iOS, tap the Share button then 'Add to Home Screen'.";
      } else {
        description += "If your browser supports it, look for an 'Install' or 'Add to Home Screen' option in the browser menu.";
      }
      toast({
        title: "App Installation Info",
        description: description,
        variant: "default",
        duration: 8000,
      });
    }
  };

  // The button is always rendered. Its action changes based on installPrompt.
  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleInstallClick}
      className="border-primary/50 text-primary hover:bg-primary/10 hover:text-primary"
      title={`Install ${APP_NAME} App`}
    >
      <DownloadCloud className="h-4 w-4 mr-2" />
      Install App
    </Button>
  );
}

