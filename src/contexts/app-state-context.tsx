
'use client';

import type { ReactNode} from 'react';
import { createContext, useContext, useState, useEffect } from 'react';
import type { DocumentData, QueryDocumentSnapshot, Timestamp } from 'firebase/firestore';
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';
import { getDbSafe } from '@/lib/firebase';
import { useAuth } from './auth-context';
// Using Firestore specific type for ChildProfile as stored in DB
import type { ChildProfileFirestore } from '@/types';


// This is the type for ChildProfile as used in the app's state
export interface ChildProfile extends ChildProfileFirestore {
  id: string; 
}

interface AppStateContextType {
  selectedChild: ChildProfile | null;
  setSelectedChildId: (childId: string | null) => void;
  childrenProfiles: ChildProfile[];
  childrenLoading: boolean;
}

const AppStateContext = createContext<AppStateContextType | undefined>(undefined);

export function AppStateProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth(); // Firebase Auth user
  const [selectedChildId, setSelectedChildIdState] = useState<string | null>(null);
  const [childrenProfiles, setChildrenProfiles] = useState<ChildProfile[]>([]);
  const [childrenLoading, setChildrenLoading] = useState(true);

  useEffect(() => {
    if (user) {
      setChildrenLoading(true);
      try {
        const db = getDbSafe();
        const q = query(collection(db, 'children'), where('parentId', '==', user.uid), orderBy('name'));
        const unsubscribe = onSnapshot(q, (querySnapshot) => {
          const profiles = querySnapshot.docs.map(doc => ({ 
            id: doc.id, 
            ...doc.data() 
          } as ChildProfile));
          setChildrenProfiles(profiles);
          
          if (profiles.length > 0 && (!selectedChildId || !profiles.find(p => p.id === selectedChildId))) {
            setSelectedChildIdState(profiles[0].id);
          } else if (profiles.length === 0) {
            setSelectedChildIdState(null);
          }
          setChildrenLoading(false);
        }, (error) => {
          console.error("Error fetching children profiles:", error);
          setChildrenLoading(false);
        });
        return () => unsubscribe();
      } catch (e) {
        console.error("AppStateProvider: Failed to get Firestore instance.", e);
        setChildrenProfiles([]);
        setSelectedChildIdState(null);
        setChildrenLoading(false);
        return () => {};
      }
    } else {
      setChildrenProfiles([]);
      setSelectedChildIdState(null);
      setChildrenLoading(false);
    }
  }, [user, selectedChildId]);

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
