
'use client';

import { useRouter } from 'next/navigation';
import { BehaviorLogForm } from '@/components/forms/behavior-log-form';
import { AppStateProvider, useAppState } from '@/contexts/app-state-context';
import { useAuth } from '@/contexts/auth-context';
import { getDbSafe } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp, Timestamp } from 'firebase/firestore';
import type { BehaviorLogInput } from '@/lib/schemas';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

function LogBehaviorContent() {
  const router = useRouter();
  const { user } = useAuth();
  const { selectedChild, childrenLoading } = useAppState();
  const { toast } = useToast();

  const handleSubmit = async (values: BehaviorLogInput) => {
    if (!user || !selectedChild) {
      toast({ variant: 'destructive', title: 'Error', description: 'User or child not selected.' });
      return null;
    }

    try {
      const db = getDbSafe();
      const docRef = await addDoc(collection(db, 'behaviorLogs'), {
        ...values,
        date: Timestamp.fromDate(values.date), // Convert JS Date to Firestore Timestamp
        parentId: user.uid,
        childId: selectedChild.id, // Ensure childId is from selectedChild context
        createdAt: serverTimestamp(),
      });
      toast({ title: 'Behavior Logged', description: 'Redirecting to suggestions...' });
      router.push(`/suggestions/${docRef.id}`);
      return docRef.id;
    } catch (error) {
      console.error('Error logging behavior:', error);
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to log behavior. Please try again.' });
      return null;
    }
  };
  
  if (childrenLoading && !selectedChild) {
    return (
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <Skeleton className="h-8 w-3/4 mb-2" />
          <Skeleton className="h-4 w-1/2" />
        </CardHeader>
        <CardContent className="space-y-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-4 w-1/4" />
              <Skeleton className="h-10 w-full" />
            </div>
          ))}
          <Skeleton className="h-10 w-1/3" />
        </CardContent>
      </Card>
    );
  }

  if (!selectedChild) {
    return (
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Log New Behavior</CardTitle>
          <CardDescription>Please select a child profile on the dashboard first.</CardDescription>
        </CardHeader>
        <CardContent>
          <Link href="/dashboard">
            <Button variant="link">Go to Dashboard</Button>
          </Link>
        </CardContent>
      </Card>
    );
  }


  return (
    <Card className="max-w-2xl mx-auto shadow-xl">
      <CardHeader>
        <CardTitle className="text-2xl">Log New Behavior for {selectedChild.name}</CardTitle>
        <CardDescription>
          Record your child's recent behavior to receive personalized story and activity suggestions.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <BehaviorLogForm childId={selectedChild.id} onSubmit={handleSubmit} />
      </CardContent>
    </Card>
  );
}


export default function LogBehaviorPage() {
  return (
    <AppStateProvider>
      <LogBehaviorContent />
    </AppStateProvider>
  );
}

