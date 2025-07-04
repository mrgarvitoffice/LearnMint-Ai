
"use client";

import type { ReactNode } from 'react';
import { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, getRedirectResult, getAdditionalUserInfo, type User } from 'firebase/auth';
import { auth } from '@/lib/firebase/config';
import { Loader2 } from 'lucide-react';
import { updateUserCountOnSignup } from '@/lib/actions';
import { useToast } from '@/hooks/use-toast';

interface AuthContextType {
  user: User | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    // This function handles the result of a redirect sign-in attempt.
    // It runs once when the app loads after a user is redirected back from Google.
    getRedirectResult(auth)
      .then(async (result) => {
        if (result) {
          // User has just successfully signed in or signed up via redirect.
          const additionalUserInfo = getAdditionalUserInfo(result);
          if (additionalUserInfo?.isNewUser) {
            toast({ title: 'Account Created!', description: 'Welcome to LearnMint! Redirecting...' });
            await updateUserCountOnSignup();
          } else {
            toast({ title: 'Signed In', description: 'Welcome back! Redirecting...' });
          }
          // The onAuthStateChanged listener below will handle the actual state update.
        }
      })
      .catch((error) => {
        console.error("Error during sign-in redirect result processing:", error);
        toast({
          title: 'Sign In Failed',
          description: error.message || 'An error occurred during the sign-in redirect.',
          variant: 'destructive'
        });
      });

    // This onAuthStateChanged listener is the single source of truth for the user's session state.
    // It will fire after a redirect is processed, after a normal email sign-in, or on initial page load.
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [toast]); // Added toast to dependency array

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background text-foreground">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="mt-4 text-lg">Initializing Session...</p>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ user, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
