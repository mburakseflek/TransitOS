ALTER TABLE "Vehicle"
ADD COLUMN "fleetTrackingEnabled" BOOLEAN NOT NULL DEFAULT false;

UPDATE "Vehicle"
SET "fleetTrackingEnabled" = true
WHERE "subcontractorId" IS NULL;

CREATE INDEX "Vehicle_fleetTrackingEnabled_idx"
ON "Vehicle"("fleetTrackingEnabled");
