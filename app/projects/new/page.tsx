import { redirect } from 'next/navigation'
import { createProject } from '@/app/actions/project'

export default function NewProjectPage() {
  async function handleCreate(formData: FormData) {
    'use server'
    const country = formData.get('country') as string
    const genre = formData.get('genre') as string
    await createProject({ country, genre })
    redirect('/')
  }

  return (
    <main style={{ padding: '20px' }}>
      <h1>新規プロジェクト作成</h1>
      <form action={handleCreate}>
        <div style={{ marginBottom: '10px' }}>
          <label>
            国:
            <input type="text" name="country" required style={{ marginLeft: '10px' }} />
          </label>
        </div>
        <div style={{ marginBottom: '10px' }}>
          <label>
            ジャンル:
            <input type="text" name="genre" required style={{ marginLeft: '10px' }} />
          </label>
        </div>
        <button type="submit">作成</button>
      </form>
    </main>
  )
}
