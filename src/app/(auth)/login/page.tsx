
'use client';

import { useRouter } from 'next/navigation';
import { 
  signInWithEmailAndPassword, 
  GoogleAuthProvider, 
  OAuthProvider, 
  signInWithPopup,
  type UserCredential,
  type AuthError 
} from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import { AuthForm } from '@/components/auth/auth-form';
import type { LoginInput } from '@/lib/schemas';
import { useToast } from '@/hooks/use-toast';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';

export default function LoginPage() {
  const router = useRouter();
  const { toast } = useToast();

  const handleSuccessfulLogin = async (userCredential: UserCredential, providerName: string) => {
    const user = userCredential.user;
    const userDocRef = doc(db, 'users', user.uid);
    
    try {
      const userDocSnap = await getDoc(userDocRef);
      if (!userDocSnap.exists()) {
        // User is new or document doesn't exist, create it
        await setDoc(userDocRef, {
          email: user.email,
          displayName: user.displayName || null,
          photoURL: user.photoURL || null,
          providerId: userCredential.providerId || (providerName === 'Google' ? 'google.com' : 'microsoft.com'),
          createdAt: serverTimestamp(),
        });
        toast({ title: 'Account Created & Logged In', description: `Welcome, ${user.displayName || user.email}!` });
      } else {
        // User document exists, could update last login time here if needed
        toast({ title: 'Login Successful', description: `Welcome back, ${user.displayName || user.email}!` });
      }
      router.push('/dashboard');
    } catch (error: any) {
      console.error(`Error handling ${providerName} user document:`, error);
      toast({ variant: 'destructive', title: `${providerName} Login Issue`, description: 'Could not finalize login. Please try again.' });
       // re-throw to be caught by AuthForm if this happens during the form's own social sign-in wrapper
      if (error instanceof Error) throw error; 
      else throw new Error('Failed to process user data post-login.');
    }
  };
  
  const handleSocialLoginError = (error: AuthError, providerName: string) => {
    console.error(`${providerName} sign-in failed:`, error);
    let errorMessage = `Failed to sign in with ${providerName}. Please try again.`;
    if (error.code === 'auth/popup-closed-by-user') {
      errorMessage = 'Sign-in cancelled. Please try again if you wish to proceed.';
    } else if (error.code === 'auth/account-exists-with-different-credential') {
      errorMessage = `An account already exists with this email using a different sign-in method. Try logging in with that method.`;
    } else if (error.code === 'auth/cancelled-popup-request') {
      errorMessage = 'Sign-in process was interrupted. Please try again.'
    }
    toast({ variant: 'destructive', title: `${providerName} Login Failed`, description: errorMessage });
    throw new Error(errorMessage); // re-throw to be caught by AuthForm
  };

  const handleLogin = async (values: LoginInput) => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, values.email, values.password);
      // Standard email login doesn't typically create the user doc here, it's done at signup.
      // If you want to ensure doc exists for older users or handle it here too, add similar logic as in handleSuccessfulLogin.
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

  const handleGoogleSignIn = async () => {
    const provider = new GoogleAuthProvider();
    try {
      const userCredential = await signInWithPopup(auth, provider);
      await handleSuccessfulLogin(userCredential, 'Google');
    } catch (error: any) {
      handleSocialLoginError(error as AuthError, 'Google');
    }
  };

  const handleMicrosoftSignIn = async () => {
    const provider = new OAuthProvider('microsoft.com');
    // Optionally, you can add custom parameters or scopes here
    // provider.addScope('mail.read');
    // provider.setCustomParameters({
    //   prompt: 'select_account',
    // });
    try {
      const userCredential = await signInWithPopup(auth, provider);
      await handleSuccessfulLogin(userCredential, 'Microsoft');
    } catch (error: any) {
      handleSocialLoginError(error as AuthError, 'Microsoft');
    }
  };


  return (
    <AuthForm 
      isLogin={true} 
      onSubmit={handleLogin} 
      onGoogleSignIn={handleGoogleSignIn}
      onMicrosoftSignIn={handleMicrosoftSignIn}
    />
  );
}

