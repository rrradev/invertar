import { prisma } from '@repo/db';
import { parsedEnv } from './envSchema';

async function purgeAllTestUsers() {
    const orgs = [parsedEnv.SUPERADMIN_ORGANIZATION, parsedEnv.ADMIN_ORGANIZATION, parsedEnv.USER_ORGANIZATION];

    for (const orgName of orgs) {
        const org = await prisma.organization.findUnique({ where: { name: orgName } });
        if (!org) continue;

        await prisma.user.deleteMany({ where: { organizationId: org.id } });

        await prisma.organization.delete({ where: { id: org.id } });
    }

    console.log('Purged all test users and organizations');
    await prisma.$disconnect();
}

(async () => {
    try {
        await purgeAllTestUsers();
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
})();