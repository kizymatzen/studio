'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { Skeleton } from '@/components/ui/skeleton';

export default function HomePage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (user) {
        router.replace('/dashboard');
      } else {
        router.replace('/login');
      }
    }
  }, [user, loading, router]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
      <Skeleton className="h-12 w-12 rounded-full mb-4" />
      <Skeleton className="h-6 w-48 mb-2" />
      <Skeleton className="h-4 w-32" />
      <p className="mt-4 text-muted-foreground">Loading Little Steps...</p>
    </div>
  );
}
