
"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { signInWithEmailAndPassword, signInWithPopup, signInAnonymously } from 'firebase/auth';
import { auth, googleProvider } from '@/lib/firebase/config'; // Import googleProvider
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
import { Loader2, Chrome } from 'lucide-react'; // Using Chrome icon for Google as an example
import { Separator } from '@/components/ui/separator';

export default function SignInPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [isAnonymousLoading, setIsAnonymousLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      toast({ title: 'Signed In', description: 'Welcome back!' });
      router.push('/'); 
    } catch (err: any) {
      setError(err.message || 'Failed to sign in. Please check your credentials.');
      toast({ title: 'Sign In Failed', description: err.message || 'Please check your credentials.', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true);
    setError(null);
    try {
      await signInWithPopup(auth, googleProvider);
      toast({ title: 'Signed In with Google', description: 'Welcome!' });
      router.push('/');
    } catch (err: any) {
      setError(err.message || 'Failed to sign in with Google.');
      toast({ title: 'Google Sign In Failed', description: err.message || 'Please try again.', variant: 'destructive' });
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const handleAnonymousSignIn = async () => {
    setIsAnonymousLoading(true);
    setError(null);
    try {
      await signInAnonymously(auth);
      toast({ title: 'Signed In Anonymously', description: 'Welcome, Guest!' });
      router.push('/');
    } catch (err: any) { // Fixed: Added opening curly brace
      setError(err.message || 'Failed to sign in anonymously.');
      toast({ title: 'Anonymous Sign In Failed', description: err.message || 'Please try again.', variant: 'destructive' });
    } finally {
      setIsAnonymousLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md shadow-xl">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl">Sign In to LearnMint</CardTitle>
        <CardDescription>Enter your credentials or use an alternative method.</CardDescription>
      </CardHeader>
      <form onSubmit={handleSignIn}>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input id="password" type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} required />
          </div>
          {error && !isGoogleLoading && !isAnonymousLoading && <p className="text-sm text-destructive">{error}</p>}
        </CardContent>
        <CardFooter className="flex flex-col gap-3">
          <Button type="submit" className="w-full" disabled={isLoading || isGoogleLoading || isAnonymousLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Sign In with Email
          </Button>
        </CardFooter>
      </form>
      
      <div className="px-6 pb-4">
        <div className="relative my-3">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-2 text-muted-foreground">
              Or continue with
            </span>
          </div>
        </div>

        <div className="space-y-3">
          <Button variant="outline" className="w-full" onClick={handleGoogleSignIn} disabled={isLoading || isGoogleLoading || isAnonymousLoading}>
            {isGoogleLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Chrome className="mr-2 h-4 w-4" /> }
            Sign in with Google
          </Button>
          <Button variant="secondary" className="w-full" onClick={handleAnonymousSignIn} disabled={isLoading || isGoogleLoading || isAnonymousLoading}>
            {isAnonymousLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Continue as Guest
          </Button>
        </div>
        {error && (isGoogleLoading || isAnonymousLoading) && <p className="mt-3 text-sm text-destructive text-center">{error}</p>}
      </div>

      <CardFooter className="flex-col gap-2 pt-2 border-t mt-3">
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
