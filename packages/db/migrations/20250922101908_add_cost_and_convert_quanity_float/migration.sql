-- CreateEnum
CREATE TYPE "public"."Unit" AS ENUM ('PCS', 'KG', 'G', 'L', 'ML', 'M', 'CM', 'M2', 'M3');

-- AlterTable
ALTER TABLE "public"."Item" ADD COLUMN     "cost" DOUBLE PRECISION,
ADD COLUMN     "unit" "public"."Unit" NOT NULL DEFAULT 'PCS',
ALTER COLUMN "quantity" SET DEFAULT 0,
ALTER COLUMN "quantity" SET DATA TYPE DOUBLE PRECISION;
