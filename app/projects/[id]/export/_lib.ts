import { prisma } from "@/lib/prisma";

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

  const project = await prisma.researchProject.findUnique({
    where: { id: projectId },
  });

  if (!project) {
    throw new Error(`Project not found: ${projectId}`);
  }

  // 1) templates
  const templates = await prisma.researchItemTemplate.findMany({
    where: {
      scope,
      ...(includeInactiveTemplates ? {} : { isActive: true }),
    },
    orderBy: [{ order: "asc" }],
  });

  // 2) items（存在するテンプレだけ対象）
  const templateIds = templates.map((t) => t.id);
  const items = templateIds.length
    ? await prisma.researchProjectItem.findMany({
        where: {
          projectId,
          templateId: { in: templateIds },
        },
      })
    : [];

  const valueMap = new Map<string, string>();
  for (const it of items) {
    valueMap.set(it.templateId, it.value ?? "");
  }

  const rows: ExportItemRow[] = templates.map((t) => ({
    order: t.order ?? 0,
    templateId: t.id,
    label: t.label ?? "",
    value: valueMap.get(t.id) ?? "",
    isActive: t.isActive,
  }));

  return {
    project: {
      id: project.id,
      name: project.genre || project.id,
      updatedAt: project.updatedAt ? project.updatedAt.toISOString() : null,
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
