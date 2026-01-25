/**
 * scraper.ts のユニットテスト
 * HTMLパース機能のテスト
 */

import { parseHtml, ScrapedData } from "./scraper";

describe("parseHtml", () => {
  describe("基本的なHTML要素の抽出", () => {
    it("titleタグを抽出する", () => {
      const html = "<html><head><title>テストページ</title></head><body></body></html>";
      const result = parseHtml("https://example.com", html);
      expect(result.title).toBe("テストページ");
    });

    it("h1タグを抽出する", () => {
      const html = "<html><body><h1>見出し1</h1></body></html>";
      const result = parseHtml("https://example.com", html);
      expect(result.h1).toBe("見出し1");
    });

    it("meta descriptionを抽出する（name-content順）", () => {
      const html = `<html><head><meta name="description" content="これは説明文です"></head></html>`;
      const result = parseHtml("https://example.com", html);
      expect(result.metaDescription).toBe("これは説明文です");
    });

    it("meta descriptionを抽出する（content-name順）", () => {
      const html = `<html><head><meta content="逆順の説明文" name="description"></head></html>`;
      const result = parseHtml("https://example.com", html);
      expect(result.metaDescription).toBe("逆順の説明文");
    });

    it("og:imageを抽出する", () => {
      const html = `<html><head><meta property="og:image" content="https://example.com/image.jpg"></head></html>`;
      const result = parseHtml("https://example.com", html);
      expect(result.ogImage).toBe("https://example.com/image.jpg");
    });

    it("canonicalを抽出する", () => {
      const html = `<html><head><link rel="canonical" href="https://example.com/page"></head></html>`;
      const result = parseHtml("https://example.com", html);
      expect(result.canonical).toBe("https://example.com/page");
    });
  });

  describe("リンクのカウント", () => {
    it("内部リンクをカウントする", () => {
      const html = `
        <html><body>
          <a href="https://example.com/page1">内部1</a>
          <a href="/page2">内部2（相対）</a>
          <a href="page3">内部3（相対）</a>
        </body></html>
      `;
      const result = parseHtml("https://example.com", html);
      expect(result.internalLinkCount).toBe(3);
    });

    it("外部リンクをカウントする", () => {
      const html = `
        <html><body>
          <a href="https://other-site.com/page1">外部1</a>
          <a href="https://another.com/page2">外部2</a>
        </body></html>
      `;
      const result = parseHtml("https://example.com", html);
      expect(result.externalLinkCount).toBe(2);
    });

    it("内部と外部の混合をカウントする", () => {
      const html = `
        <html><body>
          <a href="https://example.com/page1">内部</a>
          <a href="https://external.com/page2">外部</a>
        </body></html>
      `;
      const result = parseHtml("https://example.com", html);
      expect(result.internalLinkCount).toBe(1);
      expect(result.externalLinkCount).toBe(1);
    });
  });

  describe("リダイレクトスクリプト検出", () => {
    it("window.locationを検出する", () => {
      const html = `<html><body><script>window.location = 'https://redirect.com';</script></body></html>`;
      const result = parseHtml("https://example.com", html);
      expect(result.hasRedirectScript).toBe(true);
    });

    it("location.hrefを検出する", () => {
      const html = `<html><body><script>location.href = 'https://redirect.com';</script></body></html>`;
      const result = parseHtml("https://example.com", html);
      expect(result.hasRedirectScript).toBe(true);
    });

    it("location.replaceを検出する", () => {
      const html = `<html><body><script>location.replace('https://redirect.com');</script></body></html>`;
      const result = parseHtml("https://example.com", html);
      expect(result.hasRedirectScript).toBe(true);
    });

    it("meta refreshを検出する", () => {
      const html = `<html><head><meta http-equiv="refresh" content="0;url=https://redirect.com"></head></html>`;
      const result = parseHtml("https://example.com", html);
      expect(result.hasRedirectScript).toBe(true);
    });

    it("リダイレクトスクリプトがない場合はfalse", () => {
      const html = `<html><body><p>通常のページ</p></body></html>`;
      const result = parseHtml("https://example.com", html);
      expect(result.hasRedirectScript).toBe(false);
    });
  });

  describe("iframe検出", () => {
    it("iframeを検出する", () => {
      const html = `<html><body><iframe src="https://example.com/frame"></iframe></body></html>`;
      const result = parseHtml("https://example.com", html);
      expect(result.hasIframe).toBe(true);
    });

    it("iframeがない場合はfalse", () => {
      const html = `<html><body><p>通常のページ</p></body></html>`;
      const result = parseHtml("https://example.com", html);
      expect(result.hasIframe).toBe(false);
    });
  });

  describe("本文テキスト抽出", () => {
    it("bodyからテキストを抽出する", () => {
      const html = `
        <html>
          <head><title>タイトル</title></head>
          <body>
            <p>これは本文です。</p>
            <p>テスト文章です。</p>
          </body>
        </html>
      `;
      const result = parseHtml("https://example.com", html);
      expect(result.bodyText).toContain("これは本文です");
      expect(result.bodyText).toContain("テスト文章です");
    });

    it("scriptタグの内容を除外する", () => {
      const html = `
        <html><body>
          <p>本文</p>
          <script>var secret = "除外されるべき";</script>
        </body></html>
      `;
      const result = parseHtml("https://example.com", html);
      expect(result.bodyText).toContain("本文");
      expect(result.bodyText).not.toContain("除外されるべき");
    });

    it("styleタグの内容を除外する", () => {
      const html = `
        <html><body>
          <p>本文</p>
          <style>.hidden { display: none; }</style>
        </body></html>
      `;
      const result = parseHtml("https://example.com", html);
      expect(result.bodyText).toContain("本文");
      expect(result.bodyText).not.toContain("display");
    });

    it("bodyTextは5000文字以下に制限される", () => {
      const longText = "あ".repeat(10000);
      const html = `<html><body><p>${longText}</p></body></html>`;
      const result = parseHtml("https://example.com", html);
      expect(result.bodyText.length).toBeLessThanOrEqual(5000);
    });
  });

  describe("単語数カウント", () => {
    it("日本語の文字数をカウントする", () => {
      const html = `<html><body><p>日本語テスト</p></body></html>`;
      const result = parseHtml("https://example.com", html);
      // 「日本語テスト」= 6文字（ひらがな・カタカナ・漢字）
      expect(result.wordCount).toBeGreaterThanOrEqual(5);
    });

    it("英単語数をカウントする", () => {
      const html = `<html><body><p>Hello world test</p></body></html>`;
      const result = parseHtml("https://example.com", html);
      // Hello, world, test = 3単語
      expect(result.wordCount).toBe(3);
    });

    it("日本語と英語の混合をカウントする", () => {
      const html = `<html><body><p>日本語とEnglish混合</p></body></html>`;
      const result = parseHtml("https://example.com", html);
      // 日本語文字 + English単語
      expect(result.wordCount).toBeGreaterThanOrEqual(4);
    });
  });

  describe("キーワード抽出", () => {
    it("title, h1, descriptionからキーワードを抽出する", () => {
      const html = `
        <html>
          <head>
            <title>サービス比較サイト</title>
            <meta name="description" content="最適なサービスを見つけましょう">
          </head>
          <body>
            <h1>サービス選び方ガイド</h1>
          </body>
        </html>
      `;
      const result = parseHtml("https://example.com", html);
      expect(result.keywords.length).toBeGreaterThan(0);
      expect(result.keywords.some((k) => k.includes("サービス"))).toBe(true);
    });

    it("キーワードは最大10件", () => {
      const manyWords = "キーワード一 キーワード二 キーワード三 キーワード四 キーワード五 " +
        "キーワード六 キーワード七 キーワード八 キーワード九 キーワード十 キーワード十一 キーワード十二";
      const html = `<html><head><title>${manyWords}</title></head></html>`;
      const result = parseHtml("https://example.com", html);
      expect(result.keywords.length).toBeLessThanOrEqual(10);
    });

    it("重複キーワードは除去される", () => {
      const html = `
        <html>
          <head>
            <title>テストテストテスト</title>
            <meta name="description" content="テストの説明">
          </head>
          <body><h1>テスト見出し</h1></body>
        </html>
      `;
      const result = parseHtml("https://example.com", html);
      const testKeywords = result.keywords.filter((k) => k === "テスト");
      expect(testKeywords.length).toBeLessThanOrEqual(1);
    });
  });

  describe("HTMLエンティティのデコード", () => {
    it("&nbsp;をスペースに変換する", () => {
      const html = `<html><body><p>テスト&nbsp;文章</p></body></html>`;
      const result = parseHtml("https://example.com", html);
      expect(result.bodyText).toContain("テスト 文章");
    });

    it("&amp;を&に変換する", () => {
      const html = `<html><head><title>A &amp; B</title></head></html>`;
      const result = parseHtml("https://example.com", html);
      expect(result.title).toBe("A & B");
    });

    it("&lt; &gt;を< >に変換する", () => {
      const html = `<html><body><p>1 &lt; 2 &gt; 0</p></body></html>`;
      const result = parseHtml("https://example.com", html);
      expect(result.bodyText).toContain("1 < 2 > 0");
    });
  });

  describe("エッジケース", () => {
    it("空のHTMLでもエラーにならない", () => {
      const result = parseHtml("https://example.com", "");
      expect(result.url).toBe("https://example.com");
      expect(result.title).toBe("");
      expect(result.fetchError).toBeNull();
    });

    it("不正なHTMLでもエラーにならない", () => {
      const html = "<html><body><p>閉じタグなし";
      const result = parseHtml("https://example.com", html);
      expect(result.url).toBe("https://example.com");
      expect(result.fetchError).toBeNull();
    });

    it("URLが正しく保持される", () => {
      const url = "https://example.com/path?query=1";
      const result = parseHtml(url, "<html></html>");
      expect(result.url).toBe(url);
    });
  });
});
