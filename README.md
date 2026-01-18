# 商標レス意思決定支援サイト

商標ゼロ構成でGoogle広告を長期・安定運用するための意思決定支援サイト

## 技術スタック

| 領域 | 技術 |
|------|------|
| フロントエンド | Next.js 14 (App Router) |
| 言語 | TypeScript |
| スタイル | Tailwind CSS |
| データベース | PostgreSQL |
| ORM | Prisma |
| AI/自動化 | AIT42 |

## セットアップ

```bash
# 依存関係インストール
npm install

# 環境変数設定
cp .env.example .env
# .env の DATABASE_URL を編集

# DBセットアップ
npm run db:generate
npm run db:push

# 開発サーバー起動
npm run dev
```

## ディレクトリ構造

```
.claude/claude.md     # 憲法（最上位ルール）
docs/
  requirements.md     # 要件定義書
  spec.md             # 仕様書
app/
  page.tsx            # トップ
  quiz/               # 診断
  category/           # 条件別
  compare/            # 比較
  result/[type]/      # 結果
  legal/              # Legal
prisma/schema.prisma  # DBスキーマ
```

## プロジェクト原則

- 商標・ブランド名を一切使用しない
- ランキング・おすすめ表現は禁止
- 判断はユーザーに委ねる
- 迷ったら「出さない」「書かない」「止める」
