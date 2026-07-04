/*
  Warnings:

  - The values [FULL_DAY,EXTRA] on the enum `ServiceDirection` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "ServiceDirection_new" AS ENUM ('MORNING', 'EVENING', 'OVERTIME', 'ONE_OFF');
ALTER TABLE "ServiceAssignment" ALTER COLUMN "direction" TYPE "ServiceDirection_new" USING ("direction"::text::"ServiceDirection_new");
ALTER TYPE "ServiceDirection" RENAME TO "ServiceDirection_old";
ALTER TYPE "ServiceDirection_new" RENAME TO "ServiceDirection";
DROP TYPE "ServiceDirection_old";
COMMIT;

-- AlterTable
ALTER TABLE "ServiceAssignment" ALTER COLUMN "projectId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "ServiceRoute" ADD COLUMN     "standardWorkDays" INTEGER NOT NULL DEFAULT 22,
ALTER COLUMN "projectId" DROP NOT NULL;
