-- CreateTable
CREATE TABLE "VehicleSurveyResponse" (
    "id" TEXT NOT NULL,
    "vehicleId" TEXT NOT NULL,
    "routeId" TEXT,
    "projectId" TEXT,
    "vehicleFleetNumber" TEXT NOT NULL,
    "vehiclePlateNumber" TEXT NOT NULL,
    "driverName" TEXT,
    "driverPhone" TEXT,
    "passengerName" TEXT NOT NULL,
    "passengerPhone" TEXT NOT NULL,
    "passengerEmail" TEXT,
    "serviceLineLabel" TEXT NOT NULL,
    "journeyDate" TIMESTAMP(3) NOT NULL,
    "deviceKey" TEXT NOT NULL,
    "courtesyRating" INTEGER NOT NULL,
    "safetyRating" INTEGER NOT NULL,
    "cleanlinessRating" INTEGER NOT NULL,
    "comfortRating" INTEGER NOT NULL,
    "punctualityRating" INTEGER NOT NULL,
    "trustRating" INTEGER NOT NULL,
    "satisfactionRating" INTEGER NOT NULL,
    "recommendationRating" INTEGER NOT NULL,
    "favoriteTopics" JSONB NOT NULL DEFAULT '[]',
    "comments" TEXT,
    "lowScoreExplanation" TEXT,
    "averageRating" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VehicleSurveyResponse_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "VehicleSurveyResponse_vehicleId_journeyDate_deviceKey_key" ON "VehicleSurveyResponse"("vehicleId", "journeyDate", "deviceKey");

-- CreateIndex
CREATE INDEX "VehicleSurveyResponse_vehicleId_journeyDate_idx" ON "VehicleSurveyResponse"("vehicleId", "journeyDate");

-- CreateIndex
CREATE INDEX "VehicleSurveyResponse_routeId_idx" ON "VehicleSurveyResponse"("routeId");

-- CreateIndex
CREATE INDEX "VehicleSurveyResponse_projectId_idx" ON "VehicleSurveyResponse"("projectId");

-- CreateIndex
CREATE INDEX "VehicleSurveyResponse_averageRating_idx" ON "VehicleSurveyResponse"("averageRating");

-- AddForeignKey
ALTER TABLE "VehicleSurveyResponse" ADD CONSTRAINT "VehicleSurveyResponse_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "Vehicle"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VehicleSurveyResponse" ADD CONSTRAINT "VehicleSurveyResponse_routeId_fkey" FOREIGN KEY ("routeId") REFERENCES "ServiceRoute"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VehicleSurveyResponse" ADD CONSTRAINT "VehicleSurveyResponse_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE SET NULL ON UPDATE CASCADE;
