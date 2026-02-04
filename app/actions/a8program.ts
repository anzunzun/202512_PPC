"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

// 収益性スコア計算
// EPC(40%) + 承認率(30%) + 報酬単価正規化(30%)
function calculateProfitScore(
  epc: number | null,
  approvalRate: number | null,
  reward: number
): number {
  // EPC スコア: 100円を100点として正規化（上限200円）
  const epcScore = epc ? Math.min((epc / 100) * 100, 100) : 0;

  // 承認率スコア: そのまま使用（0-100）
  const approvalScore = approvalRate ?? 50; // 未入力は50%と仮定

  // 報酬スコア: 5000円を100点として正規化（上限10000円）
  const rewardScore = Math.min((reward / 5000) * 100, 100);

  // 加重平均
  return Math.round(epcScore * 0.4 + approvalScore * 0.3 + rewardScore * 0.3);
}

export async function getA8Programs() {
  return prisma.a8Program.findMany({
    where: { isActive: true },
    orderBy: { profitScore: "desc" },
  });
}

export async function createA8Program(formData: FormData) {
  const programName = formData.get("programName") as string;
  const category = formData.get("category") as string;
  const reward = parseInt(formData.get("reward") as string, 10);
  const rewardType = (formData.get("rewardType") as string) || "fixed";
  const approvalRateStr = formData.get("approvalRate") as string;
  const epcStr = formData.get("epc") as string;
  const cookieDaysStr = formData.get("cookieDays") as string;
  const programId = formData.get("programId") as string;
  const advertiserName = formData.get("advertiserName") as string;
  const notes = formData.get("notes") as string;
  const lpUrl = formData.get("lpUrl") as string;

  const approvalRate = approvalRateStr ? parseFloat(approvalRateStr) : null;
  const epc = epcStr ? parseFloat(epcStr) : null;
  const cookieDays = cookieDaysStr ? parseInt(cookieDaysStr, 10) : null;

  const profitScore = calculateProfitScore(epc, approvalRate, reward);

  await prisma.a8Program.create({
    data: {
      programId: programId || null,
      programName,
      advertiserName: advertiserName || null,
      category,
      reward,
      rewardType,
      approvalRate,
      epc,
      cookieDays,
      notes: notes || null,
      lpUrl: lpUrl || null,
      profitScore,
    },
  });

  revalidatePath("/a8-finder");
}

export async function updateA8Program(id: string, formData: FormData) {
  const programName = formData.get("programName") as string;
  const category = formData.get("category") as string;
  const reward = parseInt(formData.get("reward") as string, 10);
  const rewardType = (formData.get("rewardType") as string) || "fixed";
  const approvalRateStr = formData.get("approvalRate") as string;
  const epcStr = formData.get("epc") as string;
  const cookieDaysStr = formData.get("cookieDays") as string;
  const programId = formData.get("programId") as string;
  const advertiserName = formData.get("advertiserName") as string;
  const notes = formData.get("notes") as string;
  const lpUrl = formData.get("lpUrl") as string;

  const approvalRate = approvalRateStr ? parseFloat(approvalRateStr) : null;
  const epc = epcStr ? parseFloat(epcStr) : null;
  const cookieDays = cookieDaysStr ? parseInt(cookieDaysStr, 10) : null;

  const profitScore = calculateProfitScore(epc, approvalRate, reward);

  await prisma.a8Program.update({
    where: { id },
    data: {
      programId: programId || null,
      programName,
      advertiserName: advertiserName || null,
      category,
      reward,
      rewardType,
      approvalRate,
      epc,
      cookieDays,
      notes: notes || null,
      lpUrl: lpUrl || null,
      profitScore,
    },
  });

  revalidatePath("/a8-finder");
}

export async function deleteA8Program(id: string) {
  await prisma.a8Program.update({
    where: { id },
    data: { isActive: false },
  });

  revalidatePath("/a8-finder");
}

export async function recalculateAllScores() {
  const programs = await prisma.a8Program.findMany({
    where: { isActive: true },
  });

  for (const program of programs) {
    const profitScore = calculateProfitScore(
      program.epc,
      program.approvalRate,
      program.reward
    );
    await prisma.a8Program.update({
      where: { id: program.id },
      data: { profitScore },
    });
  }

  revalidatePath("/a8-finder");
}
