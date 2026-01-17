import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// 既存のPPCテンプレ（日本語label）→ 安定key
const LABEL_TO_KEY = {
  "ターゲットKW": "targetKw",
  "参考URL": "referenceUrl",
  "参照URL": "referenceUrl",
  "コンバージョン": "conversion",
  "CV": "conversion",
  "クリック数": "clicks",
  "クリック": "clicks",
  "PV": "pv",
  "表示回数": "pv",
  "総合スコア": "totalScore",
  "広告ポリシーリスク": "adPolicyRisk",
  "商標リスク": "trademarkRisk",
  "ブリッジページリスク": "bridgePageRisk",
};

// 日本語など slugify不能時に使うハッシュ
function hash32(str) {
  let h = 2166136261; // FNV-1a
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0).toString(16);
}

function slugifyAscii(str) {
  const s = String(str ?? "")
    .trim()
    .toLowerCase()
    .replace(/['"]/g, "")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
  return s;
}

function deriveKey(scope, label) {
  const direct = LABEL_TO_KEY[label];
  if (direct) return direct;

  const slug = slugifyAscii(label);
  if (slug) return slug;

  // 最後の手段：item_<hash>
  return `item_${hash32(`${scope}:${label}`)}`;
}

async function main() {
  const templates = await prisma.researchItemTemplate.findMany({
    orderBy: [{ scope: "asc" }, { order: "asc" }, { label: "asc" }],
  });

  // scopeごとの既存keyセット
  const usedByScope = new Map();
  for (const t of templates) {
    const scope = t.scope;
    if (!usedByScope.has(scope)) usedByScope.set(scope, new Set());
    const set = usedByScope.get(scope);
    if (t.key && t.key.trim()) set.add(t.key.trim());
  }

  let updated = 0;

  for (const t of templates) {
    const cur = (t.key ?? "").trim();
    if (cur) continue;

    const scope = t.scope;
    const set = usedByScope.get(scope) ?? new Set();
    let base = deriveKey(scope, t.label);
    let key = base;
    let n = 2;

    while (set.has(key)) {
      key = `${base}_${n++}`;
    }
    set.add(key);
    usedByScope.set(scope, set);

    await prisma.researchItemTemplate.update({
      where: { id: t.id },
      data: { key },
    });

    updated++;
    console.log(`[ok] template ${t.id} scope=${scope} label="${t.label}" -> key=${key}`);
  }

  console.log(`done. updated=${updated} / total=${templates.length}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
