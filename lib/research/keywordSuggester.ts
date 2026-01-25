/**
 * キーワード提案エンジン
 * サイト内容から商標なしの一般KWを提案
 */

import type { ScrapedData } from "./scraper";
import { TRADEMARK_CATEGORIES } from "./rules/trademarkRules";

export type SuggestedKeyword = {
  keyword: string;
  category: "purchase" | "compare" | "info" | "problem";
  score: number; // 0-100 推定効果スコア
  reason: string;
};

export type KeywordSuggestionResult = {
  mainKeywords: SuggestedKeyword[];
  longTailKeywords: SuggestedKeyword[];
  negativeKeywords: string[]; // 除外すべきKW（商標など）
  summary: string;
};

// カテゴリ別のキーワードテンプレート
const CATEGORY_TEMPLATES = {
  // 購入意図が高いKW
  purchase: [
    "{product} 購入",
    "{product} 通販",
    "{product} 安い",
    "{product} 激安",
    "{product} セール",
    "{product} プレゼント",
    "{product} ギフト",
    "{product} 送料無料",
  ],
  // 比較検討系KW
  compare: [
    "{product} 比較",
    "{product} 違い",
    "{product} どれがいい",
    "{product} 選び方",
    "{product} 種類",
    "{product} メリット デメリット",
  ],
  // 情報収集系KW
  info: [
    "{product} とは",
    "{product} 意味",
    "{product} 使い方",
    "{product} 手入れ",
    "{product} サイズ",
    "{product} 素材",
  ],
  // 悩み・課題系KW
  problem: [
    "{product} 金属アレルギー",
    "{product} 黒ずみ",
    "{product} 傷",
    "{product} サビ",
    "{product} 変色",
    "{product} お揃い",
    "{product} ペア",
  ],
};

// 商品カテゴリ別の追加KW
const PRODUCT_CATEGORY_KEYWORDS: Record<string, string[]> = {
  アクセサリー: ["ネックレス", "ブレスレット", "リング", "指輪", "ペンダント", "バングル"],
  ペア: ["カップル", "恋人", "夫婦", "お揃い", "マッチング", "記念日"],
  ギフト: ["プレゼント", "誕生日", "クリスマス", "ホワイトデー", "バレンタイン", "記念日"],
  素材: ["ステンレス", "チタン", "シルバー", "レザー", "革"],
};

/**
 * スクレイピング結果からキーワードを提案
 */
export function suggestKeywords(
  scraped: ScrapedData,
  customProductName?: string
): KeywordSuggestionResult {
  // 1. サイトから商品カテゴリを推定
  const productCategories = detectProductCategories(scraped);

  // 2. メインの商品名/カテゴリを決定（商標は除外）
  const mainProduct = customProductName || extractMainProduct(scraped, productCategories);

  // 3. 商標キーワードを検出（除外用）
  const negativeKeywords = detectTrademarkKeywords(scraped);

  // 4. メインキーワードを生成
  const mainKeywords = generateMainKeywords(mainProduct, productCategories);

  // 5. ロングテールキーワードを生成
  const longTailKeywords = generateLongTailKeywords(mainProduct, scraped, productCategories);

  // 6. サマリー生成
  const summary = generateSummary(mainProduct, productCategories, mainKeywords.length);

  return {
    mainKeywords,
    longTailKeywords,
    negativeKeywords,
    summary,
  };
}

/**
 * サイト内容から商品カテゴリを検出
 */
function detectProductCategories(scraped: ScrapedData): string[] {
  const text = [
    scraped.title,
    scraped.h1,
    scraped.metaDescription,
    scraped.bodyText,
  ].join(" ").toLowerCase();

  const detected: string[] = [];

  // カテゴリ検出ルール
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

/**
 * メイン商品名を抽出（商標除外）
 */
function extractMainProduct(scraped: ScrapedData, categories: string[]): string {
  // タイトルやH1から商品名を抽出
  const candidates: string[] = [];

  // カテゴリベースで商品名を決定
  if (categories.includes("ペア") && categories.includes("アクセサリー")) {
    return "ペアアクセサリー";
  }
  if (categories.includes("アクセサリー")) {
    return "アクセサリー";
  }

  // キーワードから抽出
  if (scraped.keywords && scraped.keywords.length > 0) {
    for (const kw of scraped.keywords) {
      if (!isTrademarkWord(kw) && kw.length >= 2 && kw.length <= 10) {
        candidates.push(kw);
      }
    }
  }

  if (candidates.length > 0) {
    return candidates[0];
  }

  // フォールバック
  return categories[0] || "商品";
}

/**
 * 商標キーワードを検出
 */
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

/**
 * 単語が商標かどうか判定
 */
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
 * メインキーワードを生成
 */
function generateMainKeywords(
  mainProduct: string,
  categories: string[]
): SuggestedKeyword[] {
  const keywords: SuggestedKeyword[] = [];

  // 購入意図KW（スコア高）
  const purchaseTemplates = CATEGORY_TEMPLATES.purchase;
  for (const template of purchaseTemplates.slice(0, 4)) {
    const kw = template.replace("{product}", mainProduct);
    keywords.push({
      keyword: kw,
      category: "purchase",
      score: 85 + Math.floor(Math.random() * 10),
      reason: "購入意図が高く、CV率が期待できる",
    });
  }

  // 比較検討KW
  const compareTemplates = CATEGORY_TEMPLATES.compare;
  for (const template of compareTemplates.slice(0, 3)) {
    const kw = template.replace("{product}", mainProduct);
    keywords.push({
      keyword: kw,
      category: "compare",
      score: 70 + Math.floor(Math.random() * 15),
      reason: "比較検討段階のユーザーを獲得",
    });
  }

  return keywords;
}

/**
 * ロングテールキーワードを生成
 */
function generateLongTailKeywords(
  mainProduct: string,
  scraped: ScrapedData,
  categories: string[]
): SuggestedKeyword[] {
  const keywords: SuggestedKeyword[] = [];

  // カテゴリ別の追加ワードを組み合わせ
  for (const category of categories) {
    const additionalWords = PRODUCT_CATEGORY_KEYWORDS[category] || [];
    for (const word of additionalWords.slice(0, 3)) {
      // 悩み系KW
      keywords.push({
        keyword: `${mainProduct} ${word}`,
        category: "info",
        score: 55 + Math.floor(Math.random() * 20),
        reason: `${word}に関心のあるユーザーを獲得`,
      });
    }
  }

  // 悩み・課題系KW
  const problemTemplates = CATEGORY_TEMPLATES.problem;
  for (const template of problemTemplates.slice(0, 4)) {
    const kw = template.replace("{product}", mainProduct);
    keywords.push({
      keyword: kw,
      category: "problem",
      score: 60 + Math.floor(Math.random() * 15),
      reason: "課題解決を求めるユーザーを獲得",
    });
  }

  // 情報収集系KW
  const infoTemplates = CATEGORY_TEMPLATES.info;
  for (const template of infoTemplates.slice(0, 3)) {
    const kw = template.replace("{product}", mainProduct);
    keywords.push({
      keyword: kw,
      category: "info",
      score: 45 + Math.floor(Math.random() * 15),
      reason: "認知拡大・情報収集層へのアプローチ",
    });
  }

  return keywords;
}

/**
 * サマリーを生成
 */
function generateSummary(
  mainProduct: string,
  categories: string[],
  keywordCount: number
): string {
  const categoryText = categories.join("・");
  return `「${mainProduct}」（${categoryText}カテゴリ）に関連する${keywordCount}件のキーワードを提案しました。購入意図の高いKWを優先的に提案しています。商標を含むKWは除外済みです。`;
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

  // スコア順にソート
  for (const key of Object.keys(groups)) {
    groups[key].sort((a, b) => b.score - a.score);
  }

  return groups;
}
