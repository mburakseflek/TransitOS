ALTER TABLE "FinancialDocument" ADD COLUMN IF NOT EXISTS "projectCompanyId" TEXT;

UPDATE "FinancialDocument" d
SET "projectCompanyId" = p."projectCompanyId"
FROM "Project" p
WHERE d."projectId" = p."id"
  AND d."projectCompanyId" IS NULL
  AND p."projectCompanyId" IS NOT NULL;

CREATE INDEX IF NOT EXISTS "FinancialDocument_projectCompanyId_monthKey_idx"
ON "FinancialDocument"("projectCompanyId", "monthKey");

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'FinancialDocument_projectCompanyId_fkey') THEN
    ALTER TABLE "FinancialDocument" ADD CONSTRAINT "FinancialDocument_projectCompanyId_fkey"
    FOREIGN KEY ("projectCompanyId") REFERENCES "ProjectCompany"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;
