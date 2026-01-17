import Link from "next/link";
import { unstable_noStore as noStore } from "next/cache";

const styles: Record<string, React.CSSProperties> = {
  page: { padding: 24, maxWidth: 900, margin: "0 auto" },
  h1: { fontSize: 20, margin: "0 0 8px 0" },
  note: { color: "#555", lineHeight: 1.7, marginTop: 0 },
  box: {
    border: "1px solid #eee",
    borderRadius: 10,
    padding: 14,
    marginTop: 14,
    background: "#fff",
  },
  link: { color: "blue", textDecoration: "underline" },
  pill: {
    display: "inline-block",
    padding: "2px 8px",
    border: "1px solid #ddd",
    borderRadius: 999,
    fontSize: 12,
    color: "#555",
    background: "#fafafa",
    marginRight: 8,
  },
  code: {
    fontFamily:
      'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
    fontSize: 12,
    background: "#fafafa",
    border: "1px solid #eee",
    padding: 10,
    borderRadius: 8,
    whiteSpace: "pre-wrap",
  },
};

export default async function ExportPage({
  params,
}: {
  params: { id: string };
}) {
  noStore();

  const projectId = params.id;
  const scope = "PPC";

  const jsonUrl = `/projects/${projectId}/export/json?scope=${encodeURIComponent(scope)}`;
  const csvUrl = `/projects/${projectId}/export/csv?scope=${encodeURIComponent(scope)}`;

  return (
    <main style={styles.page}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
        <div>
          <h1 style={styles.h1}>エクスポート</h1>
          <p style={styles.note}>
            プロジェクト単位で、テンプレ入力値（テンプレ + 値合成）を
            <b>CSV / JSON</b>でダウンロードできます。
          </p>
          <div>
            <span style={styles.pill}>projectId: {projectId}</span>
            <span style={styles.pill}>scope: {scope}</span>
          </div>
        </div>

        <div style={{ textAlign: "right" }}>
          <Link href={`/projects/${projectId}`} style={styles.link}>
            プロジェクト詳細へ戻る
          </Link>
        </div>
      </div>

      <div style={styles.box}>
        <div style={{ fontWeight: 700, marginBottom: 8 }}>ダウンロード</div>
        <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
          <a href={jsonUrl} style={styles.link}>
            JSONをダウンロード
          </a>
          <a href={csvUrl} style={styles.link}>
            CSVをダウンロード
          </a>
        </div>

        <div style={{ marginTop: 12, color: "#555", lineHeight: 1.7 }}>
          ※ 非表示テンプレまで含めたい場合は <code>includeInactive=1</code> を付けます（例）。
        </div>

        <pre style={styles.code}>
{`JSON: ${jsonUrl}&includeInactive=1
CSV : ${csvUrl}&includeInactive=1`}
        </pre>
      </div>
    </main>
  );
}

