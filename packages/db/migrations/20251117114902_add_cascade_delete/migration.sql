-- DropForeignKey
ALTER TABLE "public"."Item" DROP CONSTRAINT "Item_shelfId_fkey";

-- DropForeignKey
ALTER TABLE "public"."Label" DROP CONSTRAINT "Label_organizationId_fkey";

-- DropForeignKey
ALTER TABLE "public"."Photo" DROP CONSTRAINT "Photo_itemId_fkey";

-- DropForeignKey
ALTER TABLE "public"."Photo" DROP CONSTRAINT "Photo_shelfId_fkey";

-- DropForeignKey
ALTER TABLE "public"."Shelf" DROP CONSTRAINT "Shelf_organizationId_fkey";

-- DropForeignKey
ALTER TABLE "public"."User" DROP CONSTRAINT "User_organizationId_fkey";

-- AddForeignKey
ALTER TABLE "public"."User" ADD CONSTRAINT "User_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "public"."Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Shelf" ADD CONSTRAINT "Shelf_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "public"."Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Label" ADD CONSTRAINT "Label_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "public"."Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Item" ADD CONSTRAINT "Item_shelfId_fkey" FOREIGN KEY ("shelfId") REFERENCES "public"."Shelf"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Photo" ADD CONSTRAINT "Photo_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "public"."Item"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Photo" ADD CONSTRAINT "Photo_shelfId_fkey" FOREIGN KEY ("shelfId") REFERENCES "public"."Shelf"("id") ON DELETE CASCADE ON UPDATE CASCADE;
