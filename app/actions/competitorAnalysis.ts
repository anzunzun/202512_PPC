"use server";

import { analyzeLp, compareLps, type LpStructure } from "@/lib/research/competitorAnalyzer";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

// 競合LP分析を実行
export async function analyzeCompetitorLp(url: string): Promise<LpStructure> {
  if (!url || !url.startsWith("http")) {
    throw new Error("有効なURLを入力してください");
  }

  return analyzeLp(url);
}

// 複数LP分析
export async function analyzeMultipleLps(urls: string[]): Promise<{
  results: LpStructure[];
  comparison: ReturnType<typeof compareLps>;
}> {
  const validUrls = urls.filter(u => u && u.startsWith("http"));

  if (validUrls.length === 0) {
    throw new Error("有効なURLを入力してください");
  }

  const results = await Promise.all(validUrls.map(url => analyzeLp(url)));
  const comparison = compareLps(results.filter(r => !r.fetchError));

  return { results, comparison };
}

// 複数LP分析を実行してDBに保存
export async function analyzeAndSaveMultipleLps(
  projectId: string,
  urls: string[]
): Promise<{
  results: LpStructure[];
  comparison: ReturnType<typeof compareLps>;
  savedCount: number;
}> {
  const { results, comparison } = await analyzeMultipleLps(urls);

  // 成功した分析結果をDBに保存
  let savedCount = 0;
  for (const lp of results) {
    if (!lp.fetchError) {
      await saveCompetitorAnalysisResult(projectId, lp);
      savedCount++;
    }
  }

  revalidatePath(`/projects/${projectId}`);
  revalidatePath(`/projects/${projectId}/competitor-analysis`);

  return { results, comparison, savedCount };
}

// プロジェクトに競合LP分析結果を保存（詳細版）
export async function saveCompetitorAnalysisResult(
  projectId: string,
  analysis: LpStructure
): Promise<string> {
  const result = await prisma.competitorAnalysisResult.create({
    data: {
      projectId,
      url: analysis.url,
      title: analysis.title || null,
      heroHeadline: analysis.heroHeadline || null,
      heroSubheadline: analysis.heroSubheadline || null,
      hasHeroImage: analysis.hasHeroImage,
      ctaCount: analysis.ctaCount,
      ctaTexts: analysis.ctaTexts,
      hasFloatingCta: analysis.hasFloatingCta,
      sectionCount: analysis.sectionCount,
      sectionHeadings: analysis.sectionHeadings,
      hasComparisonTable: analysis.hasComparisonTable,
      hasPriceDisplay: analysis.hasPriceDisplay,
      hasTestimonials: analysis.hasTestimonials,
      hasFaq: analysis.hasFaq,
      appealPoints: analysis.appealPoints,
      urgencyPhrases: analysis.urgencyPhrases,
      trustSignals: analysis.trustSignals,
      wordCount: analysis.wordCount,
      imageCount: analysis.imageCount,
      externalLinkCount: analysis.externalLinkCount,
      scores: analysis.scores,
      fetchError: analysis.fetchError,
    },
  });

  return result.id;
}

// プロジェクトの競合LP分析結果一覧を取得
export async function getCompetitorAnalysisResults(projectId: string) {
  return prisma.competitorAnalysisResult.findMany({
    where: { projectId },
    orderBy: { analyzedAt: "desc" },
  });
}

// 競合LP分析結果を削除
export async function deleteCompetitorAnalysisResult(id: string, projectId: string) {
  await prisma.competitorAnalysisResult.delete({
    where: { id },
  });
  revalidatePath(`/projects/${projectId}/competitor-analysis`);
}

// プロジェクトの競合LP情報を保存（従来版 - 互換性維持）
export async function saveCompetitorAnalysis(
  projectId: string,
  analysis: LpStructure
): Promise<void> {
  await prisma.competitorSite.create({
    data: {
      projectId,
      domain: new URL(analysis.url).hostname,
      lpStructureType: analysis.hasComparisonTable ? "comparison" : "single",
      brandDependencyScore: 0,
    },
  });

  revalidatePath(`/projects/${projectId}`);
}

// プロジェクトの競合LP一覧を取得（従来版）
export async function getCompetitorSites(projectId: string) {
  return prisma.competitorSite.findMany({
    where: { projectId },
    orderBy: { id: "desc" },
  });
}
