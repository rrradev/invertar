import { z } from 'zod';
export declare const loginInput: z.ZodObject<{
    username: z.ZodString;
    organizationName: z.ZodString;
    password: z.ZodString;
}, z.core.$strip>;
export declare const setPasswordWithCodeInput: z.ZodObject<{
    userId: z.ZodString;
    newPassword: z.ZodString;
    oneTimeAccessCode: z.ZodString;
}, z.core.$strip>;
export declare const createAdminInput: z.ZodObject<{
    username: z.ZodString;
    email: z.ZodEmail;
    organizationName: z.ZodString;
}, z.core.$strip>;
export type LoginInput = z.infer<typeof loginInput>;
export type SetPasswordWithCodeInput = z.infer<typeof setPasswordWithCodeInput>;
export type CreateAdminInput = z.infer<typeof createAdminInput>;
