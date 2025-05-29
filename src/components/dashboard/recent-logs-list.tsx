
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAppState } from '@/contexts/app-state-context';
import { getDbSafe } from '@/lib/firebase';
import { collection, query, where, orderBy, limit, onSnapshot } from 'firebase/firestore';
import type { BehaviorLog } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button }
from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { FileText, CalendarDays, Smile, AlertTriangle, Frown, Angry, Meh, Wind, Zap, CheckCircle2, Edit3 } from 'lucide-react'; // Added more icons
import { format } from 'date-fns';

function EmotionIcon({ emotion }: { emotion: BehaviorLog['emotion'] }) {
  switch (emotion) {
    case 'Happy': return <Smile className="h-5 w-5 text-green-500" />;
    case 'Sad': return <Frown className="h-5 w-5 text-blue-500" />;
    case 'Angry': return <Angry className="h-5 w-5 text-red-500" />;
    case 'Anxious': return <Meh className="h-5 w-5 text-yellow-500" />; // Using Meh for Anxious
    case 'Calm': return <Wind className="h-5 w-5 text-teal-500" />; // Using Wind for Calm
    case 'Frustrated': return <AlertTriangle className="h-5 w-5 text-orange-500" />;
    case 'Excited': return <Zap className="h-5 w-5 text-purple-500" />;
    case 'Scared': return <Frown className="h-5 w-5 text-gray-500" />; // Re-using Frown or specific icon
    default: return <FileText className="h-5 w-5 text-muted-foreground" />;
  }
}

export function RecentLogsList() {
  const { selectedChild } = useAppState();
  const [logs, setLogs] = useState<BehaviorLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!selectedChild) {
      setLogs([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const db = getDbSafe();
      const q = query(
        collection(db, 'behaviors'), // Renamed collection
        where('childId', '==', selectedChild.id),
        orderBy('date', 'desc'),
        limit(10)
      );

      const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const fetchedLogs = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as BehaviorLog));
        setLogs(fetchedLogs);
        setIsLoading(false);
      }, (err) => {
        console.error("Error fetching recent logs:", err);
        setError("Failed to load recent logs.");
        setIsLoading(false);
      });

      return () => unsubscribe();
    } catch (e: any) {
      console.error("Error initializing Firestore listener:", e);
      setError("Failed to initialize connection for recent logs.");
      setIsLoading(false);
      return () => {}; // No-op unsubscribe
    }
  }, [selectedChild]);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-1/2" />
          <Skeleton className="h-4 w-3/4" />
        </CardHeader>
        <CardContent className="space-y-4">
          {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Error</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-destructive">{error}</p>
        </CardContent>
      </Card>
    );
  }
  
  if (!selectedChild) {
     return (
      <Card>
        <CardHeader>
          <CardTitle>Recent Behavior Logs</CardTitle>
          <CardDescription>Select a child to see their recent logs.</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground italic text-center py-8">Please select a child profile above.</p>
        </CardContent>
      </Card>
    );
  }

  if (logs.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Recent Behavior Logs for {selectedChild.name}</CardTitle>
          <CardDescription>No behavior logs found for this child yet.</CardDescription>
        </CardHeader>
        <CardContent className="text-center py-8">
          <FileText className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-muted-foreground">Start by logging a new behavior for {selectedChild.name}.</p>
           <Button asChild className="mt-4">
            <Link href="/log-behavior">Log New Behavior</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle>Recent Behavior Logs for {selectedChild.name}</CardTitle>
        <CardDescription>Showing the last {logs.length} entries. Click an entry for details & suggestions.</CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px] pr-4">
          <ul className="space-y-4">
            {logs.map((log) => (
              <li key={log.id} className="border p-4 rounded-lg hover:shadow-md transition-shadow bg-card">
                <Link href={`/suggestions/${log.id}`} className="block group">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <EmotionIcon emotion={log.emotion} />
                      <span className="font-semibold text-lg group-hover:text-primary">{log.emotion}</span>
                    </div>
                    <span className="text-sm text-muted-foreground flex items-center gap-1">
                      <CalendarDays className="h-4 w-4" />
                      {format(log.date.toDate(), 'MMM d, yyyy')}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground truncate mb-1">
                    <span className="font-medium text-foreground">Trigger:</span> {log.trigger}
                  </p>
                  <p className="text-sm text-muted-foreground truncate">
                   <span className="font-medium text-foreground">Resolution:</span> {log.resolution}
                  </p>
                   <Button variant="link" size="sm" className="p-0 h-auto mt-2 text-primary group-hover:underline">
                    View Suggestions <Edit3 className="ml-1 h-3 w-3"/>
                  </Button>
                </Link>
              </li>
            ))}
          </ul>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
