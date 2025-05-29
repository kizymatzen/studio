
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
import { getAuthSafe, getDbSafe } from '@/lib/firebase';
import { AuthForm } from '@/components/auth/auth-form';
import type { LoginInput } from '@/lib/schemas';
import { useToast } from '@/hooks/use-toast';
import { doc, setDoc, getDoc, serverTimestamp, Timestamp } from 'firebase/firestore';
import type { UserProfile } from '@/types';

export default function LoginPage() {
  const router = useRouter();
  const { toast } = useToast();

  const handleSuccessfulLogin = async (userCredential: UserCredential, providerName: string) => {
    const user = userCredential.user;
    const db = getDbSafe();
    const userDocRef = doc(db, 'users', user.uid);
    
    try {
      const userDocSnap = await getDoc(userDocRef);
      if (!userDocSnap.exists()) {
        // User is new or document doesn't exist, create it with default "free" tier values
        const newUserProfile: Omit<UserProfile, 'uid' | 'createdAt'> = { // uid and createdAt handled separately
          email: user.email,
          displayName: user.displayName || user.email?.split('@')[0] || null,
          photoURL: user.photoURL || null,
          role: 'parent',
          membership: 'free',
          childIds: [],
          professionalIds: [],
          storageUsed: 0,
          storageLimit: 10, // Default 10MB for free tier
          providerId: userCredential.providerId || (providerName === 'Google' ? 'google.com' : 'microsoft.com'),
        };
        await setDoc(userDocRef, {
          ...newUserProfile,
          uid: user.uid, // ensure uid is part of the object
          createdAt: serverTimestamp() as Timestamp,
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
    } else if (error.code === 'auth/unauthorized-domain') {
      errorMessage = 'This domain is not authorized for Firebase authentication. Please contact support or check Firebase console settings.';
    }
    toast({ variant: 'destructive', title: `${providerName} Login Failed`, description: errorMessage });
    throw new Error(errorMessage); 
  };

  const handleLogin = async (values: LoginInput) => {
    try {
      const auth = getAuthSafe();
      const userCredential = await signInWithEmailAndPassword(auth, values.email, values.password);
      // Firestore user document should already exist from signup or prior OAuth login.
      // If not, handleSuccessfulLogin would create it, but email/pass login doesn't call that here.
      // For robustness, you might check/create here too if legacy users are possible.
      toast({ title: 'Login Successful', description: 'Welcome back!' });
      router.push('/dashboard');
    } catch (error: any) {
      console.error('Login failed:', error);
      let errorMessage = 'Login failed. Please check your credentials.';
      if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
        errorMessage = 'Invalid email or password.';
      } else if (error.code === 'auth/unauthorized-domain') {
        errorMessage = 'This domain is not authorized for Firebase authentication. Please contact support.';
      }
      toast({ variant: 'destructive', title: 'Login Failed', description: errorMessage });
      throw new Error(errorMessage); 
    }
  };

  const handleGoogleSignIn = async () => {
    const provider = new GoogleAuthProvider();
    try {
      const auth = getAuthSafe();
      const userCredential = await signInWithPopup(auth, provider);
      await handleSuccessfulLogin(userCredential, 'Google');
    } catch (error: any) {
      handleSocialLoginError(error as AuthError, 'Google');
    }
  };

  const handleMicrosoftSignIn = async () => {
    const provider = new OAuthProvider('microsoft.com');
    try {
      const auth = getAuthSafe();
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
