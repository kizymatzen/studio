'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { Button } from '@/components/ui/button';
import { Logo } from '@/components/core/logo';
import { auth } from '@/lib/firebase';
import { signOut } from 'firebase/auth';
import { LogOut, UserCircle, Home } from 'lucide-react';

export function AppHeader() {
  const { user, loading } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await signOut(auth);
      router.push('/login');
    } catch (error) {
      console.error('Error signing out:', error);
      // Optionally show a toast message for error
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-card shadow-sm">
      <div className="container mx-auto flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href={user ? "/dashboard" : "/"} passHref>
          <Logo />
        </Link>
        <nav className="flex items-center gap-4">
          {loading ? (
            <div className="h-8 w-20 animate-pulse rounded-md bg-muted"></div>
          ) : user ? (
            <>
              <Link href="/dashboard" passHref>
                <Button variant="ghost" size="sm">
                  <Home className="mr-2 h-4 w-4" /> Dashboard
                </Button>
              </Link>
              <Button variant="ghost" size="sm" onClick={handleLogout}>
                <LogOut className="mr-2 h-4 w-4" /> Logout
              </Button>
            </>
          ) : (
            <>
              <Link href="/login" passHref>
                <Button variant="ghost" size="sm">Login</Button>
              </Link>
              <Link href="/signup" passHref>
                <Button size="sm">Sign Up</Button>
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
