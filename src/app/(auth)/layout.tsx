import type { ReactNode } from 'react';
import { AppHeader } from '@/components/core/app-header';

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <AppHeader />
      <main className="flex flex-1 items-center justify-center bg-background p-4">
        {children}
      </main>
    </div>
  );
}
