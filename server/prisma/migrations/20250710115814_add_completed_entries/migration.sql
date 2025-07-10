-- CreateTable
CREATE TABLE "CompletedMealEntry" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "summary" TEXT NOT NULL,
    "totalCalories" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalCarbs" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalFat" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalProtein" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalSodium" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalSugar" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "waterIntake" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "isCompleted" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CompletedMealEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CompletedWorkoutEntry" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "summary" TEXT NOT NULL,
    "totalCaloriesBurned" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalDuration" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalExercises" INTEGER NOT NULL DEFAULT 0,
    "isCompleted" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CompletedWorkoutEntry_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CompletedMealEntry_userId_date_idx" ON "CompletedMealEntry"("userId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "CompletedMealEntry_userId_date_key" ON "CompletedMealEntry"("userId", "date");

-- CreateIndex
CREATE INDEX "CompletedWorkoutEntry_userId_date_idx" ON "CompletedWorkoutEntry"("userId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "CompletedWorkoutEntry_userId_date_key" ON "CompletedWorkoutEntry"("userId", "date");

-- AddForeignKey
ALTER TABLE "CompletedMealEntry" ADD CONSTRAINT "CompletedMealEntry_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CompletedWorkoutEntry" ADD CONSTRAINT "CompletedWorkoutEntry_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
