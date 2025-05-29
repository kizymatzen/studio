
'use client';

import { useRouter } from 'next/navigation';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { getAuthSafe, getDbSafe } from '@/lib/firebase';
import { doc, setDoc, serverTimestamp, Timestamp } from 'firebase/firestore';
import { AuthForm } from '@/components/auth/auth-form';
import type { SignupInput } from '@/lib/schemas';
import { useToast } from '@/hooks/use-toast';
import type { UserProfile } from '@/types';

export default function SignupPage() {
  const router = useRouter();
  const { toast } = useToast();

  const handleSignup = async (values: SignupInput) => {
    try {
      const auth = getAuthSafe();
      const db = getDbSafe();
      const userCredential = await createUserWithEmailAndPassword(auth, values.email, values.password);
      const user = userCredential.user;

      // Create user document in Firestore
      const newUserProfile: UserProfile = {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName || user.email?.split('@')[0] || null, // Default display name
        photoURL: user.photoURL || null,
        role: 'parent',
        membership: 'free',
        childIds: [],
        professionalIds: [],
        storageUsed: 0,
        storageLimit: 10, // Default 10MB for free tier
        createdAt: serverTimestamp() as Timestamp, // Cast to Timestamp for type safety server-side
        providerId: 'password',
      };
      await setDoc(doc(db, 'users', user.uid), newUserProfile);

      toast({ title: 'Signup Successful', description: 'Welcome to Little Steps!'});
      router.push('/dashboard');
    } catch (error: any) {
      console.error('Signup failed:', error);
      let errorMessage = 'Signup failed. Please try again.';
      if (error.code === 'auth/email-already-in-use') {
        errorMessage = 'This email is already registered. Please login or use a different email.';
      } else if (error.code === 'auth/requests-to-this-api-identitytoolkit-method-google.cloud.identitytoolkit.v1.authenticationservice.signup-are-blocked') {
        errorMessage = 'Signup is currently disabled for this project. Please contact support.';
      } else if (error.code === 'auth/unauthorized-domain'){
        errorMessage = 'This domain is not authorized for authentication. Please contact support or try again later.';
      }
      toast({ variant: 'destructive', title: 'Signup Failed', description: errorMessage });
      throw new Error(errorMessage); 
    }
  };

  return <AuthForm isLogin={false} onSubmit={handleSignup} />;
}
