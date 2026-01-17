/**
 * 広告ポリシーリスク判定ルール
 * 薬機法・景表法・誇大広告等のNGワード検出
 */

// リスクワードカテゴリ
type RiskCategory = {
  name: string;
  weight: number; // 1-10
  words: string[];
};

const RISK_CATEGORIES: RiskCategory[] = [
  {
    name: "効果保証",
    weight: 8,
    words: [
      "確実に",
      "必ず",
      "絶対",
      "100%",
      "間違いなく",
      "保証します",
      "効果保証",
      "返金保証なし", // 効果保証とセットで危険
    ],
  },
  {
    name: "収益誇張",
    weight: 9,
    words: [
      "簡単に稼げる",
      "不労所得",
      "副業で月収",
      "誰でも稼げる",
      "楽して稼ぐ",
      "1日5分で",
      "スマホだけで",
      "初心者でも月100万",
      "億り人",
      "秒速で",
    ],
  },
  {
    name: "健康誇大",
    weight: 10,
    words: [
      "痩せる",
      "治る",
      "効く",
      "完治",
      "根治",
      "若返り",
      "アンチエイジング効果",
      "癌が消える",
      "血糖値が下がる",
      "血圧が正常に",
    ],
  },
  {
    name: "金融詐欺",
    weight: 10,
    words: [
      "必ず儲かる",
      "元本保証",
      "絶対に損しない",
      "リスクなし",
      "ノーリスク",
      "年利50%",
      "確実に増える",
      "投資詐欺ではない",
    ],
  },
  {
    name: "緊急煽り",
    weight: 6,
    words: [
      "今だけ",
      "限定",
      "残りわずか",
      "先着",
      "本日限り",
      "急いで",
      "早い者勝ち",
      "在庫限り",
    ],
  },
  {
    name: "権威詐称",
    weight: 7,
    words: [
      "医師推奨",
      "専門家推薦",
      "芸能人愛用",
      "テレビで話題",
      "雑誌で紹介",
      "モンドセレクション",
      "売上No.1", // 根拠なしの場合
    ],
  },
  {
    name: "法的リスク",
    weight: 9,
    words: [
      "情報商材",
      "裏技",
      "非公開",
      "極秘",
      "内部情報",
      "インサイダー",
      "脱税",
      "節税スキーム",
    ],
  },
];

// URLパターンでのリスク検出
const RISKY_URL_PATTERNS = [
  { pattern: /bit\.ly|tinyurl|goo\.gl|t\.co/i, risk: 3, reason: "短縮URL" },
  { pattern: /click|track|aff|ref=/i, risk: 2, reason: "アフィリエイト風" },
  { pattern: /landing|lp\d|promo/i, risk: 1, reason: "LP風URL" },
];

export type AdPolicyRiskResult = {
  score: number; // 0-100
  level: "low" | "medium" | "high" | "critical";
  matchedCategories: Array<{
    name: string;
    matchedWords: string[];
    contribution: number;
  }>;
  urlRisks: string[];
};

/**
 * 広告ポリシーリスクを算出
 * @param text ページテキスト（title + body等）
 * @param url URL
 * @returns リスクスコア (0-100, 高いほど危険)
 */
export function calcAdPolicyRisk(
  text: string,
  url: string
): AdPolicyRiskResult {
  const normalizedText = normalizeText(text);
  const matchedCategories: AdPolicyRiskResult["matchedCategories"] = [];
  let totalScore = 0;

  // カテゴリごとにマッチング
  for (const cat of RISK_CATEGORIES) {
    const matched: string[] = [];
    for (const word of cat.words) {
      if (normalizedText.includes(normalizeText(word))) {
        matched.push(word);
      }
    }

    if (matched.length > 0) {
      // マッチ数 × 重み で加算（上限あり）
      const contribution = Math.min(matched.length * cat.weight, 25);
      totalScore += contribution;
      matchedCategories.push({
        name: cat.name,
        matchedWords: matched,
        contribution,
      });
    }
  }

  // URLリスク
  const urlRisks: string[] = [];
  for (const p of RISKY_URL_PATTERNS) {
    if (p.pattern.test(url)) {
      totalScore += p.risk;
      urlRisks.push(p.reason);
    }
  }

  // 上限100
  const score = Math.min(totalScore, 100);

  // レベル判定
  let level: AdPolicyRiskResult["level"];
  if (score >= 70) level = "critical";
  else if (score >= 40) level = "high";
  else if (score >= 20) level = "medium";
  else level = "low";

  return { score, level, matchedCategories, urlRisks };
}

/**
 * シンプルなスコアのみ返す
 */
export function calcAdPolicyRiskScore(text: string, url: string): number {
  return calcAdPolicyRisk(text, url).score;
}

function normalizeText(s: string): string {
  return String(s ?? "")
    .toLowerCase()
    .replace(/\s+/g, "")
    .replace(/[！!？?。、,\.]/g, "");
}
