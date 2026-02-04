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

// 外部からの不定形データ用の型
type UnknownRecord = Record<string, unknown>;

/**
 * 外部/LLM/スクレイピング等で揺れるキー名を吸収して、
 * テンプレkeyに厳密一致する形へ正規化する。
 */
export function normalizeRunResult(input: unknown): NormalizedRunResult {
  const src = (input ?? {}) as UnknownRecord;
  const r = (src.result ?? src ?? {}) as UnknownRecord;
  const s = (src.scores ?? src.score ?? src.metrics ?? {}) as UnknownRecord;

  const pickString = (obj: UnknownRecord, keys: string[]): string | undefined => {
    for (const k of keys) {
      const v = obj?.[k];
      if (v !== undefined && v !== null && String(v).trim() !== "") {
        return String(v);
      }
    }
    return undefined;
  };

  const pickNumeric = (obj: UnknownRecord, keys: string[]): number | string | undefined => {
    for (const k of keys) {
      const v = obj?.[k];
      if (v !== undefined && v !== null && String(v).trim() !== "") {
        return typeof v === "number" ? v : String(v);
      }
    }
    return undefined;
  };

  return {
    result: {
      conversion: pickString(r, ["conversion", "cv", "conversions"]),
      targetKw: pickString(r, ["targetKw", "targetKW", "target_kw", "keyword", "targetKeyword"]),
      referenceUrl: pickString(r, ["referenceUrl", "referenceURL", "reference_url", "url", "reference"]),
    },
    scores: {
      clicks: pickNumeric(s, ["clicks", "click"]),
      pv: pickNumeric(s, ["pv", "pageviews", "views", "impressions"]),
      totalScore: pickNumeric(s, ["totalScore", "total_score", "score"]),
      adPolicyRisk: pickString(s, ["adPolicyRisk", "ad_policy_risk", "policyRisk", "risk"]),
    },
  };
}
