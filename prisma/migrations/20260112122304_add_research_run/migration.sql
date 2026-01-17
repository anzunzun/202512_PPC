-- CreateTable
CREATE TABLE "ResearchRun" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "scope" TEXT NOT NULL DEFAULT 'PPC',
    "provider" TEXT NOT NULL DEFAULT 'demo',
    "status" TEXT NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finishedAt" TIMESTAMP(3),
    "durationMs" INTEGER,
    "resultJson" JSONB,
    "errorMessage" TEXT,

    CONSTRAINT "ResearchRun_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ResearchRun_projectId_startedAt_idx" ON "ResearchRun"("projectId", "startedAt");

-- AddForeignKey
ALTER TABLE "ResearchRun" ADD CONSTRAINT "ResearchRun_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "ResearchProject"("id") ON DELETE CASCADE ON UPDATE CASCADE;
