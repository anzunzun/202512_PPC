/**
 * キーワード提案エンジン v2
 *
 * 設計方針:
 * - Google Adsで「検索ボリュームが少ない」にならない短い一般KWを優先
 * - 1〜2語のKWをメインに、3語以上は「フレーズ一致」推奨で低ボリュームリスク表示
 * - 商標なし（憲法準拠）
 * - マッチタイプ推奨を付与
 */

import type { ScrapedData } from "./scraper";
import { TRADEMARK_CATEGORIES } from "./rules/trademarkRules";

export type MatchType = "broad" | "phrase" | "exact";

export type SuggestedKeyword = {
  keyword: string;
  category: "purchase" | "compare" | "info" | "problem";
  score: number; // 0-100 推定効果スコア
  reason: string;
  matchType: MatchType;
  volumeRisk: "high" | "medium" | "low"; // 検索ボリューム推定（high=ボリュームあり）
};

export type KeywordSuggestionResult = {
  mainKeywords: SuggestedKeyword[];
  longTailKeywords: SuggestedKeyword[];
  negativeKeywords: string[];
  summary: string;
};

/**
 * 検索ボリュームが存在しやすい一般KWパターン
 * - 1語 or 2語のシンプルなKWを中心に
 * - Google Adsで実際に配信可能なレベル
 */
const HIGH_VOLUME_PATTERNS: Record<string, Array<{
  suffix: string;
  category: "purchase" | "compare" | "info" | "problem";
  score: number;
  matchType: MatchType;
  reason: string;
}>> = {
  // 単語のみ（最もボリュームが大きい）
  solo: [
    { suffix: "", category: "purchase", score: 95, matchType: "broad", reason: "最も検索ボリュームが大きい。部分一致で幅広くリーチ" },
  ],
  // 2語（高ボリューム帯）
  purchase: [
    { suffix: "通販", category: "purchase", score: 90, matchType: "phrase", reason: "購入意図が明確。通販系KWは安定したボリュームがある" },
    { suffix: "おすすめ", category: "purchase", score: 88, matchType: "phrase", reason: "購入直前の比較段階。高ボリューム" },
    { suffix: "人気", category: "purchase", score: 87, matchType: "phrase", reason: "購入検討中のユーザー。安定ボリューム" },
    { suffix: "安い", category: "purchase", score: 85, matchType: "phrase", reason: "価格重視の購入意図。ボリュームあり" },
    { suffix: "プレゼント", category: "purchase", score: 84, matchType: "phrase", reason: "ギフト需要。季節変動あるが高ボリューム" },
  ],
  compare: [
    { suffix: "比較", category: "compare", score: 82, matchType: "phrase", reason: "比較検討段階。CV率は中程度だがボリューム安定" },
    { suffix: "選び方", category: "compare", score: 78, matchType: "phrase", reason: "情報収集〜購入の中間。記事系LPと相性良い" },
    { suffix: "違い", category: "compare", score: 75, matchType: "phrase", reason: "比較意図。LP内で差異を説明できれば効果的" },
  ],
  problem: [
    { suffix: "口コミ", category: "problem", score: 80, matchType: "phrase", reason: "購入前の不安解消。高ボリューム" },
    { suffix: "評判", category: "problem", score: 78, matchType: "phrase", reason: "購入前の確認行動。ボリューム安定" },
  ],
};

/**
 * ジャンル横断で使える高ボリューム単独KW
 * これらは product を含まず、単独で部分一致で使える
 */
const GENERIC_HIGH_VOLUME_KW: Record<string, Array<{
  keyword: string;
  category: "purchase" | "compare" | "info" | "problem";
  score: number;
  reason: string;
}>> = {
  アクセサリー: [
    { keyword: "ペアリング", category: "purchase", score: 92, reason: "単独で月間検索数万。部分一致で高リーチ" },
    { keyword: "ペアネックレス", category: "purchase", score: 90, reason: "単独で月間検索数千。購入意図が強い" },
    { keyword: "ペアブレスレット", category: "purchase", score: 88, reason: "単独でボリュームあり。購入意図が強い" },
    { keyword: "カップル アクセサリー", category: "purchase", score: 86, reason: "2語で安定ボリューム。ターゲットが明確" },
    { keyword: "記念日 プレゼント", category: "purchase", score: 85, reason: "ギフト需要。季節問わず安定" },
    { keyword: "ペア お揃い", category: "purchase", score: 83, reason: "2語で安定ボリューム" },
  ],
  ギフト: [
    { keyword: "プレゼント 彼氏", category: "purchase", score: 91, reason: "月間検索数万。ギフト系の王道KW" },
    { keyword: "プレゼント 彼女", category: "purchase", score: 91, reason: "月間検索数万。ギフト系の王道KW" },
    { keyword: "誕生日プレゼント", category: "purchase", score: 90, reason: "単独で高ボリューム" },
    { keyword: "クリスマスプレゼント", category: "purchase", score: 88, reason: "季節KWだがピーク時は超高ボリューム" },
    { keyword: "記念日 ギフト", category: "purchase", score: 84, reason: "通年で安定したボリューム" },
  ],
  ファッション: [
    { keyword: "メンズ アクセサリー", category: "purchase", score: 87, reason: "性別指定で安定ボリューム" },
    { keyword: "レディース アクセサリー", category: "purchase", score: 87, reason: "性別指定で安定ボリューム" },
  ],
  素材: [
    { keyword: "ステンレス アクセサリー", category: "info", score: 75, reason: "素材指定。アレルギー対応で需要あり" },
    { keyword: "金属アレルギー対応", category: "problem", score: 80, reason: "悩み系で安定ボリューム。CV率も高い" },
  ],
};

export function suggestKeywords(
  scraped: ScrapedData,
  customProductName?: string
): KeywordSuggestionResult {
  const productCategories = detectProductCategories(scraped);
  const mainProduct = customProductName || extractMainProduct(scraped, productCategories);
  const negativeKeywords = detectTrademarkKeywords(scraped);

  const mainKeywords: SuggestedKeyword[] = [];
  const longTailKeywords: SuggestedKeyword[] = [];

  // 1. 商品名単独（部分一致）- 最もボリュームが大きい
  for (const p of HIGH_VOLUME_PATTERNS.solo) {
    mainKeywords.push({
      keyword: mainProduct,
      category: p.category,
      score: p.score,
      reason: p.reason,
      matchType: p.matchType,
      volumeRisk: "high",
    });
  }

  // 2. 商品名 + 高ボリューム接尾語（2語）
  for (const group of [HIGH_VOLUME_PATTERNS.purchase, HIGH_VOLUME_PATTERNS.compare, HIGH_VOLUME_PATTERNS.problem]) {
    for (const p of group) {
      mainKeywords.push({
        keyword: `${mainProduct} ${p.suffix}`,
        category: p.category,
        score: p.score,
        reason: p.reason,
        matchType: p.matchType,
        volumeRisk: estimateVolumeRisk(mainProduct, p.suffix),
      });
    }
  }

  // 3. ジャンル別の高ボリューム単独KW
  for (const cat of productCategories) {
    const generics = GENERIC_HIGH_VOLUME_KW[cat] || [];
    for (const g of generics) {
      // 商標チェック
      if (negativeKeywords.some((neg) => g.keyword.toLowerCase().includes(neg.toLowerCase()))) continue;

      longTailKeywords.push({
        keyword: g.keyword,
        category: g.category,
        score: g.score,
        reason: g.reason,
        matchType: g.keyword.includes(" ") ? "phrase" : "broad",
        volumeRisk: g.keyword.includes(" ") ? "medium" : "high",
      });
    }
  }

  // 重複排除
  const seen = new Set<string>();
  const dedup = (arr: SuggestedKeyword[]) =>
    arr.filter((kw) => {
      const k = kw.keyword.toLowerCase().trim();
      if (seen.has(k)) return false;
      seen.add(k);
      return true;
    });

  const dedupedMain = dedup(mainKeywords);
  const dedupedLong = dedup(longTailKeywords);

  const summary = [
    `「${mainProduct}」の広告配信用キーワードを提案。`,
    `部分一致・フレーズ一致を推奨（完全一致は低ボリュームリスクあり）。`,
    `商標KWは除外済み。`,
    `ボリューム: 🟢高 🟡中 🔴低`,
  ].join(" ");

  return {
    mainKeywords: dedupedMain,
    longTailKeywords: dedupedLong,
    negativeKeywords,
    summary,
  };
}

/**
 * 検索ボリュームリスク推定
 * - 1語: high（ほぼ確実にボリュームあり）
 * - 2語: medium〜high（一般的な組み合わせならボリュームあり）
 * - 3語以上: low（低ボリュームリスク高い）
 */
function estimateVolumeRisk(product: string, suffix: string): "high" | "medium" | "low" {
  const combined = `${product} ${suffix}`.trim();
  const wordCount = combined.split(/\s+/).length;

  if (wordCount <= 1) return "high";
  if (wordCount === 2) {
    // 短い商品名 + 一般的接尾語なら high
    if (product.length <= 6) return "high";
    return "medium";
  }
  return "low";
}

function detectProductCategories(scraped: ScrapedData): string[] {
  const text = [
    scraped.title,
    scraped.h1,
    scraped.metaDescription,
    scraped.bodyText,
  ].join(" ").toLowerCase();

  const detected: string[] = [];

  const categoryRules: Record<string, string[]> = {
    アクセサリー: ["アクセサリー", "ジュエリー", "ネックレス", "ブレスレット", "リング", "指輪"],
    ペア: ["ペア", "カップル", "お揃い", "二人"],
    ギフト: ["ギフト", "プレゼント", "贈り物"],
    ファッション: ["ファッション", "おしゃれ", "コーデ"],
    素材: ["ステンレス", "チタン", "シルバー", "ゴールド", "レザー", "革"],
  };

  for (const [category, keywords] of Object.entries(categoryRules)) {
    for (const kw of keywords) {
      if (text.includes(kw.toLowerCase()) || text.includes(kw)) {
        if (!detected.includes(category)) {
          detected.push(category);
        }
        break;
      }
    }
  }

  return detected.length > 0 ? detected : ["商品"];
}

function extractMainProduct(scraped: ScrapedData, categories: string[]): string {
  if (categories.includes("ペア") && categories.includes("アクセサリー")) {
    return "ペアアクセサリー";
  }
  if (categories.includes("アクセサリー")) {
    return "アクセサリー";
  }

  if (scraped.keywords && scraped.keywords.length > 0) {
    for (const kw of scraped.keywords) {
      if (!isTrademarkWord(kw) && kw.length >= 2 && kw.length <= 6) {
        return kw;
      }
    }
  }

  return categories[0] || "商品";
}

function detectTrademarkKeywords(scraped: ScrapedData): string[] {
  const text = [
    scraped.title,
    scraped.h1,
    scraped.metaDescription,
    scraped.bodyText,
  ].join(" ").toLowerCase();

  const found: string[] = [];

  for (const category of TRADEMARK_CATEGORIES) {
    for (const trademark of category.trademarks) {
      if (text.includes(trademark.toLowerCase())) {
        if (!found.includes(trademark)) {
          found.push(trademark);
        }
      }
    }
  }

  return found;
}

function isTrademarkWord(word: string): boolean {
  const w = word.toLowerCase();
  for (const category of TRADEMARK_CATEGORIES) {
    for (const trademark of category.trademarks) {
      if (w === trademark.toLowerCase()) {
        return true;
      }
    }
  }
  return false;
}

/**
 * キーワードをカテゴリ別にグループ化
 */
export function groupKeywordsByCategory(
  keywords: SuggestedKeyword[]
): Record<string, SuggestedKeyword[]> {
  const groups: Record<string, SuggestedKeyword[]> = {
    purchase: [],
    compare: [],
    info: [],
    problem: [],
  };

  for (const kw of keywords) {
    if (groups[kw.category]) {
      groups[kw.category].push(kw);
    }
  }

  for (const key of Object.keys(groups)) {
    groups[key].sort((a, b) => b.score - a.score);
  }

  return groups;
}
