/*
  Warnings:

  - You are about to drop the column `intensity` on the `Workout` table. All the data in the column will be lost.
  - Added the required column `name` to the `Workout` table without a default value. This is not possible if the table is not empty.
  - Added the required column `notes` to the `Workout` table without a default value. This is not possible if the table is not empty.
  - Added the required column `reps` to the `Workout` table without a default value. This is not possible if the table is not empty.
  - Added the required column `sets` to the `Workout` table without a default value. This is not possible if the table is not empty.
  - Added the required column `weight` to the `Workout` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Workout" DROP COLUMN "intensity",
ADD COLUMN     "name" TEXT NOT NULL,
ADD COLUMN     "notes" TEXT NOT NULL,
ADD COLUMN     "reps" INTEGER NOT NULL,
ADD COLUMN     "sets" INTEGER NOT NULL,
ADD COLUMN     "weight" DOUBLE PRECISION NOT NULL;

-- CreateIndex
CREATE INDEX "Meal_userId_date_idx" ON "Meal"("userId", "date");

-- CreateIndex
CREATE INDEX "Workout_userId_date_idx" ON "Workout"("userId", "date");
