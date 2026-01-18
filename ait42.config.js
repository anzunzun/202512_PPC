/**
 * AIT42 Configuration
 *
 * 本プロジェクトの憲法に従い、以下の原則を遵守:
 * - 商標・ブランド名を一切使用しない
 * - ランキング・おすすめ表現は禁止
 * - 判断はユーザーに委ねる
 */

module.exports = {
  // プロジェクト設定
  project: {
    name: 'trademark-free-decision-site',
    type: 'nextjs',
  },

  // エージェント設定
  agents: {
    // 並列実行するエージェント数
    parallel: 3,

    // 使用するエージェントタイプ
    types: [
      'frontend-developer',
      'backend-developer',
      'test-generator',
      'code-reviewer',
    ],
  },

  // 品質ゲート
  qualityGates: {
    // コードレビュースコア閾値
    minReviewScore: 80,

    // テストカバレッジ閾値
    minCoverage: 70,
  },

  // 禁止ワード（憲法に基づく）
  prohibitedTerms: [
    // 商標関連
    'おすすめ',
    'ランキング',
    'No.1',
    '最安',
    '人気',

    // 効果断定
    '確実',
    '絶対',
    '必ず',
  ],

  // CTA許可テンプレート
  allowedCTA: [
    '条件に合う公式サイトを確認',
    '詳細条件を公式ページで見る',
  ],
}
