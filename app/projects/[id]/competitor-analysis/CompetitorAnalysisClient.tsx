"use client";

import { useState, useTransition } from "react";
import { analyzeMultipleLps } from "@/app/actions/competitorAnalysis";
import type { LpStructure } from "@/lib/research/competitorAnalyzer";

type AnalysisResult = {
  results: LpStructure[];
  comparison: {
    bestPractices: string[];
    improvements: string[];
    avgScores: LpStructure["scores"];
  };
};

export default function CompetitorAnalysisClient({ projectId }: { projectId: string }) {
  const [isPending, startTransition] = useTransition();
  const [urls, setUrls] = useState<string[]>(["", "", ""]);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  function updateUrl(index: number, value: string) {
    const newUrls = [...urls];
    newUrls[index] = value;
    setUrls(newUrls);
  }

  function addUrlField() {
    if (urls.length < 5) {
      setUrls([...urls, ""]);
    }
  }

  function analyze() {
    const validUrls = urls.filter(u => u.trim());
    if (validUrls.length === 0) {
      setError("URLを入力してください");
      return;
    }

    startTransition(async () => {
      try {
        setError(null);
        const result = await analyzeMultipleLps(validUrls);
        setAnalysis(result);
      } catch (e) {
        setError(e instanceof Error ? e.message : "分析に失敗しました");
      }
    });
  }

  return (
    <div>
      {/* URL入力 */}
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: 16, marginBottom: 12 }}>競合LP URL（最大5件）</h2>
        <div style={{ display: "grid", gap: 8 }}>
          {urls.map((url, i) => (
            <input
              key={i}
              type="url"
              value={url}
              onChange={(e) => updateUrl(i, e.target.value)}
              placeholder={`競合LP ${i + 1} の URL`}
              style={{
                padding: "10px 14px",
                border: "1px solid #ddd",
                borderRadius: 6,
                fontSize: 14,
              }}
            />
          ))}
        </div>
        <div style={{ marginTop: 12, display: "flex", gap: 12 }}>
          {urls.length < 5 && (
            <button
              onClick={addUrlField}
              style={{
                padding: "8px 16px",
                background: "#f3f4f6",
                border: "1px solid #e5e7eb",
                borderRadius: 6,
                cursor: "pointer",
              }}
            >
              + URL追加
            </button>
          )}
          <button
            onClick={analyze}
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
            {isPending ? "分析中..." : "分析開始"}
          </button>
        </div>
      </div>

      {error && (
        <div style={{ padding: 12, background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 8, marginBottom: 20, color: "#991b1b" }}>
          {error}
        </div>
      )}

      {/* 分析結果 */}
      {analysis && (
        <div style={{ display: "grid", gap: 20 }}>
          {/* 比較サマリー */}
          <div style={{ padding: 20, background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 12 }}>
            <h3 style={{ margin: "0 0 16px", fontSize: 16 }}>分析サマリー</h3>

            {/* 平均スコア */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 12, marginBottom: 16 }}>
              <ScoreCard label="CTA視認性" score={analysis.comparison.avgScores.ctaVisibility} />
              <ScoreCard label="コンテンツ充実度" score={analysis.comparison.avgScores.contentDepth} />
              <ScoreCard label="信頼構築" score={analysis.comparison.avgScores.trustBuilding} />
              <ScoreCard label="緊急性演出" score={analysis.comparison.avgScores.urgencyLevel} />
              <ScoreCard label="総合" score={analysis.comparison.avgScores.overall} highlight />
            </div>

            {/* ベストプラクティス */}
            {analysis.comparison.bestPractices.length > 0 && (
              <div style={{ marginBottom: 12 }}>
                <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 6 }}>競合が採用しているベストプラクティス</div>
                <ul style={{ margin: 0, paddingLeft: 20, fontSize: 13 }}>
                  {analysis.comparison.bestPractices.map((bp, i) => (
                    <li key={i}>{bp}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* 改善提案 */}
            {analysis.comparison.improvements.length > 0 && (
              <div>
                <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 6, color: "#dc2626" }}>改善提案</div>
                <ul style={{ margin: 0, paddingLeft: 20, fontSize: 13, color: "#dc2626" }}>
                  {analysis.comparison.improvements.map((imp, i) => (
                    <li key={i}>{imp}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* 個別LP分析 */}
          <h3 style={{ margin: 0, fontSize: 16 }}>個別LP分析</h3>
          {analysis.results.map((lp, i) => (
            <LpAnalysisCard key={i} lp={lp} index={i + 1} />
          ))}
        </div>
      )}
    </div>
  );
}

function ScoreCard({ label, score, highlight }: { label: string; score: number; highlight?: boolean }) {
  const color = score >= 70 ? "#22c55e" : score >= 40 ? "#eab308" : "#ef4444";

  return (
    <div
      style={{
        textAlign: "center",
        padding: 12,
        background: highlight ? "#fff" : "#f9fafb",
        borderRadius: 8,
        border: highlight ? "2px solid #22c55e" : "1px solid #e5e7eb",
      }}
    >
      <div style={{ fontSize: 11, color: "#666", marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 24, fontWeight: 800, color }}>{score}</div>
    </div>
  );
}

function LpAnalysisCard({ lp, index }: { lp: LpStructure; index: number }) {
  const [expanded, setExpanded] = useState(false);

  if (lp.fetchError) {
    return (
      <div style={{ padding: 16, background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 8 }}>
        <div style={{ fontWeight: 700, color: "#991b1b" }}>LP {index}: 取得エラー</div>
        <div style={{ fontSize: 12, color: "#991b1b" }}>{lp.url}</div>
        <div style={{ fontSize: 12, marginTop: 8 }}>{lp.fetchError}</div>
      </div>
    );
  }

  return (
    <div style={{ border: "1px solid #e5e7eb", borderRadius: 12, overflow: "hidden" }}>
      {/* ヘッダー */}
      <div
        style={{
          padding: 16,
          background: "#f9fafb",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          cursor: "pointer",
        }}
        onClick={() => setExpanded(!expanded)}
      >
        <div>
          <div style={{ fontWeight: 700, fontSize: 14 }}>LP {index}: {lp.title || "(タイトルなし)"}</div>
          <div style={{ fontSize: 12, color: "#666", marginTop: 4 }}>{lp.url}</div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div
            style={{
              width: 50,
              height: 50,
              borderRadius: "50%",
              background: lp.scores.overall >= 70 ? "#22c55e" : lp.scores.overall >= 40 ? "#eab308" : "#ef4444",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "white",
              fontWeight: 800,
              fontSize: 18,
            }}
          >
            {lp.scores.overall}
          </div>
          <span style={{ fontSize: 20 }}>{expanded ? "▲" : "▼"}</span>
        </div>
      </div>

      {/* 詳細 */}
      {expanded && (
        <div style={{ padding: 16, display: "grid", gap: 16 }}>
          {/* スコア */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8 }}>
            <ScoreCard label="CTA視認性" score={lp.scores.ctaVisibility} />
            <ScoreCard label="コンテンツ" score={lp.scores.contentDepth} />
            <ScoreCard label="信頼構築" score={lp.scores.trustBuilding} />
            <ScoreCard label="緊急性" score={lp.scores.urgencyLevel} />
          </div>

          {/* 構造 */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <div>
              <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 8 }}>ヘッドライン</div>
              <div style={{ fontSize: 13, background: "#f3f4f6", padding: 12, borderRadius: 6 }}>
                {lp.heroHeadline || "(なし)"}
              </div>
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 8 }}>メトリクス</div>
              <div style={{ fontSize: 12, display: "grid", gap: 4 }}>
                <div>文字数: {lp.wordCount.toLocaleString()}</div>
                <div>画像数: {lp.imageCount}</div>
                <div>セクション数: {lp.sectionCount}</div>
                <div>CTA数: {lp.ctaCount}</div>
              </div>
            </div>
          </div>

          {/* 構造フラグ */}
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <Tag label="フローティングCTA" active={lp.hasFloatingCta} />
            <Tag label="比較表" active={lp.hasComparisonTable} />
            <Tag label="価格表示" active={lp.hasPriceDisplay} />
            <Tag label="口コミ" active={lp.hasTestimonials} />
            <Tag label="FAQ" active={lp.hasFaq} />
          </div>

          {/* CTA */}
          {lp.ctaTexts.length > 0 && (
            <div>
              <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 8 }}>CTA文言</div>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                {lp.ctaTexts.map((cta, i) => (
                  <span
                    key={i}
                    style={{
                      padding: "4px 10px",
                      background: "#dbeafe",
                      borderRadius: 4,
                      fontSize: 12,
                    }}
                  >
                    {cta}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* 訴求ポイント */}
          {lp.appealPoints.length > 0 && (
            <div>
              <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 8 }}>訴求ポイント</div>
              <ul style={{ margin: 0, paddingLeft: 20, fontSize: 12 }}>
                {lp.appealPoints.map((ap, i) => (
                  <li key={i}>{ap}</li>
                ))}
              </ul>
            </div>
          )}

          {/* 信頼シグナル */}
          {lp.trustSignals.length > 0 && (
            <div>
              <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 8 }}>信頼シグナル</div>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                {lp.trustSignals.map((ts, i) => (
                  <span
                    key={i}
                    style={{
                      padding: "4px 10px",
                      background: "#dcfce7",
                      borderRadius: 4,
                      fontSize: 12,
                    }}
                  >
                    {ts}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function Tag({ label, active }: { label: string; active: boolean }) {
  return (
    <span
      style={{
        padding: "4px 10px",
        borderRadius: 4,
        fontSize: 11,
        fontWeight: 600,
        background: active ? "#dcfce7" : "#f3f4f6",
        color: active ? "#166534" : "#9ca3af",
      }}
    >
      {active ? "✓" : "✗"} {label}
    </span>
  );
}
