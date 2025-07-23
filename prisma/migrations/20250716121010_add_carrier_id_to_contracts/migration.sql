-- AlterTable
ALTER TABLE "contracts" ADD COLUMN     "carrier_id" TEXT,
ADD COLUMN     "end_date" TIMESTAMP(3),
ADD COLUMN     "start_date" TIMESTAMP(3),
ALTER COLUMN "merchant_id" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "contracts" ADD CONSTRAINT "contracts_carrier_id_fkey" FOREIGN KEY ("carrier_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
