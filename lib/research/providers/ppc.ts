/**
 * PPC Research Provider
 * ルールベースのリスク判定 + 強化版スクレイピング
 */

import type { ResearchProvider, ProviderOutput } from "@/lib/research/types";
import { scrapeUrl, type ScrapedData } from "@/lib/research/scraper";
import {
  calcAdPolicyRiskScore,
  calcTrademarkRiskScore,
  calcBridgePageRiskScore,
  calcTotalRiskScore,
} from "@/lib/research/rules";
import { suggestKeywords, groupKeywordsByCategory } from "@/lib/research/keywordSuggester";
import { prisma } from "@/lib/prisma";

export const ppcProvider: ResearchProvider = {
  id: "ppc",
  version: 1,

  async run({ projectId, scope }) {
    // 1. プロジェクトからreferenceUrl / 既存targetKwを取得
    const { referenceUrl, existingTargetKw } = await getProjectInputs(
      projectId,
      scope
    );

    // 2. referenceUrlがあればスクレイピング
    let scraped: ScrapedData | null = null;
    if (referenceUrl) {
      scraped = await scrapeUrl(referenceUrl, 10000);
    }

    // 3. リスクスコア算出
    const scores = calculateScores(scraped, referenceUrl);

    // 4. キーワード提案を生成
    const keywordSuggestion = scraped ? suggestKeywords(scraped) : null;
    const groupedKeywords = keywordSuggestion
      ? groupKeywordsByCategory([
          ...keywordSuggestion.mainKeywords,
          ...keywordSuggestion.longTailKeywords,
        ])
      : null;

    // 5. targetKw生成（既存があれば上書きしない、なければ提案KWの上位を使用）
    let targetKw = existingTargetKw;
    if (!targetKw && keywordSuggestion && keywordSuggestion.mainKeywords.length > 0) {
      // 購入意図の高いKWを優先
      targetKw = keywordSuggestion.mainKeywords
        .slice(0, 3)
        .map((k) => k.keyword)
        .join(", ");
    }
    if (!targetKw) {
      targetKw = generateTargetKw(scraped);
    }

    // 6. 結果組み立て
    const kv: Record<string, string> = {
      referenceUrl: referenceUrl || "",
      targetKw,
      pageTitle: scraped?.title || "",
      pageH1: scraped?.h1 || "",
      pageDescription: scraped?.metaDescription || "",
      wordCount: String(scraped?.wordCount ?? 0),
      totalScore: String(scores.totalScore),
      adPolicyRisk: String(scores.adPolicyRisk),
      trademarkRisk: String(scores.trademarkRisk),
      bridgePageRisk: String(scores.bridgePageRisk),
    };

    // キーワード提案をJSON形式で保存
    if (keywordSuggestion) {
      kv.suggestedKeywords = JSON.stringify({
        summary: keywordSuggestion.summary,
        mainKeywords: keywordSuggestion.mainKeywords,
        longTailKeywords: keywordSuggestion.longTailKeywords,
        negativeKeywords: keywordSuggestion.negativeKeywords,
        grouped: groupedKeywords,
      });
    }

    // 抽出キーワード（カンマ区切り）
    if (scraped?.keywords && scraped.keywords.length > 0) {
      kv.extractedKeywords = scraped.keywords.join(", ");
    }

    return {
      kv,
      scores,
      meta: {
        scrapedUrl: scraped?.url || null,
        fetchError: scraped?.fetchError || null,
        usedExistingTargetKw: Boolean(existingTargetKw),
        keywordSuggestion: keywordSuggestion || null,
      },
    };
  },
};

/**
 * プロジェクトから入力値を取得
 */
async function getProjectInputs(
  projectId: string,
  scope: string
): Promise<{ referenceUrl: string; existingTargetKw: string }> {
  // テンプレートIDを取得
  const [tplRef, tplKw] = await prisma.$transaction([
    prisma.researchItemTemplate.findFirst({
      where: { scope, key: "referenceUrl", isActive: true },
      select: { id: true },
    }),
    prisma.researchItemTemplate.findFirst({
      where: { scope, key: "targetKw", isActive: true },
      select: { id: true },
    }),
  ]);

  // 値を取得
  const referenceUrl = tplRef
    ? await prisma.researchProjectItem
        .findUnique({
          where: {
            projectId_templateId: { projectId, templateId: tplRef.id },
          },
          select: { value: true },
        })
        .then((x) => toStr(x?.value))
    : "";

  const existingTargetKw = tplKw
    ? await prisma.researchProjectItem
        .findUnique({
          where: {
            projectId_templateId: { projectId, templateId: tplKw.id },
          },
          select: { value: true },
        })
        .then((x) => toStr(x?.value))
    : "";

  return { referenceUrl, existingTargetKw };
}

/**
 * リスクスコア算出
 */
function calculateScores(
  scraped: ScrapedData | null,
  referenceUrl: string
): {
  totalScore: number;
  adPolicyRisk: number;
  trademarkRisk: number;
  bridgePageRisk: number;
} {
  if (!scraped || scraped.fetchError) {
    // スクレイピング失敗時は低スコア（リスク判定不能）
    return {
      totalScore: 0,
      adPolicyRisk: 0,
      trademarkRisk: 0,
      bridgePageRisk: 0,
    };
  }

  // テキスト結合（リスク判定用）
  const allText = [
    scraped.title,
    scraped.h1,
    scraped.metaDescription,
    scraped.bodyText,
  ]
    .filter(Boolean)
    .join(" ");

  const adPolicyRisk = calcAdPolicyRiskScore(allText, referenceUrl);
  const trademarkRisk = calcTrademarkRiskScore(allText, referenceUrl);
  const bridgePageRisk = calcBridgePageRiskScore(scraped);
  const totalScore = calcTotalRiskScore(
    adPolicyRisk,
    trademarkRisk,
    bridgePageRisk
  );

  return {
    totalScore,
    adPolicyRisk,
    trademarkRisk,
    bridgePageRisk,
  };
}

/**
 * スクレイピング結果からtargetKwを生成
 */
function generateTargetKw(scraped: ScrapedData | null): string {
  if (!scraped) return "";

  // 優先順位: keywords > title > h1
  if (scraped.keywords && scraped.keywords.length > 0) {
    // 上位3キーワードを結合
    return scraped.keywords.slice(0, 3).join(" ");
  }

  // titleから生成
  if (scraped.title) {
    return cleanKeyword(scraped.title);
  }

  // h1から生成
  if (scraped.h1) {
    return cleanKeyword(scraped.h1);
  }

  return "";
}

/**
 * キーワードクリーニング
 */
function cleanKeyword(text: string): string {
  const cleaned = String(text ?? "")
    .replace(/[【】［］（）()〈〉<>「」『』|｜•·・]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  if (!cleaned) return "";

  // 前半を優先（サイト名などは後ろにつくことが多い）
  const head = cleaned.split(/[/\-|｜]/).filter(Boolean)[0]?.trim() || cleaned;

  // 句読点で切って短い塊を狙う
  const chunk =
    head
      .split("。")[0]
      ?.split("！")[0]
      ?.split("!")[0]
      ?.split("？")[0]
      ?.split("?")[0]
      ?.trim() || head;

  // 単語数制限
  const words = chunk.split(/\s+/).filter(Boolean);
  if (words.length <= 1) {
    return chunk.slice(0, 40).trim();
  }
  return words.slice(0, 6).join(" ").slice(0, 50).trim();
}

function toStr(v: unknown): string {
  if (v === null || v === undefined) return "";
  const s = String(v);
  return s.trim();
}
