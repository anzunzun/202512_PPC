import type { ResearchProvider } from "@/lib/research/types";

export const demoProvider: ResearchProvider = {
  id: "demo",
  version: 1,
  async run({ projectId }) {
    const short = projectId.slice(0, 6);

    const scores = {
      totalScore: 72,
      adPolicyRisk: 18,
      trademarkRisk: 9,
      bridgePageRisk: 13,
    };

    const kv = {
      targetKw: `demo_kw_${short}`,
      referenceUrl: `https://example.com/${short}`,
      conversion: "1.2%",
      clicks: "120",
      pv: "980",
      totalScore: String(scores.totalScore),
      adPolicyRisk: String(scores.adPolicyRisk),
      trademarkRisk: String(scores.trademarkRisk),
      bridgePageRisk: String(scores.bridgePageRisk),
    };

    return { kv, scores, meta: { short } };
  },
};
