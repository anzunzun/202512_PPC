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

    // 6. Google広告文を生成
    const adCopy = generateAdCopy(scraped, targetKw, keywordSuggestion);

    // 7. 結果組み立て
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
      // Google広告文
      adTitle1: adCopy.title1,
      adTitle2: adCopy.title2,
      adTitle3: adCopy.title3,
      adDescription1: adCopy.description1,
      adDescription2: adCopy.description2,
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

/**
 * Google広告文を生成（商標なし・一般KW構成）
 * 見出し: 全角15文字（半角30文字）以内
 * 説明文: 全角45文字（半角90文字）以内
 */
function generateAdCopy(
  scraped: ScrapedData | null,
  targetKw: string,
  keywordSuggestion: ReturnType<typeof suggestKeywords> | null
): {
  title1: string;
  title2: string;
  title3: string;
  description1: string;
  description2: string;
} {
  // メインKWを短くする（最初のカンマ区切り）
  const mainKw = targetKw.split(/[,、]/)[0]?.trim() || "商品";

  // 購入意図の高いKWを取得
  const purchaseKws = keywordSuggestion?.mainKeywords
    .filter((k) => k.category === "purchase")
    .sort((a, b) => b.score - a.score) || [];
  const compareKws = keywordSuggestion?.mainKeywords
    .filter((k) => k.category === "compare")
    .sort((a, b) => b.score - a.score) || [];

  // 見出し候補（全角15文字以内）
  const title1 = truncateJa(`${mainKw} 比較・選び方`, 15);
  const title2 = truncateJa(
    purchaseKws[0]
      ? `${purchaseKws[0].keyword.replace(mainKw, "").trim() || "お得に"}購入`
      : `${mainKw} 通販`,
    15
  );
  const title3 = truncateJa("失敗しない選び方ガイド", 15);

  // 説明文候補（全角45文字以内）
  const description1 = truncateJa(
    `${mainKw}を徹底比較。あなたに合った${mainKw}が見つかる選び方ガイド。`,
    45
  );
  const description2 = truncateJa(
    `価格・特徴・口コミを比較して、納得の${mainKw}選びをサポート。`,
    45
  );

  return { title1, title2, title3, description1, description2 };
}

/** 全角文字数でトランケート（半角は0.5文字換算） */
function truncateJa(text: string, maxFullWidth: number): string {
  let width = 0;
  let i = 0;
  for (; i < text.length; i++) {
    const code = text.charCodeAt(i);
    // 半角: ASCII + 半角カナ
    const isHalf = code <= 0x7e || (code >= 0xff61 && code <= 0xff9f);
    width += isHalf ? 0.5 : 1;
    if (width > maxFullWidth) break;
  }
  return text.slice(0, i);
}

function toStr(v: unknown): string {
  if (v === null || v === undefined) return "";
  const s = String(v);
  return s.trim();
}
