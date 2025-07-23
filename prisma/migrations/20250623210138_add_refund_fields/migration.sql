/*
  Warnings:

  - The values [SENDER] on the enum `Role` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `read` on the `notifications` table. All the data in the column will be lost.
  - Added the required column `title` to the `notifications` table without a default value. This is not possible if the table is not empty.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "Role_new" AS ENUM ('CUSTOMER', 'CARRIER', 'MERCHANT', 'PROVIDER', 'SERVICE_PROVIDER', 'ADMIN');
ALTER TABLE "users" ALTER COLUMN "role" DROP DEFAULT;
ALTER TABLE "users" ALTER COLUMN "role" TYPE "Role_new" USING ("role"::text::"Role_new");
ALTER TYPE "Role" RENAME TO "Role_old";
ALTER TYPE "Role_new" RENAME TO "Role";
DROP TYPE "Role_old";
ALTER TABLE "users" ALTER COLUMN "role" SET DEFAULT 'CUSTOMER';
COMMIT;

-- AlterTable
ALTER TABLE "notifications" DROP COLUMN "read",
ADD COLUMN     "data" JSONB,
ADD COLUMN     "is_read" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "title" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "payments" ADD COLUMN     "refund_amount" DOUBLE PRECISION,
ADD COLUMN     "refund_reason" TEXT;

-- AlterTable
ALTER TABLE "services" ADD COLUMN     "rating" DOUBLE PRECISION DEFAULT 0,
ADD COLUMN     "total_ratings" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "users" ALTER COLUMN "role" SET DEFAULT 'CUSTOMER';
