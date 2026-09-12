ALTER TABLE "ServiceAssignment" ADD COLUMN "submissionKey" TEXT;

CREATE UNIQUE INDEX "ServiceAssignment_submissionKey_serviceDate_key"
ON "ServiceAssignment"("submissionKey", "serviceDate");
