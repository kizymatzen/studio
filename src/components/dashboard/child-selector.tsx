'use client';

import { useAppState, type ChildProfile } from '@/contexts/app-state-context';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Users } from 'lucide-react';

export function ChildSelector() {
  const { selectedChild, setSelectedChildId, childrenProfiles, childrenLoading } = useAppState();

  if (childrenLoading) {
    return <Skeleton className="h-10 w-full max-w-xs" />;
  }

  if (!childrenProfiles.length) {
    return <p className="text-muted-foreground italic">No child profiles found. Please add one.</p>;
  }

  return (
    <div className="flex items-center gap-2">
      <Users className="h-5 w-5 text-muted-foreground" />
      <Select
        value={selectedChild?.id || ''}
        onValueChange={(value) => setSelectedChildId(value)}
        disabled={childrenLoading || !childrenProfiles.length}
      >
        <SelectTrigger className="w-full max-w-xs">
          <SelectValue placeholder="Select a child profile..." />
        </SelectTrigger>
        <SelectContent>
          {childrenProfiles.map((child) => (
            <SelectItem key={child.id} value={child.id}>
              {child.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
