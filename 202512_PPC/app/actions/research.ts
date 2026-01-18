"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { runRuleBasedResearch } from "@/lib/research/engine";

// ----------------------------
// runResearchProjectAction
// 「再リサーチ」ボタンから呼ばれる本体
// ----------------------------
type RunResearchInput = {
  projectId: string;
};

type RunResearchOutput = {
  status: "completed";
  scores: {
    id: string;
    trademarkRisk: number;
    adPolicyRisk: number;
    bridgePageRisk: number;
    totalScore: number;
    projectId: string;
  };
  analysis?: {
    profitScore: number;
    opportunityScore: number;
    keywordCandidates: unknown;
    recommendations: unknown;
    evidence: unknown;
  };
};

export async function runResearchProjectAction(
  input: RunResearchInput
): Promise<RunResearchOutput> {
  const { projectId } = input;

  // ★追加：まずここが呼ばれてるかログで確実に見る
  console.log("[runResearchProjectAction] start", {
    projectId,
    at: new Date().toISOString(),
  });

  // 1) 入力（ResearchItems）を読む ※[OUTPUT]は解析対象から除外
  const items = await prisma.researchItem.findMany({
    where: {
      projectId,
      NOT: { label: { startsWith: "[OUTPUT]" } },
    },
    orderBy: { order: "asc" },
    select: { label: true, value: true, type: true, order: true },
  });

  // 2) ルールベース解析（外部APIなし）
  const summary = runRuleBasedResearch(
    items.map((i) => ({
      label: i.label,
      value: i.value ?? "",
      type: i.type as any,
      order: i.order,
    }))
  );

  // RiskScore（0-100）：高いほど危険
  const trademarkRisk = summary.scores.trademarkRisk;
  const adPolicyRisk = summary.scores.adPolicyRisk;
  const bridgePageRisk = summary.scores.bridgePageRisk;

  // totalScore は「リスク総合」（既存の意味を維持）
  const totalScore = summary.scores.totalRiskScore;

  // 3) OUTPUTをDBへ保存（移行ゼロで安全）
  const nowIso = new Date().toISOString();
  const outputItems = [
    { label: "[OUTPUT] lastRunAt", value: nowIso, order: 9000 },
    { label: "[OUTPUT] profitScore", value: String(summary.scores.profitScore), order: 9001 },
    { label: "[OUTPUT] opportunityScore", value: String(summary.scores.opportunityScore), order: 9002 },
    { label: "[OUTPUT] keywordCandidates", value: JSON.stringify(summary.candidates, null, 2), order: 9003 },
    { label: "[OUTPUT] recommendations", value: JSON.stringify(summary.recommendations, null, 2), order: 9004 },
    { label: "[OUTPUT] evidence", value: JSON.stringify(summary.evidence, null, 2), order: 9005 },
  ] as const;

  const riskScore = await prisma.$transaction(async (tx) => {
    // 3-1) RiskScore 更新
    const rs = await tx.riskScore.upsert({
      where: { projectId },
      update: { trademarkRisk, adPolicyRisk, bridgePageRisk, totalScore },
      create: { projectId, trademarkRisk, adPolicyRisk, bridgePageRisk, totalScore },
    });

    // 3-2) 既存の OUTPUT を掃除して入れ替え
    await tx.researchItem.deleteMany({
      where: { projectId, label: { startsWith: "[OUTPUT]" } },
    });

    // 3-3) OUTPUTを保存（長文JSONなので note 推奨）
    for (const oi of outputItems) {
      await tx.researchItem.create({
        data: {
          projectId,
          label: oi.label,
          value: oi.value,
          type: "note",
          order: oi.order,
        },
      });
    }

    // 3-4) project status 更新
    await tx.researchProject.update({
      where: { id: projectId },
      data: { status: "completed" },
    });

    return rs;
  });

  revalidatePath(`/projects/${projectId}`);
  revalidatePath("/projects");

  return {
    status: "completed",
    scores: riskScore,
    analysis: {
      profitScore: summary.scores.profitScore,
      opportunityScore: summary.scores.opportunityScore,
      keywordCandidates: summary.candidates,
      recommendations: summary.recommendations,
      evidence: summary.evidence,
    },
  };
}
