"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { runResearchAndPreview, type PreviewRow } from "@/app/actions/runToItems";
import { createManualResearchRunAction } from "@/app/actions/manualRun";
import { normalizeEmptyLike } from "@/lib/emptyLike";

type FormRow = PreviewRow & {
  inputValue: string;
};

export default function ManualRunClient({
  projectId,
  scope,
}: {
  projectId: string;
  scope: string;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [loaded, setLoaded] = useState(false);
  const [raw, setRaw] = useState<any>(null);
  const [rows, setRows] = useState<FormRow[]>([]);

  const [note, setNote] = useState("");
  const [scores, setScores] = useState({
    totalScore: 0,
    adPolicyRisk: 0,
    trademarkRisk: 0,
    bridgePageRisk: 0,
  });

  useEffect(() => {
    startTransition(async () => {
      const res = await runResearchAndPreview({ projectId, scope, doRun: false });
      setRaw(res.raw);

      const initRows: FormRow[] = res.preview.map((r: PreviewRow) => ({
        ...r,
        inputValue: r.proposedValue ?? "",
      }));
      setRows(initRows);

      const find = (k: string) => {
        const row = initRows.find((x) => String(x.key || "") === k);
        return row ? Number.parseFloat(String(row.inputValue || "0")) : 0;
      };
      setScores({
        totalScore: Number.isFinite(find("totalScore")) ? find("totalScore") : 0,
        adPolicyRisk: Number.isFinite(find("adPolicyRisk")) ? find("adPolicyRisk") : 0,
        trademarkRisk: Number.isFinite(find("trademarkRisk")) ? find("trademarkRisk") : 0,
        bridgePageRisk: Number.isFinite(find("bridgePageRisk")) ? find("bridgePageRisk") : 0,
      });

      setLoaded(true);
    });
  }, [projectId, scope]);

  const keyMissingCount = useMemo(() => {
    return rows.filter((r) => !String(r.key ?? "").trim()).length;
  }, [rows]);

  function updateRow(templateId: string, value: string) {
    setRows((prev) =>
      prev.map((r) => (r.templateId === templateId ? { ...r, inputValue: value } : r))
    );
  }

  function fillFromCurrentValue() {
    setRows((prev) =>
      prev.map((r) => ({
        ...r,
        inputValue: normalizeEmptyLike(r.currentValue),
      }))
    );
  }

  function clearAll() {
    setRows((prev) => prev.map((r) => ({ ...r, inputValue: "" })));
  }

  async function saveManualRun() {
    startTransition(async () => {
      const kv: Record<string, string> = {};
      for (const r of rows) {
        const key = String(r.key ?? "").trim();
        if (!key) continue;
        kv[key] = normalizeEmptyLike(r.inputValue);
      }

      await createManualResearchRunAction({
        projectId,
        scope,
        kv,
        scores,
        note,
      });

      router.push(`/projects/${projectId}/apply?scope=${encodeURIComponent(scope)}`);
      router.refresh();
    });
  }

  return (
    <div style={{ display: "grid", gap: 12 }}>
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
        <Link href={`/projects/${projectId}`} style={{ textDecoration: "underline" }}>
          詳細へ戻る
        </Link>
        <Link href={`/projects/${projectId}/apply?scope=${encodeURIComponent(scope)}`} style={{ textDecoration: "underline" }}>
          Applyへ（反映）
        </Link>
        <Link href={`/projects/${projectId}/runs`} style={{ textDecoration: "underline" }}>
          Run履歴
        </Link>
      </div>

      <div style={{ padding: 12, border: "1px solid #ddd", borderRadius: 10, display: "grid", gap: 10 }}>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
          <b>scope: {scope}</b>
          <span style={{ color: keyMissingCount ? "#991b1b" : "#6b7280", fontWeight: 800 }}>
            key未設定: {keyMissingCount}（key無しは保存してもRun→Applyに出ません）
          </span>
          {raw?.runId ? (
            <span style={{ color: "#6b7280" }}>latest runId: {String(raw.runId)}</span>
          ) : (
            <span style={{ color: "#6b7280" }}>latest run: なし</span>
          )}
        </div>

        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
          <button onClick={fillFromCurrentValue} disabled={isPending || !loaded}>
            現在値で埋める
          </button>
          <button onClick={clearAll} disabled={isPending || !loaded}>
            全クリア
          </button>
          <button onClick={saveManualRun} disabled={isPending || !loaded} style={{ fontWeight: 900 }}>
            手動Runを保存
          </button>
        </div>

        <div style={{ display: "grid", gap: 8 }}>
          <div style={{ fontWeight: 900 }}>RiskScore（数値）</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            <label style={{ display: "grid", gap: 4 }}>
              <span style={{ fontSize: 12, color: "#6b7280" }}>totalScore</span>
              <input
                value={scores.totalScore}
                onChange={(e) => setScores((p) => ({ ...p, totalScore: Number(e.target.value || 0) }))}
                type="number"
                step="0.01"
                disabled={isPending}
              />
            </label>
            <label style={{ display: "grid", gap: 4 }}>
              <span style={{ fontSize: 12, color: "#6b7280" }}>adPolicyRisk</span>
              <input
                value={scores.adPolicyRisk}
                onChange={(e) => setScores((p) => ({ ...p, adPolicyRisk: Number(e.target.value || 0) }))}
                type="number"
                step="0.01"
                disabled={isPending}
              />
            </label>
            <label style={{ display: "grid", gap: 4 }}>
              <span style={{ fontSize: 12, color: "#6b7280" }}>trademarkRisk</span>
              <input
                value={scores.trademarkRisk}
                onChange={(e) => setScores((p) => ({ ...p, trademarkRisk: Number(e.target.value || 0) }))}
                type="number"
                step="0.01"
                disabled={isPending}
              />
            </label>
            <label style={{ display: "grid", gap: 4 }}>
              <span style={{ fontSize: 12, color: "#6b7280" }}>bridgePageRisk</span>
              <input
                value={scores.bridgePageRisk}
                onChange={(e) => setScores((p) => ({ ...p, bridgePageRisk: Number(e.target.value || 0) }))}
                type="number"
                step="0.01"
                disabled={isPending}
              />
            </label>
          </div>

          <label style={{ display: "grid", gap: 4 }}>
            <span style={{ fontSize: 12, color: "#6b7280" }}>note（任意）</span>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={3}
              disabled={isPending}
            />
          </label>
        </div>
      </div>

      <div style={{ border: "1px solid #eee", borderRadius: 10, overflow: "hidden" }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1.2fr 0.8fr 1fr",
            padding: 10,
            fontWeight: 900,
            background: "#fafafa",
          }}
        >
          <div>項目（label / key）</div>
          <div>現在値</div>
          <div>入力値（manual kv）</div>
        </div>

        {rows.map((r) => {
          const keyVal = String(r.key ?? "").trim();
          const keyMissing = !keyVal;

          return (
            <div
              key={r.templateId}
              style={{
                display: "grid",
                gridTemplateColumns: "1.2fr 0.8fr 1fr",
                padding: 10,
                borderTop: "1px solid #eee",
                alignItems: "start",
              }}
            >
              <div style={{ display: "grid", gap: 4 }}>
                <div style={{ fontWeight: 900 }}>{r.label}</div>
                <div style={{ fontSize: 12, color: keyMissing ? "#991b1b" : "#6b7280", fontWeight: 800 }}>
                  key: {keyMissing ? "（未設定）" : keyVal} / type: {r.type} / order: {r.order}
                </div>
                {keyMissing ? (
                  <div style={{ fontSize: 12, color: "#991b1b", fontWeight: 800 }}>
                    key未設定のため、この行は Run→Apply の提案値に出ません
                  </div>
                ) : null}
              </div>

              <div style={{ whiteSpace: "pre-wrap", color: "#111827" }}>
                {normalizeEmptyLike(r.currentValue) === "" ? (
                  <span style={{ opacity: 0.6 }}>（空）</span>
                ) : (
                  r.currentValue
                )}
              </div>

              <div style={{ display: "grid", gap: 6 }}>
                <textarea
                  value={r.inputValue}
                  onChange={(e) => updateRow(r.templateId, e.target.value)}
                  rows={2}
                  disabled={isPending}
                />
                <div style={{ fontSize: 12, color: "#6b7280" }}>
                  空扱いは Apply 側で弾く（manual run保存自体は可能）
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
