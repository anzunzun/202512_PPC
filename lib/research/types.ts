export type ResearchRunInput = {
  projectId: string;
  scope: string; // e.g. "PPC"
};

export type ResearchKv = Record<string, string>;

export type ResearchScores = {
  totalScore: number;
  adPolicyRisk: number;
  trademarkRisk: number;
  bridgePageRisk: number;
};

export type ProviderOutput = {
  kv: ResearchKv; // template.key で引ける
  scores: ResearchScores;
  meta?: Record<string, unknown>;
};

export type ResearchProvider = {
  id: string; // "demo" | "manual" | ...
  version: number;
  run: (input: ResearchRunInput) => Promise<ProviderOutput>;
};
