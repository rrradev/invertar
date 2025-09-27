/*
  Warnings:

  - You are about to drop the column `folderId` on the `Item` table. All the data in the column will be lost.
  - You are about to drop the column `folderId` on the `Photo` table. All the data in the column will be lost.
  - You are about to drop the `Folder` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[shelfId,hashId]` on the table `Item` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `shelfId` to the `Item` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "public"."Folder" DROP CONSTRAINT "Folder_lastModifiedById_fkey";

-- DropForeignKey
ALTER TABLE "public"."Folder" DROP CONSTRAINT "Folder_organizationId_fkey";

-- DropForeignKey
ALTER TABLE "public"."Item" DROP CONSTRAINT "Item_folderId_fkey";

-- DropForeignKey
ALTER TABLE "public"."Photo" DROP CONSTRAINT "Photo_folderId_fkey";

-- DropIndex
DROP INDEX "public"."Item_folderId_hashId_key";

-- AlterTable
ALTER TABLE "public"."Item" DROP COLUMN "folderId",
ADD COLUMN     "shelfId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "public"."Photo" DROP COLUMN "folderId",
ADD COLUMN     "shelfId" TEXT;

-- DropTable
DROP TABLE "public"."Folder";

-- CreateTable
CREATE TABLE "public"."Shelf" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "lastModifiedById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Shelf_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Item_shelfId_hashId_key" ON "public"."Item"("shelfId", "hashId");

-- AddForeignKey
ALTER TABLE "public"."Shelf" ADD CONSTRAINT "Shelf_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "public"."Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Shelf" ADD CONSTRAINT "Shelf_lastModifiedById_fkey" FOREIGN KEY ("lastModifiedById") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Item" ADD CONSTRAINT "Item_shelfId_fkey" FOREIGN KEY ("shelfId") REFERENCES "public"."Shelf"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Photo" ADD CONSTRAINT "Photo_shelfId_fkey" FOREIGN KEY ("shelfId") REFERENCES "public"."Shelf"("id") ON DELETE SET NULL ON UPDATE CASCADE;
