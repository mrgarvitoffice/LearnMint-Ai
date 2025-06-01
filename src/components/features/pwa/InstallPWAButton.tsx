
"use client";

import { Button } from "@/components/ui/button";
import { DownloadCloud } from "lucide-react";
import { useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { useSound } from '@/hooks/useSound';
import { APP_NAME } from "@/lib/constants"; // Ensure APP_NAME is imported
import { cn } from "@/lib/utils";

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: "accepted" | "dismissed";
    platform: string;
  }>;
  prompt(): Promise<void>;
}

interface InstallPWAButtonProps {
  /**
   * If true, styles the button to look like a DropdownMenuItem.
   * Omitting this or setting to false uses default Button styling.
   */
  asDropdownItem?: boolean;
}

export default function InstallPWAButton({ asDropdownItem = false }: InstallPWAButtonProps) {
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
      } else if (typeof navigator !== 'undefined' && /(iPad|iPhone|iPod)/g.test(navigator.userAgent) && !('MSStream' in window)) {
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

  const buttonBaseClasses = "w-full justify-start gap-2 rounded-md";
  const dropdownItemClasses = "relative flex cursor-default select-none items-center px-2 py-1.5 text-sm outline-none transition-colors focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50";
  
  return (
    <Button
      variant={asDropdownItem ? "ghost" : "outline"}
      onClick={handleInstallClick}
      className={cn(
        buttonBaseClasses,
        asDropdownItem 
          ? dropdownItemClasses // Mimic DropdownMenuItem styling
          : "h-8 px-2 py-1 text-xs border-primary/50 text-primary hover:bg-primary/10 hover:text-primary" // Original styling
      )}
      title={`Install ${APP_NAME} App`}
    >
      <DownloadCloud className={cn("mr-1.5", asDropdownItem ? "h-4 w-4" : "h-3.5 w-3.5")} />
      Install App
    </Button>
  );
}

    