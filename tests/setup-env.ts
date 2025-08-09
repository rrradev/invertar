import { config } from 'dotenv';
import { resolve } from 'path';
import { z } from 'zod';

config({ path: resolve(__dirname, '../.env') });

const envSchema = z.object({
  SUPERADMIN_USERNAME: z.string().min(1, 'SUPERADMIN_USERNAME is required'),
  SUPERADMIN_PASSWORD: z.string().min(1, 'SUPERADMIN_PASSWORD is required'),
  SUPERADMIN_ORGANIZATION: z.string().min(1, 'SUPERADMIN_ORGANIZATION is required'),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('Missing or invalid environment variables:', z.treeifyError(parsed.error));
  process.exit(1);
}

export const env = parsed.data;
