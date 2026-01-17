"use client";

import { useMemo, useState, useTransition } from "react";
import { saveProjectListSummaryTemplateIds } from "@/app/actions/projectListSummaryConfig";

type TemplateMeta = {
  templateId: string;
  label: string;
  order: number;
};

const styles: Record<string, React.CSSProperties> = {
  box: {
    border: "1px solid #eee",
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
    background: "#fff",
  },
  row: { display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" },
  pill: {
    display: "inline-block",
    padding: "2px 8px",
    border: "1px solid #ddd",
    borderRadius: 999,
    fontSize: 12,
    color: "#555",
    background: "#fafafa",
  },
  textarea: {
    width: "100%",
    minHeight: 68,
    padding: 10,
    borderRadius: 8,
    border: "1px solid #ddd",
    fontFamily:
      'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
    fontSize: 12,
  },
  btn: {
    padding: "8px 10px",
    borderRadius: 8,
    border: "1px solid #ddd",
    background: "#fff",
    cursor: "pointer",
    fontSize: 13,
  },
  btnPrimary: {
    padding: "8px 10px",
    borderRadius: 8,
    border: "1px solid #333",
    background: "#333",
    color: "#fff",
    cursor: "pointer",
    fontSize: 13,
  },
  muted: { color: "#666", fontSize: 12, lineHeight: 1.6, marginTop: 6 },
  pre: {
    width: "100%",
    padding: 10,
    borderRadius: 8,
    border: "1px solid #ddd",
    background: "#fafafa",
    fontFamily:
      'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
    fontSize: 12,
    whiteSpace: "pre-wrap",
    margin: 0,
    userSelect: "text",
  },
};

function parseIds(text: string): string[] {
  return Array.from(
    new Set(
      text
        .split(/[\n,\t ]+/g)
        .map((s) => s.trim())
        .filter(Boolean)
    )
  );
}

export default function SummaryConfigEditor(props: {
  scope: string;
  currentTemplateIds: string[];
  resolvedTemplates: TemplateMeta[];
}) {
  const { scope, currentTemplateIds, resolvedTemplates } = props;

  // currentTemplateIds が変わった時に textarea を更新したいなら useEffect だが、
  // 今回は「ユーザー入力を勝手に消さない」を優先して初期値固定にする
  const initialText = useMemo(() => currentTemplateIds.join("\n"), []);
  const [text, setText] = useState(initialText);
  const [isPending, startTransition] = useTransition();
  const [savedAt, setSavedAt] = useState<string>("");

  const idsFromResolved = useMemo(
    () => resolvedTemplates.map((t) => t.templateId).filter(Boolean),
    [resolvedTemplates]
  );

  const resolvedLines = useMemo(() => {
    return resolvedTemplates
      .map((t) => `${t.templateId}  # ${t.label}`)
      .join("\n");
  }, [resolvedTemplates]);

  const fillFromResolved = () => {
    const idsOnly = idsFromResolved.join("\n");
    setText(idsOnly);
  };

  const save = () => {
    const ids = parseIds(text);
    startTransition(async () => {
      await saveProjectListSummaryTemplateIds({ scope, templateIds: ids });
      setSavedAt(new Date().toLocaleString("ja-JP"));
    });
  };

  const copyResolvedToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(idsFromResolved.join("\n"));
    } catch {
      // クリップボード権限が無い環境は無視（手動コピペでOK）
    }
  };

  return (
    <div style={styles.box}>
      <div style={styles.row}>
        <span style={styles.pill}>サマリ設定（DB保存）</span>
        <span style={styles.pill}>scope: {scope}</span>
        <span style={styles.pill}>
          現在: {currentTemplateIds.length ? "ID固定モード" : "未設定（labelから自動解決中）"}
        </span>
        {savedAt && <span style={styles.pill}>保存: {savedAt}</span>}
      </div>

      <div style={{ marginTop: 10 }}>
        <div style={{ fontWeight: 700, marginBottom: 6 }}>templateId を貼って保存</div>

        <textarea
          style={styles.textarea}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={`例）\nxxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx\nyyyyyyyy-yyyy-yyyy-yyyy-yyyyyyyyyyyy`}
        />

        <div style={styles.row}>
          <button
            type="button"
            style={styles.btn}
            disabled={isPending || idsFromResolved.length === 0}
            onClick={fillFromResolved}
          >
            いま表示中の列のIDを自動入力
          </button>

          <button
            type="button"
            style={styles.btn}
            disabled={isPending || idsFromResolved.length === 0}
            onClick={copyResolvedToClipboard}
          >
            IDをコピー
          </button>

          <button type="button" style={styles.btnPrimary} disabled={isPending} onClick={save}>
            {isPending ? "保存中…" : "保存"}
          </button>
        </div>

        <div style={styles.muted}>
          ✅ 一度保存すれば、以後は label を変更しても一覧サマリは壊れません。
        </div>

        {currentTemplateIds.length === 0 && resolvedTemplates.length > 0 && (
          <div style={{ marginTop: 10 }}>
            <div style={{ fontWeight: 700, marginBottom: 6 }}>
              いま自動解決できているテンプレ（参考）
            </div>
            <pre style={styles.pre}>{resolvedLines}</pre>
          </div>
        )}
      </div>
    </div>
  );
}
