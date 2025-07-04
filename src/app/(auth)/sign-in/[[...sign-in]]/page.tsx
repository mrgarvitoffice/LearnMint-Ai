
"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LogIn } from 'lucide-react';

export default function SignInPage() {
  return (
    <Card className="w-full max-w-md shadow-xl text-center">
      <CardHeader>
        <LogIn className="mx-auto h-16 w-16 text-primary" />
        <CardTitle className="text-2xl mt-4">Sign In</CardTitle>
        <CardDescription>Sign in to your LearnMint account.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-muted-foreground">
          This page is a placeholder for your sign-in form. Integrate your authentication provider here.
        </p>
      </CardContent>
    </Card>
  );
}
