-- CreateEnum
CREATE TYPE "ItemType" AS ENUM ('text', 'url', 'number', 'money', 'note');

-- CreateTable
CREATE TABLE "AppSetting" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AppSetting_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ResearchItemTemplate" (
    "id" TEXT NOT NULL,
    "scope" TEXT NOT NULL DEFAULT 'PPC',
    "label" TEXT NOT NULL,
    "type" "ItemType" NOT NULL DEFAULT 'text',
    "order" INTEGER NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ResearchItemTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ResearchProjectItem" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "templateId" TEXT NOT NULL,
    "value" TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ResearchProjectItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AppSetting_key_key" ON "AppSetting"("key" ASC);

-- CreateIndex
CREATE INDEX "ResearchItemTemplate_scope_isActive_idx" ON "ResearchItemTemplate"("scope" ASC, "isActive" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "ResearchItemTemplate_scope_label_key" ON "ResearchItemTemplate"("scope" ASC, "label" ASC);

-- CreateIndex
CREATE INDEX "ResearchProjectItem_projectId_idx" ON "ResearchProjectItem"("projectId" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "ResearchProjectItem_projectId_templateId_key" ON "ResearchProjectItem"("projectId" ASC, "templateId" ASC);

-- CreateIndex
CREATE INDEX "ResearchProjectItem_templateId_idx" ON "ResearchProjectItem"("templateId" ASC);

-- AddForeignKey
ALTER TABLE "ResearchProjectItem" ADD CONSTRAINT "ResearchProjectItem_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "ResearchProject"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResearchProjectItem" ADD CONSTRAINT "ResearchProjectItem_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "ResearchItemTemplate"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

