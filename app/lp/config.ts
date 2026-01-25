/**
 * LP設定ファイル
 * 案件差し替え時はこのファイルのみ編集
 */

export type Question = {
  id: string;
  text: string;
};

export type ProductType = {
  id: string;
  name: string;
  image: string;
  description: string;
  price: string;
  priceNote: string;
  features: string[];
  specs: Record<string, string>;
  ctaUrl: string;
  ctaText: string;
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
  genre: "ペアアクセサリー",
  subtitle: "条件別で選ぶ",
  categoryLabel: "カテゴリ",

  // 比較商品リスト（ランキングではなく条件別比較）
  products: [
    {
      id: "product-a",
      name: "スタンダードライン",
      image: "https://images.unsplash.com/photo-1611591437281-460bfbe1220a?w=400&h=300&fit=crop",
      description: "日常使いに適した、傷つきにくく黒ずまない素材を使用。シンプルなデザインで飽きが来ません。",
      price: "8,800円〜",
      priceNote: "ペア価格（税込）",
      features: [
        "サージカルステンレス製",
        "金属アレルギー対応",
        "シンプルデザイン",
        "刻印サービスあり",
      ],
      specs: {
        素材: "サージカルステンレス316L",
        カラー: "シルバー / ブラック / ピンクゴールド",
        サイズ展開: "5種類",
        納期: "約1週間",
      },
      ctaUrl: "https://px.a8.net/svt/ejp?a8mat=4AVE83+8V4D0Y+5M2G+5YZ75",
      ctaText: "詳細を公式サイトで確認",
    },
    {
      id: "product-b",
      name: "プレミアムライン",
      image: "https://images.unsplash.com/photo-1515377905703-c4788e51af15?w=400&h=300&fit=crop",
      description: "特別な日の贈り物に適した上質な素材を使用。高級感のあるデザインと耐久性を両立。",
      price: "15,800円〜",
      priceNote: "ペア価格（税込）",
      features: [
        "タングステン / チタン製",
        "傷がつきにくい高硬度",
        "上品な光沢",
        "ギフトボックス付き",
      ],
      specs: {
        素材: "タングステン / チタン",
        カラー: "シルバー / ブラック",
        サイズ展開: "7種類",
        納期: "約1〜2週間",
      },
      ctaUrl: "https://px.a8.net/svt/ejp?a8mat=4AVE83+8V4D0Y+5M2G+5YZ75",
      ctaText: "詳細を公式サイトで確認",
    },
    {
      id: "product-c",
      name: "レザーコンビライン",
      image: "https://images.unsplash.com/photo-1573408301185-9146fe634ad0?w=400&h=300&fit=crop",
      description: "金属とレザーを組み合わせた個性的なデザイン。カジュアルなスタイルに合わせやすい。",
      price: "6,800円〜",
      priceNote: "ペア価格（税込）",
      features: [
        "本革×ステンレス",
        "カジュアルデザイン",
        "男女兼用サイズ",
        "カラー交換可能",
      ],
      specs: {
        素材: "本革 + ステンレス",
        カラー: "ブラウン / ブラック / ネイビー",
        サイズ展開: "フリーサイズ（調整可）",
        納期: "約5日",
      },
      ctaUrl: "https://px.a8.net/svt/ejp?a8mat=4AVE83+8V4D0Y+5M2G+5YZ75",
      ctaText: "詳細を公式サイトで確認",
    },
  ] as ProductType[],

  // 比較表の項目
  compareItems: [
    { key: "price", label: "価格帯" },
    { key: "material", label: "主な素材" },
    { key: "durability", label: "耐久性" },
    { key: "style", label: "スタイル" },
  ],

  // 比較データ
  compareData: {
    "product-a": {
      price: "8,800円〜",
      material: "サージカルステンレス",
      durability: "高い",
      style: "シンプル",
    },
    "product-b": {
      price: "15,800円〜",
      material: "タングステン/チタン",
      durability: "非常に高い",
      style: "上品・高級感",
    },
    "product-c": {
      price: "6,800円〜",
      material: "本革+ステンレス",
      durability: "中程度",
      style: "カジュアル",
    },
  } as Record<string, Record<string, string>>,

  // 5つの質問（診断用・商標なし）
  questions: [
    { id: "q1", text: "予算は1万円以上を想定していますか？" },
    { id: "q2", text: "傷がつきにくい素材を重視しますか？" },
    { id: "q3", text: "シンプルなデザインを好みますか？" },
    { id: "q4", text: "記念日などの特別な日に使いたいですか？" },
    { id: "q5", text: "金属アレルギーが気になりますか？" },
  ] as Question[],

  // 結果タイプ（診断結果用）
  results: {
    "type-a": {
      title: "スタンダードタイプ",
      description: "日常使いしやすく、コストパフォーマンスに優れたアクセサリーが向いています。",
      points: [
        "予算を抑えたい",
        "普段使いしやすいデザイン",
        "金属アレルギーに配慮したい",
        "シンプルなものが好き",
      ],
      cautions: [
        "高級感を求める場合は物足りないかも",
        "個性的なデザインは少なめ",
      ],
      ctaUrl: "https://px.a8.net/svt/ejp?a8mat=4AVE83+8V4D0Y+5M2G+5YZ75",
      ctaText: "条件に合うアクセサリーを確認",
    },
    "type-b": {
      title: "プレミアムタイプ",
      description: "特別な日にふさわしい、上質な素材と高級感のあるアクセサリーが向いています。",
      points: [
        "予算に余裕がある",
        "傷がつきにくい素材を重視",
        "特別なギフトとして贈りたい",
        "長く使える品質を求める",
      ],
      cautions: [
        "価格は高めになる",
        "カジュアルな服装には合わせにくい場合も",
      ],
      ctaUrl: "https://px.a8.net/svt/ejp?a8mat=4AVE83+8V4D0Y+5M2G+5YZ75",
      ctaText: "条件に合うアクセサリーを確認",
    },
    "type-c": {
      title: "カジュアルタイプ",
      description: "個性的でカジュアルなスタイルに合う、レザーコンビのアクセサリーが向いています。",
      points: [
        "カジュアルな服装が多い",
        "個性的なデザインが好き",
        "コストを抑えたい",
        "サイズ調整がしやすいものがいい",
      ],
      cautions: [
        "フォーマルな場面には不向き",
        "レザー部分は経年変化あり",
      ],
      ctaUrl: "https://px.a8.net/svt/ejp?a8mat=4AVE83+8V4D0Y+5M2G+5YZ75",
      ctaText: "条件に合うアクセサリーを確認",
    },
  } as Record<string, ResultType>,

  // 法的情報
  legal: {
    operator: "加藤梓",
    email: "g4space@ymail.ne.jp",
    disclaimer:
      "当サイトは情報提供を目的としており、特定の商品を推奨するものではありません。最終的な判断はご自身の責任でお願いいたします。価格・仕様は変更される場合があります。",
  },
};

/**
 * スコアから結果タイプを判定
 * @param score 0-5の合計スコア
 */
export function getResultType(score: number): string {
  if (score <= 1) return "type-c"; // カジュアル
  if (score >= 4) return "type-b"; // プレミアム
  return "type-a"; // スタンダード
}
