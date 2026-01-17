'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

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
  const created = await prisma.researchProject.create({
    data: {
      country: data.country,
      genre: data.genre,
      status: 'pending',
    },
  })

  revalidatePath('/projects')
  return created
}

// 採否承認
export async function approveProject(id: string) {
  const updated = await prisma.researchProject.update({
    where: { id },
    data: { status: 'completed' },
  })

  revalidatePath('/projects')
  revalidatePath(`/projects/${id}`)
  return updated
}

// 却下
export async function rejectProject(id: string) {
  const updated = await prisma.researchProject.update({
    where: { id },
    data: { status: 'rejected' },
  })

  revalidatePath('/projects')
  revalidatePath(`/projects/${id}`)
  return updated
}
