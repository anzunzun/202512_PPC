"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export type AutoRunSettings = {
  enabled: boolean;
  intervalHours: number;
  lastRunAt: string | null;
};

// 自動実行設定を取得
export async function getAutoRunSettings(): Promise<AutoRunSettings> {
  const [enabledSetting, intervalSetting, lastRunSetting] = await Promise.all([
    prisma.appSetting.findUnique({ where: { key: "autoRunEnabled" } }),
    prisma.appSetting.findUnique({ where: { key: "autoRunIntervalHours" } }),
    prisma.appSetting.findUnique({ where: { key: "lastAutoRunAt" } }),
  ]);

  return {
    enabled: enabledSetting?.value === "true",
    intervalHours: parseInt(intervalSetting?.value || "24", 10),
    lastRunAt: lastRunSetting?.value || null,
  };
}

// 自動実行設定を更新
export async function updateAutoRunSettings(settings: {
  enabled: boolean;
  intervalHours: number;
}): Promise<void> {
  await Promise.all([
    prisma.appSetting.upsert({
      where: { key: "autoRunEnabled" },
      update: { value: settings.enabled ? "true" : "false" },
      create: { key: "autoRunEnabled", value: settings.enabled ? "true" : "false" },
    }),
    prisma.appSetting.upsert({
      where: { key: "autoRunIntervalHours" },
      update: { value: String(settings.intervalHours) },
      create: { key: "autoRunIntervalHours", value: String(settings.intervalHours) },
    }),
  ]);

  revalidatePath("/settings/auto-run");
}

// 手動で自動実行をトリガー
export async function triggerManualAutoRun(projectIds?: string[]): Promise<{
  success: boolean;
  message: string;
}> {
  const cronSecret = process.env.CRON_SECRET || "dev-secret";
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";

  try {
    const response = await fetch(`${baseUrl}/api/cron/auto-run`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${cronSecret}`,
      },
      body: JSON.stringify({ projectIds }),
    });

    const result = await response.json();

    if (!response.ok) {
      return { success: false, message: result.error || "Failed to trigger auto-run" };
    }

    revalidatePath("/settings/auto-run");
    return { success: true, message: result.message };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : "Network error",
    };
  }
}

// 最近の自動実行履歴を取得
export async function getRecentAutoRunHistory(limit = 10) {
  const runs = await prisma.researchRun.findMany({
    where: { provider: "demo" },
    orderBy: { startedAt: "desc" },
    take: limit,
    include: {
      project: {
        select: { id: true, genre: true },
      },
    },
  });

  return runs.map(r => ({
    id: r.id,
    projectId: r.projectId,
    projectGenre: r.project.genre,
    status: r.status,
    startedAt: r.startedAt,
    durationMs: r.durationMs,
  }));
}
