ALTER TABLE "VehicleMaintenance"
ADD COLUMN "maintenanceType" TEXT NOT NULL DEFAULT 'Periyodik Bakım',
ADD COLUMN "nextServiceDate" TIMESTAMP(3),
ADD COLUMN "nextServiceOdometer" INTEGER,
ADD COLUMN "invoiceNumber" TEXT;

CREATE INDEX "VehicleMaintenance_nextServiceDate_idx" ON "VehicleMaintenance"("nextServiceDate");
