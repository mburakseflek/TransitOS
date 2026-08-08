ALTER TYPE "ExpenseCategory" ADD VALUE IF NOT EXISTS 'VEHICLE_TRACKING_SUBSCRIPTION';

CREATE TABLE IF NOT EXISTS "ProjectCompany" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ProjectCompany_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "ProjectCompany_name_key" ON "ProjectCompany"("name");

ALTER TABLE "Project" ADD COLUMN IF NOT EXISTS "projectCompanyId" TEXT;

INSERT INTO "ProjectCompany" ("id", "name", "createdAt", "updatedAt")
SELECT 'legacy_' || md5(trim("clientCompany")), trim("clientCompany"), CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM "Project"
WHERE trim("clientCompany") <> ''
ON CONFLICT ("name") DO NOTHING;

UPDATE "Project" p
SET "projectCompanyId" = c."id"
FROM "ProjectCompany" c
WHERE p."projectCompanyId" IS NULL AND trim(p."clientCompany") = c."name";

CREATE INDEX IF NOT EXISTS "Project_projectCompanyId_idx" ON "Project"("projectCompanyId");
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Project_projectCompanyId_fkey') THEN
    ALTER TABLE "Project" ADD CONSTRAINT "Project_projectCompanyId_fkey"
    FOREIGN KEY ("projectCompanyId") REFERENCES "ProjectCompany"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS "_ProjectCompanyOwners" ("A" TEXT NOT NULL, "B" TEXT NOT NULL);
CREATE UNIQUE INDEX IF NOT EXISTS "_ProjectCompanyOwners_AB_unique" ON "_ProjectCompanyOwners"("A", "B");
CREATE INDEX IF NOT EXISTS "_ProjectCompanyOwners_B_index" ON "_ProjectCompanyOwners"("B");

INSERT INTO "_ProjectCompanyOwners" ("A", "B")
SELECT DISTINCT p."projectCompanyId", old."B"
FROM "_ProjectOwnerProjects" old
JOIN "Project" p ON p."id" = old."A"
WHERE p."projectCompanyId" IS NOT NULL
ON CONFLICT DO NOTHING;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = '_ProjectCompanyOwners_A_fkey') THEN
    ALTER TABLE "_ProjectCompanyOwners" ADD CONSTRAINT "_ProjectCompanyOwners_A_fkey"
    FOREIGN KEY ("A") REFERENCES "ProjectCompany"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = '_ProjectCompanyOwners_B_fkey') THEN
    ALTER TABLE "_ProjectCompanyOwners" ADD CONSTRAINT "_ProjectCompanyOwners_B_fkey"
    FOREIGN KEY ("B") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;
