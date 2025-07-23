-- AlterEnum
ALTER TYPE "RideRequestStatus" ADD VALUE 'PAID';

-- AlterTable
ALTER TABLE "payments" ADD COLUMN     "ride_request_id" TEXT;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_ride_request_id_fkey" FOREIGN KEY ("ride_request_id") REFERENCES "ride_requests"("id") ON DELETE SET NULL ON UPDATE CASCADE;
