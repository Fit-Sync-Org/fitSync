-- This is an empty migration.
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "age" INTEGER;
