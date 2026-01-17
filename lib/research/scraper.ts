/**
 * 強化版スクレイパー
 * URLからSEOデータ・リスク判定用データを抽出
 */

export type ScrapedData = {
  url: string;
  title: string;
  h1: string;
  metaDescription: string;
  ogImage: string;
  canonical: string;
  wordCount: number;
  externalLinkCount: number;
  internalLinkCount: number;
  hasRedirectScript: boolean;
  hasIframe: boolean;
  bodyText: string; // リスク判定用のテキスト
  keywords: string[];
  fetchError: string | null;
};

const EMPTY_SCRAPED: ScrapedData = {
  url: "",
  title: "",
  h1: "",
  metaDescription: "",
  ogImage: "",
  canonical: "",
  wordCount: 0,
  externalLinkCount: 0,
  internalLinkCount: 0,
  hasRedirectScript: false,
  hasIframe: false,
  bodyText: "",
  keywords: [],
  fetchError: null,
};

/**
 * URLをスクレイピングしてデータ抽出
 */
export async function scrapeUrl(
  url: string,
  timeoutMs = 10000
): Promise<ScrapedData> {
  const u = String(url ?? "").trim();
  if (!u) {
    return { ...EMPTY_SCRAPED, fetchError: "URL is empty" };
  }

  // http(s)以外は弾く
  if (!/^https?:\/\//i.test(u)) {
    return { ...EMPTY_SCRAPED, url: u, fetchError: "Invalid URL scheme" };
  }

  const ac = new AbortController();
  const t = setTimeout(() => ac.abort(), timeoutMs);

  try {
    const res = await fetch(u, {
      method: "GET",
      redirect: "follow",
      signal: ac.signal,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; PPCResearchBot/1.0; +https://localhost)",
        Accept: "text/html,application/xhtml+xml",
      },
    });

    if (!res.ok) {
      return {
        ...EMPTY_SCRAPED,
        url: u,
        fetchError: `HTTP ${res.status}`,
      };
    }

    const ct = res.headers.get("content-type") || "";
    if (!ct.includes("text/html")) {
      return {
        ...EMPTY_SCRAPED,
        url: u,
        fetchError: `Not HTML: ${ct}`,
      };
    }

    const html = await res.text();
    return parseHtml(u, html);
  } catch (e: any) {
    const msg = e?.name === "AbortError" ? "Timeout" : (e?.message ?? "Fetch error");
    return { ...EMPTY_SCRAPED, url: u, fetchError: msg };
  } finally {
    clearTimeout(t);
  }
}

/**
 * HTMLをパースしてScrapedDataを生成
 */
function parseHtml(url: string, html: string): ScrapedData {
  const title = pickTag(html, "title", 200);
  const h1 = pickTag(html, "h1", 200);
  const metaDescription = pickMeta(html, "description", 300);
  const ogImage = pickMetaProperty(html, "og:image", 500);
  const canonical = pickCanonical(html);

  const bodyText = extractBodyText(html);
  const wordCount = countWords(bodyText);

  const { external, internal } = countLinks(html, url);
  const hasRedirectScript = detectRedirectScript(html);
  const hasIframe = /<iframe/i.test(html);

  const keywords = extractKeywords(title, h1, metaDescription);

  return {
    url,
    title,
    h1,
    metaDescription,
    ogImage,
    canonical,
    wordCount,
    externalLinkCount: external,
    internalLinkCount: internal,
    hasRedirectScript,
    hasIframe,
    bodyText: bodyText.slice(0, 5000), // 5KB上限
    keywords,
    fetchError: null,
  };
}

/* ----------------------------- helpers ----------------------------- */

function pickTag(html: string, tag: string, maxLen: number): string {
  const re = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, "i");
  const m = html.match(re);
  if (!m) return "";
  return stripTags(m[1]).slice(0, maxLen).trim();
}

function pickMeta(html: string, name: string, maxLen: number): string {
  // name="description" content="..."
  const re1 = new RegExp(
    `<meta[^>]+name=["']${name}["'][^>]+content=["']([^"']+)["'][^>]*>`,
    "i"
  );
  const m1 = html.match(re1);
  if (m1) return stripTags(m1[1]).slice(0, maxLen).trim();

  // content="..." name="description" (順序逆)
  const re2 = new RegExp(
    `<meta[^>]+content=["']([^"']+)["'][^>]+name=["']${name}["'][^>]*>`,
    "i"
  );
  const m2 = html.match(re2);
  if (m2) return stripTags(m2[1]).slice(0, maxLen).trim();

  return "";
}

function pickMetaProperty(html: string, prop: string, maxLen: number): string {
  const re = new RegExp(
    `<meta[^>]+property=["']${prop}["'][^>]+content=["']([^"']+)["'][^>]*>`,
    "i"
  );
  const m = html.match(re);
  if (m) return m[1].slice(0, maxLen).trim();
  return "";
}

function pickCanonical(html: string): string {
  const re = /<link[^>]+rel=["']canonical["'][^>]+href=["']([^"']+)["'][^>]*>/i;
  const m = html.match(re);
  if (m) return m[1].trim();
  return "";
}

function stripTags(s: string): string {
  return String(s ?? "")
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/\s+/g, " ")
    .trim();
}

function extractBodyText(html: string): string {
  // head, script, style を除去
  let s = html
    .replace(/<head[\s\S]*?<\/head>/gi, " ")
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, " ");

  return stripTags(s);
}

function countWords(text: string): number {
  // 日本語: 文字数ベース、英語: 単語数ベース
  const s = String(text ?? "").trim();
  if (!s) return 0;

  // 日本語文字数
  const jpChars = (s.match(/[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FFF]/g) || []).length;

  // 英単語数
  const enWords = (s.match(/[a-zA-Z]+/g) || []).length;

  return jpChars + enWords;
}

function countLinks(
  html: string,
  baseUrl: string
): { external: number; internal: number } {
  let baseHost = "";
  try {
    baseHost = new URL(baseUrl).hostname;
  } catch {
    // invalid URL
  }

  const linkMatches = html.match(/<a[^>]+href=["']([^"']+)["']/gi) || [];
  let external = 0;
  let internal = 0;

  for (const m of linkMatches) {
    const hrefMatch = m.match(/href=["']([^"']+)["']/i);
    if (!hrefMatch) continue;
    const href = hrefMatch[1];

    try {
      const linkUrl = new URL(href, baseUrl);
      if (linkUrl.hostname === baseHost) {
        internal++;
      } else {
        external++;
      }
    } catch {
      // 相対パス等 → internal扱い
      internal++;
    }
  }

  return { external, internal };
}

function detectRedirectScript(html: string): boolean {
  // よくあるリダイレクトパターン検出
  const patterns = [
    /window\.location\s*[=.]/i,
    /location\.href\s*=/i,
    /location\.replace\s*\(/i,
    /document\.location\s*=/i,
    /<meta[^>]+http-equiv=["']refresh["']/i,
  ];

  for (const p of patterns) {
    if (p.test(html)) return true;
  }
  return false;
}

function extractKeywords(title: string, h1: string, desc: string): string[] {
  const combined = [title, h1, desc].filter(Boolean).join(" ");
  const cleaned = combined
    .replace(/[【】［］（）()〈〉<>「」『』|｜•·・]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  if (!cleaned) return [];

  // 日本語: 2-10文字の塊を抽出
  const jpWords = cleaned.match(/[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FFF]{2,10}/g) || [];

  // 英語: 3文字以上の単語
  const enWords = cleaned.match(/[a-zA-Z]{3,}/g) || [];

  // 重複除去 & 上位10件
  const all = [...new Set([...jpWords, ...enWords])];
  return all.slice(0, 10);
}
