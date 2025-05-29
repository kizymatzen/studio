
'use client';

import { useEffect, useState } from 'react';
import { useAppState } from '@/contexts/app-state-context';
import { getDbSafe } from '@/lib/firebase';
import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import type { DocumentMetadata } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { FileText, Download, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';

export function DocumentList() {
  const { selectedChild } = useAppState();
  const [documents, setDocuments] = useState<DocumentMetadata[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const childId = selectedChild?.id; // Use childId for dependency

    if (!childId) {
      setDocuments([]);
      setIsLoading(false);
      setError(null);
      return;
    }

    setIsLoading(true);
    setError(null);
    let unsubscribe = () => {}; // Initialize unsubscribe to a no-op

    try {
      const db = getDbSafe();
      const q = query(
        collection(db, 'documents'),
        where('childId', '==', childId), // Use childId in query
        orderBy('uploadedAt', 'desc')
      );

      unsubscribe = onSnapshot(q, (querySnapshot) => {
        const fetchedDocs = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as DocumentMetadata));
        setDocuments(fetchedDocs);
        setIsLoading(false);
      }, (err) => {
        console.error("Error fetching documents:", err);
        setError("Failed to load documents.");
        setIsLoading(false);
      });

    } catch (e: any) {
      console.error("Error initializing Firestore listener for documents:", e);
      setError("Failed to initialize connection for documents.");
      setIsLoading(false);
    }
    return () => unsubscribe();
  }, [selectedChild?.id]); // Depend on selectedChild.id

  if (!selectedChild) {
    return (
        <p className="text-sm text-muted-foreground mt-2">Select a child to view their documents.</p>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-3 mt-4">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="mt-4 p-4 border border-destructive/50 bg-destructive/10 rounded-md">
        <div className="flex items-center gap-2 text-destructive">
            <AlertCircle className="h-5 w-5" />
            <p className="font-semibold">Error loading documents</p>
        </div>
        <p className="text-sm text-destructive/80 ">{error}</p>
      </div>
    );
  }

  if (documents.length === 0) {
    return (
      <p className="text-sm text-muted-foreground mt-4">No documents uploaded for {selectedChild.name} yet.</p>
    );
  }

  return (
    <ScrollArea className="h-[200px] mt-4 pr-3">
      <ul className="space-y-3">
        {documents.map((doc) => (
          <li key={doc.id} className="flex items-center justify-between p-3 border rounded-md bg-secondary/20 hover:shadow-sm transition-shadow">
            <div className="flex items-center gap-3">
              <FileText className="h-6 w-6 text-primary" />
              <div>
                <p className="font-medium text-sm">{doc.docName}</p>
                <p className="text-xs text-muted-foreground">
                  Uploaded on {doc.uploadedAt ? format(doc.uploadedAt.toDate(), 'MMM d, yyyy') : 'Date unknown'}
                </p>
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={() => alert(`Download ${doc.docName} - Coming Soon!`)} title="Download document">
              <Download className="h-4 w-4" />
            </Button>
          </li>
        ))}
      </ul>
    </ScrollArea>
  );
}
