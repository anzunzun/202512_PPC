import Link from "next/link";
import { getProjects } from "./actions/project";

export default async function Home() {
  const hasDbConfig = !!process.env.DATABASE_URL;

  let projects: any[] = [];
  let dbError: string | null = null;

  if (hasDbConfig) {
    try {
      projects = await getProjects();
    } catch (e: any) {
      dbError =
        e?.message?.includes("Can't reach database server")
          ? "DBに接続できません（localhost:5432 など）。Postgresを起動するか、DATABASE_URLを正しい接続先に変更してください。"
          : "DBエラーが発生しました。DATABASE_URLやDB状態を確認してください。";
      projects = [];
    }
  }

  const dbOk = hasDbConfig && !dbError;

  return (
    <main style={{ padding: "20px" }}>
      <h1>リサーチ一覧</h1>

      {!hasDbConfig && (
        <div style={{ marginTop: 12, marginBottom: 12, padding: 12, border: "1px solid #ccc", borderRadius: 8, background: "#fffbe6", lineHeight: 1.6 }}>
          <b>DATABASE_URL が未設定</b>のため、DB機能は無効です。<br />
          <code>.env</code> に <code>DATABASE_URL</code> を設定すると一覧が表示されます。
        </div>
      )}

      {dbError && (
        <div style={{ marginTop: 12, marginBottom: 12, padding: 12, border: "1px solid #f5c2c7", borderRadius: 8, background: "#fff5f5", lineHeight: 1.6 }}>
          <b>DB接続エラー</b><br />
          {dbError}
        </div>
      )}

      <div style={{ marginTop: 8, marginBottom: 12 }}>
        <Link href="/projects/new">新規作成</Link>
      </div>

      <table style={{ marginTop: "20px", borderCollapse: "collapse", width: "100%", opacity: dbOk ? 1 : 0.6 }}>
        <thead>
          <tr>
            <th style={{ border: "1px solid #ccc", padding: "8px" }}>ID</th>
            <th style={{ border: "1px solid #ccc", padding: "8px" }}>国</th>
            <th style={{ border: "1px solid #ccc", padding: "8px" }}>ジャンル</th>
            <th style={{ border: "1px solid #ccc", padding: "8px" }}>ステータス</th>
            <th style={{ border: "1px solid #ccc", padding: "8px" }}>操作</th>
          </tr>
        </thead>
        <tbody>
          {projects.length === 0 ? (
            <tr>
              <td colSpan={5} style={{ border: "1px solid #ccc", padding: "12px" }}>
                {dbOk ? "プロジェクトがありません。新規作成してください。" : "DB未接続のため一覧を表示できません。"}
              </td>
            </tr>
          ) : (
            projects.map((project: any) => (
              <tr key={project.id}>
                <td style={{ border: "1px solid #ccc", padding: "8px" }}>{String(project.id).slice(0, 8)}</td>
                <td style={{ border: "1px solid #ccc", padding: "8px" }}>{project.country}</td>
                <td style={{ border: "1px solid #ccc", padding: "8px" }}>{project.genre}</td>
                <td style={{ border: "1px solid #ccc", padding: "8px" }}>{project.status}</td>
                <td style={{ border: "1px solid #ccc", padding: "8px" }}>
                  <Link href={`/projects/${project.id}`}>詳細</Link>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </main>
  );
}
