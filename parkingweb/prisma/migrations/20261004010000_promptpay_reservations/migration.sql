CREATE TABLE "PaymentReservation" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "plateNumber" TEXT NOT NULL,
    "ownerName" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "omiseChargeId" TEXT,
    "qrImageUrl" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

CREATE UNIQUE INDEX "PaymentReservation_omiseChargeId_key" ON "PaymentReservation"("omiseChargeId");
CREATE INDEX "PaymentReservation_status_createdAt_idx" ON "PaymentReservation"("status", "createdAt");
