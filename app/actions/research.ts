'use server'

import { prisma } from '@/lib/prisma'

// 仕様書準拠: Input
type RunResearchInput = {
  projectId: string
}

// 仕様書準拠: Output
type RunResearchOutput = {
  status: 'completed'
  scores: {
    id: string
    trademarkRisk: number
    adPolicyRisk: number
    bridgePageRisk: number
    totalScore: number
    projectId: string
  }
}

export async function runResearchProjectAction(
  input: RunResearchInput
): Promise<RunResearchOutput> {
  const { projectId } = input

  // 1. データ収集（仮）
  // 2. スコア算出（仮の固定値）
  const trademarkRisk = 0.0
  const adPolicyRisk = 0.0
  const bridgePageRisk = 0.0
  const totalScore = 0.0

  // 3. DB保存
  const riskScore = await prisma.riskScore.upsert({
    where: { projectId },
    update: {
      trademarkRisk,
      adPolicyRisk,
      bridgePageRisk,
      totalScore,
    },
    create: {
      projectId,
      trademarkRisk,
      adPolicyRisk,
      bridgePageRisk,
      totalScore,
    },
  })

  await prisma.researchProject.update({
    where: { id: projectId },
    data: { status: 'completed' },
  })

  return {
    status: 'completed',
    scores: riskScore,
  }
}
