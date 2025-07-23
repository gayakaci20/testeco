-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "MatchStatus" ADD VALUE 'AWAITING_TRANSFER';
ALTER TYPE "MatchStatus" ADD VALUE 'READY_FOR_PICKUP';

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "PackageStatus" ADD VALUE 'AWAITING_RELAY';
ALTER TYPE "PackageStatus" ADD VALUE 'RELAY_IN_PROGRESS';

-- AlterTable
ALTER TABLE "matches" ADD COLUMN     "dropoff_location" TEXT,
ADD COLUMN     "is_partial_delivery" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "is_relay_segment" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "segment_order" INTEGER NOT NULL DEFAULT 1;

-- AlterTable
ALTER TABLE "packages" ADD COLUMN     "current_location" TEXT,
ADD COLUMN     "final_destination" TEXT,
ADD COLUMN     "is_multi_segment" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "parent_package_id" TEXT,
ADD COLUMN     "segment_number" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "total_segments" INTEGER NOT NULL DEFAULT 1;

-- AlterTable
ALTER TABLE "rides" ADD COLUMN     "allows_relay_dropoff" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "allows_relay_pickup" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "tracking_events" ADD COLUMN     "event_type" TEXT,
ADD COLUMN     "next_carrier_id" TEXT,
ADD COLUMN     "transfer_code" TEXT;

-- AddForeignKey
ALTER TABLE "packages" ADD CONSTRAINT "packages_parent_package_id_fkey" FOREIGN KEY ("parent_package_id") REFERENCES "packages"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tracking_events" ADD CONSTRAINT "tracking_events_next_carrier_id_fkey" FOREIGN KEY ("next_carrier_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
