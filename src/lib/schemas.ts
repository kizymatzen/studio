import { z } from 'zod';

export const LoginSchema = z.object({
  email: z.string().email({ message: 'Invalid email address.' }),
  password: z.string().min(6, { message: 'Password must be at least 6 characters.' }),
});
export type LoginInput = z.infer<typeof LoginSchema>;

export const SignupSchema = z.object({
  email: z.string().email({ message: 'Invalid email address.' }),
  password: z.string().min(6, { message: 'Password must be at least 6 characters.' }),
  confirmPassword: z.string().min(6, { message: 'Password must be at least 6 characters.' }),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match.",
  path: ["confirmPassword"], // Point error to confirmPassword field
});
export type SignupInput = z.infer<typeof SignupSchema>;

export const ChildSchema = z.object({
  name: z.string().min(1, { message: "Child's name is required." }).max(50, { message: "Name too long."}),
  // Age is optional as per original requirements, but useful
  // age: z.coerce.number().int().min(0).max(18, { message: "Enter a valid age."}).optional(),
});
export type ChildInput = z.infer<typeof ChildSchema>;

export const emotionOptions = ["Happy", "Sad", "Angry", "Anxious", "Calm", "Frustrated", "Excited", "Scared"] as const;

export const BehaviorLogSchema = z.object({
  date: z.date({ required_error: "Please select a date."}),
  emotion: z.enum(emotionOptions, { required_error: "Please select an emotion."}),
  trigger: z.string().min(1, { message: "Trigger is required." }).max(500, { message: "Trigger text is too long."}),
  resolution: z.string().min(1, { message: "Resolution is required." }).max(500, { message: "Resolution text is too long."}),
  childId: z.string().min(1, { message: "Child ID is required." }), // This will be hidden but necessary
});
export type BehaviorLogInput = z.infer<typeof BehaviorLogSchema>;
