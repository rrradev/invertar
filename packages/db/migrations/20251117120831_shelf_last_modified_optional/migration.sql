-- DropForeignKey
ALTER TABLE "public"."Shelf" DROP CONSTRAINT "Shelf_lastModifiedById_fkey";

-- AlterTable
ALTER TABLE "public"."Shelf" ALTER COLUMN "lastModifiedById" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "public"."Shelf" ADD CONSTRAINT "Shelf_lastModifiedById_fkey" FOREIGN KEY ("lastModifiedById") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
