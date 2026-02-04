"use client";

import { useState } from "react";

export default function LpPreview({
  html,
  projectId,
}: {
  html: string;
  projectId: string;
}) {
  const [copied, setCopied] = useState(false);
  const [view, setView] = useState<"preview" | "code">("preview");

  async function copyToClipboard() {
    try {
      await navigator.clipboard.writeText(html);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      alert("コピーに失敗しました");
    }
  }

  async function downloadHtml() {
    const blob = new Blob([html], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `lp-${projectId.slice(0, 8)}.html`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div>
      <div style={{ display: "flex", gap: 12, marginBottom: 16, alignItems: "center" }}>
        <div style={{ display: "flex", gap: 4, background: "#f3f4f6", borderRadius: 8, padding: 4 }}>
          <button
            onClick={() => setView("preview")}
            style={{
              padding: "8px 16px",
              border: "none",
              borderRadius: 6,
              background: view === "preview" ? "#fff" : "transparent",
              boxShadow: view === "preview" ? "0 1px 3px rgba(0,0,0,.1)" : "none",
              cursor: "pointer",
              fontWeight: view === "preview" ? 700 : 400,
            }}
          >
            プレビュー
          </button>
          <button
            onClick={() => setView("code")}
            style={{
              padding: "8px 16px",
              border: "none",
              borderRadius: 6,
              background: view === "code" ? "#fff" : "transparent",
              boxShadow: view === "code" ? "0 1px 3px rgba(0,0,0,.1)" : "none",
              cursor: "pointer",
              fontWeight: view === "code" ? 700 : 400,
            }}
          >
            HTML
          </button>
        </div>

        <button
          onClick={copyToClipboard}
          style={{
            padding: "8px 16px",
            background: copied ? "#22c55e" : "#0066cc",
            color: "#fff",
            border: "none",
            borderRadius: 6,
            cursor: "pointer",
            fontWeight: 700,
          }}
        >
          {copied ? "コピー完了!" : "HTMLをコピー"}
        </button>

        <button
          onClick={downloadHtml}
          style={{
            padding: "8px 16px",
            background: "#6b7280",
            color: "#fff",
            border: "none",
            borderRadius: 6,
            cursor: "pointer",
          }}
        >
          ダウンロード
        </button>
      </div>

      {view === "preview" ? (
        <div
          style={{
            border: "1px solid #e5e7eb",
            borderRadius: 12,
            overflow: "hidden",
            background: "#f9fafb",
          }}
        >
          <div
            style={{
              padding: "8px 16px",
              background: "#e5e7eb",
              fontSize: 12,
              color: "#6b7280",
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <span style={{ width: 12, height: 12, borderRadius: "50%", background: "#ef4444" }} />
            <span style={{ width: 12, height: 12, borderRadius: "50%", background: "#eab308" }} />
            <span style={{ width: 12, height: 12, borderRadius: "50%", background: "#22c55e" }} />
            <span style={{ marginLeft: 12 }}>モバイルプレビュー (480px)</span>
          </div>
          <div
            style={{
              maxWidth: 480,
              margin: "0 auto",
              background: "#fff",
              minHeight: 600,
            }}
          >
            <iframe
              srcDoc={html}
              style={{
                width: "100%",
                height: 800,
                border: "none",
              }}
              title="LP Preview"
            />
          </div>
        </div>
      ) : (
        <div
          style={{
            background: "#1e293b",
            borderRadius: 12,
            padding: 16,
            overflow: "auto",
            maxHeight: 600,
          }}
        >
          <pre
            style={{
              margin: 0,
              fontSize: 12,
              color: "#e2e8f0",
              whiteSpace: "pre-wrap",
              wordBreak: "break-all",
            }}
          >
            {html}
          </pre>
        </div>
      )}

      <div style={{ marginTop: 16, padding: 12, background: "#eff6ff", borderRadius: 8, border: "1px solid #bfdbfe" }}>
        <div style={{ fontWeight: 700, color: "#1e40af", fontSize: 13, marginBottom: 8 }}>使い方</div>
        <ol style={{ margin: 0, paddingLeft: 20, fontSize: 12, color: "#1e40af", lineHeight: 1.8 }}>
          <li>「HTMLをコピー」ボタンでコードをコピー</li>
          <li>WordPress管理画面で新規ページを作成</li>
          <li>「カスタムHTML」ブロックを追加</li>
          <li>コピーしたHTMLを貼り付けて公開</li>
        </ol>
      </div>
    </div>
  );
}
