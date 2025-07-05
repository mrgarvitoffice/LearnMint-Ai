
"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Lock } from 'lucide-react';
import Link from 'next/link';

interface GuestLockProps {
  featureName: string;
  message?: string;
}

export function GuestLock({ featureName, message }: GuestLockProps) {
  return (
    <div className="container mx-auto max-w-xl py-8 flex flex-col items-center justify-center min-h-[calc(100vh-12rem)]">
      <Card className="w-full text-center p-6 bg-card/90 backdrop-blur-sm shadow-xl">
        <CardHeader>
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-primary/10 rounded-full border border-primary/20">
              <Lock className="h-10 w-10 text-primary" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold text-primary">Feature Locked for Guests</CardTitle>
          <CardDescription className="text-muted-foreground mt-2">
            {message || `Please sign up or log in to use the ${featureName}.`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="mb-6">
            Creating an account unlocks all features, saves your progress, and gives you unlimited access to our AI tools.
          </p>
          <div className="flex gap-4 justify-center">
            <Button asChild>
              <Link href="/sign-in">Sign In</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/sign-up">Sign Up</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
