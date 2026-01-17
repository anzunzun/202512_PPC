"use server";

import * as prismaModule from "@/lib/prisma";
import type {
  SummaryTemplateMeta,
  ProjectResearchSummaryRow,
} from "./summaryTypes";

function getPrismaClient(): any {
  const mod: any = prismaModule as any;
  return mod.default ?? mod.prisma ?? mod.db ?? mod.client;
}

function pickModel(db: any, candidates: string[]) {
  for (const key of candidates) {
    if (db?.[key]) return db[key];
  }
  return null;
}

function toStr(x: any) {
  return x == null ? "" : String(x);
}

function unique(arr: string[]) {
  return Array.from(new Set(arr));
}

/**
 * /projects 一覧用（サマリ表示）
 * - templateIds があれば「ID固定」で取得（labelゆれに強い）
 * - templateIds が空なら labels からテンプレを解決（初回導入用）
 *
 * 返り値に templates（解決済みテンプレID一覧）も返すので、
 * /projects 画面側で「これを const に貼れ」を出せる。
 */
export async function getProjectsWithResearchSummaryPack(params: {
  scope: string;
  templateIds?: string[];
  labels?: string[];
  onlyActiveTemplates?: boolean;
}): Promise<{
  templates: SummaryTemplateMeta[];
  rows: ProjectResearchSummaryRow[];
}> {
  const {
    scope,
    templateIds: rawTemplateIds,
    labels: rawLabels,
    onlyActiveTemplates = true,
  } = params;

  const db = getPrismaClient();
  if (!db) {
    throw new Error(
      "Prisma client が取得できません。@/lib/prisma の export を確認してください（default / prisma / db / client のいずれかが必要）。"
    );
  }

  const ResearchProject = pickModel(db, ["researchProject", "project"]);
  const ResearchItemTemplate = pickModel(db, ["researchItemTemplate"]);
  const ResearchProjectItem = pickModel(db, ["researchProjectItem"]);

  if (!ResearchProject) {
    throw new Error(
      "Prisma model が見つかりません: researchProject / project のどちらも存在しない"
    );
  }
  if (!ResearchItemTemplate) {
    throw new Error("Prisma model が見つかりません: researchItemTemplate");
  }
  if (!ResearchProjectItem) {
    throw new Error("Prisma model が見つかりません: researchProjectItem");
  }

  // projects
  const projects = (await ResearchProject.findMany({
    orderBy: [{ updatedAt: "desc" }],
  })) as any[];

  if (projects.length === 0) {
    return { templates: [], rows: [] };
  }

  const templateIds = unique((rawTemplateIds ?? []).map(toStr).filter(Boolean));
  const labels = unique((rawLabels ?? []).map(toStr).filter(Boolean));

  // ---- templates 解決 ----
  // 優先: templateIds（ID固定）
  // フォールバック: labels（初回導入用）
  let templates: any[] = [];

  if (templateIds.length > 0) {
    templates = await ResearchItemTemplate.findMany({
      where: {
        scope,
        id: { in: templateIds },
        ...(onlyActiveTemplates ? { isActive: true } : {}),
      },
    });

    // templateIds の順序で並べ替える（UIの列順固定）
    const orderMap = new Map(templateIds.map((id, idx) => [id, idx]));
    templates.sort((a: any, b: any) => {
      const ai = orderMap.get(String(a.id)) ?? 9999;
      const bi = orderMap.get(String(b.id)) ?? 9999;
      return ai - bi;
    });

    // 欠損IDがあっても「列が消えない」ようにプレースホルダーを入れる
    const found = new Set(templates.map((t: any) => String(t.id)));
    const placeholders = templateIds
      .filter((id) => !found.has(id))
      .map((id) => ({
        id,
        label: "(missing template)",
        order: 9999,
      }));

    templates = [...templates, ...placeholders];
  } else if (labels.length > 0) {
    templates = await ResearchItemTemplate.findMany({
      where: {
        scope,
        label: { in: labels },
        ...(onlyActiveTemplates ? { isActive: true } : {}),
      },
      orderBy: [{ order: "asc" }],
    });

    // labels の順序に揃える（初回でも列順ブレないように）
    const orderMap = new Map(labels.map((lb, idx) => [lb, idx]));
    templates.sort((a: any, b: any) => {
      const ai = orderMap.get(String(a.label)) ?? 9999;
      const bi = orderMap.get(String(b.label)) ?? 9999;
      return ai - bi;
    });
  } else {
    // サマリ指定なし
    const rows = projects.map((p) => ({
      projectId: String(p.id),
      projectName: String(p.name ?? p.title ?? p.projectName ?? p.id),
      updatedAt: (p.updatedAt as Date) ?? null,
      summary: [],
    }));
    return { templates: [], rows };
  }

  const templateMeta: SummaryTemplateMeta[] = templates.map((t: any) => ({
    templateId: String(t.id),
    label: String(t.label ?? "(no label)"),
    order: Number(t.order ?? 0),
  }));

  if (templateMeta.length === 0) {
    const rows = projects.map((p) => ({
      projectId: String(p.id),
      projectName: String(p.name ?? p.title ?? p.projectName ?? p.id),
      updatedAt: (p.updatedAt as Date) ?? null,
      summary: (labels.length ? labels : templateIds).map((x) => ({
        templateId: templateIds.length ? x : "",
        label: templateIds.length ? "(missing template)" : x,
        value: "",
      })),
    }));
    return { templates: templateMeta, rows };
  }

  // ---- items 一括取得 ----
  const projectIds = projects.map((p) => String(p.id));
  const usedTemplateIds = templateMeta.map((t) => t.templateId);

  const items = await ResearchProjectItem.findMany({
    where: {
      projectId: { in: projectIds },
      templateId: { in: usedTemplateIds },
    },
  });

  const map = new Map<string, Map<string, string>>();
  for (const it of items) {
    const pid = String(it.projectId);
    const tid = String(it.templateId);
    if (!map.has(pid)) map.set(pid, new Map());
    map.get(pid)!.set(tid, it.value ?? "");
  }

  const rows: ProjectResearchSummaryRow[] = projects.map((p) => {
    const pid = String(p.id);
    const tmap = map.get(pid) ?? new Map<string, string>();

    return {
      projectId: pid,
      projectName: String(p.name ?? p.title ?? p.projectName ?? pid),
      updatedAt: (p.updatedAt as Date) ?? null,
      summary: templateMeta.map((t) => ({
        templateId: t.templateId,
        label: t.label,
        value: tmap.get(t.templateId) ?? "",
      })),
    };
  });

  return { templates: templateMeta, rows };
}
