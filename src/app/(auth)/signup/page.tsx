
'use client';

import { useRouter } from 'next/navigation';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { getAuthSafe, getDbSafe } from '@/lib/firebase';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { AuthForm } from '@/components/auth/auth-form';
import type { SignupInput } from '@/lib/schemas';
import { useToast } from '@/hooks/use-toast';

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
      await setDoc(doc(db, 'users', user.uid), {
        email: user.email,
        displayName: user.displayName || null, // Store display name if available (usually not for email/pass)
        photoURL: user.photoURL || null,     // Store photo URL if available
        createdAt: serverTimestamp(),      // Use serverTimestamp for consistency
        providerId: 'password', // Indicate email/password provider
      });

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
      throw new Error(errorMessage); // re-throw to be caught by AuthForm
    }
  };

  // For now, OAuth is only on the login page. 
  // If you want to add it to signup, pass the handlers like in login page.
  return <AuthForm isLogin={false} onSubmit={handleSignup} />;
}
