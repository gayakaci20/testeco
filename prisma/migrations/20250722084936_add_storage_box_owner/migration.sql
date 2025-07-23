-- AlterTable
ALTER TABLE "storage_boxes" ADD COLUMN     "owner_id" TEXT;

-- AddForeignKey
ALTER TABLE "storage_boxes" ADD CONSTRAINT "storage_boxes_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
