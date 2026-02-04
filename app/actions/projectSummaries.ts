"use server";

import { prisma } from "@/lib/prisma";
import type {
  SummaryTemplateMeta,
  ProjectResearchSummaryRow,
} from "./summaryTypes";

function toStr(x: unknown): string {
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

  // projects
  const projects = await prisma.researchProject.findMany({
    orderBy: [{ updatedAt: "desc" }],
  });

  if (projects.length === 0) {
    return { templates: [], rows: [] };
  }

  const templateIds = unique((rawTemplateIds ?? []).map(toStr).filter(Boolean));
  const labels = unique((rawLabels ?? []).map(toStr).filter(Boolean));

  // ---- templates 解決 ----
  // 優先: templateIds（ID固定）
  // フォールバック: labels（初回導入用）
  type TemplateRecord = { id: string; label: string; order: number };
  let templates: TemplateRecord[] = [];

  if (templateIds.length > 0) {
    const found = await prisma.researchItemTemplate.findMany({
      where: {
        scope,
        id: { in: templateIds },
        ...(onlyActiveTemplates ? { isActive: true } : {}),
      },
    });

    // templateIds の順序で並べ替える（UIの列順固定）
    const orderMap = new Map(templateIds.map((id, idx) => [id, idx]));
    found.sort((a, b) => {
      const ai = orderMap.get(a.id) ?? 9999;
      const bi = orderMap.get(b.id) ?? 9999;
      return ai - bi;
    });

    // 欠損IDがあっても「列が消えない」ようにプレースホルダーを入れる
    const foundSet = new Set(found.map((t) => t.id));
    const placeholders: TemplateRecord[] = templateIds
      .filter((id) => !foundSet.has(id))
      .map((id) => ({
        id,
        label: "(missing template)",
        order: 9999,
      }));

    templates = [...found, ...placeholders];
  } else if (labels.length > 0) {
    const found = await prisma.researchItemTemplate.findMany({
      where: {
        scope,
        label: { in: labels },
        ...(onlyActiveTemplates ? { isActive: true } : {}),
      },
      orderBy: [{ order: "asc" }],
    });

    // labels の順序に揃える（初回でも列順ブレないように）
    const orderMap = new Map(labels.map((lb, idx) => [lb, idx]));
    found.sort((a, b) => {
      const ai = orderMap.get(a.label) ?? 9999;
      const bi = orderMap.get(b.label) ?? 9999;
      return ai - bi;
    });
    templates = found;
  } else {
    // サマリ指定なし
    const rows = projects.map((p) => ({
      projectId: p.id,
      projectName: p.genre || p.id,
      updatedAt: p.updatedAt,
      summary: [],
    }));
    return { templates: [], rows };
  }

  const templateMeta: SummaryTemplateMeta[] = templates.map((t) => ({
    templateId: t.id,
    label: t.label ?? "(no label)",
    order: t.order ?? 0,
  }));

  if (templateMeta.length === 0) {
    const rows = projects.map((p) => ({
      projectId: p.id,
      projectName: p.genre || p.id,
      updatedAt: p.updatedAt,
      summary: (labels.length ? labels : templateIds).map((x) => ({
        templateId: templateIds.length ? x : "",
        label: templateIds.length ? "(missing template)" : x,
        value: "",
      })),
    }));
    return { templates: templateMeta, rows };
  }

  // ---- items 一括取得 ----
  const projectIds = projects.map((p) => p.id);
  const usedTemplateIds = templateMeta.map((t) => t.templateId);

  const items = await prisma.researchProjectItem.findMany({
    where: {
      projectId: { in: projectIds },
      templateId: { in: usedTemplateIds },
    },
  });

  const map = new Map<string, Map<string, string>>();
  for (const it of items) {
    const pid = it.projectId;
    const tid = it.templateId;
    if (!map.has(pid)) map.set(pid, new Map());
    map.get(pid)!.set(tid, it.value ?? "");
  }

  const rows: ProjectResearchSummaryRow[] = projects.map((p) => {
    const pid = p.id;
    const tmap = map.get(pid) ?? new Map<string, string>();

    return {
      projectId: pid,
      projectName: p.genre || pid,
      updatedAt: p.updatedAt,
      summary: templateMeta.map((t) => ({
        templateId: t.templateId,
        label: t.label,
        value: tmap.get(t.templateId) ?? "",
      })),
    };
  });

  return { templates: templateMeta, rows };
}
