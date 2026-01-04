import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { getProject, approveProject, rejectProject } from '@/app/actions/project'
import { runResearchProjectAction } from '@/app/actions/research'

type Props = {
  params: Promise<{ id: string }>
}

export default async function ProjectDetailPage({ params }: Props) {
  const { id } = await params
  const project = await getProject(id)

  if (!project) {
    notFound()
  }

  async function handleRunResearch() {
    'use server'
    await runResearchProjectAction({ projectId: id })
    redirect(`/projects/${id}`)
  }

  async function handleApprove() {
    'use server'
    await approveProject(id)
    redirect(`/projects/${id}`)
  }

  async function handleReject() {
    'use server'
    await rejectProject(id)
    redirect(`/projects/${id}`)
  }

  return (
    <main style={{ padding: '20px' }}>
      <h1>プロジェクト詳細</h1>
      <Link href="/">一覧へ戻る</Link>

      <h2 style={{ marginTop: '20px' }}>基本情報</h2>
      <table style={{ borderCollapse: 'collapse' }}>
        <tbody>
          <tr>
            <th style={{ border: '1px solid #ccc', padding: '8px', textAlign: 'left' }}>ID</th>
            <td style={{ border: '1px solid #ccc', padding: '8px' }}>{project.id}</td>
          </tr>
          <tr>
            <th style={{ border: '1px solid #ccc', padding: '8px', textAlign: 'left' }}>国</th>
            <td style={{ border: '1px solid #ccc', padding: '8px' }}>{project.country}</td>
          </tr>
          <tr>
            <th style={{ border: '1px solid #ccc', padding: '8px', textAlign: 'left' }}>ジャンル</th>
            <td style={{ border: '1px solid #ccc', padding: '8px' }}>{project.genre}</td>
          </tr>
          <tr>
            <th style={{ border: '1px solid #ccc', padding: '8px', textAlign: 'left' }}>ステータス</th>
            <td style={{ border: '1px solid #ccc', padding: '8px' }}>{project.status}</td>
          </tr>
        </tbody>
      </table>

      <h2 style={{ marginTop: '20px' }}>スコア</h2>
      {project.riskScore ? (
        <table style={{ borderCollapse: 'collapse' }}>
          <tbody>
            <tr>
              <th style={{ border: '1px solid #ccc', padding: '8px', textAlign: 'left' }}>商標リスク</th>
              <td style={{ border: '1px solid #ccc', padding: '8px' }}>{project.riskScore.trademarkRisk}</td>
            </tr>
            <tr>
              <th style={{ border: '1px solid #ccc', padding: '8px', textAlign: 'left' }}>広告ポリシーリスク</th>
              <td style={{ border: '1px solid #ccc', padding: '8px' }}>{project.riskScore.adPolicyRisk}</td>
            </tr>
            <tr>
              <th style={{ border: '1px solid #ccc', padding: '8px', textAlign: 'left' }}>ブリッジページリスク</th>
              <td style={{ border: '1px solid #ccc', padding: '8px' }}>{project.riskScore.bridgePageRisk}</td>
            </tr>
            <tr>
              <th style={{ border: '1px solid #ccc', padding: '8px', textAlign: 'left' }}>総合スコア</th>
              <td style={{ border: '1px solid #ccc', padding: '8px' }}>{project.riskScore.totalScore}</td>
            </tr>
          </tbody>
        </table>
      ) : (
        <p>スコア未算出</p>
      )}

      <h2 style={{ marginTop: '20px' }}>操作</h2>
      <div style={{ display: 'flex', gap: '10px' }}>
        {project.status === 'pending' && !project.riskScore && (
          <form action={handleRunResearch}>
            <button type="submit">リサーチ実行</button>
          </form>
        )}
        {project.status === 'pending' && project.riskScore && (
          <>
            <form action={handleApprove}>
              <button type="submit">承認</button>
            </form>
            <form action={handleReject}>
              <button type="submit">却下</button>
            </form>
          </>
        )}
      </div>
    </main>
  )
}
