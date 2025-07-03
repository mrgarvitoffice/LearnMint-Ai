
"use client";

import type { ReactNode } from 'react';
import { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { auth, db } from '@/lib/firebase/config';
import { Loader2 } from 'lucide-react';
import { doc, runTransaction, serverTimestamp, onSnapshot } from 'firebase/firestore';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  totalLearners: number;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  totalLearners: 21,
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [totalLearners, setTotalLearners] = useState(21);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Effect to listen for totalLearners count
  useEffect(() => {
    // Only set up the listener if there's a user, preventing permission errors
    if (user) {
        const metadataRef = doc(db, 'metadata', 'userStats');
        const unsubscribe = onSnapshot(metadataRef, (docSnap) => {
            if (docSnap.exists()) {
                setTotalLearners(docSnap.data().totalUsers || 21);
            }
        }, (error) => {
            console.error("AuthContext: Error fetching real-time user count:", error);
            setTotalLearners(21); // Fallback on error
        });

        // Cleanup listener on unmount or when user changes
        return () => unsubscribe();
    }
  }, [user]);

  // Effect to create a user document and increment the total user count on first sign-up
  useEffect(() => {
    const setupNewUser = async (newUser: User) => {
      // Don't run for anonymous users
      if (newUser.isAnonymous) return;

      const userRef = doc(db, 'users', newUser.uid);
      const metadataRef = doc(db, 'metadata', 'userStats');

      try {
        await runTransaction(db, async (transaction) => {
          const userDoc = await transaction.get(userRef);
          
          if (userDoc.exists()) {
            return;
          }

          const metadataDoc = await transaction.get(metadataRef);
          const newTotal = (metadataDoc.data()?.totalUsers || 21) + 1;

          transaction.set(userRef, {
            uid: newUser.uid,
            email: newUser.email,
            displayName: newUser.displayName,
            photoURL: newUser.photoURL,
            createdAt: serverTimestamp(),
          });

          transaction.set(metadataRef, { totalUsers: newTotal }, { merge: true });
          console.log(`New user registered and counted: ${newUser.uid}. New total: ${newTotal}`);
        });
      } catch (error) {
        console.error("Failed to run new user setup transaction:", error);
      }
    };
    
    if (user && !loading) {
      setupNewUser(user);
    }
    
  }, [user, loading]);


  if (loading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background text-foreground">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="mt-4 text-lg">Loading Authentication...</p>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ user, loading, totalLearners }}>
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
