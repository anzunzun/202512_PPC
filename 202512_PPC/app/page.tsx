import Link from 'next/link'
import { getProjects } from './actions/project'

export default async function Home() {
  const projects = await getProjects()

  return (
    <main style={{ padding: '20px' }}>
      <h1>リサーチ一覧</h1>
      <Link href="/projects/new">新規作成</Link>
      <table style={{ marginTop: '20px', borderCollapse: 'collapse', width: '100%' }}>
        <thead>
          <tr>
            <th style={{ border: '1px solid #ccc', padding: '8px' }}>ID</th>
            <th style={{ border: '1px solid #ccc', padding: '8px' }}>国</th>
            <th style={{ border: '1px solid #ccc', padding: '8px' }}>ジャンル</th>
            <th style={{ border: '1px solid #ccc', padding: '8px' }}>ステータス</th>
            <th style={{ border: '1px solid #ccc', padding: '8px' }}>操作</th>
          </tr>
        </thead>
        <tbody>
          {projects.map((project) => (
            <tr key={project.id}>
              <td style={{ border: '1px solid #ccc', padding: '8px' }}>{project.id.slice(0, 8)}</td>
              <td style={{ border: '1px solid #ccc', padding: '8px' }}>{project.country}</td>
              <td style={{ border: '1px solid #ccc', padding: '8px' }}>{project.genre}</td>
              <td style={{ border: '1px solid #ccc', padding: '8px' }}>{project.status}</td>
              <td style={{ border: '1px solid #ccc', padding: '8px' }}>
                <Link href={`/projects/${project.id}`}>詳細</Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </main>
  )
}
