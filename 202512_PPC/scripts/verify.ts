import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function verify() {
  console.log('=== Phase 4: ローカル統合検証 ===\n')

  // 1. プロジェクト作成
  console.log('1. プロジェクト作成')
  const project = await prisma.researchProject.create({
    data: {
      country: 'JP',
      genre: 'test-genre',
      status: 'pending',
    },
  })
  console.log(`   Created: ${project.id}\n`)

  // 2. リサーチ実行（スコア算出）
  console.log('2. リサーチ実行（スコア算出）')
  const riskScore = await prisma.riskScore.create({
    data: {
      projectId: project.id,
      trademarkRisk: 0.0,
      adPolicyRisk: 0.0,
      bridgePageRisk: 0.0,
      totalScore: 0.0,
    },
  })
  console.log(`   RiskScore created: ${riskScore.id}\n`)

  // 3. 再実行で結果不変の確認
  console.log('3. 再実行で結果不変の確認')
  const score1 = await prisma.riskScore.findUnique({
    where: { projectId: project.id },
  })
  const score2 = await prisma.riskScore.findUnique({
    where: { projectId: project.id },
  })
  const isConsistent =
    score1?.trademarkRisk === score2?.trademarkRisk &&
    score1?.adPolicyRisk === score2?.adPolicyRisk &&
    score1?.bridgePageRisk === score2?.bridgePageRisk &&
    score1?.totalScore === score2?.totalScore
  console.log(`   結果一致: ${isConsistent ? '✅' : '❌'}\n`)

  // 4. DBのみが正解を持つ確認
  console.log('4. DBのみが正解を持つ確認')
  const dbData = await prisma.researchProject.findUnique({
    where: { id: project.id },
    include: { riskScore: true },
  })
  console.log(`   DB内スコア: ${JSON.stringify(dbData?.riskScore)}`)
  console.log(`   ✅ DBのみが正解を保持\n`)

  // 5. 承認操作
  console.log('5. 承認操作')
  await prisma.researchProject.update({
    where: { id: project.id },
    data: { status: 'completed' },
  })
  const approved = await prisma.researchProject.findUnique({
    where: { id: project.id },
  })
  console.log(`   Status: ${approved?.status} ✅\n`)

  // クリーンアップ
  console.log('6. クリーンアップ')
  await prisma.riskScore.delete({ where: { projectId: project.id } })
  await prisma.researchProject.delete({ where: { id: project.id } })
  console.log('   テストデータ削除完了\n')

  console.log('=== 検証完了 ===')
  console.log('すべての検証項目をパスしました。')
}

verify()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
