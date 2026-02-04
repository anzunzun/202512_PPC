import Link from "next/link";
import { unstable_noStore as noStore } from "next/cache";
import { getAutoRunSettings, getRecentAutoRunHistory } from "@/app/actions/autoRun";
import AutoRunSettingsClient from "./AutoRunSettingsClient";

export default async function AutoRunSettingsPage() {
  noStore();

  const [settings, history] = await Promise.all([
    getAutoRunSettings(),
    getRecentAutoRunHistory(20),
  ]);

  return (
    <main style={{ padding: 20, maxWidth: 900, margin: "0 auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <h1 style={{ margin: 0 }}>自動実行設定</h1>
        <Link href="/dashboard" style={{ color: "#0066cc" }}>
          ← ダッシュボードに戻る
        </Link>
      </div>

      <div style={{ marginBottom: 24, padding: 16, background: "#eff6ff", borderRadius: 8, border: "1px solid #bfdbfe" }}>
        <div style={{ fontWeight: 700, color: "#1e40af", fontSize: 14, marginBottom: 8 }}>
          自動実行について
        </div>
        <p style={{ margin: 0, fontSize: 13, color: "#1e40af" }}>
          設定した間隔で自動的にリスク再評価を実行します。
          外部のcronサービス（Vercel Cron、Railway等）から以下のエンドポイントを呼び出してください。
        </p>
        <div style={{ marginTop: 12, padding: 12, background: "#fff", borderRadius: 6, fontFamily: "monospace", fontSize: 12 }}>
          GET /api/cron/auto-run
          <br />
          Authorization: Bearer {"{CRON_SECRET}"}
        </div>
      </div>

      <AutoRunSettingsClient initialSettings={settings} history={history} />
    </main>
  );
}
