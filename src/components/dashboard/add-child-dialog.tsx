'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
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
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { ChildSchema, type ChildInput } from '@/lib/schemas';
import { useAuth } from '@/contexts/auth-context';
import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { PlusCircle } from 'lucide-react';

export function AddChildDialog() {
  const [open, setOpen] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<ChildInput>({
    resolver: zodResolver(ChildSchema),
    defaultValues: {
      name: '',
    },
  });

  const onSubmit = async (values: ChildInput) => {
    if (!user) {
      toast({ variant: 'destructive', title: 'Error', description: 'You must be logged in to add a child.' });
      return;
    }
    setIsSubmitting(true);
    try {
      await addDoc(collection(db, 'children'), {
        ...values,
        parentId: user.uid,
        createdAt: serverTimestamp(),
      });
      toast({ title: 'Child Added', description: `${values.name} has been added to your profiles.` });
      form.reset();
      setOpen(false);
    } catch (error) {
      console.error('Error adding child:', error);
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to add child. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <PlusCircle className="mr-2 h-4 w-4" /> Add Child
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add New Child</DialogTitle>
          <DialogDescription>Enter the details for the new child profile.</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Child's Name</FormLabel>
                  <FormControl>
                    <Input placeholder="E.g., Alex" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            {/* Add age field if needed in future, according to schema update */}
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={isSubmitting}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Adding...' : 'Add Child'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
