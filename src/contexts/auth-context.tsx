// Using 'use client' for context and hooks that interact with browser/Firebase SDK
'use client';

import type { User } from 'firebase/auth';
import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { app as firebaseApp } from '@/lib/firebase'; // Import the initialized app instance

interface AuthContextType {
  user: User | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    let unsubscribe = () => {};

    if (firebaseApp) { // Check if the Firebase app object itself was initialized
      try {
        const authInstance = getAuth(firebaseApp); // Get auth instance using the app
        unsubscribe = onAuthStateChanged(authInstance, (currentUser) => {
          setUser(currentUser);
          setLoading(false);
        });
      } catch (error) {
        console.error("Error initializing Auth listener in AuthProvider:", error);
        // This might happen if authInstance couldn't be created from firebaseApp (e.g. if firebaseApp was partially initialized but auth component failed)
        setUser(null);
        setLoading(false);
      }
    } else {
      // Firebase app not initialized (e.g., due to .env issues), so auth cannot function.
      console.warn("AuthProvider: Firebase app is not initialized. Auth features will be unavailable.");
      setUser(null);
      setLoading(false);
    }
    
    return () => unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
