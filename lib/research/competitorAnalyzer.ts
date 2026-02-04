/**
 * 競合LP分析ロジック
 * LPの構造、訴求ポイント、CTAなどを分析
 */

import { scrapeUrl, type ScrapedData } from "./scraper";

export type LpStructure = {
  url: string;
  title: string;

  // ファーストビュー
  heroHeadline: string;
  heroSubheadline: string;
  hasHeroImage: boolean;

  // CTA分析
  ctaCount: number;
  ctaTexts: string[];
  hasFloatingCta: boolean;

  // コンテンツ構造
  sectionCount: number;
  sectionHeadings: string[];
  hasComparisonTable: boolean;
  hasPriceDisplay: boolean;
  hasTestimonials: boolean;
  hasFaq: boolean;

  // 訴求ポイント
  appealPoints: string[];
  urgencyPhrases: string[];
  trustSignals: string[];

  // メトリクス
  wordCount: number;
  imageCount: number;
  externalLinkCount: number;

  // 分析スコア
  scores: {
    ctaVisibility: number;      // CTA視認性 0-100
    contentDepth: number;       // コンテンツ充実度 0-100
    trustBuilding: number;      // 信頼構築度 0-100
    urgencyLevel: number;       // 緊急性演出度 0-100
    overall: number;            // 総合 0-100
  };

  fetchError: string | null;
};

// CTA系のキーワード
const CTA_PATTERNS = [
  /今すぐ|いますぐ/,
  /購入|申[し込]?み|申込|お申し込み/,
  /詳[しく]?[見は]|詳細/,
  /公式|オフィシャル/,
  /無料|0円|タダ/,
  /こちら|ここから|クリック/,
  /始める|スタート/,
  /試[すし]/,
  /チェック/,
];

// 緊急性を煽るフレーズ
const URGENCY_PATTERNS = [
  /今だけ|期間限定|数量限定/,
  /先着|残り|あと\d/,
  /本日|今日|〜まで/,
  /キャンペーン|セール|特価/,
  /終了|締切|〆切/,
];

// 信頼シグナル
const TRUST_PATTERNS = [
  /\d+万[人名件]/,
  /実績|導入|採用/,
  /満足度|評価/,
  /受賞|認定|認証/,
  /専門家|医師|監修/,
  /安心|安全|保証/,
  /返金|返品/,
];

// 訴求ポイント抽出パターン
const APPEAL_PATTERNS = [
  /(?:✓|✔|☑|■|・|【).{3,30}/g,
  /\d+%(?:OFF|オフ|引き|還元)/g,
  /初回.{0,10}(?:無料|円|OFF)/g,
  /送料無料/g,
];

export async function analyzeLp(url: string): Promise<LpStructure> {
  // スクレイピング
  const scraped = await scrapeUrl(url, 15000);

  if (scraped.fetchError) {
    return createEmptyStructure(url, scraped.fetchError);
  }

  const bodyText = scraped.bodyText || "";
  const html = scraped.rawHtml || bodyText;

  // CTA分析
  const ctaTexts = extractCtaTexts(html);
  const hasFloatingCta = /position:\s*fixed|sticky/i.test(html) &&
    CTA_PATTERNS.some(p => p.test(html));

  // セクション分析
  const sectionHeadings = extractHeadings(html);

  // 訴求ポイント抽出
  const appealPoints = extractAppealPoints(bodyText);
  const urgencyPhrases = extractByPatterns(bodyText, URGENCY_PATTERNS);
  const trustSignals = extractByPatterns(bodyText, TRUST_PATTERNS);

  // 構造検出
  const hasComparisonTable = /比較|<table/i.test(html);
  const hasPriceDisplay = /円|¥|\d{1,3},\d{3}/.test(bodyText);
  const hasTestimonials = /口コミ|レビュー|体験談|お客様の声/.test(bodyText);
  const hasFaq = /よくある質問|FAQ|Q&A|Q\./i.test(html);

  // 画像カウント
  const imageCount = (html.match(/<img/gi) || []).length;

  // スコア計算
  const scores = calculateScores({
    ctaCount: ctaTexts.length,
    hasFloatingCta,
    wordCount: scraped.wordCount,
    sectionCount: sectionHeadings.length,
    trustSignals: trustSignals.length,
    urgencyPhrases: urgencyPhrases.length,
    hasComparisonTable,
    hasFaq,
  });

  return {
    url,
    title: scraped.title || "",

    heroHeadline: scraped.h1 || "",
    heroSubheadline: scraped.metaDescription || "",
    hasHeroImage: /<img[^>]*hero|banner|main/i.test(html),

    ctaCount: ctaTexts.length,
    ctaTexts: ctaTexts.slice(0, 10),
    hasFloatingCta,

    sectionCount: sectionHeadings.length,
    sectionHeadings: sectionHeadings.slice(0, 15),
    hasComparisonTable,
    hasPriceDisplay,
    hasTestimonials,
    hasFaq,

    appealPoints: appealPoints.slice(0, 10),
    urgencyPhrases: urgencyPhrases.slice(0, 5),
    trustSignals: trustSignals.slice(0, 5),

    wordCount: scraped.wordCount,
    imageCount,
    externalLinkCount: scraped.externalLinkCount,

    scores,
    fetchError: null,
  };
}

function extractCtaTexts(html: string): string[] {
  const results: string[] = [];

  // ボタン・リンクテキストを抽出
  const btnMatches = html.match(/<(?:button|a)[^>]*>([^<]{2,30})<\/(?:button|a)>/gi) || [];

  for (const match of btnMatches) {
    const textMatch = match.match(/>([^<]+)</);
    if (textMatch) {
      const text = textMatch[1].trim();
      if (CTA_PATTERNS.some(p => p.test(text))) {
        if (!results.includes(text)) {
          results.push(text);
        }
      }
    }
  }

  return results;
}

function extractHeadings(html: string): string[] {
  const results: string[] = [];
  const matches = html.match(/<h[1-6][^>]*>([^<]+)<\/h[1-6]>/gi) || [];

  for (const match of matches) {
    const textMatch = match.match(/>([^<]+)</);
    if (textMatch) {
      const text = textMatch[1].trim();
      if (text.length >= 2 && text.length <= 50) {
        results.push(text);
      }
    }
  }

  return results;
}

function extractAppealPoints(text: string): string[] {
  const results: string[] = [];

  for (const pattern of APPEAL_PATTERNS) {
    const matches = text.match(pattern) || [];
    for (const m of matches) {
      const clean = m.replace(/^[✓✔☑■・【]+/, "").trim();
      if (clean.length >= 3 && !results.includes(clean)) {
        results.push(clean);
      }
    }
  }

  return results;
}

function extractByPatterns(text: string, patterns: RegExp[]): string[] {
  const results: string[] = [];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match && !results.includes(match[0])) {
      results.push(match[0]);
    }
  }

  return results;
}

function calculateScores(data: {
  ctaCount: number;
  hasFloatingCta: boolean;
  wordCount: number;
  sectionCount: number;
  trustSignals: number;
  urgencyPhrases: number;
  hasComparisonTable: boolean;
  hasFaq: boolean;
}): LpStructure["scores"] {
  // CTA視認性: CTAの数とフローティング有無
  const ctaVisibility = Math.min(100,
    data.ctaCount * 20 + (data.hasFloatingCta ? 30 : 0)
  );

  // コンテンツ充実度: 文字数とセクション数
  const contentDepth = Math.min(100,
    Math.min(50, data.wordCount / 20) +
    Math.min(30, data.sectionCount * 5) +
    (data.hasComparisonTable ? 10 : 0) +
    (data.hasFaq ? 10 : 0)
  );

  // 信頼構築度: 信頼シグナルの数
  const trustBuilding = Math.min(100, data.trustSignals * 20);

  // 緊急性演出度: 緊急性フレーズの数
  const urgencyLevel = Math.min(100, data.urgencyPhrases * 25);

  // 総合スコア
  const overall = Math.round(
    ctaVisibility * 0.3 +
    contentDepth * 0.3 +
    trustBuilding * 0.25 +
    urgencyLevel * 0.15
  );

  return {
    ctaVisibility,
    contentDepth,
    trustBuilding,
    urgencyLevel,
    overall,
  };
}

function createEmptyStructure(url: string, error: string): LpStructure {
  return {
    url,
    title: "",
    heroHeadline: "",
    heroSubheadline: "",
    hasHeroImage: false,
    ctaCount: 0,
    ctaTexts: [],
    hasFloatingCta: false,
    sectionCount: 0,
    sectionHeadings: [],
    hasComparisonTable: false,
    hasPriceDisplay: false,
    hasTestimonials: false,
    hasFaq: false,
    appealPoints: [],
    urgencyPhrases: [],
    trustSignals: [],
    wordCount: 0,
    imageCount: 0,
    externalLinkCount: 0,
    scores: {
      ctaVisibility: 0,
      contentDepth: 0,
      trustBuilding: 0,
      urgencyLevel: 0,
      overall: 0,
    },
    fetchError: error,
  };
}

// 複数LP比較
export function compareLps(lps: LpStructure[]): {
  bestPractices: string[];
  improvements: string[];
  avgScores: LpStructure["scores"];
} {
  if (lps.length === 0) {
    return { bestPractices: [], improvements: [], avgScores: { ctaVisibility: 0, contentDepth: 0, trustBuilding: 0, urgencyLevel: 0, overall: 0 } };
  }

  // 平均スコア
  const avgScores = {
    ctaVisibility: Math.round(lps.reduce((s, l) => s + l.scores.ctaVisibility, 0) / lps.length),
    contentDepth: Math.round(lps.reduce((s, l) => s + l.scores.contentDepth, 0) / lps.length),
    trustBuilding: Math.round(lps.reduce((s, l) => s + l.scores.trustBuilding, 0) / lps.length),
    urgencyLevel: Math.round(lps.reduce((s, l) => s + l.scores.urgencyLevel, 0) / lps.length),
    overall: Math.round(lps.reduce((s, l) => s + l.scores.overall, 0) / lps.length),
  };

  // ベストプラクティス抽出
  const bestPractices: string[] = [];
  const allCtaTexts = lps.flatMap(l => l.ctaTexts);
  const ctaCounts = new Map<string, number>();
  for (const cta of allCtaTexts) {
    ctaCounts.set(cta, (ctaCounts.get(cta) || 0) + 1);
  }
  const popularCtas = [...ctaCounts.entries()]
    .filter(([, count]) => count >= 2)
    .map(([text]) => text);
  if (popularCtas.length > 0) {
    bestPractices.push(`人気のCTA: ${popularCtas.slice(0, 3).join(", ")}`);
  }

  if (lps.filter(l => l.hasFloatingCta).length >= lps.length / 2) {
    bestPractices.push("フローティングCTAを採用");
  }
  if (lps.filter(l => l.hasComparisonTable).length >= lps.length / 2) {
    bestPractices.push("比較表を設置");
  }
  if (lps.filter(l => l.hasFaq).length >= lps.length / 2) {
    bestPractices.push("FAQセクションを設置");
  }

  // 改善提案
  const improvements: string[] = [];
  if (avgScores.ctaVisibility < 50) {
    improvements.push("CTAの数を増やすかフローティングCTAを追加");
  }
  if (avgScores.contentDepth < 50) {
    improvements.push("コンテンツを充実させる（比較表、FAQ追加）");
  }
  if (avgScores.trustBuilding < 50) {
    improvements.push("実績や口コミなど信頼シグナルを追加");
  }

  return { bestPractices, improvements, avgScores };
}
