"use server";

import { prisma } from "@/lib/prisma";

export type ProjectWithRiskScore = {
  id: string;
  genre: string;
  status: string;
  updatedAt: Date;
  riskScore: {
    adPolicyRisk: number;
    trademarkRisk: number;
    bridgePageRisk: number;
    totalScore: number;
  } | null;
  latestRunAt: Date | null;
  competitorAnalysisCount: number;
};

// ダッシュボード用：全プロジェクトとリスクスコアを取得
export async function getProjectsWithRiskScores(): Promise<ProjectWithRiskScore[]> {
  const projects = await prisma.researchProject.findMany({
    include: {
      riskScore: true,
      researchRuns: {
        where: { status: "ok" },
        orderBy: { startedAt: "desc" },
        take: 1,
        select: { startedAt: true },
      },
      competitorAnalyses: {
        select: { id: true },
      },
    },
    orderBy: { updatedAt: "desc" },
  });

  return projects.map(p => ({
    id: p.id,
    genre: p.genre,
    status: p.status,
    updatedAt: p.updatedAt,
    riskScore: p.riskScore
      ? {
          adPolicyRisk: p.riskScore.adPolicyRisk,
          trademarkRisk: p.riskScore.trademarkRisk,
          bridgePageRisk: p.riskScore.bridgePageRisk,
          totalScore: p.riskScore.totalScore,
        }
      : null,
    latestRunAt: p.researchRuns[0]?.startedAt ?? null,
    competitorAnalysisCount: p.competitorAnalyses.length,
  }));
}

// プロジェクト統計を取得
export async function getDashboardStats(): Promise<{
  totalProjects: number;
  projectsWithRiskScore: number;
  highRiskProjects: number;
  projectsWithCompetitorAnalysis: number;
  avgRiskScore: number;
}> {
  const projects = await prisma.researchProject.findMany({
    include: {
      riskScore: true,
      competitorAnalyses: {
        select: { id: true },
      },
    },
  });

  const projectsWithRisk = projects.filter(p => p.riskScore);
  const highRiskProjects = projectsWithRisk.filter(
    p => p.riskScore && p.riskScore.totalScore >= 50
  );
  const projectsWithCompetitor = projects.filter(
    p => p.competitorAnalyses.length > 0
  );

  const avgRiskScore = projectsWithRisk.length > 0
    ? Math.round(
        projectsWithRisk.reduce((sum, p) => sum + (p.riskScore?.totalScore ?? 0), 0) /
          projectsWithRisk.length
      )
    : 0;

  return {
    totalProjects: projects.length,
    projectsWithRiskScore: projectsWithRisk.length,
    highRiskProjects: highRiskProjects.length,
    projectsWithCompetitorAnalysis: projectsWithCompetitor.length,
    avgRiskScore,
  };
}
