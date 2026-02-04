"use client";

import { useState, useTransition } from "react";
import { updateAutoRunSettings, triggerManualAutoRun, type AutoRunSettings } from "@/app/actions/autoRun";

type RunHistory = {
  id: string;
  projectId: string;
  projectGenre: string;
  status: string;
  startedAt: Date;
  durationMs: number | null;
};

export default function AutoRunSettingsClient({
  initialSettings,
  history,
}: {
  initialSettings: AutoRunSettings;
  history: RunHistory[];
}) {
  const [isPending, startTransition] = useTransition();
  const [settings, setSettings] = useState(initialSettings);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  function handleSave() {
    startTransition(async () => {
      try {
        await updateAutoRunSettings({
          enabled: settings.enabled,
          intervalHours: settings.intervalHours,
        });
        setMessage({ type: "success", text: "設定を保存しました" });
      } catch (e) {
        setMessage({ type: "error", text: "保存に失敗しました" });
      }
    });
  }

  function handleManualRun() {
    startTransition(async () => {
      try {
        const result = await triggerManualAutoRun();
        if (result.success) {
          setMessage({ type: "success", text: result.message });
          window.location.reload();
        } else {
          setMessage({ type: "error", text: result.message });
        }
      } catch (e) {
        setMessage({ type: "error", text: "実行に失敗しました" });
      }
    });
  }

  return (
    <div>
      {/* 設定フォーム */}
      <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 12, padding: 20, marginBottom: 24 }}>
        <h2 style={{ margin: "0 0 16px", fontSize: 16 }}>基本設定</h2>

        <div style={{ display: "grid", gap: 16 }}>
          {/* 有効/無効 */}
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
              <input
                type="checkbox"
                checked={settings.enabled}
                onChange={e => setSettings({ ...settings, enabled: e.target.checked })}
                style={{ width: 18, height: 18 }}
              />
              <span style={{ fontWeight: 600 }}>自動実行を有効にする</span>
            </label>
          </div>

          {/* 実行間隔 */}
          <div>
            <label style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 6 }}>
              実行間隔（時間）
            </label>
            <select
              value={settings.intervalHours}
              onChange={e => setSettings({ ...settings, intervalHours: parseInt(e.target.value, 10) })}
              style={{ padding: "8px 12px", borderRadius: 6, border: "1px solid #ddd", fontSize: 14 }}
            >
              <option value={1}>1時間</option>
              <option value={6}>6時間</option>
              <option value={12}>12時間</option>
              <option value={24}>24時間（1日）</option>
              <option value={48}>48時間（2日）</option>
              <option value={168}>168時間（1週間）</option>
            </select>
            <p style={{ margin: "6px 0 0", fontSize: 12, color: "#666" }}>
              前回の実行から指定時間以上経過したプロジェクトが再評価対象になります
            </p>
          </div>

          {/* 最終実行日時 */}
          {initialSettings.lastRunAt && (
            <div>
              <span style={{ fontSize: 13, color: "#666" }}>
                最終実行: {new Date(initialSettings.lastRunAt).toLocaleString("ja-JP")}
              </span>
            </div>
          )}
        </div>

        {/* ボタン */}
        <div style={{ marginTop: 20, display: "flex", gap: 12 }}>
          <button
            onClick={handleSave}
            disabled={isPending}
            style={{
              padding: "10px 24px",
              background: isPending ? "#9ca3af" : "#0066cc",
              color: "white",
              border: "none",
              borderRadius: 6,
              fontWeight: 700,
              cursor: isPending ? "wait" : "pointer",
            }}
          >
            {isPending ? "保存中..." : "設定を保存"}
          </button>
          <button
            onClick={handleManualRun}
            disabled={isPending}
            style={{
              padding: "10px 24px",
              background: isPending ? "#9ca3af" : "#22c55e",
              color: "white",
              border: "none",
              borderRadius: 6,
              fontWeight: 700,
              cursor: isPending ? "wait" : "pointer",
            }}
          >
            {isPending ? "実行中..." : "今すぐ実行"}
          </button>
        </div>

        {/* メッセージ */}
        {message && (
          <div
            style={{
              marginTop: 16,
              padding: 12,
              borderRadius: 8,
              background: message.type === "success" ? "#f0fdf4" : "#fef2f2",
              border: `1px solid ${message.type === "success" ? "#bbf7d0" : "#fecaca"}`,
              color: message.type === "success" ? "#166534" : "#991b1b",
              fontSize: 13,
            }}
          >
            {message.text}
          </div>
        )}
      </div>

      {/* 実行履歴 */}
      <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 12, padding: 20 }}>
        <h2 style={{ margin: "0 0 16px", fontSize: 16 }}>最近の実行履歴</h2>

        {history.length === 0 ? (
          <p style={{ color: "#666", fontSize: 13 }}>まだ実行履歴がありません</p>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid #e5e7eb" }}>
                <th style={{ padding: "8px 10px", textAlign: "left", fontSize: 12, fontWeight: 600 }}>プロジェクト</th>
                <th style={{ padding: "8px 10px", textAlign: "center", fontSize: 12, fontWeight: 600 }}>ステータス</th>
                <th style={{ padding: "8px 10px", textAlign: "center", fontSize: 12, fontWeight: 600 }}>実行時間</th>
                <th style={{ padding: "8px 10px", textAlign: "right", fontSize: 12, fontWeight: 600 }}>実行日時</th>
              </tr>
            </thead>
            <tbody>
              {history.map(h => (
                <tr key={h.id} style={{ borderBottom: "1px solid #f3f4f6" }}>
                  <td style={{ padding: "10px", fontSize: 13 }}>
                    {h.projectGenre || h.projectId.slice(0, 8)}
                  </td>
                  <td style={{ padding: "10px", textAlign: "center" }}>
                    <span
                      style={{
                        padding: "2px 8px",
                        borderRadius: 4,
                        fontSize: 11,
                        fontWeight: 600,
                        background: h.status === "ok" ? "#dcfce7" : "#fef2f2",
                        color: h.status === "ok" ? "#166534" : "#991b1b",
                      }}
                    >
                      {h.status === "ok" ? "成功" : "失敗"}
                    </span>
                  </td>
                  <td style={{ padding: "10px", textAlign: "center", fontSize: 12, color: "#666" }}>
                    {h.durationMs ? `${(h.durationMs / 1000).toFixed(1)}秒` : "-"}
                  </td>
                  <td style={{ padding: "10px", textAlign: "right", fontSize: 12, color: "#666" }}>
                    {new Date(h.startedAt).toLocaleString("ja-JP")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
