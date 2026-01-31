"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import Link from "next/link";

import {
  runResearchAndPreview,
  applyPreviewToProjectItems,
  type PreviewRow,
} from "@/app/actions/runToItems";
import { isEmptyLike, normalizeEmptyLike } from "@/lib/emptyLike";

// Inline type to avoid client/server module import issues
type SuggestedKeyword = {
  keyword: string;
  category: "purchase" | "compare" | "info" | "problem";
  score: number;
  reason: string;
  matchType?: "broad" | "phrase" | "exact";
  volumeRisk?: "high" | "medium" | "low";
};

type UiRow = PreviewRow & {
  selectableNow: boolean;
  lockReasonNow?: string;
};

type KeywordSuggestionData = {
  summary: string;
  mainKeywords: SuggestedKeyword[];
  longTailKeywords: SuggestedKeyword[];
  negativeKeywords: string[];
  grouped?: Record<string, SuggestedKeyword[]>;
};

export default function ApplyClient({
  projectId,
  scope,
  autorun,
}: {
  projectId: string;
  scope: string;
  autorun?: boolean;
}) {
  const [isPending, startTransition] = useTransition();

  const [raw, setRaw] = useState<any>(null);
  const [preview, setPreview] = useState<PreviewRow[]>([]);
  const [loaded, setLoaded] = useState(false);

  const [overwrite, setOverwrite] = useState(false);
  const [checked, setChecked] = useState<Record<string, boolean>>({});

  const rows: UiRow[] = useMemo(() => {
    return preview.map((r) => {
      const curN = normalizeEmptyLike(r.currentValue);
      const propN = normalizeEmptyLike(r.proposedValue);

      const keyVal = String(r.key ?? "").trim();
      const keyMissing = !keyVal;

      const proposedEmpty = propN === "";
      const same = curN !== "" && curN === propN;

      let selectableNow = true;
      let lockReasonNow: string | undefined;

      if (keyMissing) {
        selectableNow = false;
        lockReasonNow = "テンプレ key 未設定（Run結果のマッピング先が不明）";
      } else if (proposedEmpty) {
        selectableNow = false;
        lockReasonNow = "提案値（Run）が空なので反映できません";
      } else if (same) {
        selectableNow = false;
        lockReasonNow = "現在値と提案値が同じです";
      } else if (!overwrite && curN !== "") {
        selectableNow = false;
        lockReasonNow = "安全モード：入力済み（overwrite ONで反映可）";
      }

      return { ...r, selectableNow, lockReasonNow };
    });
  }, [preview, overwrite]);

  const summary = useMemo(() => {
    const total = rows.length;
    const selectable = rows.filter((r) => r.selectableNow).length;
    const keyMissing = rows.filter((r) => !String(r.key ?? "").trim()).length;
    const proposedEmpty = rows.filter((r) => normalizeEmptyLike(r.proposedValue) === "").length;
    const filled = rows.filter((r) => normalizeEmptyLike(r.currentValue) !== "").length;
    const same = rows.filter((r) => {
      const a = normalizeEmptyLike(r.currentValue);
      const b = normalizeEmptyLike(r.proposedValue);
      return a !== "" && a === b;
    }).length;

    return { total, selectable, keyMissing, proposedEmpty, filled, same };
  }, [rows]);

  const selectedCount = useMemo(() => {
    let n = 0;
    for (const r of rows) if (checked[r.templateId]) n++;
    return n;
  }, [rows, checked]);

  async function refreshPreview(doRun: boolean) {
    const res = await runResearchAndPreview({ projectId, scope, doRun });

    setRaw(res.raw);
    setPreview(res.preview);

    const init: Record<string, boolean> = {};
    for (const r of res.preview) init[r.templateId] = false;
    setChecked(init);

    setLoaded(true);
  }

  function loadLatestOnly() {
    startTransition(async () => {
      await refreshPreview(false);
    });
  }

  function doRun() {
    startTransition(async () => {
      await refreshPreview(true);
    });
  }

  useEffect(() => {
    if (autorun) doRun();
    else loadLatestOnly();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autorun, projectId, scope]);

  useEffect(() => {
    if (overwrite) return;
    const next = { ...checked };
    let changed = false;

    for (const r of rows) {
      const curN = normalizeEmptyLike(r.currentValue);
      if (curN !== "" && next[r.templateId]) {
        next[r.templateId] = false;
        changed = true;
      }
    }
    if (changed) setChecked(next);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [overwrite, rows]);

  function toggleRow(templateId: string, v: boolean) {
    setChecked((prev) => ({ ...prev, [templateId]: v }));
  }

  function selectAllSelectable() {
    const next: Record<string, boolean> = { ...checked };
    for (const r of rows) next[r.templateId] = r.selectableNow;
    setChecked(next);
  }

  function clearAll() {
    const next: Record<string, boolean> = { ...checked };
    for (const k of Object.keys(next)) next[k] = false;
    setChecked(next);
  }

  function applySelected() {
    const selectedTemplateIds = rows
      .filter((r) => Boolean(checked[r.templateId]))
      .map((r) => r.templateId);

    if (selectedTemplateIds.length === 0) return;

    startTransition(async () => {
      const res = await applyPreviewToProjectItems({
        projectId,
        scope,
        overwrite,

        selectedTemplateIds,
        selections: selectedTemplateIds,

        preview: rows.map((r) => ({
          templateId: r.templateId,
          label: r.label,
          type: r.type,
          order: r.order,
          proposedValue: r.proposedValue,
          currentValue: r.currentValue,
          key: r.key ?? null,
          selected: Boolean(checked[r.templateId]),
        })),
      });

      await refreshPreview(false);
      alert(`反映: ${res.applied} / スキップ: ${res.skipped}`);
    });
  }

  const runId = raw?.runId ? String(raw.runId) : "";

  if (!loaded) {
    return (
      <div style={{ padding: 16 }}>
        <div style={{ fontWeight: 800 }}>読み込み中...</div>
      </div>
    );
  }

  return (
    <div style={{ padding: 16, display: "grid", gap: 12 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
        <div>
          <div style={{ fontSize: 18, fontWeight: 800 }}>Run → プレビュー → 選択して反映（安全版）</div>
          <div style={{ fontSize: 12, opacity: 0.8 }}>空扱い: 空/—/-/null/undefined（0 は空扱いしません）</div>

          {raw?.at && (
            <div style={{ fontSize: 12, opacity: 0.8 }}>
              last run: {String(raw.at)}
              {runId ? (
                <>
                  {" / "}
                  <Link href={`/projects/${projectId}/runs/${runId}`} style={{ textDecoration: "underline" }}>
                    このRun詳細
                  </Link>
                </>
              ) : null}
              {" / "}
              <Link href={`/projects/${projectId}/runs`} style={{ textDecoration: "underline" }}>
                Run履歴
              </Link>
              {" / "}
              <Link href={`/projects/${projectId}/runs/manual?scope=${encodeURIComponent(scope)}`} style={{ textDecoration: "underline" }}>
                手動Run作成
              </Link>
            </div>
          )}

          {raw?.status === "error" && raw?.errorMessage && (
            <div style={{ fontSize: 12, color: "#991b1b", fontWeight: 800 }}>Runエラー: {String(raw.errorMessage)}</div>
          )}
        </div>

        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <Link href={`/projects/${projectId}`} style={{ textDecoration: "underline" }}>
            詳細へ戻る
          </Link>
          <Link href={`/projects/${projectId}/export?scope=${encodeURIComponent(scope)}`} style={{ textDecoration: "underline" }}>
            Exportへ
          </Link>
        </div>
      </div>

      <div style={{ padding: 12, border: "1px solid #ddd", borderRadius: 10, display: "grid", gap: 10 }}>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
          <b>
            反映可能: {summary.selectable} / {summary.total}
          </b>
          <span style={{ opacity: 0.8 }}>
            入力済み: {summary.filled} / key未設定: {summary.keyMissing} / 提案空: {summary.proposedEmpty} / 同値: {summary.same}
          </span>
        </div>

        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
          <button onClick={doRun} disabled={isPending}>
            Runしてプレビュー更新（Run発火）
          </button>

          <button onClick={loadLatestOnly} disabled={isPending}>
            最新Runを読むだけ（Runしない）
          </button>

          <label style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <input type="checkbox" checked={overwrite} onChange={(e) => setOverwrite(e.target.checked)} disabled={isPending} />
            <b>上書き（overwrite）: {overwrite ? "ON" : "OFF"}</b>
            <span style={{ fontSize: 12, opacity: 0.8 }}>OFF: 空欄だけ / ON: 既存値も上書き（提案空・同値は選べない）</span>
          </label>

          <button onClick={selectAllSelectable} disabled={isPending || preview.length === 0}>
            選べる行だけ全選択
          </button>
          <button onClick={clearAll} disabled={isPending || preview.length === 0}>
            全解除
          </button>

          <button
            onClick={applySelected}
            disabled={isPending || selectedCount === 0}
            style={{ fontWeight: 800, opacity: selectedCount === 0 ? 0.5 : 1 }}
          >
            選択分を反映（{selectedCount}件）
          </button>
        </div>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "44px 1.6fr 1fr 1fr",
          gap: 12,
          padding: "10px 12px",
          borderBottom: "1px solid #eee",
          fontWeight: 800,
        }}
      >
        <div />
        <div>項目</div>
        <div>現在値</div>
        <div>提案値（Run）</div>
      </div>

      <div style={{ display: "grid", gap: 0 }}>
        {rows.map((r) => {
          const keyVal = String(r.key ?? "").trim();
          const disabled = !r.selectableNow;

          return (
            <div
              key={r.templateId}
              style={{
                display: "grid",
                gridTemplateColumns: "44px 1.6fr 1fr 1fr",
                gap: 12,
                padding: "14px 12px",
                borderBottom: "1px solid #f2f2f2",
                alignItems: "start",
                opacity: disabled ? 0.75 : 1,
              }}
            >
              <div style={{ display: "flex", justifyContent: "center" }}>
                <input
                  type="checkbox"
                  checked={Boolean(checked[r.templateId])}
                  disabled={disabled || isPending}
                  onChange={(e) => toggleRow(r.templateId, e.target.checked)}
                  title={r.lockReasonNow ?? ""}
                />
              </div>

              <div style={{ display: "grid", gap: 4 }}>
                <div style={{ fontWeight: 800 }}>{r.label}</div>
                <div style={{ fontSize: 12, opacity: 0.8 }}>
                  key: {keyVal || "（未設定）"} / type: {r.type} / order: {r.order}
                </div>
              </div>

              <div style={{ whiteSpace: "pre-wrap" }}>
                {isEmptyLike(r.currentValue) ? <span style={{ opacity: 0.6 }}>（空）</span> : r.currentValue}
              </div>

              <div style={{ whiteSpace: "pre-wrap" }}>
                {isEmptyLike(r.proposedValue) ? <span style={{ opacity: 0.6 }}>（空）</span> : r.proposedValue}
              </div>
            </div>
          );
        })}
      </div>

      {/* キーワード提案セクション */}
      <KeywordSuggestionSection raw={raw} />
    </div>
  );
}

/**
 * キーワード提案表示コンポーネント
 */
function KeywordSuggestionSection({ raw }: { raw: any }) {
  const suggestion = useMemo((): KeywordSuggestionData | null => {
    try {
      // resultJson.itemsByKey に保存されている
      const itemsByKey = raw?.resultJson?.itemsByKey;
      if (!itemsByKey?.suggestedKeywords) return null;
      return JSON.parse(itemsByKey.suggestedKeywords);
    } catch {
      return null;
    }
  }, [raw]);

  if (!suggestion) return null;

  const categoryLabels: Record<string, { label: string; color: string; description: string }> = {
    purchase: { label: "購入意図", color: "#22c55e", description: "CV率が高い、購入直前のユーザー向け" },
    compare: { label: "比較検討", color: "#3b82f6", description: "情報収集段階、比較を求めるユーザー向け" },
    info: { label: "情報収集", color: "#8b5cf6", description: "認知拡大、初期段階のユーザー向け" },
    problem: { label: "課題解決", color: "#f59e0b", description: "特定の悩みを持つユーザー向け" },
  };

  const grouped = suggestion.grouped || {};

  return (
    <div style={{ marginTop: 24, padding: 20, border: "1px solid #ddd", borderRadius: 12, background: "#fafafa" }}>
      <div style={{ marginBottom: 16 }}>
        <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800, display: "flex", alignItems: "center", gap: 8 }}>
          キーワード提案
          <span style={{ fontSize: 12, fontWeight: 400, opacity: 0.7 }}>（サイト内容から自動生成・商標なし）</span>
        </h3>
        <p style={{ margin: "8px 0 0", fontSize: 13, opacity: 0.8 }}>{suggestion.summary}</p>
      </div>

      {/* カテゴリ別キーワード */}
      <div style={{ display: "grid", gap: 16 }}>
        {Object.entries(categoryLabels).map(([cat, info]) => {
          const keywords = grouped[cat] || [];
          if (keywords.length === 0) return null;

          return (
            <div key={cat} style={{ background: "#fff", borderRadius: 8, padding: 16, border: "1px solid #eee" }}>
              <div style={{ marginBottom: 12, display: "flex", alignItems: "center", gap: 8 }}>
                <span
                  style={{
                    display: "inline-block",
                    padding: "4px 10px",
                    borderRadius: 4,
                    background: info.color,
                    color: "#fff",
                    fontSize: 12,
                    fontWeight: 700,
                  }}
                >
                  {info.label}
                </span>
                <span style={{ fontSize: 12, opacity: 0.7 }}>{info.description}</span>
              </div>

              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {keywords.map((kw, idx) => (
                  <KeywordChip key={idx} keyword={kw} color={info.color} />
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* 除外キーワード（商標） */}
      {suggestion.negativeKeywords && suggestion.negativeKeywords.length > 0 && (
        <div style={{ marginTop: 16, padding: 16, background: "#fef2f2", borderRadius: 8, border: "1px solid #fecaca" }}>
          <div style={{ marginBottom: 8, fontWeight: 700, color: "#991b1b", fontSize: 14 }}>
            除外推奨キーワード（商標・ブランド名）
          </div>
          <div style={{ fontSize: 13, opacity: 0.9 }}>
            以下のキーワードは商標を含むため、広告配信では除外してください：
          </div>
          <div style={{ marginTop: 8, display: "flex", flexWrap: "wrap", gap: 6 }}>
            {suggestion.negativeKeywords.map((kw, idx) => (
              <span
                key={idx}
                style={{
                  display: "inline-block",
                  padding: "4px 10px",
                  borderRadius: 4,
                  background: "#fee2e2",
                  color: "#991b1b",
                  fontSize: 12,
                  textDecoration: "line-through",
                }}
              >
                {kw}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* 活用ガイド */}
      <div style={{ marginTop: 16, padding: 12, background: "#eff6ff", borderRadius: 8, border: "1px solid #bfdbfe" }}>
        <div style={{ fontWeight: 700, color: "#1e40af", fontSize: 13, marginBottom: 8 }}>活用ガイド</div>
        <ul style={{ margin: 0, paddingLeft: 20, fontSize: 12, color: "#1e40af", lineHeight: 1.8 }}>
          <li>「購入意図」のKWをGoogle広告のメインキーワードに設定</li>
          <li>「比較検討」「課題解決」のKWを広告グループの拡張用に使用</li>
          <li>スコアが高いほどCV期待度が高い（目安）</li>
          <li>除外キーワードは広告の除外設定に追加推奨</li>
        </ul>
      </div>
    </div>
  );
}

/**
 * キーワードチップ表示
 */
const VOLUME_ICONS: Record<string, { icon: string; label: string; color: string }> = {
  high: { icon: "\u{1F7E2}", label: "高", color: "#16a34a" },
  medium: { icon: "\u{1F7E1}", label: "中", color: "#ca8a04" },
  low: { icon: "\u{1F534}", label: "低", color: "#dc2626" },
};

const MATCH_LABELS: Record<string, string> = {
  broad: "部分一致",
  phrase: "フレーズ一致",
  exact: "完全一致",
};

function KeywordChip({ keyword, color }: { keyword: SuggestedKeyword; color: string }) {
  const [showDetail, setShowDetail] = useState(false);
  const vol = VOLUME_ICONS[keyword.volumeRisk || "medium"];
  const matchLabel = MATCH_LABELS[keyword.matchType || "broad"];

  // Google Ads入稿用フォーマット
  const adsFormat =
    keyword.matchType === "exact"
      ? `[${keyword.keyword}]`
      : keyword.matchType === "phrase"
        ? `"${keyword.keyword}"`
        : keyword.keyword;

  return (
    <div style={{ position: "relative" }}>
      <button
        onClick={() => setShowDetail(!showDetail)}
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
          padding: "6px 12px",
          borderRadius: 6,
          background: keyword.volumeRisk === "low" ? "#fef2f2" : "#f3f4f6",
          border: `1px solid ${keyword.volumeRisk === "low" ? "#fecaca" : "#e5e7eb"}`,
          cursor: "pointer",
          fontSize: 13,
          fontWeight: 500,
          opacity: keyword.volumeRisk === "low" ? 0.7 : 1,
        }}
      >
        <span style={{ fontSize: 10 }}>{vol.icon}</span>
        <span>{keyword.keyword}</span>
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            height: 18,
            padding: "0 4px",
            borderRadius: 4,
            background: color,
            color: "#fff",
            fontSize: 10,
            fontWeight: 700,
          }}
        >
          {keyword.score}
        </span>
      </button>

      {showDetail && (
        <div
          style={{
            position: "absolute",
            top: "100%",
            left: 0,
            marginTop: 4,
            padding: 12,
            background: "#fff",
            borderRadius: 6,
            boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
            zIndex: 10,
            minWidth: 260,
            fontSize: 12,
          }}
        >
          <div style={{ fontWeight: 700, marginBottom: 6 }}>{keyword.keyword}</div>
          <div style={{ opacity: 0.8, marginBottom: 8 }}>{keyword.reason}</div>
          <div style={{ display: "grid", gap: 4, fontSize: 11, color: "#555" }}>
            <div>スコア: {keyword.score}/100</div>
            <div>推奨マッチタイプ: <strong>{matchLabel}</strong></div>
            <div>検索ボリューム: <span style={{ color: vol.color, fontWeight: 700 }}>{vol.icon} {vol.label}</span></div>
            <div style={{ marginTop: 4, padding: "4px 8px", background: "#f3f4f6", borderRadius: 4, fontFamily: "monospace" }}>
              入稿用: {adsFormat}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
