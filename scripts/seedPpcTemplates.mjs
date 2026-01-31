// scripts/seedPpcTemplates.mjs
import "dotenv/config";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const scope = "PPC";

/**
 * 最低限「画面が生き返る」+ 既存ロジックが参照しそうな key を優先。
 * type は schema の ItemType(enum) に合わせて: text | url | number | money | note
 *
 * 注意:
 * - ResearchItemTemplate.order が必須（Prisma が "Argument `order` is missing." を出す）
 * - createMany は order 未指定を許さないので必ず付与する
 */
const templates = [
  { key: "referenceUrl", label: "参考URL（Amazon等）", type: "url" },
  { key: "productName", label: "商品名", type: "text" },
  { key: "brand", label: "ブランド", type: "text" },
  { key: "targetKw", label: "狙うKW", type: "text" },

  { key: "price", label: "販売価格", type: "money" },
  { key: "cogs", label: "原価（概算）", type: "money" },
  { key: "shippingCost", label: "送料/配送費（概算）", type: "money" },
  { key: "fbaFee", label: "FBA手数料（概算）", type: "money" },

  { key: "reviewCount", label: "レビュー数", type: "number" },
  { key: "rating", label: "評価（★）", type: "number" },

  { key: "pageTitle", label: "ページタイトル", type: "text" },
  { key: "pageH1", label: "ページH1", type: "text" },
  { key: "pageDescription", label: "ページ説明文", type: "text" },
  { key: "wordCount", label: "文字数", type: "number" },

  { key: "totalScore", label: "総合スコア", type: "number" },
  { key: "adPolicyRisk", label: "広告ポリシーリスク", type: "number" },
  { key: "trademarkRisk", label: "商標リスク", type: "number" },
  { key: "bridgePageRisk", label: "ブリッジページリスク", type: "number" },

  { key: "adTitle1", label: "広告見出し1", type: "text" },
  { key: "adTitle2", label: "広告見出し2", type: "text" },
  { key: "adTitle3", label: "広告見出し3", type: "text" },
  { key: "adDescription1", label: "広告説明文1", type: "text" },
  { key: "adDescription2", label: "広告説明文2", type: "text" },

  { key: "extractedKeywords", label: "抽出キーワード", type: "text" },

  { key: "notes", label: "メモ", type: "note" },
];

async function main() {
  // order 必須なので必ず入れる（表示順もこれで安定）
  const data = templates.map((t, i) => ({
    scope,
    ...t,
    order: i + 1,
  }));

  // 既に同じ (scope, key) があればスキップ（ユニーク制約がある前提）
  const res = await prisma.researchItemTemplate.createMany({
    data,
    skipDuplicates: true,
  });

  const count = await prisma.researchItemTemplate.count({ where: { scope } });

  console.log(`[seedPpcTemplates] inserted=${res.count} (skipDuplicates=true)`);
  console.log(`[seedPpcTemplates] total templates for ${scope} = ${count}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
