import { generateLpHtml, extractLpData } from "@/app/actions/generateLp";
import Link from "next/link";
import LpPreview from "./LpPreview";

export default async function GenerateLpPage({
  params,
}: {
  params: { id: string };
}) {
  const projectId = params.id;
  let lpHtml: string | null = null;
  let error: string | null = null;
  let lpData = null;

  try {
    lpData = await extractLpData(projectId);
    if (lpData) {
      lpHtml = await generateLpHtml(projectId);
    }
  } catch (e) {
    error = e instanceof Error ? e.message : "LP生成に失敗しました";
  }

  return (
    <div style={{ padding: 20, maxWidth: 1200, margin: "0 auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <h1 style={{ margin: 0 }}>LP自動生成</h1>
        <Link href={`/projects/${projectId}`} style={{ color: "#0066cc" }}>
          ← プロジェクト詳細に戻る
        </Link>
      </div>

      {error && (
        <div style={{ padding: 16, background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 8, marginBottom: 20, color: "#991b1b" }}>
          <strong>エラー:</strong> {error}
          <p style={{ margin: "8px 0 0", fontSize: 13 }}>
            先に「リサーチ実行」を行ってください →{" "}
            <Link href={`/projects/${projectId}/apply?scope=PPC&autorun=1`} style={{ color: "#0066cc" }}>
              リサーチ実行
            </Link>
          </p>
        </div>
      )}

      {lpData && (
        <div style={{ marginBottom: 20, padding: 16, background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 8 }}>
          <h3 style={{ margin: "0 0 12px", fontSize: 14 }}>抽出データ</h3>
          <div style={{ display: "grid", gap: 8, fontSize: 13 }}>
            <div><strong>タイトル:</strong> {lpData.title}</div>
            <div><strong>サブタイトル:</strong> {lpData.subtitle}</div>
            <div><strong>カテゴリ:</strong> {lpData.category}</div>
            <div><strong>CTA URL:</strong> {lpData.ctaUrl}</div>
            <div><strong>特徴数:</strong> {lpData.features.length}件</div>
          </div>
        </div>
      )}

      {lpHtml && <LpPreview html={lpHtml} projectId={projectId} />}

      {!lpData && !error && (
        <div style={{ padding: 40, textAlign: "center", color: "#666" }}>
          リサーチ結果がありません。先にリサーチを実行してください。
        </div>
      )}
    </div>
  );
}
