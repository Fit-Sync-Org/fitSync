-- CreateEnum
CREATE TYPE "AgeRange" AS ENUM ('A18_25', 'A26_35', 'A36_45', 'A46_PLUS');

-- CreateEnum
CREATE TYPE "Gender" AS ENUM ('MALE', 'FEMALE', 'OTHER', 'PREFER_NOT_TO_SAY');

-- CreateEnum
CREATE TYPE "SessionPreference" AS ENUM ('LONGER_FEWER', 'SHORTER_MORE');

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "ageRange" "AgeRange",
ADD COLUMN     "firstName" TEXT,
ADD COLUMN     "gender" "Gender",
ADD COLUMN     "inspiration" TEXT,
ADD COLUMN     "lastLogin" TIMESTAMP(3),
ADD COLUMN     "lastName" TEXT,
ADD COLUMN     "occupation" TEXT,
ADD COLUMN     "phone" TEXT,
ADD COLUMN     "sessionPreference" "SessionPreference",
ADD COLUMN     "streakCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "weeklyWorkoutHours" DOUBLE PRECISION;

-- CreateTable
CREATE TABLE "FitnessGoal" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "FitnessGoal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Workout" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "workoutType" TEXT NOT NULL,
    "durationMinutes" DOUBLE PRECISION NOT NULL,
    "intensity" TEXT NOT NULL,
    "caloriesBurned" DOUBLE PRECISION NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Workout_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_UserGoals" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,

    CONSTRAINT "_UserGoals_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "FitnessGoal_name_key" ON "FitnessGoal"("name");

-- CreateIndex
CREATE INDEX "_UserGoals_B_index" ON "_UserGoals"("B");

-- AddForeignKey
ALTER TABLE "Workout" ADD CONSTRAINT "Workout_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_UserGoals" ADD CONSTRAINT "_UserGoals_A_fkey" FOREIGN KEY ("A") REFERENCES "FitnessGoal"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_UserGoals" ADD CONSTRAINT "_UserGoals_B_fkey" FOREIGN KEY ("B") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
