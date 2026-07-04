ALTER TABLE "ServiceRoute" ALTER COLUMN "standardWorkDays" SET DEFAULT 0;
UPDATE "ServiceRoute" SET "standardWorkDays" = 0;
