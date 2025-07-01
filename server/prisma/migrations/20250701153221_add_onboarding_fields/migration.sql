/*
  Warnings:

  - The values [PREFER_NOT_TO_SAY] on the enum `Gender` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `ageRange` on the `User` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "Goals" AS ENUM ('LOSE_WEIGHT', 'GAIN_WEIGHT', 'BUILD_MUSCLE', 'TONE_AND_STRENGTHEN', 'MAINTAIN_WEIGHT', 'EAT_HEALTHY', 'HEALTH_AND_LONGEVITY', 'MANAGE_STRESS_AND_RECOVERY');

-- AlterEnum
BEGIN;
CREATE TYPE "Gender_new" AS ENUM ('MALE', 'FEMALE', 'OTHER', 'RATHER_NOT_SAY');
ALTER TABLE "User" ALTER COLUMN "gender" TYPE "Gender_new" USING ("gender"::text::"Gender_new");
ALTER TYPE "Gender" RENAME TO "Gender_old";
ALTER TYPE "Gender_new" RENAME TO "Gender";
DROP TYPE "Gender_old";
COMMIT;

-- AlterTable
ALTER TABLE "User" DROP COLUMN "ageRange",
ADD COLUMN     "age" INTEGER,
ADD COLUMN     "dietaryRestrictions" TEXT,
ADD COLUMN     "heightCm" DOUBLE PRECISION,
ADD COLUMN     "weightKg" DOUBLE PRECISION;

-- DropEnum
DROP TYPE "AgeRange";
