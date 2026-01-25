import { calcTrademarkRisk, calcTrademarkRiskScore } from "./trademarkRules";

describe("trademarkRules", () => {
  describe("calcTrademarkRisk", () => {
    it("商標なしのテキストはスコアが低い", () => {
      const result = calcTrademarkRisk("これはただのテキストです", "https://test.com");
      expect(result.score).toBe(0);
      expect(result.level).toBe("low");
      expect(result.matchedTrademarks).toHaveLength(0);
    });

    it("テック大手の商標を検出する", () => {
      const result = calcTrademarkRisk("Googleの広告を使っています", "https://example.com");
      expect(result.score).toBeGreaterThan(0);
      expect(result.matchedTrademarks.some((m) => m.trademark === "Google")).toBe(true);
    });

    it("日本語の商標を検出する", () => {
      const result = calcTrademarkRisk("楽天で買い物しました", "https://example.com");
      expect(result.score).toBeGreaterThan(0);
      expect(result.matchedTrademarks.some((m) => m.trademark === "楽天")).toBe(true);
    });

    it("URLに商標が含まれると警告が出る", () => {
      const urlIncluded = calcTrademarkRisk("テスト", "https://fake-amazon.com");
      expect(urlIncluded.warnings.length).toBeGreaterThan(0);
      expect(urlIncluded.warnings.some((w) => w.includes("Amazon"))).toBe(true);
    });

    it("公式サイトコンテキストでスコアが軽減される", () => {
      const withoutContext = calcTrademarkRisk("Googleを使っています", "https://example.com");
      const withContext = calcTrademarkRisk("Googleの公式サイトはこちら", "https://example.com");
      expect(withContext.score).toBeLessThan(withoutContext.score);
    });

    it("複数の商標で累積スコアになる", () => {
      const single = calcTrademarkRisk("Google", "https://example.com");
      const multiple = calcTrademarkRisk("GoogleとAmazonとApple", "https://example.com");
      expect(multiple.score).toBeGreaterThan(single.score);
    });

    it("スコアは100を超えない", () => {
      const text = "Google Amazon Apple Microsoft Meta Facebook Instagram Twitter YouTube TikTok Netflix 楽天 Yahoo LINE メルカリ";
      const result = calcTrademarkRisk(text, "https://google-amazon-apple.com");
      expect(result.score).toBeLessThanOrEqual(100);
    });

    it("レベル判定が正しい", () => {
      // low: 0-14
      expect(calcTrademarkRisk("これはただのテキスト", "https://test.com").level).toBe("low");

      // critical: 60以上（複数商標で達成）
      const criticalText = "Google Amazon Apple Microsoft Meta Facebook Instagram";
      const criticalResult = calcTrademarkRisk(criticalText, "https://test.com");
      expect(criticalResult.level).toBe("critical");
    });
  });

  describe("calcTrademarkRiskScore", () => {
    it("スコアのみを返す", () => {
      const score = calcTrademarkRiskScore("Googleの広告", "https://example.com");
      expect(typeof score).toBe("number");
      expect(score).toBeGreaterThanOrEqual(0);
      expect(score).toBeLessThanOrEqual(100);
    });
  });
});
