-- CreateTable
CREATE TABLE "carrier_reviews" (
    "id" TEXT NOT NULL,
    "match_id" TEXT NOT NULL,
    "customer_id" TEXT NOT NULL,
    "carrier_id" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "review" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "carrier_reviews_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "carrier_reviews_match_id_key" ON "carrier_reviews"("match_id");

-- AddForeignKey
ALTER TABLE "carrier_reviews" ADD CONSTRAINT "carrier_reviews_match_id_fkey" FOREIGN KEY ("match_id") REFERENCES "matches"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "carrier_reviews" ADD CONSTRAINT "carrier_reviews_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "carrier_reviews" ADD CONSTRAINT "carrier_reviews_carrier_id_fkey" FOREIGN KEY ("carrier_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
