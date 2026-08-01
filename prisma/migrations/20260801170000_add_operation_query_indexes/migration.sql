CREATE INDEX "ServiceAssignment_serviceDate_idx" ON "ServiceAssignment"("serviceDate");
CREATE INDEX "ServiceAssignment_monthKey_idx" ON "ServiceAssignment"("monthKey");
CREATE INDEX "ServiceAssignment_projectId_serviceDate_idx" ON "ServiceAssignment"("projectId", "serviceDate");
CREATE INDEX "ServiceAssignment_routeId_serviceDate_idx" ON "ServiceAssignment"("routeId", "serviceDate");
CREATE INDEX "ServiceAssignment_vehicleId_serviceDate_idx" ON "ServiceAssignment"("vehicleId", "serviceDate");

CREATE INDEX "Expense_expenseDate_idx" ON "Expense"("expenseDate");
CREATE INDEX "Expense_monthKey_idx" ON "Expense"("monthKey");
CREATE INDEX "Expense_subcontractorId_expenseDate_idx" ON "Expense"("subcontractorId", "expenseDate");
CREATE INDEX "Expense_vehicleId_expenseDate_idx" ON "Expense"("vehicleId", "expenseDate");
