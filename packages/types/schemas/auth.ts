import { z } from 'zod';

export const loginInput = z.object({
  username: z.string(),
  organizationName: z.string(),
  password: z.string(),
});

export const setPasswordWithCodeInput = z.object({
  userId: z.string().min(8, "Invalid user ID"),
  newPassword: z.string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter")
    .regex(/\d/, "Password must contain at least one number")
    .regex(/[\W_]/, "Password must contain at least one special character"),
  oneTimeAccessCode: z.string().min(8, "One-time access code must be at least 8 characters")
    .regex(/\d/, "One-time access code must contain at least one number")
    .regex(/[A-Z]/, "One-time access code must contain at least one uppercase letter"),
});

export const createAdminInput = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  email: z.email("Invalid email address"),
  organizationName: z.string().min(3, "Organization name must be at least 3 characters"),
});

export type LoginInput = z.infer<typeof loginInput>;
export type SetPasswordWithCodeInput = z.infer<typeof setPasswordWithCodeInput>;
export type CreateAdminInput = z.infer<typeof createAdminInput>;
