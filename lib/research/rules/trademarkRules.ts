/**
 * 商標リスク判定ルール
 * 主要ブランド・商標の無断使用検出
 */

// 商標カテゴリ
export type TrademarkCategory = {
  name: string;
  weight: number; // 重み (1-10)
  trademarks: string[];
};

export const TRADEMARK_CATEGORIES: TrademarkCategory[] = [
  {
    name: "テック大手",
    weight: 10,
    trademarks: [
      "Google",
      "Amazon",
      "Apple",
      "Microsoft",
      "Meta",
      "Facebook",
      "Instagram",
      "Twitter",
      "X",
      "YouTube",
      "TikTok",
      "Netflix",
      "Uber",
      "Airbnb",
    ],
  },
  {
    name: "日本EC/サービス",
    weight: 9,
    trademarks: [
      "楽天",
      "Yahoo",
      "ヤフー",
      "LINE",
      "メルカリ",
      "PayPay",
      "au",
      "docomo",
      "ドコモ",
      "SoftBank",
      "ソフトバンク",
      "ZOZOTOWN",
      "じゃらん",
      "ホットペッパー",
    ],
  },
  {
    name: "金融",
    weight: 10,
    trademarks: [
      "三菱UFJ",
      "みずほ",
      "三井住友",
      "りそな",
      "ゆうちょ",
      "楽天銀行",
      "住信SBIネット銀行",
      "VISA",
      "Mastercard",
      "JCB",
      "American Express",
      "アメックス",
    ],
  },
  {
    name: "投資/仮想通貨",
    weight: 10,
    trademarks: [
      "Bitcoin",
      "ビットコイン",
      "Ethereum",
      "イーサリアム",
      "Coinbase",
      "Binance",
      "bitFlyer",
      "SBI証券",
      "楽天証券",
      "マネックス",
    ],
  },
  {
    name: "ブランド品",
    weight: 8,
    trademarks: [
      "Louis Vuitton",
      "ルイヴィトン",
      "Gucci",
      "グッチ",
      "Chanel",
      "シャネル",
      "Hermes",
      "エルメス",
      "Rolex",
      "ロレックス",
      "Prada",
      "プラダ",
      "Dior",
      "ディオール",
    ],
  },
  {
    name: "ゲーム/エンタメ",
    weight: 7,
    trademarks: [
      "Nintendo",
      "任天堂",
      "PlayStation",
      "プレイステーション",
      "Xbox",
      "Pokemon",
      "ポケモン",
      "Disney",
      "ディズニー",
      "Marvel",
      "マーベル",
    ],
  },
  {
    name: "健康/医薬",
    weight: 9,
    trademarks: [
      "大正製薬",
      "武田薬品",
      "アステラス",
      "中外製薬",
      "Pfizer",
      "ファイザー",
      "DHC",
      "FANCL",
      "ファンケル",
      "サントリー",
    ],
  },
];

// コンテキストで許容されるパターン（公式サイトへのリンク等）
const ALLOWED_CONTEXTS = [
  /公式サイト/,
  /公式ページ/,
  /official/i,
  /正規代理店/,
  /認定パートナー/,
];

export type TrademarkRiskResult = {
  score: number; // 0-100
  level: "low" | "medium" | "high" | "critical";
  matchedTrademarks: Array<{
    category: string;
    trademark: string;
    contribution: number;
  }>;
  warnings: string[];
};

/**
 * 商標リスクを算出
 * @param text ページテキスト
 * @param url URL
 * @returns リスクスコア (0-100)
 */
export function calcTrademarkRisk(
  text: string,
  url: string
): TrademarkRiskResult {
  const normalizedText = text.toLowerCase();
  const normalizedUrl = url.toLowerCase();

  // 許容コンテキストチェック
  const hasAllowedContext = ALLOWED_CONTEXTS.some((p) => p.test(text));

  const matchedTrademarks: TrademarkRiskResult["matchedTrademarks"] = [];
  const warnings: string[] = [];
  let totalScore = 0;

  for (const cat of TRADEMARK_CATEGORIES) {
    for (const tm of cat.trademarks) {
      const tmLower = tm.toLowerCase();

      // テキスト内にマッチ
      if (normalizedText.includes(tmLower)) {
        // 許容コンテキストがあれば軽減
        const contribution = hasAllowedContext
          ? Math.floor(cat.weight / 3)
          : cat.weight;

        totalScore += contribution;
        matchedTrademarks.push({
          category: cat.name,
          trademark: tm,
          contribution,
        });
      }

      // URLにブランド名が含まれる（より危険）
      if (normalizedUrl.includes(tmLower)) {
        totalScore += cat.weight * 2;
        warnings.push(`URL に「${tm}」を含む（商標侵害リスク高）`);
      }
    }
  }

  // 重複マッチの調整（同じブランドの複数形態）
  const score = Math.min(totalScore, 100);

  let level: TrademarkRiskResult["level"];
  if (score >= 60) level = "critical";
  else if (score >= 35) level = "high";
  else if (score >= 15) level = "medium";
  else level = "low";

  return { score, level, matchedTrademarks, warnings };
}

/**
 * シンプルなスコアのみ返す
 */
export function calcTrademarkRiskScore(text: string, url: string): number {
  return calcTrademarkRisk(text, url).score;
}
