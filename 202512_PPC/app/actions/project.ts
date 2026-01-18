"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

// プロジェクト一覧取得
export async function getProjects() {
  return prisma.researchProject.findMany({
    include: { riskScore: true },
    orderBy: { createdAt: "desc" },
  });
}

// プロジェクト詳細取得（items を include）
export async function getProject(id: string) {
  return prisma.researchProject.findUnique({
    where: { id },
    include: {
      riskScore: true,
      competitorSites: true,
      items: { orderBy: { order: "asc" } }, // ★ items に統一
    },
  });
}

// プロジェクト作成（初期itemsを自動作成）
export async function createProject(data: { country: string; genre: string }) {
  const created = await prisma.researchProject.create({
    data: {
      country: data.country,
      genre: data.genre,
      status: "pending",
      items: {
        create: defaultResearchItems().map((label, idx) => ({
          label,
          value: "",
          type: "text",
          order: idx,
        })),
      },
    },
  });

  revalidatePath("/projects");
  return created;
}

// 採否承認
export async function approveProject(id: string) {
  const updated = await prisma.researchProject.update({
    where: { id },
    data: { status: "completed" },
  });

  revalidatePath(`/projects/${id}`);
  revalidatePath("/projects");
  return updated;
}

// 却下
export async function rejectProject(id: string) {
  const updated = await prisma.researchProject.update({
    where: { id },
    data: { status: "rejected" },
  });

  revalidatePath(`/projects/${id}`);
  revalidatePath("/projects");
  return updated;
}

function defaultResearchItems(): string[] {
  return [
    "ターゲット（誰向け？）",
    "悩み（ビフォー）",
    "理想（アフター）",
    "USP（独自性）",
    "価格帯",
    "オファー構成（特典/保証）",
    "CTA（行動導線）",
    "広告訴求案（3つ）",
  ];
}
