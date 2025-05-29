
'use client';
import { AppStateProvider, useAppState } from '@/contexts/app-state-context';
import { useAuth } from '@/contexts/auth-context'; 
import { ChildSelector } from '@/components/dashboard/child-selector';
import { RecentLogsList } from '@/components/dashboard/recent-logs-list';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { PlusSquare, UserPlus, UploadCloud, Star, Info, FileText } from 'lucide-react'; // Added FileText
import dynamic from 'next/dynamic';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { DocumentList } from '@/components/dashboard/document-list'; // Import DocumentList

const AddChildDialog = dynamic(() => 
  import('@/components/dashboard/add-child-dialog').then(mod => mod.AddChildDialog), 
  { 
    ssr: false,
    loading: () => <Skeleton className="h-10 w-[130px] rounded-md" />
  }
);

function DashboardContent() {
  const { selectedChild, childrenLoading } = useAppState();
  const { firestoreUser, loading: authLoading } = useAuth(); 

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
             <Button variant="outline" onClick={() => alert("Upgrade to Pro - Coming Soon!")}>
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
                    You can link 1 professional on the Free plan. <Button variant="link" size="sm" className="p-0 h-auto" onClick={() => alert("Upgrade to Pro - Coming Soon!")}>Upgrade to Pro</Button> for unlimited.
                  </AlertDescription>
                </Alert>
              )}
              <p className="text-sm text-muted-foreground">
                {professionalsCount} professional(s) linked.
                {isProMember ? " Add more to enrich your child's profile." : ""}
              </p>
              <Button variant="outline" size="sm" className="mt-2" onClick={() => alert("Add Professional - Coming Soon!")} disabled={!canAddMoreProfessionals && !isProMember}>
                <UserPlus className="mr-2 h-4 w-4" /> Add Professional
              </Button>
            </div>
            <div>
              <h3 className="text-md font-semibold mb-1 mt-4 flex items-center gap-2"><FileText className="h-5 w-5"/>Document Management</h3>
              <p className="text-sm text-muted-foreground">Securely upload and share documents related to your child's development.</p>
              <Button variant="outline" size="sm" className="mt-2" onClick={() => alert("Upload Document - Coming Soon!")} disabled={!selectedChild}>
                <UploadCloud className="mr-2 h-4 w-4" /> Upload Document
              </Button>
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
