/*
  Warnings:

  - Added the required column `sodium` to the `Meal` table without a default value. This is not possible if the table is not empty.
  - Added the required column `sugar` to the `Meal` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Meal" ADD COLUMN     "sodium" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "sugar" DOUBLE PRECISION NOT NULL;
