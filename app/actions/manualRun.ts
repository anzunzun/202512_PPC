"use server";

import { prisma } from "@/lib/prisma";

function toNum(v: unknown): number {
  const s = typeof v === "string" ? v : v == null ? "" : String(v);
  const n = Number.parseFloat(s);
  return Number.isFinite(n) ? n : 0;
}

export async function createManualResearchRunAction(params: {
  projectId: string;
  scope: string;
  kv: Record<string, string>;
  scores?: {
    totalScore?: number;
    adPolicyRisk?: number;
    trademarkRisk?: number;
    bridgePageRisk?: number;
  };
  note?: string;
}) {
  const { projectId, scope, kv, scores, note } = params;

  if (!projectId || !String(projectId).trim()) {
    throw new Error("createManualResearchRunAction: projectId is required");
  }

  const startedAt = new Date();
  const finishedAt = new Date();

  const s = {
    totalScore: scores?.totalScore ?? toNum(kv.totalScore),
    adPolicyRisk: scores?.adPolicyRisk ?? toNum(kv.adPolicyRisk),
    trademarkRisk: scores?.trademarkRisk ?? toNum(kv.trademarkRisk),
    bridgePageRisk: scores?.bridgePageRisk ?? toNum(kv.bridgePageRisk),
  };

  const run = await prisma.researchRun.create({
    data: {
      projectId,
      scope,
      provider: "manual",
      status: "ok",
      startedAt,
      finishedAt,
      durationMs: finishedAt.getTime() - startedAt.getTime(),
      resultJson: {
        version: 1,
        scope,
        provider: "manual",
        providerVersion: 1,
        kv,
        scores: s,
        meta: { note: note ?? "" },
      },
      errorMessage: null,
    },
    select: { id: true },
  });

  await prisma.riskScore.upsert({
    where: { projectId },
    create: {
      projectId,
      totalScore: s.totalScore,
      adPolicyRisk: s.adPolicyRisk,
      trademarkRisk: s.trademarkRisk,
      bridgePageRisk: s.bridgePageRisk,
    },
    update: {
      totalScore: s.totalScore,
      adPolicyRisk: s.adPolicyRisk,
      trademarkRisk: s.trademarkRisk,
      bridgePageRisk: s.bridgePageRisk,
    },
  });

  return { runId: run.id };
}
