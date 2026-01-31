/**
 * キーワード提案エンジン テスト
 */
import { suggestKeywords, groupKeywordsByCategory, type SuggestedKeyword } from "./keywordSuggester";
import type { ScrapedData } from "./scraper";

// テスト用のScrapedDataモック
function createMockScrapedData(overrides: Partial<ScrapedData> = {}): ScrapedData {
  return {
    url: "https://example.com",
    title: "ペアアクセサリー専門店",
    h1: "ペアアクセサリーをお探しの方へ",
    metaDescription: "カップルにおすすめのペアアクセサリー。ネックレス、ブレスレット、リングなど。",
    ogImage: "",
    canonical: "",
    wordCount: 500,
    externalLinkCount: 5,
    internalLinkCount: 10,
    hasRedirectScript: false,
    hasIframe: false,
    bodyText: "ペアアクセサリーは、カップルで身につけることで絆を深められます。ステンレス製なので金属アレルギーの方も安心。プレゼントにもおすすめです。",
    keywords: ["ペア", "アクセサリー", "カップル", "ステンレス"],
    fetchError: null,
    ...overrides,
  };
}

describe("keywordSuggester", () => {
  describe("suggestKeywords", () => {
    it("基本的なキーワード提案を生成する", () => {
      const scraped = createMockScrapedData();
      const result = suggestKeywords(scraped);

      expect(result.mainKeywords.length).toBeGreaterThan(0);
      expect(result.longTailKeywords.length).toBeGreaterThan(0);
      expect(result.summary).toBeTruthy();
    });

    it("購入意図のキーワードを含む", () => {
      const scraped = createMockScrapedData();
      const result = suggestKeywords(scraped);

      const purchaseKw = result.mainKeywords.filter((k) => k.category === "purchase");
      expect(purchaseKw.length).toBeGreaterThan(0);
      expect(purchaseKw.some((k) => k.keyword.includes("通販") || k.keyword.includes("安い") || k.keyword === "ペアアクセサリー")).toBe(true);
    });

    it("比較検討のキーワードを含む", () => {
      const scraped = createMockScrapedData();
      const result = suggestKeywords(scraped);

      const compareKw = result.mainKeywords.filter((k) => k.category === "compare");
      expect(compareKw.length).toBeGreaterThan(0);
      expect(compareKw.some((k) => k.keyword.includes("比較"))).toBe(true);
    });

    it("商標を除外キーワードとして検出する", () => {
      const scraped = createMockScrapedData({
        bodyText: "Amazon、楽天でも購入可能です。Googleで検索してみてください。",
      });
      const result = suggestKeywords(scraped);

      expect(result.negativeKeywords).toContain("Amazon");
      expect(result.negativeKeywords).toContain("楽天");
      expect(result.negativeKeywords).toContain("Google");
    });

    it("カスタム商品名を指定できる", () => {
      const scraped = createMockScrapedData();
      const result = suggestKeywords(scraped, "ペアリング");

      expect(result.mainKeywords.some((k) => k.keyword.includes("ペアリング"))).toBe(true);
    });

    it("スコアが0-100の範囲内", () => {
      const scraped = createMockScrapedData();
      const result = suggestKeywords(scraped);

      const allKeywords = [...result.mainKeywords, ...result.longTailKeywords];
      for (const kw of allKeywords) {
        expect(kw.score).toBeGreaterThanOrEqual(0);
        expect(kw.score).toBeLessThanOrEqual(100);
      }
    });

    it("理由が設定されている", () => {
      const scraped = createMockScrapedData();
      const result = suggestKeywords(scraped);

      const allKeywords = [...result.mainKeywords, ...result.longTailKeywords];
      for (const kw of allKeywords) {
        expect(kw.reason).toBeTruthy();
      }
    });

    it("サマリーに商品名が含まれる", () => {
      const scraped = createMockScrapedData();
      const result = suggestKeywords(scraped);

      expect(result.summary).toContain("ペアアクセサリー");
    });
  });

  describe("groupKeywordsByCategory", () => {
    it("カテゴリ別にグループ化する", () => {
      const keywords: SuggestedKeyword[] = [
        { keyword: "商品 購入", category: "purchase", score: 90, reason: "test", matchType: "broad" as const, volumeRisk: "high" as const },
        { keyword: "商品 比較", category: "compare", score: 80, reason: "test", matchType: "broad" as const, volumeRisk: "high" as const },
        { keyword: "商品 とは", category: "info", score: 50, reason: "test", matchType: "broad" as const, volumeRisk: "high" as const },
        { keyword: "商品 問題", category: "problem", score: 60, reason: "test", matchType: "broad" as const, volumeRisk: "high" as const },
      ];

      const grouped = groupKeywordsByCategory(keywords);

      expect(grouped.purchase.length).toBe(1);
      expect(grouped.compare.length).toBe(1);
      expect(grouped.info.length).toBe(1);
      expect(grouped.problem.length).toBe(1);
    });

    it("スコア順にソートする", () => {
      const keywords: SuggestedKeyword[] = [
        { keyword: "低スコア", category: "purchase", score: 50, reason: "test", matchType: "broad" as const, volumeRisk: "high" as const },
        { keyword: "高スコア", category: "purchase", score: 90, reason: "test", matchType: "broad" as const, volumeRisk: "high" as const },
        { keyword: "中スコア", category: "purchase", score: 70, reason: "test", matchType: "broad" as const, volumeRisk: "high" as const },
      ];

      const grouped = groupKeywordsByCategory(keywords);

      expect(grouped.purchase[0].keyword).toBe("高スコア");
      expect(grouped.purchase[1].keyword).toBe("中スコア");
      expect(grouped.purchase[2].keyword).toBe("低スコア");
    });

    it("空の配列でも動作する", () => {
      const grouped = groupKeywordsByCategory([]);

      expect(grouped.purchase).toEqual([]);
      expect(grouped.compare).toEqual([]);
      expect(grouped.info).toEqual([]);
      expect(grouped.problem).toEqual([]);
    });
  });

  describe("商品カテゴリ検出", () => {
    it("アクセサリーカテゴリを検出する", () => {
      const scraped = createMockScrapedData({
        bodyText: "ネックレス、ブレスレット、リングなどのアクセサリーを取り扱っています。",
      });
      const result = suggestKeywords(scraped);

      expect(result.summary).toContain("アクセサリー");
    });

    it("ペアカテゴリを検出する", () => {
      const scraped = createMockScrapedData({
        bodyText: "カップルでお揃いのペアアイテムをお探しの方に。",
      });
      const result = suggestKeywords(scraped);

      expect(result.summary).toContain("ペア");
    });

    it("ギフトカテゴリを検出する", () => {
      const scraped = createMockScrapedData({
        title: "ギフト専門店",
        h1: "ギフトをお探しの方へ",
        metaDescription: "贈り物に最適なギフトアイテム。",
        bodyText: "誕生日プレゼントやギフトに最適なアイテム。",
        keywords: ["ギフト", "贈り物"],
      });
      const result = suggestKeywords(scraped);

      expect(result.summary).toContain("ギフト");
    });
  });
});
