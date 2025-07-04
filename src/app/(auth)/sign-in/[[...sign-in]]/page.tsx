
"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LogIn } from 'lucide-react';

export default function SignInPage() {
  return (
    <Card className="w-full max-w-md shadow-xl text-center">
      <CardHeader>
        <LogIn className="mx-auto h-16 w-16 text-primary" />
        <CardTitle className="text-2xl mt-4">Sign In</CardTitle>
        <CardDescription>Authentication has been removed.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-muted-foreground">
          This page is a placeholder. Please integrate your chosen authentication provider, such as Clerk, to enable sign-in functionality.
        </p>
        <p className="text-sm">You can add a component like Clerk's `{'<SignIn />'}` here.</p>
      </CardContent>
    </Card>
  );
}
