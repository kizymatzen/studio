'use client';

import { useRouter } from 'next/navigation';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth, db } from '@/lib/firebase/config';
import { AuthForm } from '@/components/auth/auth-form';
import type { LoginInput } from '@/lib/schemas';
import { useToast } from '@/hooks/use-toast';

export default function LoginPage() {
  const router = useRouter();
  const { toast } = useToast();

  const handleLogin = async (values: LoginInput) => {
    try {
      await signInWithEmailAndPassword(auth, values.email, values.password);
      toast({ title: 'Login Successful', description: 'Welcome back!' });
      router.push('/dashboard');
    } catch (error: any) {
      console.error('Login failed:', error);
      let errorMessage = 'Login failed. Please check your credentials.';
      if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
        errorMessage = 'Invalid email or password.';
      }
      toast({ variant: 'destructive', title: 'Login Failed', description: errorMessage });
      throw new Error(errorMessage); // re-throw to be caught by AuthForm
    }
  };

  return <AuthForm isLogin={true} onSubmit={handleLogin} />;
}
