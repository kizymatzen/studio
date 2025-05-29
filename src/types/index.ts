
import type { Timestamp } from 'firebase/firestore';
import type { emotionOptions } from '@/lib/schemas';

export interface BehaviorLog {
  id: string;
  childId: string;
  parentId: string;
  date: Timestamp; // Firestore Timestamp
  emotion: typeof emotionOptions[number];
  trigger: string;
  resolution: string;
  createdAt: Timestamp; // Firestore Timestamp for sorting
  storySuggestion?: {
    title: string;
    summary: string;
    reason: string;
  };
  activitySuggestions?: string[];
}

export interface UserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  role: 'parent' | 'therapist' | 'teacher' | 'admin'; // Example roles
  membership: 'free' | 'pro';
  childIds?: string[]; // IDs of children managed by this parent (for parents)
  professionalIds?: string[]; // IDs of professionals linked by this parent (for parents)
  linkedChildren?: string[]; // IDs of children this professional is linked to (for professionals)
  linkedBy?: string; // UID of the parent who linked this professional (for professionals)
  storageUsed: number; // in MB
  storageLimit: number; // in MB
  createdAt: Timestamp;
  providerId?: string;
}

export interface ChildProfileFirestore {
  // Represents the structure in Firestore, parentId is key for linking
  name: string;
  parentId: string;
  professionalIds?: string[];
  createdAt: Timestamp;
  // other fields like age, dob if you add them
}
