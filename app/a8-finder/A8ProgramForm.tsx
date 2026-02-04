"use client";

import { useRef } from "react";

const categories = [
  "美容・健康",
  "金融・保険",
  "転職・求人",
  "教育・資格",
  "恋愛・婚活",
  "通信・回線",
  "食品・グルメ",
  "ファッション",
  "住宅・不動産",
  "車・バイク",
  "旅行・レジャー",
  "ペット",
  "その他",
];

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "8px 12px",
  border: "1px solid #ddd",
  borderRadius: "4px",
  fontSize: "14px",
};

const labelStyle: React.CSSProperties = {
  display: "block",
  fontSize: "12px",
  fontWeight: "bold",
  marginBottom: "4px",
  color: "#333",
};

interface Props {
  action: (formData: FormData) => Promise<void>;
  defaultValues?: {
    programId?: string;
    programName?: string;
    advertiserName?: string;
    category?: string;
    reward?: number;
    rewardType?: string;
    approvalRate?: number | null;
    epc?: number | null;
    cookieDays?: number | null;
    notes?: string;
    lpUrl?: string;
  };
}

export default function A8ProgramForm({ action, defaultValues }: Props) {
  const formRef = useRef<HTMLFormElement>(null);

  async function handleSubmit(formData: FormData) {
    await action(formData);
    formRef.current?.reset();
  }

  return (
    <form ref={formRef} action={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
      <div>
        <label style={labelStyle}>案件名 *</label>
        <input
          name="programName"
          required
          defaultValue={defaultValues?.programName}
          style={inputStyle}
          placeholder="例: 〇〇サプリ無料モニター"
        />
      </div>

      <div>
        <label style={labelStyle}>カテゴリ *</label>
        <select
          name="category"
          required
          defaultValue={defaultValues?.category || ""}
          style={inputStyle}
        >
          <option value="">選択してください</option>
          {categories.map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </select>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
        <div>
          <label style={labelStyle}>報酬単価（円） *</label>
          <input
            name="reward"
            type="number"
            required
            min="0"
            defaultValue={defaultValues?.reward}
            style={inputStyle}
            placeholder="例: 3000"
          />
        </div>
        <div>
          <label style={labelStyle}>報酬タイプ</label>
          <select
            name="rewardType"
            defaultValue={defaultValues?.rewardType || "fixed"}
            style={inputStyle}
          >
            <option value="fixed">定額</option>
            <option value="percent">定率（%）</option>
          </select>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
        <div>
          <label style={labelStyle}>承認率（%）</label>
          <input
            name="approvalRate"
            type="number"
            min="0"
            max="100"
            step="0.1"
            defaultValue={defaultValues?.approvalRate ?? ""}
            style={inputStyle}
            placeholder="例: 75"
          />
        </div>
        <div>
          <label style={labelStyle}>EPC（円）</label>
          <input
            name="epc"
            type="number"
            min="0"
            step="0.01"
            defaultValue={defaultValues?.epc ?? ""}
            style={inputStyle}
            placeholder="例: 85.5"
          />
        </div>
      </div>

      <div>
        <label style={labelStyle}>Cookie有効日数</label>
        <input
          name="cookieDays"
          type="number"
          min="0"
          defaultValue={defaultValues?.cookieDays ?? ""}
          style={inputStyle}
          placeholder="例: 60"
        />
      </div>

      <div>
        <label style={labelStyle}>広告主名</label>
        <input
          name="advertiserName"
          defaultValue={defaultValues?.advertiserName}
          style={inputStyle}
          placeholder="例: 株式会社〇〇"
        />
      </div>

      <div>
        <label style={labelStyle}>A8案件ID</label>
        <input
          name="programId"
          defaultValue={defaultValues?.programId}
          style={inputStyle}
          placeholder="例: s00000012345001"
        />
      </div>

      <div>
        <label style={labelStyle}>LP URL</label>
        <input
          name="lpUrl"
          type="url"
          defaultValue={defaultValues?.lpUrl}
          style={inputStyle}
          placeholder="https://..."
        />
      </div>

      <div>
        <label style={labelStyle}>メモ</label>
        <textarea
          name="notes"
          defaultValue={defaultValues?.notes}
          style={{ ...inputStyle, minHeight: "60px", resize: "vertical" }}
          placeholder="案件の特徴や注意点など"
        />
      </div>

      <button
        type="submit"
        style={{
          padding: "12px",
          background: "#0066cc",
          color: "white",
          border: "none",
          borderRadius: "4px",
          fontSize: "14px",
          fontWeight: "bold",
          cursor: "pointer",
        }}
      >
        案件を追加
      </button>
    </form>
  );
}
