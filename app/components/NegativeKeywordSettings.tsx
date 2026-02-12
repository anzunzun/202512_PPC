"use client";

import { useState, useEffect, useCallback } from "react";

type Props = {
  onKeywordsChange?: (keywords: string[]) => void;
};

export default function NegativeKeywordSettings({ onKeywordsChange }: Props) {
  const [keywords, setKeywords] = useState<string[]>([]);
  const [textInput, setTextInput] = useState("");
  const [spreadsheetUrl, setSpreadsheetUrl] = useState("");
  const [columnIndex, setColumnIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);

  // 初期読み込み
  useEffect(() => {
    loadKeywords();
  }, []);

  const loadKeywords = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/settings/negative-keywords");
      const data = await res.json();
      if (data.keywords) {
        setKeywords(data.keywords);
        setTextInput(data.keywords.join("\n"));
        onKeywordsChange?.(data.keywords);
      }
    } catch {
      setMessage({ type: "error", text: "読み込みに失敗しました" });
    } finally {
      setLoading(false);
    }
  };

  const saveKeywords = async () => {
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch("/api/settings/negative-keywords", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: textInput }),
      });
      const data = await res.json();
      if (res.ok) {
        setKeywords(data.keywords);
        onKeywordsChange?.(data.keywords);
        setMessage({ type: "success", text: `${data.count}件のキーワードを保存しました` });
      } else {
        setMessage({ type: "error", text: data.error || "保存に失敗しました" });
      }
    } catch {
      setMessage({ type: "error", text: "保存に失敗しました" });
    } finally {
      setLoading(false);
    }
  };

  const importFromSpreadsheet = async () => {
    if (!spreadsheetUrl.trim()) {
      setMessage({ type: "error", text: "スプレッドシートのURLを入力してください" });
      return;
    }

    setImporting(true);
    setMessage(null);
    try {
      const res = await fetch("/api/settings/negative-keywords/import-spreadsheet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: spreadsheetUrl, column: columnIndex }),
      });
      const data = await res.json();

      if (res.ok && data.keywords) {
        // 既存のキーワードとマージ
        const merged = [...new Set([...keywords, ...data.keywords])];
        setTextInput(merged.join("\n"));
        setMessage({
          type: "success",
          text: `${data.count}件のキーワードを読み込みました。「保存」で確定してください`,
        });
      } else {
        setMessage({ type: "error", text: data.error || "読み込みに失敗しました" });
      }
    } catch {
      setMessage({ type: "error", text: "読み込みに失敗しました" });
    } finally {
      setImporting(false);
    }
  };

  const clearAll = useCallback(() => {
    if (confirm("すべての除外キーワードを削除しますか？")) {
      setTextInput("");
    }
  }, []);

  return (
    <div
      style={{
        marginTop: 24,
        border: "1px solid #ddd",
        borderRadius: 12,
        background: "#fff",
        overflow: "hidden",
      }}
    >
      {/* ヘッダー（クリックで開閉） */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        style={{
          width: "100%",
          padding: "16px 20px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          background: "#f9fafb",
          border: "none",
          borderBottom: isExpanded ? "1px solid #eee" : "none",
          cursor: "pointer",
          textAlign: "left",
        }}
      >
        <div>
          <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>
            カスタム除外キーワード設定
          </h3>
          <p style={{ margin: "4px 0 0", fontSize: 12, opacity: 0.7 }}>
            {keywords.length > 0
              ? `現在 ${keywords.length} 件登録済み`
              : "キーワード提案から除外したいワードを設定"}
          </p>
        </div>
        <span style={{ fontSize: 20, opacity: 0.5 }}>{isExpanded ? "−" : "+"}</span>
      </button>

      {/* 展開時のコンテンツ */}
      {isExpanded && (
        <div style={{ padding: 20, display: "grid", gap: 16 }}>
          {/* メッセージ */}
          {message && (
            <div
              style={{
                padding: 12,
                borderRadius: 8,
                background: message.type === "success" ? "#ecfdf5" : "#fef2f2",
                border: `1px solid ${message.type === "success" ? "#a7f3d0" : "#fecaca"}`,
                color: message.type === "success" ? "#065f46" : "#991b1b",
                fontSize: 13,
              }}
            >
              {message.text}
            </div>
          )}

          {/* スプレッドシート読み込み */}
          <div
            style={{
              padding: 16,
              background: "#f9fafb",
              borderRadius: 8,
              border: "1px solid #e5e7eb",
            }}
          >
            <div style={{ fontWeight: 600, marginBottom: 12, fontSize: 14 }}>
              スプレッドシートから読み込み
            </div>

            <div style={{ display: "grid", gap: 8 }}>
              <input
                type="text"
                value={spreadsheetUrl}
                onChange={(e) => setSpreadsheetUrl(e.target.value)}
                placeholder="Google Sheetsの共有URLを貼り付け"
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  borderRadius: 6,
                  border: "1px solid #d1d5db",
                  fontSize: 13,
                  boxSizing: "border-box",
                }}
              />

              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <label style={{ fontSize: 12, display: "flex", alignItems: "center", gap: 4 }}>
                  列番号（0から）:
                  <input
                    type="number"
                    value={columnIndex}
                    onChange={(e) => setColumnIndex(parseInt(e.target.value) || 0)}
                    min={0}
                    max={25}
                    style={{
                      width: 60,
                      padding: "6px 8px",
                      borderRadius: 4,
                      border: "1px solid #d1d5db",
                      fontSize: 13,
                    }}
                  />
                </label>

                <button
                  onClick={importFromSpreadsheet}
                  disabled={importing || !spreadsheetUrl.trim()}
                  style={{
                    padding: "8px 16px",
                    borderRadius: 6,
                    border: "none",
                    background: "#3b82f6",
                    color: "#fff",
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: importing ? "wait" : "pointer",
                    opacity: importing || !spreadsheetUrl.trim() ? 0.5 : 1,
                  }}
                >
                  {importing ? "読み込み中..." : "読み込む"}
                </button>
              </div>

              <p style={{ margin: 0, fontSize: 11, opacity: 0.6 }}>
                Google Sheetsを公開設定にして共有URLを貼り付けてください。
                A列の場合は0、B列は1を指定。
              </p>
            </div>
          </div>

          {/* テキスト入力 */}
          <div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 8,
              }}
            >
              <label style={{ fontWeight: 600, fontSize: 14 }}>
                キーワード一覧（1行1キーワード or カンマ区切り）
              </label>
              <button
                onClick={clearAll}
                style={{
                  padding: "4px 8px",
                  borderRadius: 4,
                  border: "1px solid #e5e7eb",
                  background: "#fff",
                  fontSize: 11,
                  cursor: "pointer",
                }}
              >
                全削除
              </button>
            </div>

            <textarea
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              placeholder="Amazon&#10;楽天&#10;公式サイト&#10;..."
              rows={10}
              style={{
                width: "100%",
                padding: 12,
                borderRadius: 8,
                border: "1px solid #d1d5db",
                fontSize: 13,
                fontFamily: "monospace",
                resize: "vertical",
                boxSizing: "border-box",
              }}
            />

            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8 }}>
              <span style={{ fontSize: 12, opacity: 0.6 }}>
                {textInput
                  .split(/[\n,]/)
                  .filter((k) => k.trim()).length}{" "}
                件入力中
              </span>
            </div>
          </div>

          {/* 保存ボタン */}
          <div style={{ display: "flex", gap: 8 }}>
            <button
              onClick={saveKeywords}
              disabled={loading}
              style={{
                flex: 1,
                padding: "12px 24px",
                borderRadius: 8,
                border: "none",
                background: "#10b981",
                color: "#fff",
                fontSize: 14,
                fontWeight: 700,
                cursor: loading ? "wait" : "pointer",
                opacity: loading ? 0.5 : 1,
              }}
            >
              {loading ? "保存中..." : "保存"}
            </button>

            <button
              onClick={loadKeywords}
              disabled={loading}
              style={{
                padding: "12px 16px",
                borderRadius: 8,
                border: "1px solid #d1d5db",
                background: "#fff",
                fontSize: 14,
                cursor: "pointer",
              }}
            >
              リセット
            </button>
          </div>

          {/* 現在の登録キーワード（プレビュー） */}
          {keywords.length > 0 && (
            <div style={{ marginTop: 8 }}>
              <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 8 }}>
                保存済みキーワード（{keywords.length}件）
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {keywords.slice(0, 50).map((kw, idx) => (
                  <span
                    key={idx}
                    style={{
                      display: "inline-block",
                      padding: "4px 10px",
                      borderRadius: 4,
                      background: "#fee2e2",
                      color: "#991b1b",
                      fontSize: 12,
                    }}
                  >
                    {kw}
                  </span>
                ))}
                {keywords.length > 50 && (
                  <span style={{ fontSize: 12, opacity: 0.6, padding: "4px 0" }}>
                    ...他{keywords.length - 50}件
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
