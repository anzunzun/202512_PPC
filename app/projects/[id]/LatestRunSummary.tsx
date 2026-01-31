import Link from "next/link";

type SuggestedKeyword = {
  keyword: string;
  category: "purchase" | "compare" | "info" | "problem";
  score: number;
  reason: string;
  matchType?: "broad" | "phrase" | "exact";
  volumeRisk?: "high" | "medium" | "low";
};

type KeywordSuggestionData = {
  summary: string;
  mainKeywords: SuggestedKeyword[];
  longTailKeywords: SuggestedKeyword[];
  negativeKeywords: string[];
  grouped?: Record<string, SuggestedKeyword[]>;
};

const CATEGORY_LABELS: Record<string, { label: string; color: string }> = {
  purchase: { label: "購入意図", color: "#22c55e" },
  compare: { label: "比較検討", color: "#3b82f6" },
  info: { label: "情報収集", color: "#8b5cf6" },
  problem: { label: "課題解決", color: "#f59e0b" },
};

export default function LatestRunSummary({
  resultJson,
  runId,
  projectId,
}: {
  resultJson: any;
  runId: string;
  projectId: string;
}) {
  const itemsByKey = resultJson?.itemsByKey ?? {};

  // 広告文
  const adTitle1 = itemsByKey.adTitle1 || "";
  const adTitle2 = itemsByKey.adTitle2 || "";
  const adTitle3 = itemsByKey.adTitle3 || "";
  const adDesc1 = itemsByKey.adDescription1 || "";
  const adDesc2 = itemsByKey.adDescription2 || "";
  const targetKw = itemsByKey.targetKw || "";

  // キーワード提案
  let suggestion: KeywordSuggestionData | null = null;
  try {
    if (itemsByKey.suggestedKeywords) {
      suggestion = JSON.parse(itemsByKey.suggestedKeywords);
    }
  } catch {}

  const hasAdCopy = adTitle1 || adDesc1;
  const hasKeywords = suggestion && (suggestion.mainKeywords?.length > 0 || suggestion.longTailKeywords?.length > 0);

  if (!hasAdCopy && !hasKeywords) return null;

  const grouped = suggestion?.grouped || {};

  return (
    <div style={{ border: "1px solid #ddd", borderRadius: 12, padding: 20, background: "#fafafa" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <h2 style={{ margin: 0, fontSize: 18, fontWeight: 800 }}>
          AI提案（最新Run結果）
        </h2>
        <div style={{ display: "flex", gap: 10 }}>
          <Link
            href={`/projects/${projectId}/runs/${runId}`}
            style={{ fontSize: 12, color: "blue", textDecoration: "underline" }}
          >
            Run詳細
          </Link>
          <Link
            href={`/projects/${projectId}/apply?scope=PPC&autorun=1`}
            style={{ fontSize: 12, color: "blue", textDecoration: "underline" }}
          >
            再実行して反映
          </Link>
        </div>
      </div>

      {/* Google広告文プレビュー */}
      {hasAdCopy && (
        <div style={{ marginBottom: 20, padding: 16, background: "#fff", borderRadius: 8, border: "1px solid #e5e7eb" }}>
          <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 12, color: "#1a56db" }}>
            Google広告文（提案）
          </div>

          {targetKw && (
            <div style={{ fontSize: 12, color: "#666", marginBottom: 8 }}>
              ターゲットKW: <strong>{targetKw}</strong>
            </div>
          )}

          {/* 広告プレビュー風 */}
          <div style={{ padding: 12, border: "1px solid #dadce0", borderRadius: 8, background: "#fff" }}>
            <div style={{ fontSize: 14, color: "#1a0dab", fontWeight: 500, lineHeight: 1.4 }}>
              {[adTitle1, adTitle2, adTitle3].filter(Boolean).join(" | ")}
            </div>
            <div style={{ fontSize: 12, color: "#006621", marginTop: 2 }}>
              広告 - example.com
            </div>
            <div style={{ fontSize: 13, color: "#4d5156", marginTop: 4, lineHeight: 1.5 }}>
              {adDesc1}
              {adDesc2 && <> {adDesc2}</>}
            </div>
          </div>

          {/* 個別フィールド */}
          <div style={{ marginTop: 12, display: "grid", gap: 6, fontSize: 12 }}>
            {[
              ["見出し1", adTitle1],
              ["見出し2", adTitle2],
              ["見出し3", adTitle3],
              ["説明文1", adDesc1],
              ["説明文2", adDesc2],
            ]
              .filter(([, v]) => v)
              .map(([label, value]) => (
                <div key={label} style={{ display: "flex", gap: 8 }}>
                  <span style={{ fontWeight: 700, minWidth: 60, color: "#666" }}>{label}:</span>
                  <span>{value}</span>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* キーワード提案 */}
      {hasKeywords && (
        <div>
          <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 8 }}>
            キーワード提案
          </div>
          {suggestion?.summary && (
            <p style={{ fontSize: 12, color: "#666", margin: "0 0 12px" }}>{suggestion.summary}</p>
          )}

          <div style={{ display: "grid", gap: 10 }}>
            {Object.entries(CATEGORY_LABELS).map(([cat, info]) => {
              const keywords = grouped[cat] || [];
              if (keywords.length === 0) return null;
              return (
                <div key={cat}>
                  <span
                    style={{
                      display: "inline-block",
                      padding: "2px 8px",
                      borderRadius: 4,
                      background: info.color,
                      color: "#fff",
                      fontSize: 11,
                      fontWeight: 700,
                      marginBottom: 6,
                    }}
                  >
                    {info.label}
                  </span>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 4 }}>
                    {keywords.map((kw, i) => {
                      const volIcon = kw.volumeRisk === "high" ? "\u{1F7E2}" : kw.volumeRisk === "low" ? "\u{1F534}" : "\u{1F7E1}";
                      const matchLabel = kw.matchType === "exact" ? "完全" : kw.matchType === "phrase" ? "フレーズ" : "部分";
                      return (
                        <span
                          key={i}
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 4,
                            padding: "4px 10px",
                            borderRadius: 6,
                            background: kw.volumeRisk === "low" ? "#fef2f2" : "#f3f4f6",
                            border: `1px solid ${kw.volumeRisk === "low" ? "#fecaca" : "#e5e7eb"}`,
                            fontSize: 12,
                            opacity: kw.volumeRisk === "low" ? 0.7 : 1,
                          }}
                          title={`${kw.reason} / ${matchLabel}一致 / ボリューム${volIcon}`}
                        >
                          <span style={{ fontSize: 10 }}>{volIcon}</span>
                          {kw.keyword}
                          <span
                            style={{
                              fontSize: 10,
                              fontWeight: 700,
                              color: "#fff",
                              background: info.color,
                              borderRadius: 3,
                              padding: "1px 4px",
                            }}
                          >
                            {kw.score}
                          </span>
                          <span style={{ fontSize: 9, color: "#888" }}>{matchLabel}</span>
                        </span>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>

          {/* 除外KW */}
          {suggestion?.negativeKeywords && suggestion.negativeKeywords.length > 0 && (
            <div style={{ marginTop: 12, padding: 10, background: "#fef2f2", borderRadius: 6, border: "1px solid #fecaca" }}>
              <span style={{ fontWeight: 700, color: "#991b1b", fontSize: 12 }}>除外推奨: </span>
              {suggestion.negativeKeywords.map((kw, i) => (
                <span key={i} style={{ fontSize: 12, color: "#991b1b", textDecoration: "line-through", marginRight: 8 }}>
                  {kw}
                </span>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
