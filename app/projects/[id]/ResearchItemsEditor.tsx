"use client";

import { useMemo, useState, useTransition } from "react";
import { saveResearchItems } from "@/app/actions/research";

type Item = {
  id?: string;
  label: string;
  value: string;
  type: "text" | "url" | "number" | "money" | "note";
  order: number;
};

export default function ResearchItemsEditor({
  projectId,
  initialItems,
}: {
  projectId: string;
  initialItems: Item[];
}) {
  const [items, setItems] = useState<Item[]>(
    (initialItems ?? []).map((x, idx) => ({
      ...x,
      value: x.value ?? "",
      type: (x.type ?? "text") as Item["type"],
      order: x.order ?? idx,
    }))
  );

  const [isPending, startTransition] = useTransition();

  const nextOrder = useMemo(
    () => (items.length ? Math.max(...items.map((i) => i.order)) + 1 : 0),
    [items]
  );

  const addRow = () => {
    setItems((prev) => [
      ...prev,
      { label: "", value: "", type: "text", order: nextOrder },
    ]);
  };

  const removeRow = (index: number) => {
    setItems((prev) => prev.filter((_, i) => i !== index).map((x, idx) => ({ ...x, order: idx })));
  };

  const move = (from: number, to: number) => {
    setItems((prev) => {
      if (to < 0 || to >= prev.length) return prev;
      const copy = [...prev];
      const [picked] = copy.splice(from, 1);
      copy.splice(to, 0, picked);
      return copy.map((x, idx) => ({ ...x, order: idx }));
    });
  };

  const update = (index: number, patch: Partial<Item>) => {
    setItems((prev) =>
      prev.map((x, i) => (i === index ? { ...x, ...patch } : x))
    );
  };

  const save = () => {
    const normalized = items.map((x, idx) => ({ ...x, order: idx }));
    startTransition(async () => {
      await saveResearchItems(projectId, normalized);
    });
  };

  return (
    <div style={{ display: "grid", gap: 10 }}>
      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
        <button type="button" onClick={addRow} style={btnOutline}>
          ＋ 追加
        </button>
        <button type="button" onClick={save} disabled={isPending} style={btnPrimary}>
          {isPending ? "保存中..." : "保存"}
        </button>
        <span style={{ color: "#666", fontSize: 12 }}>
          （保存後に Ctrl+R で反映確認）
        </span>
      </div>

      <div style={{ display: "grid", gap: 10 }}>
        {items.map((item, idx) => (
          <div
            key={item.id ?? `new-${idx}`}
            style={{ border: "1px solid #ddd", padding: 10, borderRadius: 10 }}
          >
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <button type="button" onClick={() => move(idx, idx - 1)} style={miniBtn}>
                ↑
              </button>
              <button type="button" onClick={() => move(idx, idx + 1)} style={miniBtn}>
                ↓
              </button>

              <select
                value={item.type}
                onChange={(e) => update(idx, { type: e.target.value as Item["type"] })}
                style={{ height: 34 }}
              >
                <option value="text">text</option>
                <option value="url">url</option>
                <option value="number">number</option>
                <option value="money">money</option>
                <option value="note">note</option>
              </select>

              <input
                placeholder="項目名（例：ターゲットKW）"
                value={item.label}
                onChange={(e) => update(idx, { label: e.target.value })}
                style={{ flex: 1, height: 34, padding: "0 10px" }}
              />

              <button type="button" onClick={() => removeRow(idx)} style={btnDanger}>
                削除
              </button>
            </div>

            <textarea
              placeholder="内容"
              value={item.value}
              onChange={(e) => update(idx, { value: e.target.value })}
              style={{ width: "100%", marginTop: 8, minHeight: 90, padding: 10 }}
            />
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
  fontWeight: 800,
  cursor: "pointer",
};

const btnOutline: React.CSSProperties = {
  padding: "10px 14px",
  borderRadius: 10,
  border: "1px solid #111",
  background: "#fff",
  color: "#111",
  fontWeight: 800,
  cursor: "pointer",
};

const btnDanger: React.CSSProperties = {
  padding: "8px 10px",
  borderRadius: 10,
  border: "1px solid #c00",
  background: "#fff",
  color: "#c00",
  fontWeight: 800,
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
