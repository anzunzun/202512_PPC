"use server";

import { revalidatePath } from "next/cache";
import * as prismaModule from "@/lib/prisma";

function getPrismaClient(): any {
  const mod: any = prismaModule as any;
  return mod.default ?? mod.prisma ?? mod.db ?? mod.client;
}

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
  const db = getPrismaClient();
  if (!db?.appSetting) return []; // model未反映などのときは空扱い

  const row = await db.appSetting.findUnique({
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

  const db = getPrismaClient();
  if (!db?.appSetting) {
    throw new Error(
      "AppSetting が見つかりません。schema.prisma に AppSetting model を追加して `npx prisma db push` を実行してください。"
    );
  }

  await db.appSetting.upsert({
    where: { key: settingKey(scope) },
    update: { value: JSON.stringify(cleaned) },
    create: { key: settingKey(scope), value: JSON.stringify(cleaned) },
  });

  // /projects を即時反映
  revalidatePath("/projects");

  return { ok: true };
}
