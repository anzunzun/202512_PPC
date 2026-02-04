/**
 * 競合LP分析テスト
 */
import {
  extractCtaTexts,
  extractHeadings,
  extractAppealPoints,
  extractByPatterns,
  calculateScores,
  compareLps,
  type LpStructure,
} from "./competitorAnalyzer";

// テスト用のLpStructureモック
function createMockLpStructure(overrides: Partial<LpStructure> = {}): LpStructure {
  return {
    url: "https://example.com",
    title: "テストLP",
    heroHeadline: "メインの見出し",
    heroSubheadline: "サブの説明文",
    hasHeroImage: true,
    ctaCount: 3,
    ctaTexts: ["今すぐ購入", "詳細はこちら", "無料で始める"],
    hasFloatingCta: true,
    sectionCount: 5,
    sectionHeadings: ["特徴", "料金", "口コミ", "FAQ", "お問い合わせ"],
    hasComparisonTable: true,
    hasPriceDisplay: true,
    hasTestimonials: true,
    hasFaq: true,
    appealPoints: ["30日間返金保証", "送料無料"],
    urgencyPhrases: ["今だけ", "期間限定"],
    trustSignals: ["10万人が利用", "満足度98%"],
    wordCount: 1500,
    imageCount: 10,
    externalLinkCount: 3,
    scores: {
      ctaVisibility: 90,
      contentDepth: 85,
      trustBuilding: 60,
      urgencyLevel: 50,
      overall: 75,
    },
    fetchError: null,
    ...overrides,
  };
}

describe("competitorAnalyzer", () => {
  describe("extractCtaTexts", () => {
    it("ボタンからCTAテキストを抽出する", () => {
      const html = `
        <button>今すぐ購入</button>
        <button>詳細はこちら</button>
        <button>閉じる</button>
      `;
      const result = extractCtaTexts(html);
      expect(result).toContain("今すぐ購入");
      expect(result).toContain("詳細はこちら");
      expect(result).not.toContain("閉じる");
    });

    it("リンクからCTAテキストを抽出する", () => {
      const html = `
        <a href="#">無料で始める</a>
        <a href="#">公式サイトへ</a>
        <a href="#">ホーム</a>
      `;
      const result = extractCtaTexts(html);
      expect(result).toContain("無料で始める");
      expect(result).toContain("公式サイトへ");
      expect(result).not.toContain("ホーム");
    });

    it("重複を除去する", () => {
      const html = `
        <button>今すぐ購入</button>
        <a href="#">今すぐ購入</a>
        <button>今すぐ購入</button>
      `;
      const result = extractCtaTexts(html);
      expect(result.filter(t => t === "今すぐ購入").length).toBe(1);
    });

    it("空のHTMLでも動作する", () => {
      const result = extractCtaTexts("");
      expect(result).toEqual([]);
    });

    it("CTAパターンがない場合は空配列を返す", () => {
      const html = `
        <button>閉じる</button>
        <a href="#">ホーム</a>
      `;
      const result = extractCtaTexts(html);
      expect(result).toEqual([]);
    });
  });

  describe("extractHeadings", () => {
    it("h1-h6を抽出する", () => {
      const html = `
        <h1>見出し1</h1>
        <h2>見出し2</h2>
        <h3>見出し3</h3>
      `;
      const result = extractHeadings(html);
      expect(result).toContain("見出し1");
      expect(result).toContain("見出し2");
      expect(result).toContain("見出し3");
    });

    it("短すぎる見出しを除外する", () => {
      const html = `
        <h1>あ</h1>
        <h2>長い見出しです</h2>
      `;
      const result = extractHeadings(html);
      expect(result).not.toContain("あ");
      expect(result).toContain("長い見出しです");
    });

    it("長すぎる見出しを除外する", () => {
      const longHeading = "あ".repeat(51);
      const html = `<h1>${longHeading}</h1><h2>短い見出し</h2>`;
      const result = extractHeadings(html);
      expect(result).not.toContain(longHeading);
      expect(result).toContain("短い見出し");
    });

    it("空のHTMLでも動作する", () => {
      const result = extractHeadings("");
      expect(result).toEqual([]);
    });
  });

  describe("extractAppealPoints", () => {
    it("チェックマーク付きの訴求ポイントを抽出する", () => {
      const text = "✓ 30日間返金保証 ✔ 送料無料 ☑ 24時間サポート";
      const result = extractAppealPoints(text);
      expect(result.some(p => p.includes("返金保証"))).toBe(true);
      expect(result.some(p => p.includes("送料無料"))).toBe(true);
    });

    it("割引表現を抽出する", () => {
      const text = "今なら50%OFF！初回限定30%引き";
      const result = extractAppealPoints(text);
      expect(result.some(p => p.includes("50%OFF"))).toBe(true);
    });

    it("初回特典を抽出する", () => {
      const text = "初回無料 初回500円";
      const result = extractAppealPoints(text);
      expect(result.some(p => p.includes("初回無料") || p.includes("初回"))).toBe(true);
    });

    it("送料無料を抽出する", () => {
      const text = "全品送料無料でお届け";
      const result = extractAppealPoints(text);
      expect(result).toContain("送料無料");
    });

    it("短すぎるテキストを除外する", () => {
      const text = "✓ ab";
      const result = extractAppealPoints(text);
      expect(result).toEqual([]);
    });

    it("重複を除去する", () => {
      const text = "✓ 送料無料 ✔ 送料無料";
      const result = extractAppealPoints(text);
      expect(result.filter(p => p === "送料無料").length).toBeLessThanOrEqual(1);
    });
  });

  describe("extractByPatterns", () => {
    it("パターンにマッチするテキストを抽出する", () => {
      const patterns = [/今だけ/, /期間限定/];
      const text = "今だけ特別価格！期間限定キャンペーン実施中";
      const result = extractByPatterns(text, patterns);
      expect(result).toContain("今だけ");
      expect(result).toContain("期間限定");
    });

    it("マッチしない場合は空配列を返す", () => {
      const patterns = [/存在しないパターン/];
      const text = "通常のテキスト";
      const result = extractByPatterns(text, patterns);
      expect(result).toEqual([]);
    });

    it("重複を除去する", () => {
      const patterns = [/今だけ/, /今だけ/];
      const text = "今だけ特別価格";
      const result = extractByPatterns(text, patterns);
      expect(result.filter(p => p === "今だけ").length).toBe(1);
    });
  });

  describe("calculateScores", () => {
    it("CTA視認性スコアを計算する", () => {
      const result = calculateScores({
        ctaCount: 3,
        hasFloatingCta: true,
        wordCount: 1000,
        sectionCount: 5,
        trustSignals: 2,
        urgencyPhrases: 2,
        hasComparisonTable: false,
        hasFaq: false,
      });
      // 3 * 20 + 30 = 90
      expect(result.ctaVisibility).toBe(90);
    });

    it("CTA視認性スコアは100を超えない", () => {
      const result = calculateScores({
        ctaCount: 10,
        hasFloatingCta: true,
        wordCount: 1000,
        sectionCount: 5,
        trustSignals: 2,
        urgencyPhrases: 2,
        hasComparisonTable: false,
        hasFaq: false,
      });
      expect(result.ctaVisibility).toBeLessThanOrEqual(100);
    });

    it("コンテンツ充実度スコアを計算する", () => {
      const result = calculateScores({
        ctaCount: 1,
        hasFloatingCta: false,
        wordCount: 1000, // 50点
        sectionCount: 6, // 30点
        trustSignals: 0,
        urgencyPhrases: 0,
        hasComparisonTable: true, // 10点
        hasFaq: true, // 10点
      });
      // 50 + 30 + 10 + 10 = 100
      expect(result.contentDepth).toBe(100);
    });

    it("信頼構築度スコアを計算する", () => {
      const result = calculateScores({
        ctaCount: 1,
        hasFloatingCta: false,
        wordCount: 500,
        sectionCount: 3,
        trustSignals: 3,
        urgencyPhrases: 0,
        hasComparisonTable: false,
        hasFaq: false,
      });
      // 3 * 20 = 60
      expect(result.trustBuilding).toBe(60);
    });

    it("緊急性演出度スコアを計算する", () => {
      const result = calculateScores({
        ctaCount: 1,
        hasFloatingCta: false,
        wordCount: 500,
        sectionCount: 3,
        trustSignals: 0,
        urgencyPhrases: 2,
        hasComparisonTable: false,
        hasFaq: false,
      });
      // 2 * 25 = 50
      expect(result.urgencyLevel).toBe(50);
    });

    it("総合スコアを計算する", () => {
      const result = calculateScores({
        ctaCount: 3,
        hasFloatingCta: true,
        wordCount: 1000,
        sectionCount: 6,
        trustSignals: 3,
        urgencyPhrases: 2,
        hasComparisonTable: true,
        hasFaq: true,
      });
      // ctaVisibility: 90, contentDepth: 100, trustBuilding: 60, urgencyLevel: 50
      // 90*0.3 + 100*0.3 + 60*0.25 + 50*0.15 = 27 + 30 + 15 + 7.5 = 79.5 -> 80
      expect(result.overall).toBeGreaterThanOrEqual(70);
      expect(result.overall).toBeLessThanOrEqual(100);
    });

    it("すべてのスコアが0-100の範囲内", () => {
      const result = calculateScores({
        ctaCount: 0,
        hasFloatingCta: false,
        wordCount: 0,
        sectionCount: 0,
        trustSignals: 0,
        urgencyPhrases: 0,
        hasComparisonTable: false,
        hasFaq: false,
      });
      expect(result.ctaVisibility).toBeGreaterThanOrEqual(0);
      expect(result.ctaVisibility).toBeLessThanOrEqual(100);
      expect(result.contentDepth).toBeGreaterThanOrEqual(0);
      expect(result.contentDepth).toBeLessThanOrEqual(100);
      expect(result.trustBuilding).toBeGreaterThanOrEqual(0);
      expect(result.trustBuilding).toBeLessThanOrEqual(100);
      expect(result.urgencyLevel).toBeGreaterThanOrEqual(0);
      expect(result.urgencyLevel).toBeLessThanOrEqual(100);
      expect(result.overall).toBeGreaterThanOrEqual(0);
      expect(result.overall).toBeLessThanOrEqual(100);
    });
  });

  describe("compareLps", () => {
    it("空配列でも動作する", () => {
      const result = compareLps([]);
      expect(result.bestPractices).toEqual([]);
      expect(result.improvements).toEqual([]);
      expect(result.avgScores.overall).toBe(0);
    });

    it("平均スコアを計算する", () => {
      const lp1 = createMockLpStructure({ scores: { ctaVisibility: 80, contentDepth: 70, trustBuilding: 60, urgencyLevel: 50, overall: 65 } });
      const lp2 = createMockLpStructure({ scores: { ctaVisibility: 60, contentDepth: 50, trustBuilding: 40, urgencyLevel: 30, overall: 45 } });
      const result = compareLps([lp1, lp2]);
      expect(result.avgScores.ctaVisibility).toBe(70);
      expect(result.avgScores.contentDepth).toBe(60);
      expect(result.avgScores.trustBuilding).toBe(50);
      expect(result.avgScores.urgencyLevel).toBe(40);
      expect(result.avgScores.overall).toBe(55);
    });

    it("人気のCTAをベストプラクティスとして抽出する", () => {
      const lp1 = createMockLpStructure({ ctaTexts: ["今すぐ購入", "詳細はこちら"] });
      const lp2 = createMockLpStructure({ ctaTexts: ["今すぐ購入", "無料で始める"] });
      const result = compareLps([lp1, lp2]);
      expect(result.bestPractices.some(bp => bp.includes("今すぐ購入"))).toBe(true);
    });

    it("フローティングCTAが過半数ならベストプラクティスに含む", () => {
      const lp1 = createMockLpStructure({ hasFloatingCta: true });
      const lp2 = createMockLpStructure({ hasFloatingCta: true });
      const lp3 = createMockLpStructure({ hasFloatingCta: false });
      const result = compareLps([lp1, lp2, lp3]);
      expect(result.bestPractices).toContain("フローティングCTAを採用");
    });

    it("比較表が過半数ならベストプラクティスに含む", () => {
      const lp1 = createMockLpStructure({ hasComparisonTable: true });
      const lp2 = createMockLpStructure({ hasComparisonTable: true });
      const result = compareLps([lp1, lp2]);
      expect(result.bestPractices).toContain("比較表を設置");
    });

    it("FAQが過半数ならベストプラクティスに含む", () => {
      const lp1 = createMockLpStructure({ hasFaq: true });
      const lp2 = createMockLpStructure({ hasFaq: true });
      const result = compareLps([lp1, lp2]);
      expect(result.bestPractices).toContain("FAQセクションを設置");
    });

    it("CTA視認性が低い場合に改善提案を出す", () => {
      const lp1 = createMockLpStructure({ scores: { ctaVisibility: 30, contentDepth: 70, trustBuilding: 60, urgencyLevel: 50, overall: 50 } });
      const lp2 = createMockLpStructure({ scores: { ctaVisibility: 40, contentDepth: 70, trustBuilding: 60, urgencyLevel: 50, overall: 55 } });
      const result = compareLps([lp1, lp2]);
      expect(result.improvements.some(imp => imp.includes("CTA"))).toBe(true);
    });

    it("コンテンツ充実度が低い場合に改善提案を出す", () => {
      const lp1 = createMockLpStructure({ scores: { ctaVisibility: 70, contentDepth: 30, trustBuilding: 60, urgencyLevel: 50, overall: 50 } });
      const lp2 = createMockLpStructure({ scores: { ctaVisibility: 70, contentDepth: 40, trustBuilding: 60, urgencyLevel: 50, overall: 55 } });
      const result = compareLps([lp1, lp2]);
      expect(result.improvements.some(imp => imp.includes("コンテンツ"))).toBe(true);
    });

    it("信頼構築度が低い場合に改善提案を出す", () => {
      const lp1 = createMockLpStructure({ scores: { ctaVisibility: 70, contentDepth: 70, trustBuilding: 30, urgencyLevel: 50, overall: 50 } });
      const lp2 = createMockLpStructure({ scores: { ctaVisibility: 70, contentDepth: 70, trustBuilding: 40, urgencyLevel: 50, overall: 55 } });
      const result = compareLps([lp1, lp2]);
      expect(result.improvements.some(imp => imp.includes("信頼"))).toBe(true);
    });
  });

  describe("エッジケース", () => {
    it("特殊文字を含むHTMLでもクラッシュしない", () => {
      const html = `<h1>テスト&amp;見出し</h1><button>購入&nbsp;する</button>`;
      expect(() => extractHeadings(html)).not.toThrow();
      expect(() => extractCtaTexts(html)).not.toThrow();
    });

    it("非常に長いテキストでもクラッシュしない", () => {
      const longText = "テスト".repeat(10000);
      expect(() => extractAppealPoints(longText)).not.toThrow();
    });

    it("マルチバイト文字を正しく処理する", () => {
      const html = `<h1>日本語の見出し</h1><button>今すぐ購入</button>`;
      const headings = extractHeadings(html);
      const ctas = extractCtaTexts(html);
      expect(headings).toContain("日本語の見出し");
      expect(ctas).toContain("今すぐ購入");
    });

    it("fetchErrorがあるLpStructureでも比較できる", () => {
      const lp1 = createMockLpStructure({ fetchError: "Connection failed" });
      const lp2 = createMockLpStructure();
      expect(() => compareLps([lp1, lp2])).not.toThrow();
    });
  });
});
