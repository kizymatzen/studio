'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input'; // Not used directly, but good to have
import { Textarea } from '@/components/ui/textarea';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BehaviorLogSchema, type BehaviorLogInput, emotionOptions } from '@/lib/schemas';
import { cn } from '@/lib/utils';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { useState } from 'react';

type BehaviorLogFormProps = {
  childId: string;
  onSubmit: (values: BehaviorLogInput) => Promise<string | null>; // Returns logId or null on failure
  initialData?: Partial<BehaviorLogInput>; // For editing later
};

export function BehaviorLogForm({ childId, onSubmit, initialData }: BehaviorLogFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const form = useForm<BehaviorLogInput>({
    resolver: zodResolver(BehaviorLogSchema),
    defaultValues: {
      date: initialData?.date || new Date(),
      emotion: initialData?.emotion || undefined,
      trigger: initialData?.trigger || '',
      resolution: initialData?.resolution || '',
      childId: childId,
    },
  });

  const handleSubmit = async (values: BehaviorLogInput) => {
    setIsSubmitting(true);
    await onSubmit(values); // Parent component handles navigation / toast
    setIsSubmitting(false);
    // Form reset can be handled by parent or here if needed, e.g. form.reset() after successful submit
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-8">
        <FormField
          control={form.control}
          name="date"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel>Date of Behavior</FormLabel>
              <Popover>
                <PopoverTrigger asChild>
                  <FormControl>
                    <Button
                      variant={'outline'}
                      className={cn(
                        'w-[240px] pl-3 text-left font-normal',
                        !field.value && 'text-muted-foreground'
                      )}
                    >
                      {field.value ? format(field.value, 'PPP') : <span>Pick a date</span>}
                      <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                    </Button>
                  </FormControl>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={field.value}
                    onSelect={field.onChange}
                    disabled={(date) => date > new Date() || date < new Date('1900-01-01')}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="emotion"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Emotion</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select the primary emotion observed" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {emotionOptions.map((emotion) => (
                    <SelectItem key={emotion} value={emotion}>
                      {emotion}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormDescription>
                Choose the dominant emotion the child expressed.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="trigger"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Trigger</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Describe what happened before or led to this emotion/behavior."
                  className="resize-y min-h-[100px]"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="resolution"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Resolution / Response</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Describe how the situation was handled or resolved, and the child's response."
                  className="resize-y min-h-[100px]"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
            control={form.control}
            name="childId"
            render={({ field }) => <Input type="hidden" {...field} />}
        />


        <Button type="submit" className="w-full sm:w-auto" disabled={isSubmitting}>
          {isSubmitting ? 'Saving Log...' : 'Save Log & Get Suggestions'}
        </Button>
      </form>
    </Form>
  );
}
