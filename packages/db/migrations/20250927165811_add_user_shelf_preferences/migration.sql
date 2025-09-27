-- CreateTable
CREATE TABLE "public"."UserShelfPreference" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "shelfId" TEXT NOT NULL,
    "isExpanded" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserShelfPreference_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "UserShelfPreference_userId_shelfId_key" ON "public"."UserShelfPreference"("userId", "shelfId");

-- AddForeignKey
ALTER TABLE "public"."UserShelfPreference" ADD CONSTRAINT "UserShelfPreference_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."UserShelfPreference" ADD CONSTRAINT "UserShelfPreference_shelfId_fkey" FOREIGN KEY ("shelfId") REFERENCES "public"."Shelf"("id") ON DELETE CASCADE ON UPDATE CASCADE;
