"use client";

import React, { useMemo, useState, useTransition } from "react";
import {
  saveResearchItemTemplatesAdmin,
  type TemplateRow,
} from "@/app/actions/researchItems";

type Row = TemplateRow & { id?: string };

export default function TemplateManager({
  scope,
  initialTemplates,
}: {
  scope: string;
  initialTemplates: Array<{
    id: string;
    label: string;
    type: any;
    order: number;
    isActive: boolean;
  }>;
}) {
  const [rows, setRows] = useState<Row[]>(() =>
    (initialTemplates ?? [])
      .slice()
      .sort((a, b) => a.order - b.order)
      .map((t, idx) => ({
        id: t.id,
        label: t.label,
        type: (t.type ?? "text") as Row["type"],
        order: typeof t.order === "number" ? t.order : idx,
        isActive: !!t.isActive,
      }))
  );

  const [isPending, startTransition] = useTransition();
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const normalized = useMemo(
    () =>
      rows
        .slice()
        .sort((a, b) => a.order - b.order)
        .map((r, idx) => ({
          ...r,
          order: idx,
          label: (r.label ?? "").trim(),
        })),
    [rows]
  );

  const addRow = () => {
    setRows((prev) => [
      ...prev,
      {
        label: "",
        type: "text",
        order: prev.length,
        isActive: true,
      },
    ]);
  };

  const removeRowSoft = (index: number) => {
    // 物理削除しない：無効化運用
    setRows((prev) =>
      prev.map((r, i) => (i === index ? { ...r, isActive: false } : r))
    );
  };

  const reviveRow = (index: number) => {
    setRows((prev) =>
      prev.map((r, i) => (i === index ? { ...r, isActive: true } : r))
    );
  };

  const move = (from: number, to: number) => {
    setRows((prev) => {
      if (to < 0 || to >= prev.length) return prev;
      const copy = prev.slice().sort((a, b) => a.order - b.order);
      const [picked] = copy.splice(from, 1);
      copy.splice(to, 0, picked);
      return copy.map((x, idx) => ({ ...x, order: idx }));
    });
  };

  const update = (index: number, patch: Partial<Row>) => {
    setRows((prev) => {
      const sorted = prev.slice().sort((a, b) => a.order - b.order);
      return sorted.map((r, i) => (i === index ? { ...r, ...patch } : r));
    });
  };

  const save = () => {
    setError(null);
    setSavedAt(null);

    startTransition(async () => {
      try {
        // 空label行は弾く（UI側でも最低限）
        const payload = normalized.filter((r) => r.label.length > 0);
        await saveResearchItemTemplatesAdmin(scope, payload);
        setSavedAt(new Date().toLocaleString());
      } catch (e: any) {
        setError(e?.message ?? "保存に失敗しました");
      }
    });
  };

  const sorted = rows.slice().sort((a, b) => a.order - b.order);

  return (
    <div style={{ display: "grid", gap: 12 }}>
      <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
        <button type="button" onClick={addRow} style={btnOutline} disabled={isPending}>
          ＋ 追加
        </button>

        <button type="button" onClick={save} style={btnPrimary} disabled={isPending}>
          {isPending ? "保存中..." : "保存"}
        </button>

        {savedAt && <span style={{ fontSize: 12, color: "#0a7" }}>保存しました：{savedAt}</span>}
        {error && <span style={{ fontSize: 12, color: "#c00" }}>エラー：{error}</span>}

        <span style={{ fontSize: 12, color: "#6b7280" }}>
          ※ label重複はNG（保存時に弾く）
        </span>
      </div>

      <div style={{ display: "grid", gap: 10 }}>
        {sorted.map((r, idx) => (
          <div key={r.id ?? `new-${idx}`} style={card}>
            <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
              <button type="button" onClick={() => move(idx, idx - 1)} style={miniBtn} disabled={isPending}>
                ↑
              </button>
              <button type="button" onClick={() => move(idx, idx + 1)} style={miniBtn} disabled={isPending}>
                ↓
              </button>

              <label style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <input
                  type="checkbox"
                  checked={r.isActive}
                  onChange={(e) => update(idx, { isActive: e.target.checked })}
                  disabled={isPending}
                />
                <span style={{ fontSize: 12, fontWeight: 800 }}>
                  {r.isActive ? "有効" : "無効"}
                </span>
              </label>

              <select
                value={r.type}
                onChange={(e) => update(idx, { type: e.target.value as Row["type"] })}
                style={{ height: 34 }}
                disabled={isPending}
              >
                <option value="text">text</option>
                <option value="url">url</option>
                <option value="number">number</option>
                <option value="money">money</option>
                <option value="note">note</option>
              </select>

              <input
                placeholder="テンプレ名（例：ターゲットKW）"
                value={r.label}
                onChange={(e) => update(idx, { label: e.target.value })}
                style={{ flex: 1, height: 34, padding: "0 10px", minWidth: 240 }}
                disabled={isPending}
              />

              {r.isActive ? (
                <button type="button" onClick={() => removeRowSoft(idx)} style={btnDangerSoft} disabled={isPending}>
                  無効化
                </button>
              ) : (
                <button type="button" onClick={() => reviveRow(idx)} style={btnOutline} disabled={isPending}>
                  復活
                </button>
              )}
            </div>

            <div style={{ marginTop: 8, fontSize: 12, color: "#6b7280" }}>
              order: {idx} / id: {r.id ?? "(new)"}
            </div>
          </div>
        ))}
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
  fontWeight: 900,
  cursor: "pointer",
};

const btnOutline: React.CSSProperties = {
  padding: "10px 14px",
  borderRadius: 10,
  border: "1px solid #111",
  background: "#fff",
  color: "#111",
  fontWeight: 900,
  cursor: "pointer",
};

const btnDangerSoft: React.CSSProperties = {
  padding: "10px 14px",
  borderRadius: 10,
  border: "1px solid #c00",
  background: "#fff",
  color: "#c00",
  fontWeight: 900,
  cursor: "pointer",
};

const miniBtn: React.CSSProperties = {
  width: 34,
  height: 34,
  borderRadius: 10,
  border: "1px solid #111",
  background: "#fff",
  cursor: "pointer",
  fontWeight: 900,
};

const card: React.CSSProperties = {
  border: "1px solid #e5e7eb",
  padding: 12,
  borderRadius: 12,
  background: "#fff",
};
