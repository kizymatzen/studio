
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
  role: 'parent' | 'therapist' | 'teacher' | 'admin';
  membership: 'free' | 'pro';
  childIds?: string[]; 
  professionalIds?: string[]; 
  linkedChildren?: string[]; 
  linkedBy?: string; 
  storageUsed: number; // in MB
  storageLimit: number; // in MB
  createdAt: Timestamp;
  providerId?: string;
}

export interface ChildProfileFirestore {
  name: string;
  parentId: string;
  professionalIds: string[]; // Initialized as empty array on creation
  createdAt: Timestamp;
}

export interface DocumentMetadata {
  id: string;
  childId: string;
  ownerId: string; // UID of the parent who uploaded
  docName: string;
  storagePath: string; // Full path in Firebase Storage
  fileType: string; // e.g., 'application/pdf'
  fileSize: number; // in bytes
  uploadedAt: Timestamp;
}
