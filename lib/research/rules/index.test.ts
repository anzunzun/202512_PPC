/**
 * rules/index.ts のユニットテスト
 * 総合リスクスコア算出のテスト
 */

import { calcTotalRiskScore } from "./index";

describe("calcTotalRiskScore", () => {
  describe("重み付け計算", () => {
    it("全てのリスクが0の場合は0を返す", () => {
      const result = calcTotalRiskScore(0, 0, 0);
      expect(result).toBe(0);
    });

    it("全てのリスクが100の場合は100を返す", () => {
      const result = calcTotalRiskScore(100, 100, 100);
      expect(result).toBe(100);
    });

    it("adPolicyRiskのみ100の場合は40を返す（重み0.4）", () => {
      const result = calcTotalRiskScore(100, 0, 0);
      expect(result).toBe(40);
    });

    it("trademarkRiskのみ100の場合は30を返す（重み0.3）", () => {
      const result = calcTotalRiskScore(0, 100, 0);
      expect(result).toBe(30);
    });

    it("bridgePageRiskのみ100の場合は30を返す（重み0.3）", () => {
      const result = calcTotalRiskScore(0, 0, 100);
      expect(result).toBe(30);
    });

    it("混合スコアを正しく計算する", () => {
      // 50 * 0.4 + 60 * 0.3 + 70 * 0.3 = 20 + 18 + 21 = 59
      const result = calcTotalRiskScore(50, 60, 70);
      expect(result).toBe(59);
    });
  });

  describe("四捨五入", () => {
    it("小数点以下を四捨五入する", () => {
      // 25 * 0.4 + 25 * 0.3 + 25 * 0.3 = 10 + 7.5 + 7.5 = 25
      const result = calcTotalRiskScore(25, 25, 25);
      expect(result).toBe(25);
    });

    it("0.5以上は切り上げ", () => {
      // 33 * 0.4 + 33 * 0.3 + 33 * 0.3 = 13.2 + 9.9 + 9.9 = 33
      const result = calcTotalRiskScore(33, 33, 33);
      expect(result).toBe(33);
    });
  });

  describe("上限制御", () => {
    it("計算結果が100を超える場合は100に制限する", () => {
      // 通常は超えないが、念のため
      const result = calcTotalRiskScore(150, 150, 150);
      expect(result).toBe(100);
    });
  });

  describe("エッジケース", () => {
    it("小さい値での計算", () => {
      // 1 * 0.4 + 1 * 0.3 + 1 * 0.3 = 0.4 + 0.3 + 0.3 = 1
      const result = calcTotalRiskScore(1, 1, 1);
      expect(result).toBe(1);
    });

    it("異なる値の組み合わせ", () => {
      // 80 * 0.4 + 50 * 0.3 + 20 * 0.3 = 32 + 15 + 6 = 53
      const result = calcTotalRiskScore(80, 50, 20);
      expect(result).toBe(53);
    });

    it("adPolicyRiskが最も重い影響を持つ", () => {
      const highAdPolicy = calcTotalRiskScore(100, 0, 0);
      const highTrademark = calcTotalRiskScore(0, 100, 0);
      const highBridge = calcTotalRiskScore(0, 0, 100);

      expect(highAdPolicy).toBeGreaterThan(highTrademark);
      expect(highAdPolicy).toBeGreaterThan(highBridge);
      expect(highTrademark).toBe(highBridge);
    });
  });
});
