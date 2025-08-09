import { z } from 'zod';

export const loginInput = z.object({
  username: z.string(),
  organizationName: z.string(),
  password: z.string(),
});

export const setPasswordInput = z.object({
  userId: z.uuid(),
  newPassword: z.string()
    .min(6, "Password must be at least 6 characters")
    .regex(/[A-Z]/, "Must contain at least one uppercase letter")
    .regex(/[a-z]/, "Must contain at least one lowercase letter")
    .regex(/\d/, "Must contain at least one number")
    .regex(/[\W_]/, "Must contain at least one special character"),
  oneTimeAccessCode: z.string().min(6),
});

export type LoginInput = z.infer<typeof loginInput>;
export type SetPasswordInput = z.infer<typeof setPasswordInput>;
