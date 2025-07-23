-- CreateTable
CREATE TABLE "tracking_events" (
    "id" TEXT NOT NULL,
    "package_id" TEXT NOT NULL,
    "carrier_id" TEXT,
    "status" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "notes" TEXT,
    "lat" DOUBLE PRECISION,
    "lng" DOUBLE PRECISION,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tracking_events_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "tracking_events" ADD CONSTRAINT "tracking_events_package_id_fkey" FOREIGN KEY ("package_id") REFERENCES "packages"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tracking_events" ADD CONSTRAINT "tracking_events_carrier_id_fkey" FOREIGN KEY ("carrier_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
