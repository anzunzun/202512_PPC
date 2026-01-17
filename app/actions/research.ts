// app/actions/research.ts
"use server";

import { prisma } from "@/lib/prisma";
import { getProviderOrThrow } from "@/lib/research/providers";
import { normalizeRunResult } from "@/lib/research/normalizeRunResult";

export type RunResearchProjectInput = {
  projectId: string;
  scope: string;
  provider?: string; // "ppc" | "demo" | "manual" (default: "ppc")
};

export type RunResearchProjectOutput = {
  status: "ok" | "error";
  runId: string;
  at: string;
  errorMessage?: string;
  resultJson?: any;
};

/**
 * Research実行（PPCプロバイダー使用）
 * - PPCプロバイダー: ルールベースのリスク判定 + 強化版スクレイピング
 * - referenceUrl を解析して targetKw 自動生成
 * - 既にtargetKwが入力済みなら上書きしない（安全）
 * - ResearchRun: running -> ok/error を必ず保存
 */
export async function runResearchProjectAction(
  input: RunResearchProjectInput
): Promise<RunResearchProjectOutput> {
  const projectId = String(input.projectId ?? "").trim();
  const scope = String(input.scope ?? "").trim();
  const providerId = String(input.provider ?? "ppc").trim();

  if (!projectId) throw new Error("projectId is required");
  if (!scope) throw new Error("scope is required");

  const startedAt = new Date();

  // 1) まず Run を running で作る（ここは必ず成功させる）
  const run = await prisma.researchRun.create({
    data: {
      projectId,
      scope,
      provider: providerId,
      status: "running",
      startedAt,
    },
    select: { id: true },
  });

  const runId = String(run.id);

  try {
    // 2) プロバイダー取得・実行
    const provider = getProviderOrThrow(providerId);
    const output = await provider.run({ projectId, scope });

    const finishedAt = new Date();
    const durationMs = finishedAt.getTime() - startedAt.getTime();

    // 3) 結果を正規化
    const normalized = normalizeRunResult({
      result: output.kv,
      scores: output.scores,
    });

    // 4) keyでそのまま引ける辞書を構築
    const itemsByKey: Record<string, string> = {
      ...output.kv,
      // scoresも文字列化して追加
      totalScore: String(output.scores.totalScore ?? 0),
      adPolicyRisk: String(output.scores.adPolicyRisk ?? 0),
      trademarkRisk: String(output.scores.trademarkRisk ?? 0),
      bridgePageRisk: String(output.scores.bridgePageRisk ?? 0),
    };

    const resultJson = {
      version: 1,
      scope,
      provider: providerId,
      providerVersion: provider.version,
      ...normalized,
      itemsByKey,
      scores: output.scores,
      meta: (output.meta ?? {}) as Record<string, string | number | boolean | null>,
    };

    // 5) Run を ok で確定（resultJson 保存）
    await prisma.researchRun.update({
      where: { id: run.id },
      data: {
        status: "ok",
        errorMessage: null,
        finishedAt,
        durationMs,
        resultJson,
      },
    });

    // 6) RiskScore も更新
    await prisma.riskScore.upsert({
      where: { projectId },
      create: {
        projectId,
        totalScore: output.scores.totalScore ?? 0,
        adPolicyRisk: output.scores.adPolicyRisk ?? 0,
        trademarkRisk: output.scores.trademarkRisk ?? 0,
        bridgePageRisk: output.scores.bridgePageRisk ?? 0,
      },
      update: {
        totalScore: output.scores.totalScore ?? 0,
        adPolicyRisk: output.scores.adPolicyRisk ?? 0,
        trademarkRisk: output.scores.trademarkRisk ?? 0,
        bridgePageRisk: output.scores.bridgePageRisk ?? 0,
      },
    });

    return {
      status: "ok",
      runId,
      at: finishedAt.toISOString(),
      resultJson,
    };
  } catch (e: any) {
    const msg = e?.message ? String(e.message) : "Unknown error";
    const finishedAt = new Date();

    // エラーでも Run は error で確定させる
    await prisma.researchRun.update({
      where: { id: run.id },
      data: {
        status: "error",
        errorMessage: msg,
        finishedAt,
        durationMs: finishedAt.getTime() - startedAt.getTime(),
      },
    });

    return {
      status: "error",
      runId,
      at: finishedAt.toISOString(),
      errorMessage: msg,
    };
  }
}
