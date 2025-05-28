
'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import type { z } from 'zod';
import Link from 'next/link';
import Image from 'next/image'; // For social login icons if needed

import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { LoginSchema, SignupSchema, type LoginInput, type SignupInput } from '@/lib/schemas';
import { useState } from 'react';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle, Eye, EyeOff, ChromeIcon, MailIcon } from 'lucide-react'; // Added Eye, EyeOff
import { Separator } from '@/components/ui/separator';


// Helper component for social login buttons (optional, for better structure)
const SocialButton = ({ providerName, icon, onClick, isLoading }: { providerName: string, icon: React.ReactNode, onClick: () => void, isLoading?: boolean }) => (
  <Button variant="outline" className="w-full flex items-center justify-center gap-2" onClick={onClick} disabled={isLoading}>
    {icon}
    Sign in with {providerName}
  </Button>
);


type AuthFormProps = {
  isLogin: boolean;
  onSubmit: (values: LoginInput | SignupInput) => Promise<void>;
  onGoogleSignIn?: () => Promise<void>;
  onMicrosoftSignIn?: () => Promise<void>;
};

export function AuthForm({ isLogin, onSubmit, onGoogleSignIn, onMicrosoftSignIn }: AuthFormProps) {
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [isMicrosoftLoading, setIsMicrosoftLoading] = useState(false);

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const formSchema = isLogin ? LoginSchema : SignupSchema;
  type FormValues = z.infer<typeof formSchema>;

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: isLogin ? { email: '', password: '' } : { email: '', password: '', confirmPassword: '' },
  });

  const handleSubmit = async (values: FormValues) => {
    setIsLoading(true);
    setError(null);
    try {
      await onSubmit(values);
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSocialSignIn = async (providerAction?: () => Promise<void>, providerSetter?: React.Dispatch<React.SetStateAction<boolean>>) => {
    if (!providerAction || !providerSetter) return;
    providerSetter(true);
    setError(null);
    try {
      await providerAction();
    } catch (err: any) {
      setError(err.message || `Failed to sign in with ${providerAction.name.includes('Google') ? 'Google' : 'Microsoft'}.`);
    } finally {
      providerSetter(false);
    }
  };


  return (
    <Card className="w-full max-w-md shadow-xl">
      <CardHeader>
        <CardTitle className="text-3xl font-bold text-center">
          {isLogin ? 'Welcome Back!' : 'Create Account'}
        </CardTitle>
        <CardDescription className="text-center">
          {isLogin ? "Log in to manage your child's progress." : 'Sign up to start your journey with Little Steps.'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            {error && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input placeholder="you@example.com" {...field} type="email" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Password</FormLabel>
                  <div className="relative">
                    <FormControl>
                      <Input placeholder="••••••••" {...field} type={showPassword ? 'text' : 'password'} className="pr-10" />
                    </FormControl>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-1 top-1/2 h-7 w-7 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      onClick={() => setShowPassword(!showPassword)}
                      tabIndex={-1}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      <span className="sr-only">{showPassword ? 'Hide password' : 'Show password'}</span>
                    </Button>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
            {!isLogin && (
              <FormField
                control={form.control}
                // @ts-ignore
                name="confirmPassword" 
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Confirm Password</FormLabel>
                    <div className="relative">
                      <FormControl>
                        <Input placeholder="••••••••" {...field} type={showConfirmPassword ? 'text' : 'password'} className="pr-10" />
                      </FormControl>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-1 top-1/2 h-7 w-7 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        tabIndex={-1}
                      >
                        {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        <span className="sr-only">{showConfirmPassword ? 'Hide password' : 'Show password'}</span>
                      </Button>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
            <Button type="submit" className="w-full" disabled={isLoading || isGoogleLoading || isMicrosoftLoading}>
              {isLoading ? (isLogin ? 'Logging in...' : 'Signing up...') : (isLogin ? 'Login' : 'Sign Up')}
            </Button>
          </form>
        </Form>

        {isLogin && onGoogleSignIn && onMicrosoftSignIn && (
          <>
            <div className="my-6 flex items-center">
              <Separator className="flex-1" />
              <span className="mx-4 text-xs text-muted-foreground">OR CONTINUE WITH</span>
              <Separator className="flex-1" />
            </div>
            <div className="space-y-3">
              <SocialButton
                providerName="Google"
                icon={<ChromeIcon className="h-5 w-5" />} // Using ChromeIcon as a stand-in for Google
                onClick={() => handleSocialSignIn(onGoogleSignIn, setIsGoogleLoading)}
                isLoading={isGoogleLoading}
              />
              <SocialButton
                providerName="Microsoft"
                icon={<MailIcon className="h-5 w-5" />} // Using MailIcon as a stand-in for Microsoft/Outlook
                onClick={() => handleSocialSignIn(onMicrosoftSignIn, setIsMicrosoftLoading)}
                isLoading={isMicrosoftLoading}
              />
            </div>
          </>
        )}

      </CardContent>
      <CardFooter className="flex justify-center pt-6">
        <p className="text-sm text-muted-foreground">
          {isLogin ? "Don't have an account? " : 'Already have an account? '}
          <Link href={isLogin ? '/signup' : '/login'} className="font-medium text-primary hover:underline">
            {isLogin ? 'Sign Up' : 'Login'}
          </Link>
        </p>
      </CardFooter>
    </Card>
  );
}
