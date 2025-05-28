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
  // Optional fields for AI results if stored directly on the log
  storySuggestion?: {
    title: string;
    summary: string;
    reason: string;
  };
  activitySuggestions?: string[];
}
