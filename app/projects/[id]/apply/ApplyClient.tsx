"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import Link from "next/link";

import {
  runResearchAndPreview,
  applyPreviewToProjectItems,
  type PreviewRow,
} from "@/app/actions/runToItems";
import { isEmptyLike, normalizeEmptyLike } from "@/lib/emptyLike";

type UiRow = PreviewRow & {
  selectableNow: boolean;
  lockReasonNow?: string;
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
    </div>
  );
}
