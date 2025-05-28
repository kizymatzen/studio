'use client';

import { useRouter } from 'next/navigation';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth, db } from '@/lib/firebase/config';
import { doc, setDoc } from 'firebase/firestore';
import { AuthForm } from '@/components/auth/auth-form';
import type { SignupInput } from '@/lib/schemas';
import { useToast } from '@/hooks/use-toast';

export default function SignupPage() {
  const router = useRouter();
  const { toast } = useToast();

  const handleSignup = async (values: SignupInput) => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, values.email, values.password);
      const user = userCredential.user;

      // Create user document in Firestore
      await setDoc(doc(db, 'users', user.uid), {
        email: user.email,
        createdAt: new Date(),
      });

      toast({ title: 'Signup Successful', description: 'Welcome to Little Steps!'});
      router.push('/dashboard');
    } catch (error: any) {
      console.error('Signup failed:', error);
      let errorMessage = 'Signup failed. Please try again.';
      if (error.code === 'auth/email-already-in-use') {
        errorMessage = 'This email is already registered. Please login or use a different email.';
      }
      toast({ variant: 'destructive', title: 'Signup Failed', description: errorMessage });
      throw new Error(errorMessage); // re-throw to be caught by AuthForm
    }
  };

  return <AuthForm isLogin={false} onSubmit={handleSignup} />;
}
