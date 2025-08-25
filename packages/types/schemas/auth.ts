import { z } from 'zod';

export const loginInput = z.object({
  username: z.string().trim().min(1, "Username is required"),
  organizationName: z.string().trim().min(1, "Organization name is required"),
  password: z.string().min(1, "Password is required"),
});

export const setPasswordWithCodeInput = z.object({
  userId: z.string().min(8, "Invalid user ID"),
  newPassword: z.string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter")
    .regex(/\d/, "Password must contain at least one number")
    .regex(/[\W_]/, "Password must contain at least one special character"),
  oneTimeAccessCode: z.string().min(12, "One-time access code must be at least 12 characters")
    .regex(/^(?=(?:.*[A-Z]){6,})(?=(?:.*\d){6,})[A-Z0-9]+$/, 
           "Access code must have at least 6 letters and 6 numbers"),
});

export const createAdminInput = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  email: z.email("Invalid email address"),
  organizationName: z.string().min(3, "Organization name must be at least 3 characters"),
});

export const deleteAdminInput = z.object({
  adminId: z.string().min(1, "Admin ID is required"),
});

export const refreshOTACInput = z.object({
  adminId: z.string().min(1, "Admin ID is required"),
});

export const resetAdminInput = z.object({
  adminId: z.string().min(1, "Admin ID is required"),
});

export const createUserInput = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
});

export const deleteUserInput = z.object({
  userId: z.string().min(1, "User ID is required"),
});

export const resetUserInput = z.object({
  userId: z.string().min(1, "User ID is required"),
});

export type LoginInput = z.infer<typeof loginInput>;
export type SetPasswordWithCodeInput = z.infer<typeof setPasswordWithCodeInput>;
export type CreateAdminInput = z.infer<typeof createAdminInput>;
export type DeleteAdminInput = z.infer<typeof deleteAdminInput>;
export type RefreshOTACInput = z.infer<typeof refreshOTACInput>;
export type ResetAdminInput = z.infer<typeof resetAdminInput>;
export type CreateUserInput = z.infer<typeof createUserInput>;
export type DeleteUserInput = z.infer<typeof deleteUserInput>;
export type ResetUserInput = z.infer<typeof resetUserInput>;
