// app/types/researchPreview.ts
export type ResearchScope = string;

export type RunRawResult = {
  status: string; // "ok" | "error" など（既存に合わせて）
  projectId: string;
  scope: ResearchScope;
  at: string; // ISO
  result: Record<string, unknown>;
  scores?: Record<string, unknown>;
};

export type PreviewRow = {
  // テンプレ側
  templateId: string;
  templateKey: string;
  templateLabel: string;

  // 値
  proposedValue: string; // Run結果からの提案（表示用に文字列化済）
  currentValue: string;  // DBにある現在値（表示用に文字列化済）

  // 安全版（overwrite=false）で選べるか
  canSelectInSafeMode: boolean;
  safeLockReason?: string; // 選べない理由（UIに表示）
};

export type ApplySelection = {
  templateId: string;
  value: string;
};

export type RunAndPreviewResponse = {
  raw: RunRawResult;
  preview: PreviewRow[];
};
