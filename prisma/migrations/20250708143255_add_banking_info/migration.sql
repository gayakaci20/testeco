/*
  Warnings:

  - The values [PROPOSED] on the enum `MatchStatus` will be removed. If these variants are still used in the database, this will fail.
  - The values [MATCH_PROPOSED,MATCH_ACCEPTED,MATCH_REJECTED,MATCH_CONFIRMED,PACKAGE_IN_TRANSIT,PACKAGE_DELIVERED,RIDE_REMINDER,NEW_MESSAGE,PAYMENT_SUCCESS,PAYMENT_FAILED,ACCOUNT_VERIFIED,PASSWORD_RESET] on the enum `NotificationType` will be removed. If these variants are still used in the database, this will fail.
  - The values [MATCHED] on the enum `PackageStatus` will be removed. If these variants are still used in the database, this will fail.
  - The values [AVAILABLE,FULL] on the enum `RideStatus` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `proposed_by_user_id` on the `matches` table. All the data in the column will be lost.
  - You are about to drop the column `match_id` on the `messages` table. All the data in the column will be lost.
  - You are about to drop the column `read` on the `messages` table. All the data in the column will be lost.
  - You are about to drop the column `delivery_address` on the `packages` table. All the data in the column will be lost.
  - You are about to drop the column `delivery_date` on the `packages` table. All the data in the column will be lost.
  - You are about to drop the column `delivery_lat` on the `packages` table. All the data in the column will be lost.
  - You are about to drop the column `delivery_lng` on the `packages` table. All the data in the column will be lost.
  - You are about to drop the column `pickup_address` on the `packages` table. All the data in the column will be lost.
  - You are about to drop the column `pickup_date` on the `packages` table. All the data in the column will be lost.
  - You are about to drop the column `pickup_lat` on the `packages` table. All the data in the column will be lost.
  - You are about to drop the column `pickup_lng` on the `packages` table. All the data in the column will be lost.
  - You are about to drop the column `size_label` on the `packages` table. All the data in the column will be lost.
  - You are about to drop the column `title` on the `packages` table. All the data in the column will be lost.
  - You are about to drop the column `available_seats` on the `rides` table. All the data in the column will be lost.
  - You are about to drop the column `end_lat` on the `rides` table. All the data in the column will be lost.
  - You are about to drop the column `end_lng` on the `rides` table. All the data in the column will be lost.
  - You are about to drop the column `end_location_address` on the `rides` table. All the data in the column will be lost.
  - You are about to drop the column `estimated_arrival_time` on the `rides` table. All the data in the column will be lost.
  - You are about to drop the column `max_package_size` on the `rides` table. All the data in the column will be lost.
  - You are about to drop the column `max_package_weight` on the `rides` table. All the data in the column will be lost.
  - You are about to drop the column `notes` on the `rides` table. All the data in the column will be lost.
  - You are about to drop the column `price_per_seat` on the `rides` table. All the data in the column will be lost.
  - You are about to drop the column `start_lat` on the `rides` table. All the data in the column will be lost.
  - You are about to drop the column `start_lng` on the `rides` table. All the data in the column will be lost.
  - You are about to drop the column `start_location_address` on the `rides` table. All the data in the column will be lost.
  - You are about to drop the column `vehicleType` on the `rides` table. All the data in the column will be lost.
  - You are about to drop the `verification_tokens` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[tracking_number]` on the table `packages` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[stripe_transaction_id]` on the table `payments` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `recipient_address` to the `packages` table without a default value. This is not possible if the table is not empty.
  - Added the required column `recipient_name` to the `packages` table without a default value. This is not possible if the table is not empty.
  - Added the required column `recipient_phone` to the `packages` table without a default value. This is not possible if the table is not empty.
  - Added the required column `sender_address` to the `packages` table without a default value. This is not possible if the table is not empty.
  - Added the required column `sender_name` to the `packages` table without a default value. This is not possible if the table is not empty.
  - Added the required column `sender_phone` to the `packages` table without a default value. This is not possible if the table is not empty.
  - Added the required column `tracking_number` to the `packages` table without a default value. This is not possible if the table is not empty.
  - Made the column `description` on table `packages` required. This step will fail if there are existing NULL values in that column.
  - Added the required column `available_space` to the `rides` table without a default value. This is not possible if the table is not empty.
  - Added the required column `destination` to the `rides` table without a default value. This is not possible if the table is not empty.
  - Added the required column `origin` to the `rides` table without a default value. This is not possible if the table is not empty.
  - Made the column `price_per_kg` on table `rides` required. This step will fail if there are existing NULL values in that column.

*/
-- CreateEnum
CREATE TYPE "OrderStatus" AS ENUM ('PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'REFUNDED');

-- AlterEnum
BEGIN;
CREATE TYPE "MatchStatus_new" AS ENUM ('PENDING', 'ACCEPTED_BY_CARRIER', 'ACCEPTED_BY_SENDER', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'REJECTED');
ALTER TABLE "matches" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "matches" ALTER COLUMN "status" TYPE "MatchStatus_new" USING ("status"::text::"MatchStatus_new");
ALTER TYPE "MatchStatus" RENAME TO "MatchStatus_old";
ALTER TYPE "MatchStatus_new" RENAME TO "MatchStatus";
DROP TYPE "MatchStatus_old";
ALTER TABLE "matches" ALTER COLUMN "status" SET DEFAULT 'PENDING';
COMMIT;

-- AlterEnum
BEGIN;
CREATE TYPE "NotificationType_new" AS ENUM ('PACKAGE_UPDATE', 'RIDE_UPDATE', 'MATCH_UPDATE', 'PAYMENT_UPDATE', 'GENERAL', 'PROMOTION', 'SYSTEM');
ALTER TABLE "notifications" ALTER COLUMN "type" TYPE "NotificationType_new" USING ("type"::text::"NotificationType_new");
ALTER TYPE "NotificationType" RENAME TO "NotificationType_old";
ALTER TYPE "NotificationType_new" RENAME TO "NotificationType";
DROP TYPE "NotificationType_old";
COMMIT;

-- AlterEnum
BEGIN;
CREATE TYPE "PackageStatus_new" AS ENUM ('PENDING', 'CONFIRMED', 'IN_TRANSIT', 'DELIVERED', 'CANCELLED');
ALTER TABLE "packages" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "packages" ALTER COLUMN "status" TYPE "PackageStatus_new" USING ("status"::text::"PackageStatus_new");
ALTER TYPE "PackageStatus" RENAME TO "PackageStatus_old";
ALTER TYPE "PackageStatus_new" RENAME TO "PackageStatus";
DROP TYPE "PackageStatus_old";
ALTER TABLE "packages" ALTER COLUMN "status" SET DEFAULT 'PENDING';
COMMIT;

-- AlterEnum
ALTER TYPE "PaymentStatus" ADD VALUE 'PROCESSING';

-- AlterEnum
BEGIN;
CREATE TYPE "RideStatus_new" AS ENUM ('PENDING', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED');
ALTER TABLE "rides" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "rides" ALTER COLUMN "status" TYPE "RideStatus_new" USING ("status"::text::"RideStatus_new");
ALTER TYPE "RideStatus" RENAME TO "RideStatus_old";
ALTER TYPE "RideStatus_new" RENAME TO "RideStatus";
DROP TYPE "RideStatus_old";
ALTER TABLE "rides" ALTER COLUMN "status" SET DEFAULT 'PENDING';
COMMIT;

-- DropIndex
DROP INDEX "matches_package_id_ride_id_key";

-- AlterTable
ALTER TABLE "matches" DROP COLUMN "proposed_by_user_id",
ADD COLUMN     "accepted_at" TIMESTAMP(3),
ADD COLUMN     "completed_at" TIMESTAMP(3),
ADD COLUMN     "notes" TEXT,
ALTER COLUMN "status" SET DEFAULT 'PENDING';

-- AlterTable
ALTER TABLE "messages" DROP COLUMN "match_id",
DROP COLUMN "read",
ADD COLUMN     "is_read" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "packages" DROP COLUMN "delivery_address",
DROP COLUMN "delivery_date",
DROP COLUMN "delivery_lat",
DROP COLUMN "delivery_lng",
DROP COLUMN "pickup_address",
DROP COLUMN "pickup_date",
DROP COLUMN "pickup_lat",
DROP COLUMN "pickup_lng",
DROP COLUMN "size_label",
DROP COLUMN "title",
ADD COLUMN     "fragile" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "recipient_address" TEXT NOT NULL,
ADD COLUMN     "recipient_name" TEXT NOT NULL,
ADD COLUMN     "recipient_phone" TEXT NOT NULL,
ADD COLUMN     "sender_address" TEXT NOT NULL,
ADD COLUMN     "sender_name" TEXT NOT NULL,
ADD COLUMN     "sender_phone" TEXT NOT NULL,
ADD COLUMN     "size" TEXT,
ADD COLUMN     "tracking_number" TEXT NOT NULL,
ADD COLUMN     "urgent" BOOLEAN NOT NULL DEFAULT false,
ALTER COLUMN "description" SET NOT NULL;

-- AlterTable
ALTER TABLE "payments" ADD COLUMN     "completed_at" TIMESTAMP(3),
ADD COLUMN     "metadata" JSONB,
ADD COLUMN     "order_id" TEXT,
ADD COLUMN     "stripe_transaction_id" TEXT,
ALTER COLUMN "user_id" DROP NOT NULL,
ALTER COLUMN "match_id" DROP NOT NULL;

-- AlterTable
ALTER TABLE "rides" DROP COLUMN "available_seats",
DROP COLUMN "end_lat",
DROP COLUMN "end_lng",
DROP COLUMN "end_location_address",
DROP COLUMN "estimated_arrival_time",
DROP COLUMN "max_package_size",
DROP COLUMN "max_package_weight",
DROP COLUMN "notes",
DROP COLUMN "price_per_seat",
DROP COLUMN "start_lat",
DROP COLUMN "start_lng",
DROP COLUMN "start_location_address",
DROP COLUMN "vehicleType",
ADD COLUMN     "arrival_time" TIMESTAMP(3),
ADD COLUMN     "available_space" TEXT NOT NULL,
ADD COLUMN     "description" TEXT,
ADD COLUMN     "destination" TEXT NOT NULL,
ADD COLUMN     "max_weight" DOUBLE PRECISION,
ADD COLUMN     "origin" TEXT NOT NULL,
ADD COLUMN     "vehicle_type" TEXT,
ALTER COLUMN "price_per_kg" SET NOT NULL,
ALTER COLUMN "status" SET DEFAULT 'PENDING';

-- DropTable
DROP TABLE "verification_tokens";

-- CreateTable
CREATE TABLE "verificationtokens" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL
);

-- CreateTable
CREATE TABLE "orders" (
    "id" TEXT NOT NULL,
    "customer_id" TEXT,
    "merchant_id" TEXT NOT NULL,
    "package_id" TEXT,
    "customer_name" TEXT NOT NULL,
    "customer_email" TEXT,
    "customer_phone" TEXT,
    "order_type" TEXT NOT NULL DEFAULT 'POS_CHECKOUT',
    "subtotal" DOUBLE PRECISION NOT NULL,
    "delivery_fee" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "tax" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "total" DOUBLE PRECISION NOT NULL,
    "status" "OrderStatus" NOT NULL DEFAULT 'PENDING',
    "has_delivery" BOOLEAN NOT NULL DEFAULT false,
    "delivery_address" TEXT,
    "delivery_time_slot" TEXT,
    "delivery_instructions" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "confirmed_at" TIMESTAMP(3),
    "shipped_at" TIMESTAMP(3),
    "delivered_at" TIMESTAMP(3),

    CONSTRAINT "orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "order_items" (
    "id" TEXT NOT NULL,
    "order_id" TEXT NOT NULL,
    "product_id" TEXT,
    "product_name" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "unit_price" DOUBLE PRECISION NOT NULL,
    "total_price" DOUBLE PRECISION NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "order_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "products" (
    "id" TEXT NOT NULL,
    "merchant_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "price" DOUBLE PRECISION NOT NULL,
    "category" TEXT NOT NULL,
    "stock" INTEGER NOT NULL DEFAULT 0,
    "image_url" TEXT,
    "weight" DOUBLE PRECISION,
    "dimensions" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "products_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "banking_info" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "account_holder" TEXT NOT NULL,
    "iban" TEXT NOT NULL,
    "bic" TEXT NOT NULL,
    "bank_name" TEXT NOT NULL,
    "address" TEXT,
    "is_verified" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "banking_info_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "verificationtokens_token_key" ON "verificationtokens"("token");

-- CreateIndex
CREATE UNIQUE INDEX "verificationtokens_identifier_token_key" ON "verificationtokens"("identifier", "token");

-- CreateIndex
CREATE UNIQUE INDEX "orders_package_id_key" ON "orders"("package_id");

-- CreateIndex
CREATE UNIQUE INDEX "banking_info_user_id_key" ON "banking_info"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "packages_tracking_number_key" ON "packages"("tracking_number");

-- CreateIndex
CREATE UNIQUE INDEX "payments_stripe_transaction_id_key" ON "payments"("stripe_transaction_id");

-- AddForeignKey
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "packages" ADD CONSTRAINT "packages_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rides" ADD CONSTRAINT "rides_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "matches" ADD CONSTRAINT "matches_package_id_fkey" FOREIGN KEY ("package_id") REFERENCES "packages"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "matches" ADD CONSTRAINT "matches_ride_id_fkey" FOREIGN KEY ("ride_id") REFERENCES "rides"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_sender_id_fkey" FOREIGN KEY ("sender_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_receiver_id_fkey" FOREIGN KEY ("receiver_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_match_id_fkey" FOREIGN KEY ("match_id") REFERENCES "matches"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "services" ADD CONSTRAINT "services_provider_id_fkey" FOREIGN KEY ("provider_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_service_id_fkey" FOREIGN KEY ("service_id") REFERENCES "services"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_provider_id_fkey" FOREIGN KEY ("provider_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contracts" ADD CONSTRAINT "contracts_merchant_id_fkey" FOREIGN KEY ("merchant_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documents" ADD CONSTRAINT "documents_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "box_rentals" ADD CONSTRAINT "box_rentals_box_id_fkey" FOREIGN KEY ("box_id") REFERENCES "storage_boxes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "box_rentals" ADD CONSTRAINT "box_rentals_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_merchant_id_fkey" FOREIGN KEY ("merchant_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_package_id_fkey" FOREIGN KEY ("package_id") REFERENCES "packages"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "products" ADD CONSTRAINT "products_merchant_id_fkey" FOREIGN KEY ("merchant_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "banking_info" ADD CONSTRAINT "banking_info_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
