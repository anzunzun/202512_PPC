/**
 * ブリッジページリスク判定ルール
 * 低品質LP・アフィリエイト中継ページの検出
 */

import type { ScrapedData } from "../scraper";

export type BridgePageRiskResult = {
  score: number; // 0-100
  level: "low" | "medium" | "high" | "critical";
  reasons: string[];
  metrics: {
    wordCount: number;
    externalLinkCount: number;
    internalLinkCount: number;
    hasRedirectScript: boolean;
    hasIframe: boolean;
  };
};

// しきい値
const THRESHOLDS = {
  minWordCount: 300, // これ以下はコンテンツ不足
  maxExternalLinkRatio: 0.8, // 外部リンク比率
  suspiciousExternalLinkCount: 3, // 外部リンク少数（1-3個）でアフィ風
};

/**
 * ブリッジページリスクを算出
 * @param scraped スクレイピング結果
 * @returns リスクスコア (0-100)
 */
export function calcBridgePageRisk(
  scraped: ScrapedData
): BridgePageRiskResult {
  const reasons: string[] = [];
  let score = 0;

  const {
    wordCount,
    externalLinkCount,
    internalLinkCount,
    hasRedirectScript,
    hasIframe,
    bodyText,
    url,
  } = scraped;

  // 1. コンテンツ量チェック
  if (wordCount < 100) {
    score += 30;
    reasons.push(`極端にコンテンツが少ない（${wordCount}文字）`);
  } else if (wordCount < THRESHOLDS.minWordCount) {
    score += 15;
    reasons.push(`コンテンツ不足（${wordCount}文字）`);
  }

  // 2. リダイレクトスクリプト検出
  if (hasRedirectScript) {
    score += 25;
    reasons.push("JSリダイレクト検出");
  }

  // 3. iframe検出
  if (hasIframe) {
    score += 10;
    reasons.push("iframe埋め込み検出");
  }

  // 4. 外部リンク比率
  const totalLinks = externalLinkCount + internalLinkCount;
  if (totalLinks > 0) {
    const externalRatio = externalLinkCount / totalLinks;

    // 外部リンクが1-3個だけ（典型的なアフィリエイトLP）
    if (
      externalLinkCount > 0 &&
      externalLinkCount <= THRESHOLDS.suspiciousExternalLinkCount &&
      internalLinkCount === 0
    ) {
      score += 20;
      reasons.push(`外部リンク${externalLinkCount}個のみ（アフィリエイト風）`);
    } else if (externalRatio >= THRESHOLDS.maxExternalLinkRatio) {
      score += 10;
      reasons.push(`外部リンク比率高（${Math.round(externalRatio * 100)}%）`);
    }
  }

  // 5. 典型的なアフィリエイトパターン検出
  const affiliatePatterns = [
    /今すぐ(購入|申込|クリック)/,
    /こちらをクリック/,
    /詳細はこちら/,
    /公式サイトへ/,
    /限定(特典|ボーナス|価格)/,
    /\d+%OFF/,
    /初回(無料|限定)/,
  ];

  let affiliateMatchCount = 0;
  for (const p of affiliatePatterns) {
    if (p.test(bodyText)) {
      affiliateMatchCount++;
    }
  }

  if (affiliateMatchCount >= 3) {
    score += 15;
    reasons.push(`アフィリエイト風の表現多数（${affiliateMatchCount}パターン）`);
  }

  // 6. URLパターン
  if (/\/(lp|landing|promo|offer|special)\//i.test(url)) {
    score += 5;
    reasons.push("LP風のURLパス");
  }

  // 7. 日本語コンテンツなのに海外TLD
  const hasJapanese = /[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FFF]/.test(bodyText);
  const foreignTld = /\.(xyz|top|click|link|work|site|online|live|fun)$/i.test(url);
  if (hasJapanese && foreignTld) {
    score += 15;
    reasons.push("日本語コンテンツに海外TLD（詐欺サイトリスク）");
  }

  // 上限100
  score = Math.min(score, 100);

  let level: BridgePageRiskResult["level"];
  if (score >= 60) level = "critical";
  else if (score >= 35) level = "high";
  else if (score >= 15) level = "medium";
  else level = "low";

  return {
    score,
    level,
    reasons,
    metrics: {
      wordCount,
      externalLinkCount,
      internalLinkCount,
      hasRedirectScript,
      hasIframe,
    },
  };
}

/**
 * シンプルなスコアのみ返す
 */
export function calcBridgePageRiskScore(scraped: ScrapedData): number {
  return calcBridgePageRisk(scraped).score;
}

/**
 * HTMLから直接判定（scrapeUrlを呼ばない場合用）
 */
export function calcBridgePageRiskFromHtml(
  html: string,
  url: string
): BridgePageRiskResult {
  // 簡易版：主要な判定のみ
  const reasons: string[] = [];
  let score = 0;

  // bodyテキスト抽出
  const bodyText = html
    .replace(/<head[\s\S]*?<\/head>/gi, " ")
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  const wordCount = bodyText.length;

  if (wordCount < 100) {
    score += 30;
    reasons.push(`極端にコンテンツが少ない`);
  } else if (wordCount < 300) {
    score += 15;
    reasons.push(`コンテンツ不足`);
  }

  // リダイレクト検出
  if (/window\.location|location\.href|location\.replace/i.test(html)) {
    score += 25;
    reasons.push("JSリダイレクト検出");
  }

  // meta refresh
  if (/<meta[^>]+http-equiv=["']refresh["']/i.test(html)) {
    score += 20;
    reasons.push("meta refresh検出");
  }

  score = Math.min(score, 100);

  let level: BridgePageRiskResult["level"];
  if (score >= 60) level = "critical";
  else if (score >= 35) level = "high";
  else if (score >= 15) level = "medium";
  else level = "low";

  return {
    score,
    level,
    reasons,
    metrics: {
      wordCount,
      externalLinkCount: 0,
      internalLinkCount: 0,
      hasRedirectScript: score >= 25,
      hasIframe: /<iframe/i.test(html),
    },
  };
}
