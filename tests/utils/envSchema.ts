import { z } from 'zod';
import dotenv from 'dotenv';

dotenv.config({ path: '.env' });

const envSchema = z.object({
    BASE_URL: z.string().min(1),
    DATABASE_URL: z.string().min(1),
    JWT_SECRET: z.string().min(1),

    SUPERADMIN_USERNAME: z.string().min(1),
    SUPERADMIN_PASSWORD: z.string().min(1),
    SUPERADMIN_ORGANIZATION: z.string().min(1),

    ADMIN_USERNAME: z.string().min(1),
    ADMIN_PASSWORD: z.string().min(1),
    ADMIN_EMAIL: z.string().min(1),
    ADMIN_ORGANIZATION: z.string().min(1),

    USER_USERNAME: z.string().min(1),
    USER_PASSWORD: z.string().min(1),
    USER_ORGANIZATION: z.string().min(1),
});

export const parsedEnv = envSchema.parse(process.env);