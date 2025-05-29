'use client';

import type { ReactNode} from 'react';
import { createContext, useContext, useState, useEffect } from 'react';
import type { DocumentData, QueryDocumentSnapshot } from 'firebase/firestore';
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from './auth-context';

export interface ChildProfile {
  id: string;
  name: string;
  // age?: number; // Add if needed
  parentId: string;
}

interface AppStateContextType {
  selectedChild: ChildProfile | null;
  setSelectedChildId: (childId: string | null) => void;
  childrenProfiles: ChildProfile[];
  childrenLoading: boolean;
}

const AppStateContext = createContext<AppStateContextType | undefined>(undefined);

export function AppStateProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [selectedChildId, setSelectedChildIdState] = useState<string | null>(null);
  const [childrenProfiles, setChildrenProfiles] = useState<ChildProfile[]>([]);
  const [childrenLoading, setChildrenLoading] = useState(true);

  // Load children profiles for the current user
  useEffect(() => {
    if (user) {
      setChildrenLoading(true);
      const q = query(collection(db, 'children'), where('parentId', '==', user.uid), orderBy('name'));
      const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const profiles = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ChildProfile));
        setChildrenProfiles(profiles);
        
        // If no child is selected, or selected child is no longer available, select the first one
        if (profiles.length > 0 && (!selectedChildId || !profiles.find(p => p.id === selectedChildId))) {
          setSelectedChildIdState(profiles[0].id);
        } else if (profiles.length === 0) {
          setSelectedChildIdState(null); // No children, no selection
        }
        setChildrenLoading(false);
      }, (error) => {
        console.error("Error fetching children profiles:", error);
        setChildrenLoading(false);
      });
      return () => unsubscribe();
    } else {
      // No user, clear children profiles and selection
      setChildrenProfiles([]);
      setSelectedChildIdState(null);
      setChildrenLoading(false);
    }
  }, [user, selectedChildId]); // re-run if user changes, or selectedChildId needs re-validation

  const selectedChild = childrenProfiles.find(child => child.id === selectedChildId) || null;

  const setSelectedChildId = (childId: string | null) => {
    setSelectedChildIdState(childId);
  }

  return (
    <AppStateContext.Provider value={{ selectedChild, setSelectedChildId, childrenProfiles, childrenLoading }}>
      {children}
    </AppStateContext.Provider>
  );
}

export function useAppState() {
  const context = useContext(AppStateContext);
  if (context === undefined) {
    throw new Error('useAppState must be used within an AppStateProvider');
  }
  return context;
}
