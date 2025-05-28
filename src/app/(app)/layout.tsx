'use client'; // This layout itself uses hooks (useAuth, useRouter) implicitly through AuthGuard
import type { ReactNode } from 'react';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { AppHeader } from '@/components/core/app-header';
import { Skeleton } from '@/components/ui/skeleton';


// AuthGuard component to protect routes
function AuthGuard({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.replace('/login');
    }
  }, [user, loading, router]);

  if (loading || !user) {
    return (
      <div className="flex min-h-screen flex-col">
        <AppHeader />
        <main className="flex flex-1 items-center justify-center p-4">
          <div className="flex flex-col items-center space-y-4">
            <Skeleton className="h-12 w-12 rounded-full" />
            <Skeleton className="h-4 w-[250px]" />
            <Skeleton className="h-4 w-[200px]" />
          </div>
        </main>
      </div>
    );
  }

  return <>{children}</>;
}


export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <AuthGuard>
      <div className="flex min-h-screen flex-col">
        <AppHeader />
        <main className="flex-1 bg-background">
          <div className="container mx-auto py-8 px-4 sm:px-6 lg:px-8">
            {children}
          </div>
        </main>
        <footer className="py-6 text-center text-sm text-muted-foreground border-t">
          © {new Date().getFullYear()} Little Steps. All rights reserved.
        </footer>
      </div>
    </AuthGuard>
  );
}
