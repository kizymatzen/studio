
'use client';

import { useState, type ChangeEvent } from 'react';
import { Button } from '@/components/ui/button';
import {
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'; // Import only DialogContent and related parts
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/auth-context';
import type { ChildProfile } from '@/contexts/app-state-context';
import { getStorageSafe, getDbSafe } from '@/lib/firebase';
import { ref, uploadBytes } from 'firebase/storage';
import { collection, addDoc, serverTimestamp, updateDoc, doc, increment } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { File as FileIcon, Loader2 } from 'lucide-react';

interface UploadDocumentDialogContentProps {
  child: ChildProfile | null; // Receive child as a prop
  onOpenChange: (open: boolean) => void; // To close the dialog programmatically
}

export function UploadDocumentDialogContent({ child, onOpenChange }: UploadDocumentDialogContentProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  
  const { user, firestoreUser } = useAuth();
  const { toast } = useToast();

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setSelectedFile(event.target.files[0]);
    } else {
      setSelectedFile(null);
    }
  };

  const handleSubmit = async () => {
    console.log('Upload handleSubmit triggered.');
    console.log('selectedFile:', selectedFile);
    console.log('user:', user);
    console.log('child (prop):', child);
    console.log('firestoreUser:', firestoreUser);

    if (!selectedFile || !user || !child || !firestoreUser) {
      toast({
        variant: 'destructive',
        title: 'Upload Error',
        description: 'Missing file, user, or child selection. Please try again.',
      });
      if (!selectedFile) console.error('Upload Debug: selectedFile is missing.');
      if (!user) console.error('Upload Debug: user (auth) is missing.');
      if (!child) console.error('Upload Debug: child (prop) is missing.');
      if (!firestoreUser) console.error('Upload Debug: firestoreUser is missing.');
      return;
    }

    const currentStorageUsedMB = firestoreUser.storageUsed || 0;
    const storageLimitMB = firestoreUser.storageLimit || 10; 
    const newFileSizeMB = selectedFile.size / (1024 * 1024);

    if (currentStorageUsedMB + newFileSizeMB > storageLimitMB) {
        toast({
            variant: 'destructive',
            title: 'Storage Limit Exceeded',
            description: `Uploading this file would exceed your ${storageLimitMB}MB storage limit. Current usage: ${currentStorageUsedMB.toFixed(1)}MB.`,
        });
        return;
    }

    setIsUploading(true);
    try {
      const storage = getStorageSafe();
      const db = getDbSafe();

      const storagePath = `documents/${user.uid}/${child.id}/${selectedFile.name}`;
      const storageRef = ref(storage, storagePath);

      const uploadResult = await uploadBytes(storageRef, selectedFile);
      console.log('File uploaded successfully:', uploadResult);

      await addDoc(collection(db, 'documents'), {
        childId: child.id,
        ownerId: user.uid,
        docName: selectedFile.name,
        storagePath: uploadResult.metadata.fullPath, 
        fileType: selectedFile.type,
        fileSize: selectedFile.size, 
        uploadedAt: serverTimestamp(),
      });
      
      const userDocRef = doc(db, 'users', user.uid);
      await updateDoc(userDocRef, {
          storageUsed: increment(newFileSizeMB)
      });

      toast({
        title: 'Upload Successful',
        description: `${selectedFile.name} has been uploaded.`,
      });

      setSelectedFile(null); 
      onOpenChange(false); // Close dialog on success
    } catch (error: any) {
      console.error('Error uploading document:', error);
      toast({
        variant: 'destructive',
        title: 'Upload Failed',
        description: error.message || 'An unexpected error occurred during upload.',
      });
    } finally {
      setIsUploading(false);
    }
  };
  
  // Reset state if the dialog is closed externally (e.g. isOpen prop changes)
  // This is mainly handled by DashboardPage's onOpenChange now.

  if (!child) {
    // This case should ideally not be hit if DialogContent is only rendered when child exists,
    // but good for robustness.
    return (
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Error</DialogTitle>
          <DialogDescription>Child information is not available. Please select a child first.</DialogDescription>
        </DialogHeader>
        <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)}>Close</Button>
        </DialogFooter>
      </DialogContent>
    );
  }

  return (
    <DialogContent className="sm:max-w-[425px]">
      <DialogHeader>
        <DialogTitle>Upload Document for {child?.name}</DialogTitle>
        <DialogDescription>
          Select a file to upload. It will be associated with {child?.name}.
        </DialogDescription>
      </DialogHeader>
      
      <div className="grid w-full max-w-sm items-center gap-1.5 py-4">
        <Label htmlFor="document-file">Document File</Label>
        <Input id="document-file" type="file" onChange={handleFileChange} disabled={isUploading} />
      </div>

      {selectedFile && (
        <div className="p-2 border rounded-md bg-muted text-sm flex items-center gap-2 mb-4">
          <FileIcon className="h-4 w-4 shrink-0" />
          <span className="truncate flex-grow">{selectedFile.name}</span>
          <span className="text-muted-foreground text-xs whitespace-nowrap">
            ({(selectedFile.size / (1024 * 1024)).toFixed(2)} MB)
          </span>
        </div>
      )}
    
      <DialogFooter>
        <Button variant="outline" onClick={() => {
          setSelectedFile(null); // Clear selected file on cancel
          onOpenChange(false);
        }} disabled={isUploading}>
          Cancel
        </Button>
        <Button onClick={handleSubmit} disabled={!selectedFile || isUploading || !user || !firestoreUser || !child}>
          {isUploading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Uploading...
            </>
          ) : (
            'Upload'
          )}
        </Button>
      </DialogFooter>
    </DialogContent>
  );
}
