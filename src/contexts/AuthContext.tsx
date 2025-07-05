
"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { 
  onAuthStateChanged, 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut, 
  signInAnonymously,
  type User,
  signInWithRedirect,
  getRedirectResult
} from 'firebase/auth';
import { auth, db } from '@/lib/firebase/config';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signInAsGuest: () => Promise<void>;
  signOutUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const router = useRouter();

  useEffect(() => {
    // This effect runs once on mount to handle the redirect result from Google
    // and to set up the primary authentication state listener.
    const handleAuthChanges = async () => {
      try {
        const result = await getRedirectResult(auth);
        if (result) {
          // User has successfully signed in with Google and is redirected back.
          toast({ title: "Sign-in successful!", description: "Welcome to LearnMint." });
          const userRef = doc(db, 'users', result.user.uid);
          const docSnap = await getDoc(userRef);
          if (!docSnap.exists()) {
            // Create a new user document in Firestore if it's their first time.
            await setDoc(userRef, {
              uid: result.user.uid,
              email: result.user.email,
              displayName: result.user.displayName,
              photoURL: result.user.photoURL,
              createdAt: serverTimestamp(),
            });
          }
        }
      } catch (error) {
        console.error("Google Redirect Result Error:", error);
        toast({ title: "Google Sign-in failed", description: "There was an issue completing your sign-in. Please try again.", variant: "destructive" });
      }

      // onAuthStateChanged is the primary listener for any auth changes.
      // It will catch the user from the redirect, email sign-ins, sign-outs, and cached sessions.
      const unsubscribe = onAuthStateChanged(auth, (user) => {
        setUser(user);
        setLoading(false);
      });

      // Cleanup the listener on unmount
      return () => unsubscribe();
    };

    handleAuthChanges();
  }, [toast]);


  const signInWithGoogle = async () => {
    setLoading(true);
    const provider = new GoogleAuthProvider();
    // Start the redirect process. The result is handled by getRedirectResult on page load.
    await signInWithRedirect(auth, provider);
  };

  const signInAsGuest = async () => {
    setLoading(true);
    try {
      await signInAnonymously(auth);
      toast({ title: "Signed in as Guest", description: "You can now explore the app." });
    } catch (error: any) {
      console.error("Guest Sign-In Error:", error);
      toast({
        title: "Guest Sign-In Error",
        description: "Could not sign in as a guest. Please try again.",
        variant: "destructive",
      });
    } finally {
      // loading will be set to false by onAuthStateChanged
    }
  };

  const signOutUser = async () => {
    await signOut(auth);
    // onAuthStateChanged will set user to null
    toast({ title: "Signed Out", description: "You have been successfully signed out." });
    router.push('/sign-in');
  };
  
  const contextValue = {
    user,
    loading,
    signInWithGoogle,
    signInAsGuest,
    signOutUser,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
