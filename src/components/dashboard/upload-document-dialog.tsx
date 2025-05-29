
'use client';

import { useState, type ChangeEvent } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/auth-context';
import { useAppState } from '@/contexts/app-state-context';
import { getStorageSafe, getDbSafe } from '@/lib/firebase';
import { ref, uploadBytes } from 'firebase/storage';
import { collection, addDoc, serverTimestamp, updateDoc, doc, increment } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { UploadCloud, File as FileIcon, Loader2 } from 'lucide-react';

export function UploadDocumentDialog() {
  const [open, setOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  
  const { user, firestoreUser } = useAuth(); // Auth user and Firestore user profile
  const { selectedChild } = useAppState();
  const { toast } = useToast();

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setSelectedFile(event.target.files[0]);
    } else {
      setSelectedFile(null);
    }
  };

  const handleSubmit = async () => {
    if (!selectedFile || !user || !selectedChild || !firestoreUser) {
      toast({
        variant: 'destructive',
        title: 'Upload Error',
        description: 'Missing file, user, or child selection. Please try again.',
      });
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

      const storagePath = `documents/${user.uid}/${selectedChild.id}/${selectedFile.name}`;
      const storageRef = ref(storage, storagePath);

      const uploadResult = await uploadBytes(storageRef, selectedFile);
      console.log('File uploaded successfully:', uploadResult);

      await addDoc(collection(db, 'documents'), {
        childId: selectedChild.id,
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
      setOpen(false); 
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
  
  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen);
    if (!isOpen) {
      setSelectedFile(null); 
      setIsUploading(false); 
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline" className="mt-2" disabled={!selectedChild || isUploading}>
          <UploadCloud className="mr-2 h-4 w-4" /> Upload Document
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Upload Document for {selectedChild?.name}</DialogTitle>
          <DialogDescription>
            Select a file to upload. It will be associated with {selectedChild?.name}.
          </DialogDescription>
        </DialogHeader>
        
        {/* Input Group - direct child of DialogContent grid */}
        <div className="grid w-full max-w-sm items-center gap-1.5">
          <Label htmlFor="document-file">Document File</Label>
          <Input id="document-file" type="file" onChange={handleFileChange} disabled={isUploading} />
        </div>

        {/* Selected File Info - direct child of DialogContent grid */}
        {selectedFile && (
          <div className="p-2 border rounded-md bg-muted text-sm flex items-center gap-2">
            <FileIcon className="h-4 w-4 shrink-0" />
            <span className="truncate flex-grow">{selectedFile.name}</span>
            <span className="text-muted-foreground text-xs whitespace-nowrap">
              ({(selectedFile.size / (1024 * 1024)).toFixed(2)} MB)
            </span>
          </div>
        )}
      
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={isUploading}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={!selectedFile || isUploading}>
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
    </Dialog>
  );
}
