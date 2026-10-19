CREATE TABLE "SiteDailyVisit" (
    "day" DATE NOT NULL,
    "visitors" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SiteDailyVisit_pkey" PRIMARY KEY ("day")
);
