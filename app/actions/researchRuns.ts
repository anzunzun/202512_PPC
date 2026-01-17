"use server";

import { prisma } from "@/lib/prisma";

export async function getResearchRuns(params: {
  projectId: string;
  take?: number;
}) {
  const { projectId, take = 20 } = params;

  return prisma.researchRun.findMany({
    where: { projectId },
    orderBy: { startedAt: "desc" },
    take,
  });
}

export async function getResearchRun(params: {
  projectId: string;
  runId: string;
}) {
  const { projectId, runId } = params;

  return prisma.researchRun.findFirst({
    where: { id: runId, projectId },
  });
}
