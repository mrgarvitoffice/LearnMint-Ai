
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
    // onAuthStateChanged is the primary listener for auth state.
    // It handles logins, logouts, and token refreshes.
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });

    // Separately, handle the result of a redirect operation.
    // This is for giving feedback (toast) and tracking new users.
    // This should run only once when the app loads after a redirect.
    getRedirectResult(auth)
      .then(async (result) => {
        if (result) {
          // A redirect was successfully completed.
          const isNewUser = getAdditionalUserInfo(result)?.isNewUser;
          if (isNewUser) {
            toast({ title: 'Account Created!', description: 'Welcome to LearnMint! You have been signed in.' });
            await updateUserCountOnSignup();
          } else {
            toast({ title: 'Signed In', description: 'Welcome back!' });
          }
        }
      })
      .catch((error) => {
        // Catch errors from the redirect, e.g., user cancels, account already exists.
        console.error("Error from getRedirectResult:", error);
        if (error.code !== 'auth/popup-closed-by-user' && error.code !== 'auth/cancelled-popup-request') {
          toast({
            title: 'Sign In Failed',
            description: error.message || 'An error occurred during the sign-in process.',
            variant: 'destructive',
          });
        }
      });

    return () => unsubscribe(); // Clean up the primary listener
  }, [toast]);

  // While the initial user state is being determined, show a loading screen.
  // This prevents content flashing and ensures layouts don't redirect prematurely.
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
