import Link from "next/link";
import { unstable_noStore as noStore } from "next/cache";
import TemplateManager from "./TemplateManager";
import { getResearchItemTemplatesAdmin } from "@/app/actions/researchItems";

export default async function TemplatesPage() {
  noStore();

  const scope = "PPC";
  const templates = await getResearchItemTemplatesAdmin(scope);

  return (
    <main style={styles.page}>
      <div style={styles.headerRow}>
        <h1 style={styles.h1}>テンプレ管理（{scope}）</h1>

        <div style={{ display: "flex", gap: 12 }}>
          <Link href="/projects" style={styles.link}>
            プロジェクト一覧へ
          </Link>
        </div>
      </div>

      <p style={styles.note}>
        ここで定義したテンプレが、各プロジェクトの「PPCリサーチ項目」の入力欄になります。
        <br />
        基本は <b>並び替え・追加・無効化（isActive=false）</b> で運用してね（削除はしないのが安全）。
      </p>

      <div style={styles.card}>
        <TemplateManager scope={scope} initialTemplates={templates} />
      </div>
    </main>
  );
}

const styles: { [k: string]: React.CSSProperties } = {
  page: { padding: 20, maxWidth: 980, margin: "0 auto" },
  headerRow: {
    display: "flex",
    alignItems: "baseline",
    justifyContent: "space-between",
    gap: 12,
  },
  h1: { fontSize: 32, fontWeight: 900, margin: 0 },
  link: { color: "#4f46e5", textDecoration: "underline", fontWeight: 800 },
  note: { marginTop: 12, color: "#374151", lineHeight: 1.6 },
  card: {
    marginTop: 16,
    border: "1px solid #e5e7eb",
    borderRadius: 12,
    padding: 14,
    background: "#fff",
  },
};
