CREATE TYPE "FinancialDocumentType" AS ENUM ('SUBCONTRACTOR_EARNING', 'PROJECT_INVOICE');

CREATE TYPE "FinancialDocumentStatus" AS ENUM ('ISSUED');

CREATE TYPE "FinancialDocumentLineKind" AS ENUM ('SERVICE', 'EXPENSE');

CREATE TABLE "FinancialDocument" (
    "id" TEXT NOT NULL,
    "type" "FinancialDocumentType" NOT NULL,
    "status" "FinancialDocumentStatus" NOT NULL DEFAULT 'ISSUED',
    "monthKey" TEXT NOT NULL,
    "periodStart" TIMESTAMP(3) NOT NULL,
    "periodEnd" TIMESTAMP(3) NOT NULL,
    "subcontractorId" TEXT,
    "projectId" TEXT,
    "createdByUserId" TEXT,
    "issuedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "grossAmount" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "expenseAmount" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "netAmount" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FinancialDocument_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "FinancialDocumentLine" (
    "id" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "kind" "FinancialDocumentLineKind" NOT NULL,
    "serviceAssignmentId" TEXT,
    "expenseId" TEXT,
    "serviceDate" TIMESTAMP(3),
    "title" TEXT NOT NULL,
    "description" TEXT,
    "projectName" TEXT,
    "routeName" TEXT,
    "vehicleName" TEXT,
    "serviceType" TEXT,
    "serviceCount" INTEGER NOT NULL DEFAULT 0,
    "unitPrice" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "amount" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FinancialDocumentLine_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "FinancialDocument_type_monthKey_idx" ON "FinancialDocument"("type", "monthKey");
CREATE INDEX "FinancialDocument_subcontractorId_monthKey_idx" ON "FinancialDocument"("subcontractorId", "monthKey");
CREATE INDEX "FinancialDocument_projectId_monthKey_idx" ON "FinancialDocument"("projectId", "monthKey");
CREATE INDEX "FinancialDocumentLine_documentId_idx" ON "FinancialDocumentLine"("documentId");
CREATE INDEX "FinancialDocumentLine_serviceAssignmentId_idx" ON "FinancialDocumentLine"("serviceAssignmentId");
CREATE INDEX "FinancialDocumentLine_expenseId_idx" ON "FinancialDocumentLine"("expenseId");

ALTER TABLE "FinancialDocument" ADD CONSTRAINT "FinancialDocument_subcontractorId_fkey" FOREIGN KEY ("subcontractorId") REFERENCES "Subcontractor"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "FinancialDocument" ADD CONSTRAINT "FinancialDocument_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "FinancialDocument" ADD CONSTRAINT "FinancialDocument_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "FinancialDocumentLine" ADD CONSTRAINT "FinancialDocumentLine_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "FinancialDocument"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "FinancialDocumentLine" ADD CONSTRAINT "FinancialDocumentLine_serviceAssignmentId_fkey" FOREIGN KEY ("serviceAssignmentId") REFERENCES "ServiceAssignment"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "FinancialDocumentLine" ADD CONSTRAINT "FinancialDocumentLine_expenseId_fkey" FOREIGN KEY ("expenseId") REFERENCES "Expense"("id") ON DELETE SET NULL ON UPDATE CASCADE;
