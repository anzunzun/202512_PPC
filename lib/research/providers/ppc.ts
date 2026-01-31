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
      // Google広告文（見出し15・説明文4）
      ...Object.fromEntries(
        adCopy.titles.map((t, i) => [`adTitle${i + 1}`, t])
      ),
      ...Object.fromEntries(
        adCopy.descriptions.map((d, i) => [`adDescription${i + 1}`, d])
      ),
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
 * レスポンシブ検索広告: 見出し最大15本（全角15文字）、説明文最大4本（全角45文字）
 * CVR重視の訴求パターンを網羅
 */
function generateAdCopy(
  scraped: ScrapedData | null,
  targetKw: string,
  keywordSuggestion: ReturnType<typeof suggestKeywords> | null
): {
  titles: string[];
  descriptions: string[];
} {
  const mainKw = targetKw.split(/[,、]/)[0]?.trim() || "商品";
  // 短縮KW（見出しに収まるよう）
  const shortKw = mainKw.length > 8 ? mainKw.slice(0, 8) : mainKw;

  // ---- 見出し候補（優先度順、全角15文字以内） ----
  const titleCandidates: string[] = [
    // 1-3: KW挿入 + 高CV訴求
    `${shortKw} 比較・選び方`,
    `${shortKw} 通販`,
    `${shortKw} 人気ランキング`,
    // 4-6: 行動喚起・緊急性
    `今すぐチェック`,
    `失敗しない選び方`,
    `納得の一品を見つける`,
    // 7-9: 価格・お得訴求
    `${shortKw} 安い順に比較`,
    `送料無料あり`,
    `セール・特価情報`,
    // 10-12: 信頼・安心訴求
    `口コミで選ぶ${shortKw}`,
    `初めてでも安心`,
    `選んで後悔しない`,
    // 13-15: ギフト・ターゲット別
    `プレゼントに最適`,
    `人気の${shortKw}特集`,
    `おすすめ${shortKw}まとめ`,
  ];

  // KW提案から追加の見出し素材を生成
  if (keywordSuggestion) {
    const topKws = [...keywordSuggestion.mainKeywords, ...keywordSuggestion.longTailKeywords]
      .filter((k) => k.category === "purchase" || k.category === "compare")
      .sort((a, b) => b.score - a.score)
      .slice(0, 5);

    for (const kw of topKws) {
      // KWそのものを見出しに（短ければ）
      if (kw.keyword.length <= 15 && !titleCandidates.some((t) => t === kw.keyword)) {
        titleCandidates.push(kw.keyword);
      }
    }
  }

  // 重複排除 + 全角15文字トランケート + 15本に制限
  const seen = new Set<string>();
  const titles: string[] = [];
  for (const raw of titleCandidates) {
    const t = truncateJa(raw, 15);
    if (!t || seen.has(t)) continue;
    seen.add(t);
    titles.push(t);
    if (titles.length >= 15) break;
  }

  // ---- 説明文候補（全角45文字以内、4本） ----
  const descCandidates: string[] = [
    // 比較・選び方訴求
    `${mainKw}を徹底比較。あなたに合った一品が見つかる選び方ガイド。`,
    // 信頼・実績訴求
    `価格・特徴・口コミを比較して、納得の${mainKw}選びをサポート。`,
    // 行動喚起
    `今すぐ${mainKw}を比較。送料無料・セール情報もまとめてチェック。`,
    // 安心・初心者訴求
    `初めてでも失敗しない${mainKw}の選び方を分かりやすく解説。`,
  ];

  const descriptions = descCandidates
    .map((d) => truncateJa(d, 45))
    .filter(Boolean)
    .slice(0, 4);

  return { titles, descriptions };
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
