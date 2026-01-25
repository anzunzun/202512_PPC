/**
 * engine.ts のユニットテスト
 * トークン化・頻度分析のテスト
 */

import { runEngineDemo, EngineOutput } from "./engine";

describe("runEngineDemo", () => {
  describe("トークン化", () => {
    it("英単語を小文字化してトークン化する", () => {
      const result = runEngineDemo("Hello World");
      const tokens = result.freqTop.map((f) => f.token);
      expect(tokens).toContain("hello");
      expect(tokens).toContain("world");
    });

    it("大文字小文字を統一する", () => {
      const result = runEngineDemo("TEST Test test");
      expect(result.freqTop[0].token).toBe("test");
      expect(result.freqTop[0].count).toBe(3);
    });

    it("数字も含める", () => {
      const result = runEngineDemo("test123 abc456");
      const tokens = result.freqTop.map((f) => f.token);
      expect(tokens).toContain("test123");
      expect(tokens).toContain("abc456");
    });

    it("記号で分割する", () => {
      const result = runEngineDemo("hello-world foo_bar test.case");
      const tokens = result.freqTop.map((f) => f.token);
      expect(tokens).toContain("hello");
      expect(tokens).toContain("world");
      expect(tokens).toContain("foo");
      expect(tokens).toContain("bar");
      expect(tokens).toContain("test");
      expect(tokens).toContain("case");
    });
  });

  describe("頻度カウント", () => {
    it("同じ単語の出現回数をカウントする", () => {
      const result = runEngineDemo("apple banana apple cherry apple banana");
      const appleEntry = result.freqTop.find((f) => f.token === "apple");
      const bananaEntry = result.freqTop.find((f) => f.token === "banana");
      const cherryEntry = result.freqTop.find((f) => f.token === "cherry");

      expect(appleEntry?.count).toBe(3);
      expect(bananaEntry?.count).toBe(2);
      expect(cherryEntry?.count).toBe(1);
    });

    it("頻度順にソートされる", () => {
      const result = runEngineDemo("c c c b b a");
      expect(result.freqTop[0].token).toBe("c");
      expect(result.freqTop[0].count).toBe(3);
      expect(result.freqTop[1].token).toBe("b");
      expect(result.freqTop[1].count).toBe(2);
      expect(result.freqTop[2].token).toBe("a");
      expect(result.freqTop[2].count).toBe(1);
    });

    it("最大20件に制限される", () => {
      const words = Array.from({ length: 30 }, (_, i) => `word${i}`).join(" ");
      const result = runEngineDemo(words);
      expect(result.freqTop.length).toBeLessThanOrEqual(20);
    });
  });

  describe("エッジケース", () => {
    it("空文字列の場合は空配列を返す", () => {
      const result = runEngineDemo("");
      expect(result.freqTop).toEqual([]);
    });

    it("nullish値の場合は空配列を返す", () => {
      const result = runEngineDemo(null as any);
      expect(result.freqTop).toEqual([]);
    });

    it("undefinedの場合は空配列を返す", () => {
      const result = runEngineDemo(undefined as any);
      expect(result.freqTop).toEqual([]);
    });

    it("空白のみの場合は空配列を返す", () => {
      const result = runEngineDemo("   \t\n  ");
      expect(result.freqTop).toEqual([]);
    });

    it("記号のみの場合は空配列を返す", () => {
      const result = runEngineDemo("!@#$%^&*()");
      expect(result.freqTop).toEqual([]);
    });
  });

  describe("戻り値の形式", () => {
    it("EngineOutput形式で返す", () => {
      const result = runEngineDemo("test");
      expect(result).toHaveProperty("freqTop");
      expect(Array.isArray(result.freqTop)).toBe(true);
    });

    it("各エントリはtokenとcountを持つ", () => {
      const result = runEngineDemo("hello");
      expect(result.freqTop[0]).toHaveProperty("token");
      expect(result.freqTop[0]).toHaveProperty("count");
      expect(typeof result.freqTop[0].token).toBe("string");
      expect(typeof result.freqTop[0].count).toBe("number");
    });
  });
});
