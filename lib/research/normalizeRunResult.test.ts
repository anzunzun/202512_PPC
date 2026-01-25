/**
 * normalizeRunResult.ts のユニットテスト
 * 外部データの正規化処理のテスト
 */

import { normalizeRunResult, NormalizedRunResult } from "./normalizeRunResult";

describe("normalizeRunResult", () => {
  describe("result フィールドの正規化", () => {
    describe("conversion", () => {
      it("conversionキーを認識する", () => {
        const result = normalizeRunResult({ result: { conversion: "10" } });
        expect(result.result.conversion).toBe("10");
      });

      it("cvキーを認識する", () => {
        const result = normalizeRunResult({ result: { cv: "20" } });
        expect(result.result.conversion).toBe("20");
      });

      it("conversionsキーを認識する", () => {
        const result = normalizeRunResult({ result: { conversions: "30" } });
        expect(result.result.conversion).toBe("30");
      });
    });

    describe("targetKw", () => {
      it("targetKwキーを認識する", () => {
        const result = normalizeRunResult({ result: { targetKw: "keyword1" } });
        expect(result.result.targetKw).toBe("keyword1");
      });

      it("targetKWキーを認識する", () => {
        const result = normalizeRunResult({ result: { targetKW: "keyword2" } });
        expect(result.result.targetKw).toBe("keyword2");
      });

      it("target_kwキーを認識する", () => {
        const result = normalizeRunResult({ result: { target_kw: "keyword3" } });
        expect(result.result.targetKw).toBe("keyword3");
      });

      it("keywordキーを認識する", () => {
        const result = normalizeRunResult({ result: { keyword: "keyword4" } });
        expect(result.result.targetKw).toBe("keyword4");
      });

      it("targetKeywordキーを認識する", () => {
        const result = normalizeRunResult({ result: { targetKeyword: "keyword5" } });
        expect(result.result.targetKw).toBe("keyword5");
      });
    });

    describe("referenceUrl", () => {
      it("referenceUrlキーを認識する", () => {
        const result = normalizeRunResult({ result: { referenceUrl: "https://a.com" } });
        expect(result.result.referenceUrl).toBe("https://a.com");
      });

      it("referenceURLキーを認識する", () => {
        const result = normalizeRunResult({ result: { referenceURL: "https://b.com" } });
        expect(result.result.referenceUrl).toBe("https://b.com");
      });

      it("reference_urlキーを認識する", () => {
        const result = normalizeRunResult({ result: { reference_url: "https://c.com" } });
        expect(result.result.referenceUrl).toBe("https://c.com");
      });

      it("urlキーを認識する", () => {
        const result = normalizeRunResult({ result: { url: "https://d.com" } });
        expect(result.result.referenceUrl).toBe("https://d.com");
      });

      it("referenceキーを認識する", () => {
        const result = normalizeRunResult({ result: { reference: "https://e.com" } });
        expect(result.result.referenceUrl).toBe("https://e.com");
      });
    });
  });

  describe("scores フィールドの正規化", () => {
    describe("clicks", () => {
      it("clicksキーを認識する", () => {
        const result = normalizeRunResult({ scores: { clicks: 100 } });
        expect(result.scores.clicks).toBe(100);
      });

      it("clickキーを認識する", () => {
        const result = normalizeRunResult({ scores: { click: 200 } });
        expect(result.scores.clicks).toBe(200);
      });
    });

    describe("pv", () => {
      it("pvキーを認識する", () => {
        const result = normalizeRunResult({ scores: { pv: 1000 } });
        expect(result.scores.pv).toBe(1000);
      });

      it("pageviewsキーを認識する", () => {
        const result = normalizeRunResult({ scores: { pageviews: 2000 } });
        expect(result.scores.pv).toBe(2000);
      });

      it("viewsキーを認識する", () => {
        const result = normalizeRunResult({ scores: { views: 3000 } });
        expect(result.scores.pv).toBe(3000);
      });

      it("impressionsキーを認識する", () => {
        const result = normalizeRunResult({ scores: { impressions: 4000 } });
        expect(result.scores.pv).toBe(4000);
      });
    });

    describe("totalScore", () => {
      it("totalScoreキーを認識する", () => {
        const result = normalizeRunResult({ scores: { totalScore: 85 } });
        expect(result.scores.totalScore).toBe(85);
      });

      it("total_scoreキーを認識する", () => {
        const result = normalizeRunResult({ scores: { total_score: 90 } });
        expect(result.scores.totalScore).toBe(90);
      });

      it("scoreキーを認識する", () => {
        const result = normalizeRunResult({ scores: { score: 95 } });
        expect(result.scores.totalScore).toBe(95);
      });
    });

    describe("adPolicyRisk", () => {
      it("adPolicyRiskキーを認識する", () => {
        const result = normalizeRunResult({ scores: { adPolicyRisk: "high" } });
        expect(result.scores.adPolicyRisk).toBe("high");
      });

      it("ad_policy_riskキーを認識する", () => {
        const result = normalizeRunResult({ scores: { ad_policy_risk: "medium" } });
        expect(result.scores.adPolicyRisk).toBe("medium");
      });

      it("policyRiskキーを認識する", () => {
        const result = normalizeRunResult({ scores: { policyRisk: "low" } });
        expect(result.scores.adPolicyRisk).toBe("low");
      });

      it("riskキーを認識する", () => {
        const result = normalizeRunResult({ scores: { risk: "none" } });
        expect(result.scores.adPolicyRisk).toBe("none");
      });
    });
  });

  describe("代替ルートキー", () => {
    it("scoresの代わりにscoreを使用する", () => {
      const result = normalizeRunResult({ score: { clicks: 50 } });
      expect(result.scores.clicks).toBe(50);
    });

    it("scoresの代わりにmetricsを使用する", () => {
      const result = normalizeRunResult({ metrics: { pv: 500 } });
      expect(result.scores.pv).toBe(500);
    });

    it("resultがない場合はルートオブジェクトを使用する", () => {
      const result = normalizeRunResult({ conversion: "5", targetKw: "test" });
      expect(result.result.conversion).toBe("5");
      expect(result.result.targetKw).toBe("test");
    });
  });

  describe("エッジケース", () => {
    it("nullの場合も安全に処理する", () => {
      const result = normalizeRunResult(null);
      expect(result.result).toBeDefined();
      expect(result.scores).toBeDefined();
    });

    it("undefinedの場合も安全に処理する", () => {
      const result = normalizeRunResult(undefined);
      expect(result.result).toBeDefined();
      expect(result.scores).toBeDefined();
    });

    it("空オブジェクトの場合も安全に処理する", () => {
      const result = normalizeRunResult({});
      expect(result.result).toBeDefined();
      expect(result.scores).toBeDefined();
    });

    it("空文字列は無視する", () => {
      const result = normalizeRunResult({ result: { conversion: "" } });
      expect(result.result.conversion).toBeUndefined();
    });

    it("空白のみの文字列は無視する", () => {
      const result = normalizeRunResult({ result: { conversion: "   " } });
      expect(result.result.conversion).toBeUndefined();
    });

    it("0は有効な値として扱う", () => {
      const result = normalizeRunResult({ scores: { clicks: 0 } });
      expect(result.scores.clicks).toBe(0);
    });

    it("優先順位：最初に見つかった値を使用する", () => {
      const result = normalizeRunResult({
        result: { conversion: "first", cv: "second" },
      });
      expect(result.result.conversion).toBe("first");
    });
  });

  describe("戻り値の形式", () => {
    it("NormalizedRunResult形式で返す", () => {
      const result = normalizeRunResult({});
      expect(result).toHaveProperty("result");
      expect(result).toHaveProperty("scores");
    });

    it("複合データを正しく処理する", () => {
      const input = {
        result: {
          conversion: "15",
          targetKw: "affiliate",
          referenceUrl: "https://example.com",
        },
        scores: {
          clicks: 100,
          pv: 1000,
          totalScore: 75,
          adPolicyRisk: "low",
        },
      };
      const result = normalizeRunResult(input);

      expect(result.result.conversion).toBe("15");
      expect(result.result.targetKw).toBe("affiliate");
      expect(result.result.referenceUrl).toBe("https://example.com");
      expect(result.scores.clicks).toBe(100);
      expect(result.scores.pv).toBe(1000);
      expect(result.scores.totalScore).toBe(75);
      expect(result.scores.adPolicyRisk).toBe("low");
    });
  });
});
