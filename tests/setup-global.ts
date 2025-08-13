import { prisma } from '@repo/db';
import { config } from 'dotenv';
import { z } from 'zod';
import { buildServer } from '../apps/api/src/index';
import { hashPassword } from '@repo/auth/password';
import { UserRole } from '@repo/types/users/roles';

let server: Awaited<ReturnType<typeof buildServer>> | undefined;

config();

const envSchema = z.object({
  SUPERADMIN_USERNAME: z.string().min(1, 'SUPERADMIN_USERNAME is required'),
  SUPERADMIN_PASSWORD: z.string().min(1, 'SUPERADMIN_PASSWORD is required'),
  SUPERADMIN_ORGANIZATION: z.string().min(1, 'SUPERADMIN_ORGANIZATION is required'),
  ADMIN_EMAIL: z.string().min(1, 'ADMIN_EMAIL is required'),
  ADMIN_USERNAME: z.string().min(1, 'ADMIN_USERNAME is required'),
  ADMIN_PASSWORD: z.string().min(1, 'ADMIN_PASSWORD is required'),
  ADMIN_ORGANIZATION: z.string().min(1, 'ADMIN_ORGANIZATION is required'),
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  JWT_SECRET: z.string().min(1, 'JWT_SECRET is required'),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('Missing or invalid environment variables:', z.treeifyError(parsed.error));
  process.exit(1);
}

(globalThis as any).baseUrl = 'http://localhost:3000';

export async function setup() {
  const username = process.env.SUPERADMIN_USERNAME!;
  const password = process.env.SUPERADMIN_PASSWORD!;
  const organizationName = process.env.SUPERADMIN_ORGANIZATION!;

  const organization = await prisma.organization.upsert({
    where: { name: organizationName },
    update: {},
    create: {
      name: organizationName,
    },
  });

  const hashedPwd = await hashPassword(password);

  await prisma.user.upsert({
    where: {
      organizationId_username: {
        organizationId: organization.id,
        username,
      }
    },
    update: {},
    create: {
      username,
      hashedPassword: hashedPwd,
      organizationId: organization.id,
      role: UserRole.SUPER_ADMIN,
    },
  });

  console.log(`Seeded superadmin '${username}' in organization '${organizationName}'`);
  server = buildServer();
  await server.listen({ port: 3000 });

  return async () => {
    await prisma.user.deleteMany({
      where: {
        username: process.env.ADMIN_USERNAME,
      },
    });

    await prisma.organization.deleteMany({
      where: {
        name: process.env.ADMIN_ORGANIZATION,
      },
    });

    await prisma.$disconnect();

    if (server) {
      await server.close();
      console.log('Test server stopped');
    }
  };
}

export const env = parsed.data;
