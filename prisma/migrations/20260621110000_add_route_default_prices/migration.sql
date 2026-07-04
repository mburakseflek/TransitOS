ALTER TABLE "ServiceRoute"
ADD COLUMN "defaultCarrierPricePerService" DECIMAL(65, 30) NOT NULL DEFAULT 0,
ADD COLUMN "defaultClientPricePerService" DECIMAL(65, 30) NOT NULL DEFAULT 0;
