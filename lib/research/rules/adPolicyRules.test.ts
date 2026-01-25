import { calcAdPolicyRisk, calcAdPolicyRiskScore } from "./adPolicyRules";

describe("adPolicyRules", () => {
  describe("calcAdPolicyRisk", () => {
    it("NGワードなしのテキストはスコア0を返す", () => {
      const result = calcAdPolicyRisk("これは普通の商品説明です", "https://example.com");
      expect(result.score).toBe(0);
      expect(result.level).toBe("low");
      expect(result.matchedCategories).toHaveLength(0);
    });

    it("効果保証ワードを検出する", () => {
      const result = calcAdPolicyRisk("この方法は確実に効果があります", "https://example.com");
      expect(result.score).toBeGreaterThan(0);
      expect(result.matchedCategories.some((c) => c.name === "効果保証")).toBe(true);
    });

    it("収益誇張ワードを検出する", () => {
      const result = calcAdPolicyRisk("誰でも簡単に稼げる副業", "https://example.com");
      expect(result.score).toBeGreaterThan(0);
      expect(result.matchedCategories.some((c) => c.name === "収益誇張")).toBe(true);
    });

    it("健康誇大ワードを検出する", () => {
      const result = calcAdPolicyRisk("このサプリで確実に痩せる", "https://example.com");
      expect(result.score).toBeGreaterThan(0);
      expect(result.matchedCategories.some((c) => c.name === "健康誇大")).toBe(true);
    });

    it("金融詐欺ワードを検出する", () => {
      const result = calcAdPolicyRisk("元本保証で必ず儲かる投資", "https://example.com");
      expect(result.score).toBeGreaterThan(0);
      expect(result.matchedCategories.some((c) => c.name === "金融詐欺")).toBe(true);
    });

    it("緊急煽りワードを検出する", () => {
      const result = calcAdPolicyRisk("今だけ限定！先着100名様", "https://example.com");
      expect(result.score).toBeGreaterThan(0);
      expect(result.matchedCategories.some((c) => c.name === "緊急煽り")).toBe(true);
    });

    it("短縮URLをリスクとして検出する", () => {
      const result = calcAdPolicyRisk("詳細はこちら", "https://bit.ly/abc123");
      expect(result.urlRisks).toContain("短縮URL");
    });

    it("アフィリエイト風URLをリスクとして検出する", () => {
      const result = calcAdPolicyRisk("詳細はこちら", "https://example.com?ref=affiliate");
      expect(result.urlRisks).toContain("アフィリエイト風");
    });

    it("複数カテゴリで累積スコアになる", () => {
      const single = calcAdPolicyRisk("確実に効果がある", "https://example.com");
      const multiple = calcAdPolicyRisk("確実に痩せて簡単に稼げる", "https://example.com");
      expect(multiple.score).toBeGreaterThan(single.score);
    });

    it("スコアは100を超えない", () => {
      const text = "確実に必ず絶対100%保証 簡単に稼げる不労所得 痩せる治る効く 必ず儲かる元本保証 今だけ限定 医師推奨 情報商材";
      const result = calcAdPolicyRisk(text, "https://bit.ly/scam?ref=aff&track=1");
      expect(result.score).toBeLessThanOrEqual(100);
    });

    it("レベル判定が正しい", () => {
      expect(calcAdPolicyRisk("これはただのテキスト", "https://test.com").level).toBe("low");

      // critical: 70以上（より多くのNGワードで達成）
      const criticalText = "確実に必ず絶対100%保証 簡単に稼げる誰でも稼げる不労所得 痩せる治る効く完治 必ず儲かる元本保証";
      const criticalResult = calcAdPolicyRisk(criticalText, "https://test.com");
      expect(criticalResult.level).toBe("critical");
    });
  });

  describe("calcAdPolicyRiskScore", () => {
    it("スコアのみを返す", () => {
      const score = calcAdPolicyRiskScore("今だけ限定", "https://example.com");
      expect(typeof score).toBe("number");
      expect(score).toBeGreaterThanOrEqual(0);
      expect(score).toBeLessThanOrEqual(100);
    });
  });
});
