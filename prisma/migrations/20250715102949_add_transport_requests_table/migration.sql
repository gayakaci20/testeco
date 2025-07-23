-- CreateEnum
CREATE TYPE "TransportRequestStatus" AS ENUM ('PENDING', 'ACCEPTED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "NotificationType" ADD VALUE 'TRANSPORT_REQUEST';
ALTER TYPE "NotificationType" ADD VALUE 'TRANSPORT_REQUEST_ACCEPTED';
ALTER TYPE "NotificationType" ADD VALUE 'TRANSPORT_IN_PROGRESS';
ALTER TYPE "NotificationType" ADD VALUE 'TRANSPORT_COMPLETED';

-- CreateTable
CREATE TABLE "transport_requests" (
    "id" TEXT NOT NULL,
    "customer_id" TEXT NOT NULL,
    "carrier_id" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "weight" DOUBLE PRECISION,
    "dimensions" TEXT,
    "pickup_address" TEXT NOT NULL,
    "delivery_address" TEXT NOT NULL,
    "pickup_date" TIMESTAMP(3),
    "pickup_time" TEXT,
    "delivery_date" TIMESTAMP(3),
    "delivery_time" TEXT,
    "max_price" DOUBLE PRECISION,
    "negotiated_price" DOUBLE PRECISION,
    "is_fragile" BOOLEAN NOT NULL DEFAULT false,
    "is_urgent" BOOLEAN NOT NULL DEFAULT false,
    "sender_name" TEXT,
    "sender_phone" TEXT,
    "recipient_name" TEXT,
    "recipient_phone" TEXT,
    "notes" TEXT,
    "carrier_notes" TEXT,
    "status" "TransportRequestStatus" NOT NULL DEFAULT 'PENDING',
    "tracking_number" TEXT NOT NULL,
    "accepted_at" TIMESTAMP(3),
    "completed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "transport_requests_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "transport_requests_tracking_number_key" ON "transport_requests"("tracking_number");

-- AddForeignKey
ALTER TABLE "transport_requests" ADD CONSTRAINT "transport_requests_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transport_requests" ADD CONSTRAINT "transport_requests_carrier_id_fkey" FOREIGN KEY ("carrier_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
