import * as prismaModule from "@/lib/prisma";

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

export type ExportItemRow = {
  order: number;
  templateId: string;
  label: string;
  value: string;
  isActive: boolean;
};

export type ProjectExportPayload = {
  project: {
    id: string;
    name: string;
    updatedAt: string | null;
  };
  scope: string;
  exportedAt: string; // ISO
  items: ExportItemRow[];
};

export async function buildProjectExportPayload(params: {
  projectId: string;
  scope: string;
  includeInactiveTemplates?: boolean;
}): Promise<ProjectExportPayload> {
  const { projectId, scope, includeInactiveTemplates = false } = params;

  const db = getPrismaClient();
  if (!db) throw new Error("Prisma client が取得できません。@/lib/prisma を確認してください。");

  const ResearchProject = pickModel(db, ["researchProject", "project"]);
  const ResearchItemTemplate = pickModel(db, ["researchItemTemplate"]);
  const ResearchProjectItem = pickModel(db, ["researchProjectItem"]);

  if (!ResearchProject) {
    throw new Error("Prisma model が見つかりません: researchProject / project");
  }
  if (!ResearchItemTemplate) {
    throw new Error("Prisma model が見つかりません: researchItemTemplate");
  }
  if (!ResearchProjectItem) {
    throw new Error("Prisma model が見つかりません: researchProjectItem");
  }

  const project = await ResearchProject.findUnique({
    where: { id: projectId },
  });

  if (!project) {
    throw new Error(`Project not found: ${projectId}`);
  }

  // 1) templates
  const templates = await ResearchItemTemplate.findMany({
    where: {
      scope,
      ...(includeInactiveTemplates ? {} : { isActive: true }),
    },
    orderBy: [{ order: "asc" }],
  });

  // 2) items（存在するテンプレだけ対象）
  const templateIds = templates.map((t: any) => String(t.id));
  const items = templateIds.length
    ? await ResearchProjectItem.findMany({
        where: {
          projectId,
          templateId: { in: templateIds },
        },
      })
    : [];

  const valueMap = new Map<string, string>();
  for (const it of items) {
    valueMap.set(String(it.templateId), String(it.value ?? ""));
  }

  const rows: ExportItemRow[] = templates.map((t: any) => ({
    order: Number(t.order ?? 0),
    templateId: String(t.id),
    label: String(t.label ?? ""),
    value: valueMap.get(String(t.id)) ?? "",
    isActive: Boolean(t.isActive),
  }));

  return {
    project: {
      id: String(project.id),
      name: String(project.name ?? project.title ?? project.projectName ?? project.id),
      updatedAt: project.updatedAt ? new Date(project.updatedAt).toISOString() : null,
    },
    scope,
    exportedAt: new Date().toISOString(),
    items: rows,
  };
}

function csvEscapeCell(s: string) {
  const v = s ?? "";
  // 改行/カンマ/ダブルクォートを含むならダブルクォートで囲い、内部の " は "" に
  if (/[,"\n\r]/.test(v)) {
    return `"${v.replace(/"/g, '""')}"`;
  }
  return v;
}

export function payloadToCsv(payload: ProjectExportPayload): string {
  const header = ["order", "label", "value", "templateId", "isActive"];
  const lines = [header.join(",")];

  for (const row of payload.items) {
    lines.push(
      [
        String(row.order),
        csvEscapeCell(row.label),
        csvEscapeCell(row.value),
        csvEscapeCell(row.templateId),
        row.isActive ? "true" : "false",
      ].join(",")
    );
  }

  return lines.join("\n");
}
