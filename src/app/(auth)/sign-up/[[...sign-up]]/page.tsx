
"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createUserWithEmailAndPassword, signInWithPopup, getAdditionalUserInfo } from 'firebase/auth';
import { auth, googleProvider, db } from '@/lib/firebase/config';
import { doc, getDoc, setDoc, updateDoc, increment } from 'firebase/firestore';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
import { Loader2, Chrome } from 'lucide-react';

export default function SignUpPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const { toast } = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && user) {
      router.replace('/');
    }
  }, [user, loading, router]);

  const updateUserCount = async () => {
    const userCountRef = doc(db, "metadata", "userCount");
    try {
        const docSnap = await getDoc(userCountRef);
        if (docSnap.exists()) {
            await updateDoc(userCountRef, { count: increment(1) });
        } else {
            await setDoc(userCountRef, { count: 21 });
        }
    } catch (e) {
        console.error("Failed to update user count:", e);
        // Do not block sign-up if this fails, just log it.
    }
  };

  const handleEmailSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      toast({ title: 'Sign Up Failed', description: 'Passwords do not match.', variant: 'destructive' });
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      await createUserWithEmailAndPassword(auth, email, password);
      await updateUserCount();
      toast({ title: 'Account Created!', description: 'You have successfully signed up.' });
      router.push('/');
    } catch (err: any) {
      let description = 'An unknown error occurred. Please try again.';
      if (err.code === 'auth/email-already-in-use') {
        description = 'This email is already in use. Please sign in or use a different email.';
      } else if (err.code === 'auth/weak-password') {
        description = 'The password is too weak. Please choose a stronger password.';
      } else if (err.message) {
        description = err.message;
      }
      setError(description);
      toast({ title: 'Sign Up Failed', description, variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignUp = async () => {
    setIsGoogleLoading(true);
    setError(null);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const additionalInfo = getAdditionalUserInfo(result);
      if (additionalInfo?.isNewUser) {
        await updateUserCount();
      }
      toast({ title: 'Signed Up with Google!', description: 'Welcome to LearnMint!' });
      router.push('/');
    } catch (err: any)
       let description = 'An unknown error occurred. Please try again.';
      if (err.code === 'auth/popup-blocked') {
        description = 'Your browser blocked the sign-in pop-up. Please allow pop-ups for this site and try again.';
      } else if (err.code === 'auth/popup-closed-by-user') {
        description = 'The sign-in window was closed before completing. Please try again. It is important to not close the pop-up window until sign-up is complete.';
      } else if (err.code === 'auth/account-exists-with-different-credential') {
        description = 'An account with this email already exists. Please sign in using the method you originally used.';
      } else if (err.message) {
        description = err.message;
      }
      setError(description);
      toast({ title: 'Google Sign Up Failed', description, variant: 'destructive', duration: 8000 });
    } finally {
      setIsGoogleLoading(false);
    }
  };

  if (loading || (!loading && user)) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background text-foreground">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="mt-4 text-lg">Checking session...</p>
      </div>
    );
  }

  return (
    <Card className="w-full max-w-md shadow-xl">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl">Create LearnMint Account</CardTitle>
        <CardDescription>Join us to start your AI-powered learning journey.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button variant="outline" className="w-full" onClick={handleGoogleSignUp} disabled={isLoading || isGoogleLoading}>
          {isGoogleLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Chrome className="mr-2 h-4 w-4" /> }
          Sign up with Google
        </Button>

        <div className="relative my-3">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-2 text-muted-foreground">
              Or
            </span>
          </div>
        </div>
        
        <form onSubmit={handleEmailSignUp} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input id="password" type="password" placeholder="•••••••• (min. 6 characters)" value={password} onChange={(e) => setPassword(e.target.value)} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm Password</Label>
            <Input id="confirmPassword" type="password" placeholder="••••••••" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required />
          </div>
          {error && <p className="text-sm text-destructive text-center">{error}</p>}
          <Button type="submit" className="w-full" disabled={isLoading || isGoogleLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Sign Up with Email
          </Button>
        </form>
      </CardContent>
      
      <CardFooter className="flex-col gap-2 pt-2 border-t mt-0">
        <p className="text-sm text-muted-foreground text-center">
          Already have an account?{' '}
          <Button variant="link" asChild className="p-0 h-auto">
            <Link href="/sign-in">Sign In</Link>
          </Button>
        </p>
      </CardFooter>
    </Card>
  );
}
