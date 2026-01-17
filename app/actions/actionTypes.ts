// app/actions/actionTypes.ts

export type ProjectItemView = {
    templateId: string;
    label: string;
    type: "text" | "url" | "number" | "money" | "note";
    order: number;
    value: string;
  };
  
  // ===== テンプレ管理（Admin） =====
  export type TemplateRow = {
    id?: string;
    label: string;
    type: "text" | "url" | "number" | "money" | "note";
    order: number;
    isActive: boolean;
  };
  