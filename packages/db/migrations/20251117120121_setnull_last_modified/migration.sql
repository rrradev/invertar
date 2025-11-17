-- DropForeignKey
ALTER TABLE "public"."Item" DROP CONSTRAINT "Item_lastModifiedById_fkey";

-- AddForeignKey
ALTER TABLE "public"."Item" ADD CONSTRAINT "Item_lastModifiedById_fkey" FOREIGN KEY ("lastModifiedById") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
