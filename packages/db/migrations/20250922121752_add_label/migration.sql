/*
  Warnings:

  - A unique constraint covering the columns `[folderId,hashId]` on the table `Item` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `hashId` to the `Item` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "public"."Item" ADD COLUMN     "hashId" TEXT NOT NULL;

-- CreateTable
CREATE TABLE "public"."Label" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "color" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Label_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ItemLabel" (
    "id" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "labelId" TEXT NOT NULL,

    CONSTRAINT "ItemLabel_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Label_organizationId_name_key" ON "public"."Label"("organizationId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "ItemLabel_itemId_labelId_key" ON "public"."ItemLabel"("itemId", "labelId");

-- CreateIndex
CREATE UNIQUE INDEX "Item_folderId_hashId_key" ON "public"."Item"("folderId", "hashId");

-- AddForeignKey
ALTER TABLE "public"."Label" ADD CONSTRAINT "Label_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "public"."Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ItemLabel" ADD CONSTRAINT "ItemLabel_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "public"."Item"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ItemLabel" ADD CONSTRAINT "ItemLabel_labelId_fkey" FOREIGN KEY ("labelId") REFERENCES "public"."Label"("id") ON DELETE CASCADE ON UPDATE CASCADE;
