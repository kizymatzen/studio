
'use client';
import { AppStateProvider, useAppState } from '@/contexts/app-state-context';
import { useAuth } from '@/contexts/auth-context';
import { ChildSelector } from '@/components/dashboard/child-selector';
import { RecentLogsList } from '@/components/dashboard/recent-logs-list';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { PlusSquare, UserPlus, UploadCloud, Star, Info, FileText } from 'lucide-react';
import dynamic from 'next/dynamic';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { DocumentList } from '@/components/dashboard/document-list';
import { useState } from 'react';
import { Dialog, DialogTrigger } from '@/components/ui/dialog'; // Import Dialog and DialogTrigger

const AddChildDialog = dynamic(() =>
  import('@/components/dashboard/add-child-dialog').then(mod => mod.AddChildDialog),
  {
    ssr: false,
    loading: () => <Skeleton className="h-10 w-[130px] rounded-md" />
  }
);

// Dynamically import the renamed UploadDocumentDialogContent
const UploadDocumentDialogContent = dynamic(() =>
  import('@/components/dashboard/upload-document-dialog').then(mod => mod.UploadDocumentDialogContent),
  {
    ssr: false,
    loading: () => (
      // Placeholder for dialog content loading state if needed
      <div className="p-6"><Skeleton className="h-40 w-full" /></div>
    )
  }
);


function DashboardContent() {
  const { selectedChild, childrenLoading } = useAppState();
  const { firestoreUser, loading: authLoading } = useAuth();
  const [isUploadDocumentDialogOpen, setIsUploadDocumentDialogOpen] = useState(false);


  const isProMember = firestoreUser?.membership === 'pro';
  const professionalsCount = firestoreUser?.professionalIds?.length || 0;
  const canAddMoreProfessionals = isProMember || professionalsCount < 1;

  if (authLoading) {
    return (
       <div className="space-y-8">
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  const addProfessionalButtonDisabled = !canAddMoreProfessionals && !isProMember;
  const uploadDocumentButtonDisabled = !selectedChild;

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 p-4 bg-card rounded-lg shadow">
        <div>
          <h1 className="text-3xl font-bold">Welcome to Little Steps</h1>
          <p className="text-muted-foreground">
            Manage child profiles, track behavior logs, and collaborate with professionals.
          </p>
          {firestoreUser && (
            <div className="mt-2 text-sm">
              <p>Membership: <span className={`font-semibold ${isProMember ? 'text-green-600' : 'text-blue-600'}`}>{firestoreUser.membership}</span></p>
              <p>Storage: {firestoreUser.storageUsed?.toFixed(1) || 0} MB / {firestoreUser.storageLimit || 0} MB used</p>
            </div>
          )}
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
           <AddChildDialog />
           {selectedChild && (
             <Button asChild>
              <Link href="/log-behavior">
                <PlusSquare className="mr-2 h-4 w-4" /> Log Behavior for {selectedChild.name}
              </Link>
            </Button>
           )}
           {!isProMember && firestoreUser && (
             <Button variant="outline" onClick={() => {
                console.log('Upgrade to Pro button clicked');
                alert("Upgrade to Pro - Coming Soon!");
                }}>
               <Star className="mr-2 h-4 w-4" /> Upgrade to Pro
             </Button>
           )}
        </div>
      </div>
      
      <div className="grid md:grid-cols-2 gap-6">
        <Card className="shadow-md">
          <CardHeader>
            <CardTitle>Child Profile Management</CardTitle>
          </CardHeader>
          <CardContent>
            <ChildSelector />
            {!childrenLoading && !selectedChild && (
              <p className="text-muted-foreground mt-4">Please add a child to get started.</p>
            )}
          </CardContent>
        </Card>

        <Card className="shadow-md">
          <CardHeader>
            <CardTitle>Collaboration & Resources</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="text-md font-semibold mb-1">Linked Professionals</h3>
              {firestoreUser && !canAddMoreProfessionals && !isProMember && (
                <Alert variant="default" className="mb-2 bg-accent/30 border-accent">
                  <Info className="h-4 w-4 text-accent-foreground" />
                  <AlertDescription className="text-accent-foreground">
                    You can link 1 professional on the Free plan. <Button variant="link" size="sm" className="p-0 h-auto" onClick={() => {
                        console.log('Upgrade to Pro link clicked from Alert');
                        alert("Upgrade to Pro - Coming Soon!");
                    }}>Upgrade to Pro</Button> for unlimited.
                  </AlertDescription>
                </Alert>
              )}
              <p className="text-sm text-muted-foreground">
                {professionalsCount} professional(s) linked.
                {isProMember ? " Add more to enrich your child's profile." : ""}
              </p>
              <Button
                variant="outline"
                size="sm"
                className="mt-2"
                onClick={() => {
                  console.log(`Add Professional button clicked. It is currently ${addProfessionalButtonDisabled ? 'disabled' : 'enabled'}. isProMember: ${isProMember}, professionalsCount: ${professionalsCount}`);
                  alert("Add Professional - Coming Soon!");
                }}
                disabled={addProfessionalButtonDisabled}>
                <UserPlus className="mr-2 h-4 w-4" /> Add Professional
              </Button>
            </div>
            <div>
              <h3 className="text-md font-semibold mb-1 mt-4 flex items-center gap-2"><FileText className="h-5 w-5"/>Document Management</h3>
              <p className="text-sm text-muted-foreground">Securely upload and share documents related to your child's development.</p>
              
              <Dialog open={isUploadDocumentDialogOpen} onOpenChange={(isOpen) => {
                setIsUploadDocumentDialogOpen(isOpen);
                // If dialog is closing and not uploading, it's a good time to reset any internal states if needed,
                // but UploadDocumentDialogContent handles its own internal selectedFile reset on cancel.
              }}>
                <DialogTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-2"
                    disabled={uploadDocumentButtonDisabled}
                    onClick={() => {
                      if (selectedChild) {
                         console.log('Upload Document button clicked for child:', selectedChild.name);
                         setIsUploadDocumentDialogOpen(true);
                      } else {
                         console.log('Upload Document button clicked, but no child selected (button should be disabled).');
                      }
                    }}
                  >
                    <UploadCloud className="mr-2 h-4 w-4" /> Upload Document
                  </Button>
                </DialogTrigger>
                {/* Conditionally render content to ensure selectedChild is available */}
                {selectedChild && isUploadDocumentDialogOpen && (
                    <UploadDocumentDialogContent 
                        child={selectedChild} 
                        onOpenChange={setIsUploadDocumentDialogOpen} 
                    />
                )}
              </Dialog>

              {selectedChild ? (
                <DocumentList />
              ) : (
                <p className="text-sm text-muted-foreground mt-4">Select a child to manage their documents.</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
      
      <RecentLogsList />
    </div>
  );
}

export default function DashboardPage() {
  return (
    <AppStateProvider>
        <DashboardContent />
    </AppStateProvider>
  );
}
