"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";

function settingKey(scope: string) {
  return `project_list_summary_template_ids:${scope}`;
}

function safeJsonParseArray(s: string): string[] {
  try {
    const v = JSON.parse(s);
    if (Array.isArray(v)) return v.map((x) => String(x)).filter(Boolean);
    return [];
  } catch {
    return [];
  }
}

export async function getProjectListSummaryTemplateIds(scope: string): Promise<string[]> {
  const row = await prisma.appSetting.findUnique({
    where: { key: settingKey(scope) },
  });

  if (!row?.value) return [];
  return safeJsonParseArray(row.value);
}

export async function saveProjectListSummaryTemplateIds(params: {
  scope: string;
  templateIds: string[];
}): Promise<{ ok: true }> {
  const { scope, templateIds } = params;

  const cleaned = Array.from(
    new Set(
      (templateIds ?? [])
        .map((s) => String(s).trim())
        .filter(Boolean)
    )
  );

  await prisma.appSetting.upsert({
    where: { key: settingKey(scope) },
    update: { value: JSON.stringify(cleaned) },
    create: { key: settingKey(scope), value: JSON.stringify(cleaned) },
  });

  // /projects を即時反映
  revalidatePath("/projects");

  return { ok: true };
}
