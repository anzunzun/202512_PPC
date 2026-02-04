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

// プロジェクトに競合LP情報を保存
export async function saveCompetitorAnalysis(
  projectId: string,
  analysis: LpStructure
): Promise<void> {
  await prisma.competitorSite.create({
    data: {
      projectId,
      domain: new URL(analysis.url).hostname,
      lpStructureType: analysis.hasComparisonTable ? "comparison" : "single",
      brandDependencyScore: 0, // 商標依存度（将来拡張）
    },
  });

  revalidatePath(`/projects/${projectId}`);
}

// プロジェクトの競合LP一覧を取得
export async function getCompetitorSites(projectId: string) {
  return prisma.competitorSite.findMany({
    where: { projectId },
    orderBy: { id: "desc" },
  });
}
