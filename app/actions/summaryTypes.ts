export type SummaryTemplateMeta = {
    templateId: string;
    label: string;
    order: number;
  };
  
  export type ProjectResearchSummaryRow = {
    projectId: string;
    projectName: string;
    updatedAt: Date | null;
    summary: Array<{
      templateId: string;
      label: string;
      value: string;
    }>;
  };
  