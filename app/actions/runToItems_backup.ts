"use server";

import { prisma } from "@/lib/prisma";
import { normalizeEmptyLike } from "@/lib/emptyLike";

export type PreviewRow = {
  templateId: string;
  key: string;
  label: string;
  type: string;
  order: number;
  currentValue: string;
  proposedValue: string;
};

export async function runResearchAndPreview({
  projectId,
  scope,
}: {
  projectId: string;
  scope: string;
}) {
  const templates = await prisma.researchItemTemplate.findMany({
    where: { scope, isActive: true },
    orderBy: { order: "asc" },
  });

  const items = await prisma.researchProjectItem.findMany({
    where: { projectId },
  });

  const mapItems = new Map(items.map((i) => [i.templateId, i.value]));

  // 仮のdemo結果
  const demoResult = Object.fromEntries(
    templates.map((t) => [t.key, `demo_value_${t.order}`])
  );

  const preview: PreviewRow[] = templates.map((t) => ({
    templateId: t.id,
    key: t.key ?? "",
    label: t.label,
    type: t.type,
    order: t.order,
    currentValue: mapItems.get(t.id) ?? "",
    proposedValue: demoResult[t.key ?? ""] ?? "",
  }));

  return {
    raw: {
      runId: "demo-run-id",
      at: new Date().toISOString(),
      status: "ok",
    },
    preview,
  };
}

export async function applyPreviewToProjectItems({
  projectId,
  scope,
  selections,
  overwrite,
}: {
  projectId: string;
  scope: string;
  selections: { templateId: string; value: string }[];
  overwrite: boolean;
}) {
  let applied = 0;
  let skipped = 0;

  for (const sel of selections) {
    const existing = await prisma.researchProjectItem.findUnique({
      where: { projectId_templateId: { projectId, templateId: sel.templateId } },
    });

    const normalized = normalizeEmptyLike(existing?.value);
    const same = normalized === normalizeEmptyLike(sel.value);

    if (!overwrite && existing && normalized !== "") {
      skipped++;
      continue;
    }

    if (same) {
      skipped++;
      continue;
    }

    await prisma.researchProjectItem.upsert({
      where: { projectId_templateId: { projectId, templateId: sel.templateId } },
      update: { value: sel.value },
      create: {
        projectId,
        templateId: sel.templateId,
        value: sel.value,
      },
    });

    applied++;
  }

  return { applied, skipped };
}
