
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
    // This effect runs once on mount to check for a redirect result from Google.
    // This is the crucial step to complete the signInWithRedirect flow.
    getRedirectResult(auth)
      .then((result) => {
        if (result) {
          // This block runs when the user has successfully signed in with Google and is redirected back.
          toast({ title: "Sign-in successful!", description: "Welcome to LearnMint." });
          const userRef = doc(db, 'users', result.user.uid);
          
          // Check if it's a new user and create a document in Firestore.
          getDoc(userRef).then(docSnap => {
            if (!docSnap.exists()) {
              setDoc(userRef, {
                uid: result.user.uid,
                email: result.user.email,
                displayName: result.user.displayName,
                photoURL: result.user.photoURL,
                createdAt: serverTimestamp(), // Use server timestamp for accuracy
              });
            }
          });
        }
        // If result is null, it means this was not a redirect sign-in, which is normal.
      })
      .catch((error) => {
        console.error("Google Redirect Result Error:", error);
        toast({ title: "Google Sign-in failed", description: "There was an issue completing your sign-in. Please try again.", variant: "destructive" });
      });

    // onAuthStateChanged is the primary listener for any auth changes.
    // It will catch the user from the redirect, email sign-ins, sign-outs, and cached sessions.
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });

    // Cleanup the listener on unmount
    return () => unsubscribe();
  }, [toast]);


  const signInWithGoogle = async () => {
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
      setLoading(false);
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
