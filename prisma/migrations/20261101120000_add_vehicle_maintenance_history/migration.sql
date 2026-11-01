CREATE TABLE "VehicleMaintenance" (
    "id" TEXT NOT NULL,
    "vehicleId" TEXT NOT NULL,
    "serviceProvider" TEXT NOT NULL,
    "serviceDate" TIMESTAMP(3) NOT NULL,
    "odometerKm" INTEGER NOT NULL,
    "workPerformed" TEXT NOT NULL,
    "replacedParts" TEXT,
    "amount" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VehicleMaintenance_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "VehicleMaintenance_vehicleId_serviceDate_idx" ON "VehicleMaintenance"("vehicleId", "serviceDate");
CREATE INDEX "VehicleMaintenance_serviceDate_idx" ON "VehicleMaintenance"("serviceDate");

ALTER TABLE "VehicleMaintenance" ADD CONSTRAINT "VehicleMaintenance_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "Vehicle"("id") ON DELETE CASCADE ON UPDATE CASCADE;
