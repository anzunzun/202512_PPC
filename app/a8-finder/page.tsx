import { getA8Programs, createA8Program, deleteA8Program, createProjectFromA8Program } from "@/app/actions/a8program";
import A8ProgramForm from "./A8ProgramForm";
import A8ProgramList from "./A8ProgramList";

export default async function A8FinderPage() {
  const programs = await getA8Programs();

  return (
    <div style={{ padding: "20px", maxWidth: "1200px", margin: "0 auto" }}>
      <h1 style={{ marginBottom: "8px" }}>A8案件ファインダー</h1>
      <p style={{ color: "#666", marginBottom: "24px" }}>
        案件情報を入力して収益性スコアを自動計算 → プロジェクト作成
      </p>

      <div style={{ display: "grid", gridTemplateColumns: "400px 1fr", gap: "32px" }}>
        <div>
          <h2 style={{ fontSize: "18px", marginBottom: "16px" }}>案件を追加</h2>
          <A8ProgramForm action={createA8Program} />
        </div>

        <div>
          <h2 style={{ fontSize: "18px", marginBottom: "16px" }}>
            登録案件一覧（スコア順）
          </h2>
          <A8ProgramList
            programs={programs}
            deleteAction={deleteA8Program}
            createProjectAction={createProjectFromA8Program}
          />
        </div>
      </div>

      <div style={{ marginTop: "32px", padding: "16px", background: "#f5f5f5", borderRadius: "8px" }}>
        <h3 style={{ fontSize: "14px", marginBottom: "8px" }}>収益性スコアの計算式</h3>
        <p style={{ fontSize: "12px", color: "#666", margin: 0 }}>
          総合スコア = EPC(40%) + 承認率(30%) + 報酬単価(30%)<br />
          ・EPC: 100円で100点（上限200円）<br />
          ・承認率: そのまま使用（未入力は50%と仮定）<br />
          ・報酬単価: 5000円で100点（上限10000円）
        </p>
      </div>

      <div style={{ marginTop: "16px" }}>
        <a href="/" style={{ color: "#0066cc" }}>← ホームに戻る</a>
      </div>
    </div>
  );
}
