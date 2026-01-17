"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const ScopeSchema = z.string().min(1).default("PPC");
const ItemTypeSchema = z.enum(["text", "url", "number", "money", "note"]);

export type ProjectItemView = {
  templateId: string;
  label: string;
  type: z.infer<typeof ItemTypeSchema>;
  order: number;
  value: string;
};

export type TemplateRow = {
  id?: string;
  label: string;
  type: z.infer<typeof ItemTypeSchema>;
  order: number;
  isActive: boolean;
};

const SaveProjectItemSchema = z.object({
  templateId: z.string().min(1),
  value: z.string().optional().default(""),
});

const SaveTemplateRowSchema = z.object({
  id: z.string().min(1).optional(),
  label: z.string().trim().min(1, "label is required"),
  type: ItemTypeSchema.default("text"),
  order: z.number().int().nonnegative(),
  isActive: z.boolean().default(true),
});

function unique<T>(arr: T[]) {
  return Array.from(new Set(arr));
}

/**
 * UI側（プロジェクト入力）用：有効テンプレのみ取得
 */
export async function getResearchItemTemplates(scope: string = "PPC") {
  const sc = ScopeSchema.parse(scope);
  return prisma.researchItemTemplate.findMany({
    where: { scope: sc, isActive: true },
    orderBy: { order: "asc" },
  });
}

/**
 * Admin用：有効/無効ふくめて全部取得（運用は isActive で）
 */
export async function getResearchItemTemplatesAdmin(scope: string = "PPC") {
  const sc = ScopeSchema.parse(scope);
  return prisma.researchItemTemplate.findMany({
    where: { scope: sc },
    orderBy: { order: "asc" },
  });
}

/**
 * Admin用：テンプレ保存（並び順/追加/無効化）
 * - 物理削除はしない（isActive=false運用）
 * - order は payload の順で 0.. に正規化
 * - label 重複はサーバー側でも弾く
 */
export async function saveResearchItemTemplatesAdmin(
  scope: string,
  rows: unknown
) {
  const sc = ScopeSchema.parse(scope);
  const parsed = z.array(SaveTemplateRowSchema).parse(rows);

  const normalized = parsed
    .slice()
    .sort((a, b) => a.order - b.order)
    .map((r, idx) => ({
      ...r,
      order: idx,
      label: (r.label ?? "").trim(),
    }))
    .filter((r) => r.label.length > 0);

  // payload内 label 重複
  {
    const labels = normalized.map((r) => r.label);
    const dup = labels.filter((x, i) => labels.indexOf(x) !== i);
    if (dup.length) {
      throw new Error(`label が重複しています: ${unique(dup).join(", ")}`);
    }
  }

  // DB既存との衝突チェック（scope + label unique）
  const payloadIds = new Set(normalized.flatMap((r) => (r.id ? [r.id] : [])));
  const payloadLabels = unique(normalized.map((r) => r.label));

  const existingSameLabel = await prisma.researchItemTemplate.findMany({
    where: { scope: sc, label: { in: payloadLabels } },
    select: { id: true, label: true },
  });

  const conflict = existingSameLabel.filter((e) => !payloadIds.has(e.id));
  if (conflict.length) {
    throw new Error(
      `既に存在するテンプレ名があります（復活/編集で対応してね）: ${conflict
        .map((x) => x.label)
        .join(", ")}`
    );
  }

  await prisma.$transaction(async (tx) => {
    for (const r of normalized) {
      if (r.id) {
        await tx.researchItemTemplate.update({
          where: { id: r.id },
          data: {
            scope: sc,
            label: r.label,
            type: r.type,
            order: r.order,
            isActive: r.isActive,
          },
        });
      } else {
        await tx.researchItemTemplate.create({
          data: {
            scope: sc,
            label: r.label,
            type: r.type,
            order: r.order,
            isActive: r.isActive,
          },
        });
      }
    }
  });

  revalidatePath("/templates");
  revalidatePath("/projects");

  return { ok: true };
}

/**
 * テンプレ(isActive) と プロジェクトの入力値 を合体して返す
 */
export async function getProjectResearchItems(
  projectId: string,
  scope: string = "PPC"
): Promise<ProjectItemView[]> {
  const sc = ScopeSchema.parse(scope);

  const [templates, projectItems] = await prisma.$transaction([
    prisma.researchItemTemplate.findMany({
      where: { scope: sc, isActive: true },
      orderBy: { order: "asc" },
    }),
    prisma.researchProjectItem.findMany({
      where: { projectId },
    }),
  ]);

  const byTemplateId = new Map(projectItems.map((x) => [x.templateId, x.value]));

  return templates.map((t) => ({
    templateId: t.id,
    label: t.label,
    type: t.type as ProjectItemView["type"],
    order: t.order,
    value: byTemplateId.get(t.id) ?? "",
  }));
}

/**
 * UIから [{templateId, value}, ...] を受け取り upsert
 * - 空文字は「削除」(DBに残さない)
 */
export async function saveProjectResearchItems(
  projectId: string,
  items: unknown,
  scope: string = "PPC"
) {
  const sc = ScopeSchema.parse(scope);
  const parsed = z.array(SaveProjectItemSchema).parse(items);

  // templateId の存在チェック（scope + isActive）
  const templateIds = unique(parsed.map((x) => x.templateId));
  const existing = await prisma.researchItemTemplate.findMany({
    where: { id: { in: templateIds }, scope: sc, isActive: true },
    select: { id: true },
  });
  const okSet = new Set(existing.map((x) => x.id));
  const invalid = templateIds.filter((id) => !okSet.has(id));
  if (invalid.length) {
    throw new Error(`Invalid templateId(s): ${invalid.join(", ")}`);
  }

  await prisma.$transaction(async (tx) => {
    for (const item of parsed) {
      const v = (item.value ?? "").trim();

      if (!v) {
        await tx.researchProjectItem.deleteMany({
          where: { projectId, templateId: item.templateId },
        });
        continue;
      }

      await tx.researchProjectItem.upsert({
        where: {
          projectId_templateId: {
            projectId,
            templateId: item.templateId,
          },
        },
        update: { value: v },
        create: { projectId, templateId: item.templateId, value: v },
      });
    }
  });

  revalidatePath(`/projects/${projectId}`);
  revalidatePath("/projects");

  return { ok: true };
}
