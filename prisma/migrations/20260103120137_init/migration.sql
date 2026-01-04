-- CreateTable
CREATE TABLE "ResearchProject" (
    "id" TEXT NOT NULL,
    "country" TEXT NOT NULL,
    "genre" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ResearchProject_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CompetitorSite" (
    "id" TEXT NOT NULL,
    "domain" TEXT NOT NULL,
    "lpStructureType" TEXT NOT NULL,
    "brandDependencyScore" DOUBLE PRECISION NOT NULL,
    "projectId" TEXT NOT NULL,

    CONSTRAINT "CompetitorSite_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RiskScore" (
    "id" TEXT NOT NULL,
    "trademarkRisk" DOUBLE PRECISION NOT NULL,
    "adPolicyRisk" DOUBLE PRECISION NOT NULL,
    "bridgePageRisk" DOUBLE PRECISION NOT NULL,
    "totalScore" DOUBLE PRECISION NOT NULL,
    "projectId" TEXT NOT NULL,

    CONSTRAINT "RiskScore_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "RiskScore_projectId_key" ON "RiskScore"("projectId");

-- AddForeignKey
ALTER TABLE "CompetitorSite" ADD CONSTRAINT "CompetitorSite_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "ResearchProject"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RiskScore" ADD CONSTRAINT "RiskScore_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "ResearchProject"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
