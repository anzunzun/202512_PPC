import Link from "next/link";
import { unstable_noStore as noStore } from "next/cache";
import { getProjectsWithResearchSummaryPack } from "@/app/actions/projectSummaries";
import { getProjectListSummaryTemplateIds } from "@/app/actions/projectListSummaryConfig";
import SummaryConfigEditor from "./SummaryConfigEditor";

const styles: Record<string, React.CSSProperties> = {
  page: { padding: 24, maxWidth: 1100, margin: "0 auto" },
  headerRow: {
    display: "flex",
    alignItems: "baseline",
    justifyContent: "space-between",
    gap: 12,
    marginBottom: 12,
  },
  h1: { fontSize: 20, margin: 0 },
  note: { color: "#555", marginTop: 0, marginBottom: 16, lineHeight: 1.6 },
  link: { color: "blue", textDecoration: "underline" },
  table: {
    width: "100%",
    borderCollapse: "collapse",
    border: "1px solid #ddd",
    marginTop: 12,
  },
  th: {
    textAlign: "left",
    borderBottom: "1px solid #ddd",
    padding: "10px 12px",
    background: "#fafafa",
    fontWeight: 600,
    fontSize: 13,
    whiteSpace: "nowrap",
  },
  td: {
    borderBottom: "1px solid #eee",
    padding: "10px 12px",
    fontSize: 14,
    verticalAlign: "top",
  },
  muted: { color: "#777", fontSize: 12 },
  pill: {
    display: "inline-block",
    padding: "2px 8px",
    border: "1px solid #ddd",
    borderRadius: 999,
    fontSize: 12,
    color: "#555",
    background: "#fff",
  },
};

function formatJst(dt: Date | null) {
  if (!dt) return "—";
  try {
    return new Intl.DateTimeFormat("ja-JP", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    }).format(dt);
  } catch {
    return String(dt);
  }
}

function isLikelyUrl(s: string) {
  return /^https?:\/\//i.test(s.trim());
}

function truncate(s: string, n = 60) {
  const t = s.trim();
  if (t.length <= n) return t;
  return t.slice(0, n) + "…";
}

export default async function ProjectsPage() {
  noStore();

  const scope = "PPC";

  // ✅ DBから「固定テンプレID設定」を読む
  const templateIds = await getProjectListSummaryTemplateIds(scope);

  // 未設定時のフォールバック（初回だけ使う）
  const fallbackLabels = ["ターゲットKW", "参考URL"];

  const pack = await getProjectsWithResearchSummaryPack({
    scope,
    templateIds: templateIds.length ? templateIds : undefined,
    labels: templateIds.length ? undefined : fallbackLabels,
    onlyActiveTemplates: true,
  });

  const { templates, rows } = pack;

  return (
    <main style={styles.page}>
      <div style={styles.headerRow}>
        <h1 style={styles.h1}>プロジェクト一覧</h1>

        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <span style={styles.pill}>scope: {scope}</span>
          <Link href="/templates" style={styles.link}>
            テンプレ管理へ
          </Link>
        </div>
      </div>

      <p style={styles.note}>
        一覧で「PPCリサーチ項目の要点」だけを見える化します。
        <br />
        サマリの列は <b>DBに保存</b> できるので、以後は label 変更で壊れません。
      </p>

      {/* ✅ ここでブラウザから設定できる */}
      <SummaryConfigEditor
        scope={scope}
        currentTemplateIds={templateIds}
        resolvedTemplates={templates}
      />

      <table style={styles.table}>
        <thead>
          <tr>
            <th style={styles.th}>プロジェクト</th>
            <th style={styles.th}>更新</th>
            {templates.map((t) => (
              <th key={t.templateId} style={styles.th}>
                {t.label}
              </th>
            ))}
          </tr>
        </thead>

        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td style={styles.td} colSpan={2 + templates.length}>
                まだプロジェクトがありません。
              </td>
            </tr>
          ) : (
            rows.map((r) => (
              <tr key={r.projectId}>
                <td style={styles.td}>
                  <div>
                    <Link href={`/projects/${r.projectId}`} style={styles.link}>
                      {r.projectName}
                    </Link>
                  </div>
                  <div style={styles.muted}>ID: {r.projectId}</div>
                </td>

                <td style={styles.td}>{formatJst(r.updatedAt)}</td>

                {templates.map((t) => {
                  const item =
                    r.summary.find((s) => s.templateId === t.templateId) ?? null;
                  const value = (item?.value ?? "").trim();

                  if (!value) return <td key={t.templateId} style={styles.td}>—</td>;

                  if (isLikelyUrl(value)) {
                    return (
                      <td key={t.templateId} style={styles.td}>
                        <a
                          href={value}
                          target="_blank"
                          rel="noreferrer"
                          style={styles.link}
                        >
                          {truncate(value, 60)}
                        </a>
                      </td>
                    );
                  }

                  return (
                    <td key={t.templateId} style={styles.td}>
                      {truncate(value, 80)}
                    </td>
                  );
                })}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </main>
  );
}
