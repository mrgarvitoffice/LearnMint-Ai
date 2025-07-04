
"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { onAuthStateChanged, getRedirectResult, signInWithRedirect, GoogleAuthProvider, signOut, type User } from 'firebase/auth';
import { auth, db } from '@/lib/firebase/config';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signOutUser: () => Promise<void>;
  signInWithGoogle: () => Promise<void>;
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
      if (!userDoc.exists()) {
        // New user, create a document for them
        await setDoc(userRef, {
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
    // Handle redirect result from Google sign-in
    getRedirectResult(auth)
      .then((result) => {
        if (result) {
          toast({ title: "Sign-In Successful", description: "Welcome back to LearnMint!" });
          handleUser(result.user);
        }
      })
      .catch((error) => {
        console.error("Error getting redirect result:", error);
        toast({ title: "Sign-In Error", description: error.message, variant: "destructive" });
      });

    // Listen for regular auth state changes
    const unsubscribe = onAuthStateChanged(auth, handleUser);
    return () => unsubscribe();
  }, [toast]);

  const signOutUser = async () => {
    await signOut(auth);
    setUser(null);
    router.push('/sign-in');
    toast({ title: "Signed Out", description: "You have been successfully signed out." });
  };
  
  const signInWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    await signInWithRedirect(auth, provider);
  };

  const contextValue = {
    user,
    loading,
    signOutUser,
    signInWithGoogle,
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
