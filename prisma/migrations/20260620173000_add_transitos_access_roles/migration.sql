ALTER TYPE "UserRole" ADD VALUE IF NOT EXISTS 'SERVICE_SUPERVISOR';
ALTER TYPE "UserRole" ADD VALUE IF NOT EXISTS 'PROJECT_OWNER';

ALTER TABLE "ServiceAssignment"
ADD COLUMN IF NOT EXISTS "clientPricePerService" DECIMAL(65,30) NOT NULL DEFAULT 0;

CREATE TABLE IF NOT EXISTS "_ProjectOwnerProjects" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS "_ServiceSupervisorProjects" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS "_ProjectOwnerProjects_AB_unique" ON "_ProjectOwnerProjects"("A", "B");
CREATE INDEX IF NOT EXISTS "_ProjectOwnerProjects_B_index" ON "_ProjectOwnerProjects"("B");
CREATE UNIQUE INDEX IF NOT EXISTS "_ServiceSupervisorProjects_AB_unique" ON "_ServiceSupervisorProjects"("A", "B");
CREATE INDEX IF NOT EXISTS "_ServiceSupervisorProjects_B_index" ON "_ServiceSupervisorProjects"("B");

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = '_ProjectOwnerProjects_A_fkey'
    ) THEN
        ALTER TABLE "_ProjectOwnerProjects"
        ADD CONSTRAINT "_ProjectOwnerProjects_A_fkey" FOREIGN KEY ("A") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = '_ProjectOwnerProjects_B_fkey'
    ) THEN
        ALTER TABLE "_ProjectOwnerProjects"
        ADD CONSTRAINT "_ProjectOwnerProjects_B_fkey" FOREIGN KEY ("B") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = '_ServiceSupervisorProjects_A_fkey'
    ) THEN
        ALTER TABLE "_ServiceSupervisorProjects"
        ADD CONSTRAINT "_ServiceSupervisorProjects_A_fkey" FOREIGN KEY ("A") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = '_ServiceSupervisorProjects_B_fkey'
    ) THEN
        ALTER TABLE "_ServiceSupervisorProjects"
        ADD CONSTRAINT "_ServiceSupervisorProjects_B_fkey" FOREIGN KEY ("B") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;
