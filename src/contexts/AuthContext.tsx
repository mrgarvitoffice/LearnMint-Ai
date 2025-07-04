
"use client";

import type { ReactNode } from 'react';
import { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { auth, db } from '@/lib/firebase/config';
import { doc, onSnapshot } from "firebase/firestore";
import { Loader2 } from 'lucide-react';

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
  const [totalLearners, setTotalLearners] = useState(21); // Default value

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    // FIX: Only attach the listener if authentication is resolved AND there is a user.
    // This prevents "Missing or insufficient permissions" errors for unauthenticated users.
    // If the learner count should be public, the Firestore security rules for the
    // 'metadata/userCount' document must be changed to `allow read: if true;`.
    if (!loading && user) {
      const docRef = doc(db, 'metadata', 'userCount');
      const unsubscribe = onSnapshot(docRef, (docSnap) => {
        if (docSnap.exists()) {
          setTotalLearners(docSnap.data().count || 21);
        } else {
          console.warn("Learner count document does not exist in Firestore at 'metadata/userCount'.");
        }
      }, (error) => {
        console.error("Error fetching real-time learner count:", error);
      });
      // Detach listener on cleanup
      return () => unsubscribe();
    }
  }, [loading, user]); // Add `user` to the dependency array

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background text-foreground">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="mt-4 text-lg">Initializing Session...</p>
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
