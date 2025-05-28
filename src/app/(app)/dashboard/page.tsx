// Using AppStateProvider to provide child selection context at a higher level if needed.
// For now, this page structure is fine.
// AppStateProvider must wrap this page, which is handled by wrapping (app) layout

'use client';
import { AppStateProvider, useAppState } from '@/contexts/app-state-context'; // Import useAppState
import { ChildSelector } from '@/components/dashboard/child-selector';
import { RecentLogsList } from '@/components/dashboard/recent-logs-list';
import { AddChildDialog } from '@/components/dashboard/add-child-dialog';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { PlusSquare } from 'lucide-react';

function DashboardContent() {
  const { selectedChild, childrenLoading } = useAppState(); // Use context here

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 p-4 bg-card rounded-lg shadow">
        <div>
          <h1 className="text-3xl font-bold">Welcome to Little Steps</h1>
          <p className="text-muted-foreground">Manage child profiles and track behavior logs.</p>
        </div>
        <div className="flex gap-2">
           <AddChildDialog />
           {selectedChild && (
             <Button asChild>
              <Link href="/log-behavior">
                <PlusSquare className="mr-2 h-4 w-4" /> Log Behavior for {selectedChild.name}
              </Link>
            </Button>
           )}
        </div>
      </div>
      
      <div className="p-4 bg-card rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-2">Select Child Profile</h2>
        <ChildSelector />
      </div>
      
      <RecentLogsList />
    </div>
  );
}


export default function DashboardPage() {
  // Wrap content with AppStateProvider so child selector and recent logs can share state
  return (
    <AppStateProvider>
      <DashboardContent />
    </AppStateProvider>
  );
}
