
"use client";

import { useState } from 'react';
import { signInWithEmailAndPassword, signInWithRedirect, signInAnonymously } from 'firebase/auth';
import { auth, googleProvider } from '@/lib/firebase/config';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
import { Loader2, Chrome, UserX } from 'lucide-react';

export default function SignInPage() {
  const { toast } = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState<boolean>(false);
  const [isGuestLoading, setIsGuestLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      // Success toast is now handled by AuthContext after redirect state is confirmed.
    } catch (err: any) {
      let description = 'An unknown error occurred. Please check your credentials.';
      if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        description = 'Invalid email or password. Please check your credentials and try again.';
      } else if (err.code === 'auth/too-many-requests') {
        description = 'Access to this account has been temporarily disabled due to many failed login attempts. You can reset your password or try again later.';
      } else if (err.message) {
        description = err.message;
      }
      setError(description);
      toast({ title: 'Sign In Failed', description: description, variant: 'destructive', duration: 8000 });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true);
    setError(null);
    try {
      await signInWithRedirect(auth, googleProvider);
      // The browser will redirect. The result is handled by AuthContext.
    } catch (err: any) {
      setError(err.message);
      toast({ title: 'Google Sign In Failed', description: err.message, variant: 'destructive', duration: 8000 });
      setIsGoogleLoading(false); // Only reset loading state on immediate error
    }
  };

  const handleGuestSignIn = async () => {
    setIsGuestLoading(true);
    setError(null);
    try {
      await signInAnonymously(auth);
      // Success toast is now handled by AuthContext.
    } catch (err: any) {
      setError(err.message);
      toast({ title: 'Guest Sign In Failed', description: err.message, variant: 'destructive' });
      setIsGuestLoading(false);
    }
  };
  
  const anyLoading = isLoading || isGoogleLoading || isGuestLoading;

  return (
    <Card className="w-full max-w-md shadow-xl">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl">Sign In to LearnMint</CardTitle>
        <CardDescription>Enter your credentials to access your account.</CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="space-y-3">
          <Button variant="outline" className="w-full" onClick={handleGoogleSignIn} disabled={anyLoading}>
            {isGoogleLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Chrome className="mr-2 h-4 w-4" />}
            Sign in with Google
          </Button>
          <Button variant="secondary" className="w-full" onClick={handleGuestSignIn} disabled={anyLoading}>
              {isGuestLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <UserX className="mr-2 h-4 w-4" />}
              Continue as Guest
          </Button>
        </div>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-2 text-muted-foreground">
              Or sign in with email
            </span>
          </div>
        </div>
        
        <form onSubmit={handleEmailSignIn} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required disabled={anyLoading} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input id="password" type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} required disabled={anyLoading} />
          </div>
          {error && <p className="text-sm text-destructive text-center">{error}</p>}
          <Button type="submit" className="w-full" disabled={anyLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Sign In
          </Button>
        </form>
      </CardContent>
      
      <CardFooter className="flex-col gap-2 pt-4 border-t">
        <p className="text-sm text-muted-foreground text-center">
          Don&apos;t have an account?{' '}
          <Button variant="link" asChild className="p-0 h-auto">
            <Link href="/sign-up">Sign Up</Link>
          </Button>
        </p>
      </CardFooter>
    </Card>
  );
}
