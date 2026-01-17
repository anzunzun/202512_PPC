/*
  Warnings:

  - A unique constraint covering the columns `[scope,key]` on the table `ResearchItemTemplate` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "ResearchItemTemplate" ADD COLUMN     "key" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "ResearchItemTemplate_scope_key_key" ON "ResearchItemTemplate"("scope", "key");
