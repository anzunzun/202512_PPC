"use client";

import React, { useEffect, useMemo, useState, useTransition } from "react";
import {
  saveProjectResearchItems,
  type ProjectItemView,
} from "@/app/actions/researchItems";

type Row = ProjectItemView;

/**
 * UIが「空っぽ」を見せるために出しがちな記号を、入力/保存の観点では空扱いにする
 * ※「— が残って安全版で選べない」系の根本対策
 */
function normalizeEmptyLike(input: unknown): string {
  const t = String(input ?? "").trim();

  const empties = new Set([
    "",
    "—",
    "–",
    "―",
    "-",
    "ー",
    "null",
    "undefined",
  ]);

  if (empties.has(t)) return "";
  return t;
}

/** 初期表示用：DBに残ってしまった “—” 等があっても UI では空欄に見せる */
function normalizeForDisplay(rows: Row[]) {
  return rows
    .slice()
    .sort((a, b) => a.order - b.order)
    .map((r) => ({
      ...r,
      value: normalizeEmptyLike(r.value),
    }));
}

/** 保存用： “—” 等を空に寄せて server action に渡す（＝DBに残らない） */
function normalizeForSave(rows: Row[]) {
  return rows
    .slice()
    .sort((a, b) => a.order - b.order)
    .map((r) => ({
      templateId: r.templateId,
      value: normalizeEmptyLike(r.value ?? ""),
    }));
}

function stableKey(payload: Array<{ templateId: string; value: string }>) {
  // 並びは normalizeForSave 側で安定してる前提
  return JSON.stringify(payload);
}

export default function ResearchItemsEditor({
  projectId,
  initialItems,
}: {
  projectId: string;
  initialItems: Row[];
}) {
  // ★初期描画時点で “—” 等を空欄に寄せる（表示上の事故防止）
  const initialSorted = useMemo(
    () => normalizeForDisplay(initialItems ?? []),
    [initialItems]
  );

  const [rows, setRows] = useState<Row[]>(() => initialSorted);

  const [isPending, startTransition] = useTransition();
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // 「保存済みの基準」：初期値から始めて、保存成功したら更新する
  const [baselineKey, setBaselineKey] = useState<string>(() =>
    stableKey(normalizeForSave(initialSorted))
  );

  const normalized = useMemo(() => normalizeForSave(rows), [rows]);
  const currentKey = useMemo(() => stableKey(normalized), [normalized]);
  const isDirty = useMemo(
    () => currentKey !== baselineKey,
    [currentKey, baselineKey]
  );

  // initialItems が変わったときの同期
  // - 未保存(isDirty) があるときは上書きしない（事故防止）
  // - 未保存が無いなら、テンプレ増減/並び替えを即反映
  useEffect(() => {
    if (isDirty) return;

    setRows(initialSorted);
    setBaselineKey(stableKey(normalizeForSave(initialSorted)));
    setError(null);
    setSavedAt(null);
  }, [initialSorted, isDirty]);

  const updateValue = (templateId: string, value: string) => {
    setRows((prev) =>
      prev.map((r) => (r.templateId === templateId ? { ...r, value } : r))
    );
    // 編集した瞬間に「保存しました」を消す（誤認防止）
    setSavedAt(null);
    setError(null);
  };

  const clearValue = (templateId: string) => {
    updateValue(templateId, "");
  };

  const save = () => {
    if (isPending) return;

    setError(null);
    setSavedAt(null);

    startTransition(async () => {
      try {
        // normalized は “—” 等を空に寄せた payload
        await saveProjectResearchItems(projectId, normalized, "PPC");

        const now = new Date().toLocaleString();
        setSavedAt(now);

        // ★ 保存成功したら「今の値」を基準にする
        setBaselineKey(stableKey(normalized));
      } catch (e: any) {
        setError(e?.message ?? "保存に失敗しました");
      }
    });
  };

  return (
    <div style={{ display: "grid", gap: 10 }}>
      <div
        style={{
          display: "flex",
          gap: 10,
          alignItems: "center",
          flexWrap: "wrap",
        }}
      >
        <button
          type="button"
          onClick={save}
          disabled={isPending || !isDirty}
          style={{
            ...btnPrimary,
            opacity: isPending || !isDirty ? 0.6 : 1,
            cursor: isPending || !isDirty ? "not-allowed" : "pointer",
          }}
          title={!isDirty ? "変更がないので保存不要です" : undefined}
        >
          {isPending ? "保存中..." : isDirty ? "保存" : "保存済み"}
        </button>

        <span style={{ color: "#666", fontSize: 12 }}>
          （保存後に Ctrl+R で反映確認）
        </span>

        {savedAt && (
          <span style={{ fontSize: 12, color: "#0a7" }}>
            保存しました：{savedAt}
          </span>
        )}
        {error && (
          <span style={{ fontSize: 12, color: "#c00" }}>エラー：{error}</span>
        )}
        {!error && !savedAt && isDirty && (
          <span style={{ fontSize: 12, color: "#b45309" }}>
            未保存の変更があります
          </span>
        )}

        <span style={{ fontSize: 12, color: "#666" }}>
          ※「— / - / 全角ダッシュ」だけの入力は自動で空欄扱い
        </span>
      </div>

      <div style={{ display: "grid", gap: 10 }}>
        {rows
          .slice()
          .sort((a, b) => a.order - b.order)
          .map((r) => {
            const displayValue = normalizeEmptyLike(r.value);
            const hasValue = displayValue !== "";

            return (
              <div
                key={r.templateId}
                style={{
                  border: "1px solid #ddd",
                  padding: 10,
                  borderRadius: 10,
                }}
              >
                <div
                  style={{
                    display: "flex",
                    gap: 8,
                    alignItems: "center",
                    justifyContent: "space-between",
                    flexWrap: "wrap",
                  }}
                >
                  <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                    <div style={{ fontWeight: 800, minWidth: 160 }}>{r.label}</div>
                    <div style={{ fontSize: 12, color: "#666" }}>type: {r.type}</div>
                    <div
                      style={{
                        fontSize: 12,
                        color: hasValue ? "#065f46" : "#6b7280",
                        fontWeight: 700,
                      }}
                    >
                      {hasValue ? "入力あり" : "空欄"}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => clearValue(r.templateId)}
                    disabled={isPending || !hasValue}
                    style={{
                      ...btnGhost,
                      opacity: isPending || !hasValue ? 0.5 : 1,
                      cursor: isPending || !hasValue ? "not-allowed" : "pointer",
                    }}
                    title={!hasValue ? "すでに空欄です" : "この項目を空欄に戻す（保存で削除扱い）"}
                  >
                    クリア
                  </button>
                </div>

                <textarea
                  placeholder="内容（空欄にしたい場合は何も入れない）"
                  value={displayValue}
                  onChange={(e) => updateValue(r.templateId, e.target.value)}
                  onBlur={(e) => {
                    // ★ “—” 等だけ貼られても、フォーカス外したら自動で空欄にする
                    const v = normalizeEmptyLike(e.target.value);
                    if (v !== e.target.value) updateValue(r.templateId, v);
                  }}
                  disabled={isPending}
                  style={{
                    width: "100%",
                    marginTop: 8,
                    minHeight: 90,
                    padding: 10,
                    opacity: isPending ? 0.7 : 1,
                  }}
                />
              </div>
            );
          })}
      </div>
    </div>
  );
}

const btnPrimary: React.CSSProperties = {
  padding: "10px 14px",
  borderRadius: 10,
  border: "1px solid #111",
  background: "#111",
  color: "#fff",
  fontWeight: 800,
};

const btnGhost: React.CSSProperties = {
  padding: "8px 10px",
  borderRadius: 10,
  border: "1px solid #ddd",
  background: "#fff",
  color: "#111",
  fontWeight: 800,
};
