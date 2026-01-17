export type NormalizedRunResult = {
  result: {
    conversion?: string;
    targetKw?: string;
    referenceUrl?: string;
  };
  scores: {
    clicks?: number | string;
    pv?: number | string;
    totalScore?: number | string;
    adPolicyRisk?: string;
  };
};

/**
 * 外部/LLM/スクレイピング等で揺れるキー名を吸収して、
 * テンプレkeyに厳密一致する形へ正規化する。
 */
export function normalizeRunResult(input: any): NormalizedRunResult {
  const src = input ?? {};
  const r = src.result ?? src ?? {};
  const s = src.scores ?? src.score ?? src.metrics ?? {};

  const pick = (obj: any, keys: string[]) => {
    for (const k of keys) {
      const v = obj?.[k];
      if (v !== undefined && v !== null && String(v).trim() !== "") return v;
    }
    return undefined;
  };

  return {
    result: {
      conversion: pick(r, ["conversion", "cv", "conversions"]),
      targetKw: pick(r, ["targetKw", "targetKW", "target_kw", "keyword", "targetKeyword"]),
      referenceUrl: pick(r, ["referenceUrl", "referenceURL", "reference_url", "url", "reference"]),
    },
    scores: {
      clicks: pick(s, ["clicks", "click"]),
      pv: pick(s, ["pv", "pageviews", "views", "impressions"]),
      totalScore: pick(s, ["totalScore", "total_score", "score"]),
      adPolicyRisk: pick(s, ["adPolicyRisk", "ad_policy_risk", "policyRisk", "risk"]),
    },
  };
}
