import { prisma } from '@repo/db';
import { hashPassword } from '@repo/auth/password';
import { UserRole } from '@repo/types/users/roles';
import { parsedEnv } from './envSchema';

async function seedUsers() {
  // --- SUPER ADMIN ---
  const superOrg = await prisma.organization.upsert({
    where: { name: parsedEnv.SUPERADMIN_ORGANIZATION },
    update: {},
    create: { name: parsedEnv.SUPERADMIN_ORGANIZATION },
  });

  const superHashed = await hashPassword(parsedEnv.SUPERADMIN_PASSWORD);

  await prisma.user.upsert({
    where: { organizationId_username: { organizationId: superOrg.id, username: parsedEnv.SUPERADMIN_USERNAME } },
    update: {},
    create: {
      username: parsedEnv.SUPERADMIN_USERNAME,
      hashedPassword: superHashed,
      organizationId: superOrg.id,
      role: UserRole.SUPER_ADMIN,
    },
  });

  console.log(`Seeded superadmin '${parsedEnv.SUPERADMIN_USERNAME}'`);

  // --- ADMIN ---
  const adminOrg = await prisma.organization.upsert({
    where: { name: parsedEnv.ADMIN_ORGANIZATION },
    update: {},
    create: { name: parsedEnv.ADMIN_ORGANIZATION },
  });

  const adminHashed = await hashPassword(parsedEnv.ADMIN_PASSWORD);

  await prisma.user.upsert({
    where: { organizationId_username: { organizationId: adminOrg.id, username: parsedEnv.ADMIN_USERNAME } },
    update: {},
    create: {
      username: parsedEnv.ADMIN_USERNAME,
      hashedPassword: adminHashed,
      organizationId: adminOrg.id,
      email: parsedEnv.ADMIN_EMAIL,
      role: UserRole.ADMIN,
    },
  });

  console.log(`Seeded admin '${parsedEnv.ADMIN_USERNAME}'`);

  // --- REGULAR USER ---
  const userOrg = await prisma.organization.upsert({
    where: { name: parsedEnv.USER_ORGANIZATION },
    update: {},
    create: { name: parsedEnv.USER_ORGANIZATION },
  });

  const userHashed = await hashPassword(parsedEnv.USER_PASSWORD);

  await prisma.user.upsert({
    where: { organizationId_username: { organizationId: userOrg.id, username: parsedEnv.USER_USERNAME } },
    update: {},
    create: {
      username: parsedEnv.USER_USERNAME,
      hashedPassword: userHashed,
      organizationId: userOrg.id,
      role: UserRole.USER,
    },
  });

  console.log(`Seeded user '${parsedEnv.USER_USERNAME}'`);
  await prisma.$disconnect();
}

(async () => {
  try {
    await seedUsers();
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
})();