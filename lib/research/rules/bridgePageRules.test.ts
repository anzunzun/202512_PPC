import { calcBridgePageRisk, calcBridgePageRiskScore, calcBridgePageRiskFromHtml } from "./bridgePageRules";
import type { ScrapedData } from "../scraper";

// テスト用のScrapedDataモック
function createMockScrapedData(overrides: Partial<ScrapedData> = {}): ScrapedData {
  return {
    url: "https://example.com",
    title: "Test Page",
    h1: "Test H1",
    metaDescription: "Test description",
    ogImage: null,
    canonical: null,
    wordCount: 500,
    externalLinkCount: 5,
    internalLinkCount: 10,
    hasRedirectScript: false,
    hasIframe: false,
    bodyText: "これは十分な長さのテストコンテンツです。".repeat(50),
    keywords: ["test", "keyword"],
    fetchError: null,
    ...overrides,
  };
}

describe("bridgePageRules", () => {
  describe("calcBridgePageRisk", () => {
    it("正常なページはスコアが低い", () => {
      const scraped = createMockScrapedData();
      const result = calcBridgePageRisk(scraped);
      expect(result.score).toBeLessThan(15);
      expect(result.level).toBe("low");
    });

    it("コンテンツが極端に少ないとスコアが上がる", () => {
      const scraped = createMockScrapedData({ wordCount: 50, bodyText: "短いテキスト" });
      const result = calcBridgePageRisk(scraped);
      expect(result.score).toBeGreaterThanOrEqual(30);
      expect(result.reasons.some((r) => r.includes("コンテンツが少ない"))).toBe(true);
    });

    it("コンテンツ不足でスコアが上がる", () => {
      const scraped = createMockScrapedData({ wordCount: 200, bodyText: "中程度のテキスト".repeat(20) });
      const result = calcBridgePageRisk(scraped);
      expect(result.score).toBeGreaterThanOrEqual(15);
      expect(result.reasons.some((r) => r.includes("コンテンツ不足"))).toBe(true);
    });

    it("JSリダイレクトを検出する", () => {
      const scraped = createMockScrapedData({ hasRedirectScript: true });
      const result = calcBridgePageRisk(scraped);
      expect(result.score).toBeGreaterThanOrEqual(25);
      expect(result.reasons).toContain("JSリダイレクト検出");
    });

    it("iframeを検出する", () => {
      const scraped = createMockScrapedData({ hasIframe: true });
      const result = calcBridgePageRisk(scraped);
      expect(result.score).toBeGreaterThanOrEqual(10);
      expect(result.reasons).toContain("iframe埋め込み検出");
    });

    it("外部リンクのみのアフィリエイト風を検出する", () => {
      const scraped = createMockScrapedData({
        externalLinkCount: 2,
        internalLinkCount: 0,
      });
      const result = calcBridgePageRisk(scraped);
      expect(result.reasons.some((r) => r.includes("アフィリエイト風"))).toBe(true);
    });

    it("LP風URLパスを検出する", () => {
      const scraped = createMockScrapedData({ url: "https://example.com/lp/product" });
      const result = calcBridgePageRisk(scraped);
      expect(result.reasons).toContain("LP風のURLパス");
    });

    it("日本語コンテンツに海外TLDでリスク上昇", () => {
      const scraped = createMockScrapedData({
        url: "https://example.xyz",
        bodyText: "これは日本語のテキストです。".repeat(50),
      });
      const result = calcBridgePageRisk(scraped);
      expect(result.reasons.some((r) => r.includes("海外TLD"))).toBe(true);
    });

    it("アフィリエイト風の表現を検出する", () => {
      const scraped = createMockScrapedData({
        bodyText: "今すぐ購入！詳細はこちら。公式サイトへ。限定特典あり！50%OFF",
      });
      const result = calcBridgePageRisk(scraped);
      expect(result.reasons.some((r) => r.includes("アフィリエイト風の表現"))).toBe(true);
    });

    it("スコアは100を超えない", () => {
      const scraped = createMockScrapedData({
        wordCount: 50,
        hasRedirectScript: true,
        hasIframe: true,
        externalLinkCount: 2,
        internalLinkCount: 0,
        url: "https://example.xyz/lp/offer",
        bodyText: "今すぐ購入！詳細はこちら！公式サイトへ！限定特典！50%OFF！初回無料！",
      });
      const result = calcBridgePageRisk(scraped);
      expect(result.score).toBeLessThanOrEqual(100);
    });

    it("metricsが正しく返される", () => {
      const scraped = createMockScrapedData({
        wordCount: 400,
        externalLinkCount: 3,
        internalLinkCount: 7,
        hasRedirectScript: true,
        hasIframe: false,
      });
      const result = calcBridgePageRisk(scraped);
      expect(result.metrics.wordCount).toBe(400);
      expect(result.metrics.externalLinkCount).toBe(3);
      expect(result.metrics.internalLinkCount).toBe(7);
      expect(result.metrics.hasRedirectScript).toBe(true);
      expect(result.metrics.hasIframe).toBe(false);
    });
  });

  describe("calcBridgePageRiskScore", () => {
    it("スコアのみを返す", () => {
      const scraped = createMockScrapedData();
      const score = calcBridgePageRiskScore(scraped);
      expect(typeof score).toBe("number");
      expect(score).toBeGreaterThanOrEqual(0);
      expect(score).toBeLessThanOrEqual(100);
    });
  });

  describe("calcBridgePageRiskFromHtml", () => {
    it("HTMLから直接判定できる", () => {
      const html = `
        <html>
          <head><title>Test</title></head>
          <body>
            <h1>タイトル</h1>
            <p>${"これはテストコンテンツです。".repeat(50)}</p>
          </body>
        </html>
      `;
      const result = calcBridgePageRiskFromHtml(html, "https://example.com");
      expect(result.score).toBeGreaterThanOrEqual(0);
      expect(result.level).toBeDefined();
    });

    it("JSリダイレクトを検出する", () => {
      const html = `
        <html>
          <body>
            <script>window.location.href = 'https://redirect.com';</script>
          </body>
        </html>
      `;
      const result = calcBridgePageRiskFromHtml(html, "https://example.com");
      expect(result.reasons).toContain("JSリダイレクト検出");
    });

    it("meta refreshを検出する", () => {
      const html = `
        <html>
          <head>
            <meta http-equiv="refresh" content="0;url=https://redirect.com">
          </head>
          <body></body>
        </html>
      `;
      const result = calcBridgePageRiskFromHtml(html, "https://example.com");
      expect(result.reasons).toContain("meta refresh検出");
    });
  });
});
