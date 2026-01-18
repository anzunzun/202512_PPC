# 仕様書（UI / API / DB）

用途：実装・差し替え・量産
配置：docs/spec.md

## 0. 技術スタック

| 領域 | 技術 | バージョン |
|------|------|-----------|
| フロントエンド | Next.js (App Router) | 14.x |
| 言語 | TypeScript | 5.x |
| スタイル | Tailwind CSS | 3.x |
| データベース | PostgreSQL | 15+ |
| ORM | Prisma | 5.x |
| AI/自動化 | AIT42 | 2.x |

### ディレクトリ構造

```
.claude/
  └── claude.md          # 憲法（最上位ルール）
docs/
  ├── requirements.md    # 要件定義書
  └── spec.md            # 仕様書（本ファイル）
app/
  ├── layout.tsx         # 共通レイアウト
  ├── page.tsx           # G-01: トップ
  ├── quiz/page.tsx      # Q-01: 診断
  ├── category/page.tsx  # C-01: 条件別
  ├── compare/page.tsx   # CP-01: 比較
  ├── result/[type]/     # R-01: 結果
  └── legal/page.tsx     # L-01: Legal
prisma/
  └── schema.prisma      # DBスキーマ
lib/
  └── prisma.ts          # Prismaクライアント
```

## 1. サイト構造

```
/category/条件別
/compare/比較テーマ
/quiz/診断
/legal/
```

※ URL / slug に商標を含めない

## 2. 画面一覧

| ID | 画面 | 役割 |
|----|------|------|
| G-01 | トップ | 思想提示 |
| C-01 | 条件別 | 悩み起点 |
| Q-01 | 診断 | 主導線 |
| R-01 | 結果 | Type表示 |
| CP-01 | 比較 | 深掘り |
| L-01 | Legal | 信頼 |

## 3. 診断ロジック仕様

- 質問数：5〜7
- 方式：Yes/No + スコア
- 出力：Type A / B / C

表示順（固定）：
1. 理由
2. 条件
3. 注意点
4. CTA

## 4. CTA仕様

### 許可

- 条件に合う公式サイトを確認
- 詳細条件を公式ページで見る

### 禁止

- 商品名
- ブランド名
- 最安・おすすめ

## 5. 画像仕様

- WebP形式
- lazy load
- alt必須（条件説明のみ）
- ロゴ・公式画像禁止

## 6. DB仕様（Prisma想定）

```prisma
a8_offer {
  offer_id: string
  category: string
  reward_range: string
  approval_rate: string
  google_ads_allowed: boolean
  trademark_required: false
  comparison_allowed: boolean
  cons_allowed: boolean
  lp_direct_required: boolean
  score: number
  status: "candidate" | "approved" | "rejected"
}
```

※ 商標情報は存在しない

## 7. 差し替え仕様

- LP構造：変更不可
- コピー：変更不可
- 変更点：affiliate_link のみ

## 最終確認

- [ ] 商標がなくても成立しているか
- [ ] 広告文とLPは完全一致しているか
- [ ] 案件差し替えが1項目で完結するか
