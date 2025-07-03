
"use client";

import type { ReactNode } from 'react';
import { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { auth, db } from '@/lib/firebase/config';
import { Loader2 } from 'lucide-react';
import { doc, runTransaction, serverTimestamp } from 'firebase/firestore';

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

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Effect to create a user document and increment the total user count on first sign-up
  useEffect(() => {
    const setupNewUser = async (newUser: User) => {
      if (newUser.isAnonymous) return; // We don't count anonymous guests as "registered users"

      const userRef = doc(db, 'users', newUser.uid);
      const metadataRef = doc(db, 'metadata', 'userStats');

      try {
        await runTransaction(db, async (transaction) => {
          const userDoc = await transaction.get(userRef);
          
          // If the user document already exists, it means they've been counted.
          // This prevents incrementing the count on subsequent logins.
          if (userDoc.exists()) {
            return;
          }

          // User does not exist, so this is their first registration.
          // Get the current total user count.
          const metadataDoc = await transaction.get(metadataRef);
          // If the count is 0 or doesn't exist, start from 21. Otherwise, increment.
          const newTotal = (metadataDoc.data()?.totalUsers || 21) + 1;

          // Create the new user's document in Firestore.
          transaction.set(userRef, {
            uid: newUser.uid,
            email: newUser.email,
            displayName: newUser.displayName,
            photoURL: newUser.photoURL,
            createdAt: serverTimestamp(),
          });

          // Update the total user count.
          transaction.set(metadataRef, { totalUsers: newTotal }, { merge: true });

          console.log(`New user registered and counted: ${newUser.uid}. New total: ${newTotal}`);
        });
      } catch (error) {
        console.error("Failed to run new user setup transaction:", error);
        // This failure is logged but doesn't block the user's experience.
      }
    };
    
    // Check if the user object is available and not loading.
    // The `metadata.creationTime` check helps ensure this logic runs for newly created users.
    if (user && user.metadata.creationTime === user.metadata.lastSignInTime) {
      setupNewUser(user);
    }
    
  }, [user]); // This effect runs whenever the user object changes.


  if (loading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background text-foreground">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="mt-4 text-lg">Loading Authentication...</p>
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
