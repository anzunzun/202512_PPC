-- CreateTable
CREATE TABLE "ResearchItem" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "value" TEXT NOT NULL DEFAULT '',
    "type" TEXT NOT NULL DEFAULT 'text',
    "order" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ResearchItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ResearchItem_projectId_idx" ON "ResearchItem"("projectId");

-- AddForeignKey
ALTER TABLE "ResearchItem" ADD CONSTRAINT "ResearchItem_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "ResearchProject"("id") ON DELETE CASCADE ON UPDATE CASCADE;
