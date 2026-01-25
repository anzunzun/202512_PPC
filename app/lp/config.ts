/**
 * LP設定ファイル
 * 案件差し替え時はこのファイルのみ編集
 */

export type Question = {
  id: string;
  text: string;
};

export type ResultType = {
  title: string;
  description: string;
  points: string[];
  cautions: string[];
  ctaUrl: string;
  ctaText: string;
};

export const CONFIG = {
  // ジャンル名（ヘッダー表示用）
  genre: "サービス選び",
  subtitle: "あなたに合った条件を診断",

  // 5つの質問（商標なし・条件軸で質問）
  questions: [
    { id: "q1", text: "月額5,000円以上の予算は許容できますか？" },
    { id: "q2", text: "1年以上の継続利用を想定していますか？" },
    { id: "q3", text: "困ったときのサポート体制を重視しますか？" },
    { id: "q4", text: "多機能よりシンプルさ・使いやすさを重視しますか？" },
    { id: "q5", text: "なるべく早く利用を開始したいですか？" },
  ] as Question[],

  // 結果タイプ（商標なし・条件で説明）
  results: {
    "type-a": {
      title: "コスト重視タイプ",
      description: "月々の費用を抑えながら、必要最低限の機能を確保したい方に向いています。",
      points: [
        "初期費用が無料または低額",
        "月額料金が抑えめ",
        "必要な基本機能は揃っている",
        "短期間でも解約しやすい",
      ],
      cautions: [
        "サポート対応が限定的な場合がある",
        "高度な機能は別料金の可能性",
      ],
      ctaUrl: "https://px.a8.net/svt/ejp?a8mat=4AVE83+8V4D0Y+5M2G+5YZ75",
      ctaText: "条件に合うサービスを確認する",
    },
    "type-b": {
      title: "機能重視タイプ",
      description: "多少コストがかかっても、充実した機能とサポートを求める方に向いています。",
      points: [
        "豊富な機能が標準搭載",
        "サポート体制が充実",
        "長期利用でお得になるプラン",
        "セキュリティ対策が手厚い",
      ],
      cautions: [
        "月額費用は高めになる傾向",
        "機能が多すぎて使いこなせない可能性",
      ],
      ctaUrl: "https://px.a8.net/svt/ejp?a8mat=4AVE83+8V4D0Y+5M2G+5YZ75",
      ctaText: "条件に合うサービスを確認する",
    },
    "type-c": {
      title: "バランス重視タイプ",
      description: "コストと機能のバランスを取りたい方に向いています。",
      points: [
        "価格と機能のバランスが良い",
        "必要十分なサポート体制",
        "初心者でも扱いやすい",
        "柔軟なプラン変更が可能",
      ],
      cautions: [
        "特化した強みは少ない場合がある",
        "将来的に物足りなくなる可能性",
      ],
      ctaUrl: "https://px.a8.net/svt/ejp?a8mat=4AVE83+8V4D0Y+5M2G+5YZ75",
      ctaText: "条件に合うサービスを確認する",
    },
  } as Record<string, ResultType>,

  // 法的情報
  legal: {
    operator: "加藤梓",
    email: "g4space@ymail.ne.jp",
    disclaimer:
      "当サイトは情報提供を目的としており、特定のサービスを推奨するものではありません。最終的な判断はご自身の責任でお願いいたします。",
  },
};

/**
 * スコアから結果タイプを判定
 * @param score 0-5の合計スコア
 */
export function getResultType(score: number): string {
  if (score <= 1) return "type-a"; // コスト重視
  if (score >= 4) return "type-b"; // 機能重視
  return "type-c"; // バランス重視
}
