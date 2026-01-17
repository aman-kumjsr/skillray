-- CreateTable
CREATE TABLE "Violation" (
    "violationId" SERIAL NOT NULL,
    "attemptId" INTEGER NOT NULL,
    "type" TEXT NOT NULL,
    "count" INTEGER NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Violation_pkey" PRIMARY KEY ("violationId")
);

-- AddForeignKey
ALTER TABLE "Violation" ADD CONSTRAINT "Violation_attemptId_fkey" FOREIGN KEY ("attemptId") REFERENCES "TestAttempt"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
