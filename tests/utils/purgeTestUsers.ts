import { prisma } from '@repo/db';
import { parsedEnv } from './envSchema';

async function purgeAllTestUsers() {
    const orgs = [parsedEnv.SUPERADMIN_ORGANIZATION, parsedEnv.ADMIN_ORGANIZATION, parsedEnv.USER_ORGANIZATION];

    const allOrgs = await prisma.organization.findMany({
        include: { folders: { include: { items: true } }, users: true },
    });

    // Filter organizations whose name ends with a numeric pattern (timestamp-like)
    const testOrgs = allOrgs.filter(org => /\d{10,}$/.test(org.name));
    
    for (const org of testOrgs) {
        if (!orgs.includes(org.name)) {
            orgs.push(org.name);
        }
    }

    for (const orgName of orgs) {
        const org = await prisma.organization.findUnique({
            where: { name: orgName },
            include: { folders: { include: { items: true } } },
        });

        if (!org) continue;

        for (const folder of org.folders) {
            await prisma.item.deleteMany({ where: { folderId: folder.id } });
        }

        await prisma.folder.deleteMany({ where: { organizationId: org.id } });

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