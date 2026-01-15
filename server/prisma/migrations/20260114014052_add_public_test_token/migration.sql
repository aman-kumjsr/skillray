/*
  Warnings:

  - A unique constraint covering the columns `[publicToken]` on the table `Test` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Test" ADD COLUMN     "publicToken" TEXT NOT NULL DEFAULT 'TEMP';

-- CreateIndex
CREATE UNIQUE INDEX "Test_publicToken_key" ON "Test"("publicToken");
