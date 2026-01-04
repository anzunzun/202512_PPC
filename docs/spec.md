# 【3】仕様書（UI / API / DB / 実装）

> ※ 実装者・AIエージェント用
> ※ 技術前提：Next.js(App Router) / TypeScript / Prisma / PostgreSQL / GCP

---

## 技術前提（変更可否）

| レイヤー | 技術 | 変更可否 |
|----------|------|----------|
| フロントエンド | Next.js（App Router） | 変更不可 |
| バックエンド | Next.js API / Server Actions | 変更不可 |
| DB | PostgreSQL + Prisma | 変更不可 |
| インフラ | Google Cloud | 変更不可 |
| LLM | Claude Code（分析・生成補助のみ） | - |

---

## 全体アーキテクチャ

```
[ User ]
   ↓
[ Admin UI ]
   ↓
[ Research Orchestrator ]
   ├─ PPC Data Collector
   ├─ LP Structure Analyzer
   ├─ Keyword Analyzer
   ├─ Rule Engine
   └─ Claude Code (要約のみ)
        ↓
[ Core Data (PostgreSQL) ]
        ↓
[ Judgment Result ]
```

---

## UI仕様（最小）

| 画面 | 機能 |
|------|------|
| リサーチ一覧画面 | プロジェクト一覧表示 |
| スコア閲覧画面 | スコア詳細の閲覧 |
| 採否承認画面 | 承認 or 却下の操作 |

**※ 編集・調整UIは存在しない**

---

## API / Server Actions

### `runResearchProjectAction`

**Input**
```typescript
{
  projectId: string
}
```

**Output**
```typescript
{
  status: "completed",
  scores: RiskScore
}
```

**責務**
1. データ収集
2. スコア算出
3. DB保存

---

## 中核データ構造（Prisma概念）

### ResearchProject
```prisma
model ResearchProject {
  id        String   @id @default(uuid())
  country   String
  genre     String
  status    String   // pending | completed | rejected
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

### CompetitorSite
```prisma
model CompetitorSite {
  id                   String @id @default(uuid())
  domain               String
  lpStructureType      String
  brandDependencyScore Float
  projectId            String
}
```

### RiskScore
```prisma
model RiskScore {
  id             String @id @default(uuid())
  trademarkRisk  Float  // 商標リスク
  adPolicyRisk   Float  // 広告ポリシーリスク
  bridgePageRisk Float  // ブリッジページリスク
  totalScore     Float  // 総合スコア
  projectId      String @unique
}
```

---

## データフロー（判断の所在明示）

```
Raw Data
  ↓
Rule Engine
  ↓
Score Data（正解）
  ↓
UI / Report（非正解）
```

---

## エラーハンドリング

| 状況 | 処理 |
|------|------|
| データ不足 | 判定不可 |
| スコア未算出 | rejected |
| 例外 | 即失敗（例外処理なし） |

---

## 成果物の正解定義

> **正解はDB内スコアのみ**
> UI・文章・テンプレは正解を持たない。

---

## 自己検証（必須）

| 検証項目 | 許容 |
|----------|------|
| 解釈の余地 | NO |
| 人間が直したくなる | NO |
| 実装者判断 | NO |
| 再実行差分 | NO |

すべて **NO** を満たすこと。

---

## 最終宣言

この仕様は
**PPCアフィリエイトで「勝つ」ための設計ではない。**

> 「生き残る世界」と「踏み込んではいけない世界」を
> 人間の善意ごと切り分けるための、**意思決定憲法**である。

---

## 参照ドキュメント

- 憲法: `.claude/claude.md`
- 要件定義書: `docs/requirements.md`
