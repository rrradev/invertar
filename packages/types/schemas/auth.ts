import { z } from 'zod';

export const loginInput = z.object({
  username: z.string().trim().min(1, "Username is required"),
  organizationName: z.string().trim().min(1, "Organization name is required"),
  password: z.string().min(1, "Password is required"),
});

export const setPasswordInput = z.object({
  userId: z.string().uuid("Invalid user ID"),
  newPassword: z.string()
    .min(6, "Password must be at least 6 characters")
    .regex(/[A-Z]/, "Must contain at least one uppercase letter")
    .regex(/[a-z]/, "Must contain at least one lowercase letter")
    .regex(/\d/, "Must contain at least one number")
    .regex(/[\W_]/, "Must contain at least one special character"),
  oneTimeAccessCode: z.string().min(6, "Access code must be at least 6 characters"),
});

export type LoginInput = z.infer<typeof loginInput>;
export type SetPasswordInput = z.infer<typeof setPasswordInput>;
