'use server'

import { prisma } from '@/lib/prisma'

// プロジェクト一覧取得
export async function getProjects() {
  return prisma.researchProject.findMany({
    include: {
      riskScore: true,
    },
    orderBy: {
      createdAt: 'desc',
    },
  })
}

// プロジェクト詳細取得
export async function getProject(id: string) {
  return prisma.researchProject.findUnique({
    where: { id },
    include: {
      riskScore: true,
      competitorSites: true,
    },
  })
}

// プロジェクト作成
export async function createProject(data: { country: string; genre: string }) {
  return prisma.researchProject.create({
    data: {
      country: data.country,
      genre: data.genre,
      status: 'pending',
    },
  })
}

// 採否承認
export async function approveProject(id: string) {
  return prisma.researchProject.update({
    where: { id },
    data: { status: 'completed' },
  })
}

// 却下
export async function rejectProject(id: string) {
  return prisma.researchProject.update({
    where: { id },
    data: { status: 'rejected' },
  })
}
