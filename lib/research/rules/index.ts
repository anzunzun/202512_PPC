/**
 * リスク判定ルール エクスポート
 */

export {
  calcAdPolicyRisk,
  calcAdPolicyRiskScore,
  type AdPolicyRiskResult,
} from "./adPolicyRules";

export {
  calcTrademarkRisk,
  calcTrademarkRiskScore,
  type TrademarkRiskResult,
} from "./trademarkRules";

export {
  calcBridgePageRisk,
  calcBridgePageRiskScore,
  calcBridgePageRiskFromHtml,
  type BridgePageRiskResult,
} from "./bridgePageRules";

/**
 * 総合スコア算出
 * 各リスクの加重平均
 */
export function calcTotalRiskScore(
  adPolicyRisk: number,
  trademarkRisk: number,
  bridgePageRisk: number
): number {
  // 重み付け
  const weights = {
    adPolicy: 0.4, // 広告ポリシー違反は最重要
    trademark: 0.3, // 商標リスク
    bridgePage: 0.3, // ブリッジページ
  };

  const weighted =
    adPolicyRisk * weights.adPolicy +
    trademarkRisk * weights.trademark +
    bridgePageRisk * weights.bridgePage;

  // 0-100に正規化
  return Math.round(Math.min(weighted, 100));
}
