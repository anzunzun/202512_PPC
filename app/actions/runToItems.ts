"use server";

import { prisma } from "@/lib/prisma";
import { normalizeEmptyLike } from "@/lib/emptyLike";
import { revalidatePath } from "next/cache";

export type PreviewRow = {
  templateId: string;
  label: string;
  type: string;
  order: number;
  key: string | null;

  currentValue: string;
  proposedValue: string;
};

type RawRunView = {
  runId?: string;
  status?: string;
  at?: string;
  errorMessage?: string | null;
  resultJson?: any;
};

export async function runResearchAndPreview(input: {
  projectId: string;
  scope: string;
  doRun: boolean;
}): Promise<{ raw: RawRunView; preview: PreviewRow[] }> {
  const projectId = String(input.projectId ?? "").trim();
  const scope = String(input.scope ?? "").trim();
  const doRun = Boolean(input.doRun);

  if (!projectId) throw new Error("projectId is required");
  if (!scope) throw new Error("scope is required");

  // Run を発火する場合のみ research.ts を呼ぶ
  if (doRun) {
    const { runResearchProjectAction } = await import("./research");
    await runResearchProjectAction({ projectId, scope });
  }

  // 最新Run取得（createdAt が無いので startedAt + id）
  const runRecord = await prisma.researchRun.findFirst({
    where: { projectId, scope },
    orderBy: [{ startedAt: "desc" }, { id: "desc" }],
  });

  const atDate =
    (runRecord as any)?.finishedAt ?? (runRecord as any)?.startedAt ?? null;

  const raw: RawRunView = runRecord
    ? {
        runId: String((runRecord as any).id),
        status: String((runRecord as any).status ?? ""),
        at: atDate?.toISOString?.() ?? (atDate ? String(atDate) : ""),
        errorMessage: (runRecord as any).errorMessage ?? null,
        resultJson: (runRecord as any).resultJson,
      }
    : { status: "error", errorMessage: "Runがありません" };

  const resultJson = ((runRecord as any)?.resultJson ?? null) as any;

  // resultJsonの取り出し（research.ts 側の保存形式に合わせる）
  const itemsByKey: Record<string, any> = resultJson?.itemsByKey ?? {};
  const resultObj: Record<string, any> = resultJson?.result ?? {};
  const scoresObj: Record<string, any> = resultJson?.scores ?? {};

  // テンプレ
  const templates = await prisma.researchItemTemplate.findMany({
    where: { scope },
    orderBy: [{ order: "asc" }, { label: "asc" }],
  });

  // ✅ 新方式：現在値（ResearchProjectItem）を templateId で突き合わせ
  const projectItemsNew = await prisma.researchProjectItem.findMany({
    where: { projectId },
    select: { templateId: true, value: true },
  });

  const curByTemplateId = new Map<string, string>();
  for (const it of projectItemsNew as any[]) {
    const tid = String(it.templateId ?? "").trim();
    if (!tid) continue;
    curByTemplateId.set(tid, String(it.value ?? ""));
  }

  const pickProposed = (keyVal: string): string => {
    const k = String(keyVal ?? "").trim();
    if (!k) return "";

    const v1 = itemsByKey[k];
    if (v1 !== null && v1 !== undefined && String(v1).trim() !== "")
      return String(v1);

    const v2 = resultObj[k];
    if (v2 !== null && v2 !== undefined && String(v2).trim() !== "")
      return String(v2);

    const v3 = scoresObj[k];
    if (v3 !== null && v3 !== undefined && String(v3).trim() !== "")
      return String(v3);

    return "";
  };

  const preview: PreviewRow[] = (templates as any[]).map((t) => {
    const templateId = String(t.id);
    const label = String(t.label ?? "");
    const type = String(t.type ?? "text");
    const order = Number(t.order ?? 0);
    const key = t.key ?? null;

    // ✅ 新方式のみ（旧ResearchItemは読まない）
    const currentValue = String(curByTemplateId.get(templateId) ?? "");

    const proposedValue = pickProposed(String(key ?? ""));

    return {
      templateId,
      label,
      type,
      order,
      key,
      currentValue,
      proposedValue,
    };
  });

  return { raw, preview };
}

export async function applyPreviewToProjectItems(input: {
  projectId: string;
  scope: string;
  overwrite: boolean;

  selections?: string[];
  selectedTemplateIds?: string[];

  preview: Array<{
    templateId: string;
    label: string;
    type: string;
    order: number;
    proposedValue: string;
    currentValue: string;
    key?: string | null;
    selected?: boolean;
  }>;
}): Promise<{ applied: number; skipped: number }> {
  const projectId = String(input.projectId ?? "").trim();
  const scope = String(input.scope ?? "").trim();
  const overwrite = Boolean(input.overwrite);

  if (!projectId) throw new Error("projectId is required");
  if (!scope) throw new Error("scope is required");

  const selectedIds = (input.selections ?? input.selectedTemplateIds ?? []).map(
    (s) => String(s)
  );
  const selectedSet = new Set(selectedIds);
  const hasSelectedIds = selectedIds.length > 0;

  const anySelectedByFlag = (input.preview ?? []).some((r) =>
    Boolean(r.selected)
  );

  // 0/0で黙らない（必ずエラーにする）
  if (!hasSelectedIds && !anySelectedByFlag) {
    throw new Error(
      "No selections: selectedTemplateIds/selections and preview.selected are both empty."
    );
  }

  let applied = 0;
  let skipped = 0;

  for (const row of input.preview ?? []) {
    const templateId = String(row.templateId ?? "").trim();
    if (!templateId) continue;

    const isSelected = hasSelectedIds
      ? selectedSet.has(templateId)
      : Boolean(row.selected);
    if (!isSelected) continue;

    const curN = normalizeEmptyLike(row.currentValue);
    const propN = normalizeEmptyLike(row.proposedValue);

    // 提案空はスキップ
    if (propN === "") {
      skipped++;
      continue;
    }
    // 安全モード：既存値ありはスキップ
    if (!overwrite && curN !== "") {
      skipped++;
      continue;
    }
    // 同値スキップ
    if (curN !== "" && curN === propN) {
      skipped++;
      continue;
    }

    // ✅ 新方式：ResearchProjectItem に projectId+templateId で upsert（これだけ）
    await prisma.researchProjectItem.upsert({
      where: {
        projectId_templateId: { projectId, templateId },
      },
      create: {
        projectId,
        templateId,
        value: propN,
      },
      update: {
        value: propN,
      },
    });

    applied++;
  }

  revalidatePath(`/projects/${projectId}`);
  revalidatePath(`/projects/${projectId}/apply`);
  revalidatePath("/projects");

  return { applied, skipped };
}
