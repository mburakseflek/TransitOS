ALTER TABLE "ServiceAssignment" ADD COLUMN "seriesId" TEXT;

CREATE INDEX "ServiceAssignment_seriesId_idx" ON "ServiceAssignment"("seriesId");
