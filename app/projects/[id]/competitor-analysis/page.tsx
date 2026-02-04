import Link from "next/link";
import CompetitorAnalysisClient from "./CompetitorAnalysisClient";

export default async function CompetitorAnalysisPage({
  params,
}: {
  params: { id: string };
}) {
  const projectId = params.id;

  return (
    <div style={{ padding: 20, maxWidth: 1200, margin: "0 auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <h1 style={{ margin: 0 }}>競合LP分析</h1>
        <Link href={`/projects/${projectId}`} style={{ color: "#0066cc" }}>
          ← プロジェクト詳細に戻る
        </Link>
      </div>

      <div style={{ marginBottom: 20, padding: 16, background: "#eff6ff", borderRadius: 8, border: "1px solid #bfdbfe" }}>
        <div style={{ fontWeight: 700, color: "#1e40af", fontSize: 14, marginBottom: 8 }}>
          競合LP分析とは
        </div>
        <p style={{ margin: 0, fontSize: 13, color: "#1e40af" }}>
          同ジャンルの競合LPを分析して、CTA配置、コンテンツ構成、訴求ポイントを把握します。
          自分のLPの改善点を発見できます。
        </p>
      </div>

      <CompetitorAnalysisClient projectId={projectId} />
    </div>
  );
}
