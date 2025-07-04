
"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { UserPlus } from 'lucide-react';

export default function SignUpPage() {
  return (
    <Card className="w-full max-w-md shadow-xl text-center">
      <CardHeader>
        <UserPlus className="mx-auto h-16 w-16 text-primary" />
        <CardTitle className="text-2xl mt-4">Sign Up</CardTitle>
        <CardDescription>Create your LearnMint account.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-muted-foreground">
         This page is a placeholder for your sign-up form. Integrate your authentication provider here.
        </p>
      </CardContent>
    </Card>
  );
}
