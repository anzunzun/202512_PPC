"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const ItemSchema = z.object({
  id: z.string().min(1).optional(),
  label: z.string().trim().min(1, "label is required"),
  value: z.string().optional().default(""),
  type: z.enum(["text", "url", "number", "money", "note"]).default("text"),
  order: z.number().int().nonnegative(),
});

export async function saveResearchItems(projectId: string, items: unknown) {
  console.log("[saveResearchItems] start", {
    projectId,
    itemType: Array.isArray(items) ? "array" : typeof items,
    length: Array.isArray(items) ? items.length : undefined,
    at: new Date().toISOString(),
  });

  const parsed = z.array(ItemSchema).parse(items);

  await prisma.$transaction(async (tx) => {
    const keepIds = parsed.flatMap((i) => (i.id ? [i.id] : []));

    // 画面から消えたものは削除（ただし [OUTPUT] は絶対に消さない）
    await tx.researchItem.deleteMany({
      where: {
        projectId,
        NOT: { label: { startsWith: "[OUTPUT]" } },
        ...(keepIds.length ? { id: { notIn: keepIds } } : {}),
      },
    });

    for (const item of parsed) {
      if (item.id) {
        await tx.researchItem.updateMany({
          where: { id: item.id, projectId },
          data: {
            label: item.label,
            value: item.value ?? "",
            type: item.type,
            order: item.order,
          },
        });
      } else {
        await tx.researchItem.create({
          data: {
            projectId,
            label: item.label,
            value: item.value ?? "",
            type: item.type,
            order: item.order,
          },
        });
      }
    }
  });

  revalidatePath(`/projects/${projectId}`);
  revalidatePath("/projects");

  console.log("[saveResearchItems] done", {
    projectId,
    count: parsed.length,
    at: new Date().toISOString(),
  });

  return { ok: true };
}

// 読み取り用（[OUTPUT]除外）
export async function getResearchItems(projectId: string) {
  return prisma.researchItem.findMany({
    where: { projectId, NOT: { label: { startsWith: "[OUTPUT]" } } },
    orderBy: { order: "asc" },
  });
}
