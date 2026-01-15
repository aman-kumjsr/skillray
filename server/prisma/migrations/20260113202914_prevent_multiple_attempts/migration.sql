/*
  Warnings:

  - A unique constraint covering the columns `[testId,candidateEmail]` on the table `TestAttempt` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "TestAttempt_testId_candidateEmail_key" ON "TestAttempt"("testId", "candidateEmail");
