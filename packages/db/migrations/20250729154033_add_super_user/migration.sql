-- AlterEnum
ALTER TYPE "public"."UserRole" ADD VALUE 'SUPER_ADMIN';

-- AlterTable
ALTER TABLE "public"."User" ADD COLUMN     "oneTimeAccessCodeExpiry" TIMESTAMP(3);
