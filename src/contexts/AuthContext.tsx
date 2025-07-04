
"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { 
  onAuthStateChanged, 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut, 
  signInAnonymously,
  type User 
} from 'firebase/auth';
import { auth, db } from '@/lib/firebase/config';
import { doc, setDoc, getDoc } from 'firebase/firestore';
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

  const handleUser = async (rawUser: User | null) => {
    if (rawUser) {
      const userRef = doc(db, 'users', rawUser.uid);
      const userDoc = await getDoc(userRef);
      // Create user document only if it doesn't exist
      if (!userDoc.exists() && !rawUser.isAnonymous) {
        await setDoc(userRef, {
          uid: rawUser.uid,
          email: rawUser.email,
          displayName: rawUser.displayName,
          photoURL: rawUser.photoURL,
          createdAt: new Date().toISOString(),
        });
      }
      setUser(rawUser);
    } else {
      setUser(null);
    }
    setLoading(false);
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, handleUser);
    return () => unsubscribe();
  }, []);

  const signInWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
      // onAuthStateChanged will handle the user state update and redirect
      toast({ title: "Sign-in successful!", description: "Welcome to LearnMint." });
    } catch (error: any) {
      if (error.code !== 'auth/popup-closed-by-user') {
        console.error("Google Sign-In Error:", error);
        toast({
          title: "Google Sign-In Error",
          description: "Could not sign in with Google. Please try again.",
          variant: "destructive",
        });
      }
    }
  };

  const signInAsGuest = async () => {
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
    }
  };

  const signOutUser = async () => {
    await signOut(auth);
    // onAuthStateChanged will set user to null
    toast({ title: "Signed Out", description: "You have been successfully signed out." });
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
