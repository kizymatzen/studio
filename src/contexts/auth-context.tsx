
'use client';

import type { User } from 'firebase/auth';
import type { UserProfile } from '@/types';
import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { app as firebaseApp, getDbSafe } from '@/lib/firebase';
import { doc, onSnapshot, DocumentData } from 'firebase/firestore';

interface AuthContextType {
  user: User | null; // Firebase Auth user
  firestoreUser: UserProfile | null; // User profile from Firestore
  loading: boolean; // True while checking auth state or fetching Firestore user
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [firestoreUser, setFirestoreUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    let authUnsubscribe = () => {};
    let firestoreUnsubscribe = () => {};

    if (firebaseApp) {
      try {
        const authInstance = getAuth(firebaseApp);
        authUnsubscribe = onAuthStateChanged(authInstance, (currentUser) => {
          setUser(currentUser);
          if (currentUser) {
            // User is logged in, fetch their Firestore profile
            try {
                const db = getDbSafe();
                const userDocRef = doc(db, 'users', currentUser.uid);
                firestoreUnsubscribe = onSnapshot(userDocRef, (docSnap) => {
                  if (docSnap.exists()) {
                    setFirestoreUser({ uid: docSnap.id, ...docSnap.data() } as UserProfile);
                  } else {
                    // This case might happen if user exists in Auth but not Firestore yet (e.g. during signup process)
                    // Or if user doc was deleted. The login/signup pages handle creating the doc.
                    console.warn(`Firestore user document not found for UID: ${currentUser.uid}. It might be created shortly.`);
                    setFirestoreUser(null); 
                  }
                  setLoading(false);
                }, (error) => {
                  console.error("Error fetching Firestore user document:", error);
                  setFirestoreUser(null);
                  setLoading(false);
                });
            } catch(dbError) {
                console.error("Error getting Firestore instance for user profile:", dbError);
                setFirestoreUser(null);
                setLoading(false);
            }
          } else {
            // No user logged in
            setFirestoreUser(null);
            setLoading(false);
          }
        });
      } catch (error) {
        console.error("Error initializing Auth listener in AuthProvider:", error);
        setUser(null);
        setFirestoreUser(null);
        setLoading(false);
      }
    } else {
      console.warn("AuthProvider: Firebase app is not initialized. Auth features will be unavailable.");
      setUser(null);
      setFirestoreUser(null);
      setLoading(false);
    }
    
    return () => {
      authUnsubscribe();
      firestoreUnsubscribe();
    };
  }, []);

  return (
    <AuthContext.Provider value={{ user, firestoreUser, loading }}>
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
