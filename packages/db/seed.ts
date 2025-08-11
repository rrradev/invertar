import { UserRole } from '@prisma/client';
import { hashPassword } from '@repo/auth/password';
import dotenv from 'dotenv';
import { prisma } from '.';

dotenv.config();

async function main({
    username,
    password,
    organizationName,
}: {
    username?: string;
    password?: string;
    organizationName?: string;
} = {}) {
    const user = username ?? process.env.SUPERADMIN_USERNAME!;
    const pwd = password ?? process.env.SUPERADMIN_PASSWORD!;
    const orgName = organizationName ?? process.env.SUPERADMIN_ORGANIZATION!;

    const organization = await prisma.organization.upsert({
        where: { name: orgName },
        update: {},
        create: {
            name: orgName,
        },
    });

    const hashedPwd = await hashPassword(pwd);

    await prisma.user.upsert({
        where: {
            organizationId_username: {
                organizationId: organization.id,
                username: user,
            }
        },
        update: {},
        create: {
            username: user,
            hashedPassword: hashedPwd,
            organizationId: organization.id,
            role: UserRole.SUPER_ADMIN,
        },
    });

    console.log(`Seeded superadmin '${user}' in organization '${orgName}'`);
}

const args = process.argv.slice(2);
const argMap = Object.fromEntries(args.map((arg) => {
    const [k, v] = arg.split('=');
    return [k, v];
}));

main({
    username: argMap['username'],
    password: argMap['password'],
    organizationName: argMap['organizationName'],
})
    .catch(console.error)
    .finally(() => prisma.$disconnect());
