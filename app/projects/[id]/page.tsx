import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { unstable_noStore as noStore } from "next/cache";

import ResearchItemsEditor from "./ResearchItemsEditor";
import { getProject, approveProject, rejectProject } from "@/app/actions/project";
import { runResearchProjectAction } from "@/app/actions/research";

export default async function ProjectDetailPage({
  params,
}: {
  params: { id: string };
}) {
  noStore();

  const id = params.id;
  const project = await getProject(id);
  if (!project) notFound();

  async function handleRunResearch() {
    "use server";
    await runResearchProjectAction({ projectId: id });
    redirect(`/projects/${id}`);
  }

  async function handleApprove() {
    "use server";
    await approveProject(id);
    redirect(`/projects/${id}`);
  }

  async function handleReject() {
    "use server";
    await rejectProject(id);
    redirect(`/projects/${id}`);
  }

  const items = (project.items ?? []).map((x, idx) => ({
    ...x,
    order: typeof x.order === "number" ? x.order : idx,
  }));

  const statusBadge =
    project.status === "pending"
      ? styles.badgePending
      : project.status === "rejected"
      ? styles.badgeRejected
      : styles.badgeCompleted;

  return (
    <main style={styles.page}>
      <div style={styles.headerRow}>
        <h1 style={styles.h1}>プロジェクト詳細</h1>
        <Link href="/projects" style={styles.backLink}>
          一覧へ戻る
        </Link>
      </div>

      {/* 基本情報 */}
      <section style={styles.section}>
        <h2 style={styles.h2}>基本情報</h2>

        <div style={styles.card}>
          <table style={styles.table}>
            <tbody>
              <tr>
                <th style={styles.th}>ID</th>
                <td style={styles.tdMono}>{project.id}</td>
              </tr>
              <tr>
                <th style={styles.th}>国</th>
                <td style={styles.td}>{project.country}</td>
              </tr>
              <tr>
                <th style={styles.th}>ジャンル</th>
                <td style={styles.td}>{project.genre}</td>
              </tr>
              <tr>
                <th style={styles.th}>ステータス</th>
                <td style={styles.td}>
                  <span style={{ ...styles.badge, ...statusBadge }}>
                    {project.status}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* スコア */}
      <section style={styles.section}>
        <h2 style={styles.h2}>スコア</h2>

        <div style={styles.card}>
          {project.riskScore ? (
            <table style={styles.table}>
              <tbody>
                <tr>
                  <th style={styles.th}>商標リスク</th>
                  <td style={styles.td}>{project.riskScore.trademarkRisk}</td>
                </tr>
                <tr>
                  <th style={styles.th}>広告ポリシーリスク</th>
                  <td style={styles.td}>{project.riskScore.adPolicyRisk}</td>
                </tr>
                <tr>
                  <th style={styles.th}>ブリッジページリスク</th>
                  <td style={styles.td}>{project.riskScore.bridgePageRisk}</td>
                </tr>
                <tr>
                  <th style={styles.th}>総合スコア</th>
                  <td style={styles.tdStrong}>{project.riskScore.totalScore}</td>
                </tr>
              </tbody>
            </table>
          ) : (
            <p style={styles.muted}>スコア未算出</p>
          )}
        </div>
      </section>

      {/* 操作 */}
      <section style={styles.section}>
        <h2 style={styles.h2}>操作</h2>

        <div style={styles.actions}>
          {/* pending のときは「リサーチ実行」 */}
          {project.status === "pending" && (
            <form action={handleRunResearch}>
              <button type="submit" style={styles.btnPrimary}>
                リサーチ実行
              </button>
            </form>
          )}

          {/* completed / rejected のときも「再リサーチ」出す（押したら再計算してcompletedに戻る想定） */}
          {project.status !== "pending" && (
            <form action={handleRunResearch}>
              <button type="submit" style={styles.btnOutline}>
                再リサーチ
              </button>
            </form>
          )}

          {/* pending かつ score があるなら承認/却下（あなたの現状は completed なので普段は出ない） */}
          {project.status === "pending" && project.riskScore && (
            <>
              <form action={handleApprove}>
                <button type="submit" style={styles.btnPrimary}>
                  承認
                </button>
              </form>
              <form action={handleReject}>
                <button type="submit" style={styles.btnDanger}>
e
                  却下
                </button>
              </form>
            </>
          )}
        </div>
      </section>

      <hr style={styles.hr} />

      {/* PPC リサーチ項目 */}
      <section style={styles.section}>
        <h2 style={styles.h2}>PPC リサーチ項目</h2>
        <div style={styles.card}>
          <ResearchItemsEditor projectId={project.id} initialItems={items} />
        </div>

        <p style={styles.hint}>
          保存 → リロード（Ctrl+R）で同じ値が出ればDB永続化OK。
        </p>
      </section>
    </main>
  );
}

const styles: { [k: string]: React.CSSProperties } = {
  page: { padding: 20, maxWidth: 980, margin: "0 auto" },
  headerRow: { display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 12 },
  h1: { fontSize: 36, fontWeight: 800, margin: 0 },
  backLink: { color: "#4f46e5", textDecoration: "underline", fontWeight: 700 },

  section: { marginTop: 24 },
  h2: { fontSize: 24, fontWeight: 800, margin: "0 0 12px 0" },

  card: { border: "1px solid #e5e7eb", borderRadius: 12, padding: 14, background: "#fff" },
  table: { borderCollapse: "collapse", width: "100%" },
  th: { border: "1px solid #e5e7eb", padding: 10, textAlign: "left", background: "#f8fafc", width: 180 },
  td: { border: "1px solid #e5e7eb", padding: 10 },
  tdMono: { border: "1px solid #e5e7eb", padding: 10, fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace" },
  tdStrong: { border: "1px solid #e5e7eb", padding: 10, fontWeight: 800 },

  muted: { margin: 0, color: "#6b7280" },

  actions: { display: "flex", gap: 10, flexWrap: "wrap" },
  btnPrimary: { padding: "10px 14px", borderRadius: 10, border: "1px solid #111827", background: "#111827", color: "#fff", fontWeight: 800, cursor: "pointer" },
  btnOutline: { padding: "10px 14px", borderRadius: 10, border: "1px solid #111827", background: "#fff", color: "#111827", fontWeight: 800, cursor: "pointer" },
  btnDanger: { padding: "10px 14px", borderRadius: 10, border: "1px solid #991b1b", background: "#991b1b", color: "#fff", fontWeight: 800, cursor: "pointer" },

  hr: { margin: "28px 0", border: "none", borderTop: "1px solid #e5e7eb" },

  hint: { marginTop: 10, color: "#6b7280" },

  badge: { display: "inline-block", padding: "4px 10px", borderRadius: 999, fontWeight: 800, fontSize: 12, border: "1px solid transparent" },
  badgePending: { background: "#fff7ed", color: "#9a3412", borderColor: "#fed7aa" },
  badgeCompleted: { background: "#ecfdf5", color: "#065f46", borderColor: "#a7f3d0" },
  badgeRejected: { background: "#fef2f2", color: "#991b1b", borderColor: "#fecaca" },
};
