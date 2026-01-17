"use server";

import { prisma } from "@/lib/prisma";

function slugifyAscii(input: string): string {
  const s = String(input ?? "")
    .trim()
    .toLowerCase()
    // できる範囲で正規化（日本語は基本残らない）
    .normalize("NFKD")
    // 英数字以外を "_" に寄せる
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .replace(/_+/g, "_");

  return s;
}

function makeFallbackKey(order: number, id: string): string {
  // labelが日本語でslugが空になるケースのための安定fallback
  const o = Number.isFinite(order) ? String(order).padStart(3, "0") : "000";
  const tail = String(id ?? "").replace(/[^a-z0-9]/gi, "").slice(-6).toLowerCase();
  return `k_${o}_${tail || "x"}`;
}

export async function ensureTemplateKeys(params: { scope: string }) {
  const scope = String(params?.scope ?? "PPC").trim() || "PPC";

  const templates = await prisma.researchItemTemplate.findMany({
    where: { scope },
    orderBy: [{ order: "asc" }, { createdAt: "asc" }],
  });

  const usedLower = new Set<string>();

  // 既存key（空じゃないもの）を先に確保
  for (const t of templates) {
    const k = String(t.key ?? "").trim();
    if (!k) continue;
    usedLower.add(k.toLowerCase());
  }

  let updated = 0;
  let fixedDuplicates = 0;
  const changes: { id: string; label: string; before: string; after: string }[] = [];

  // ✅ まず「重複している既存key」があれば後勝ちで suffix 付け（ユニーク制約対策）
  // （通常は発生しない想定だが、ここで潰す）
  const seenExact = new Map<string, number>();
  for (const t of templates) {
    const k = String(t.key ?? "").trim();
    if (!k) continue;
    const keyLower = k.toLowerCase();
    const n = (seenExact.get(keyLower) ?? 0) + 1;
    seenExact.set(keyLower, n);
    if (n === 1) continue;

    // 同一キーが2回以上出たら後続を改名
    let cand = `${k}_${n}`;
    let candLower = cand.toLowerCase();
    let bump = n;
    while (usedLower.has(candLower)) {
      bump += 1;
      cand = `${k}_${bump}`;
      candLower = cand.toLowerCase();
    }

    await prisma.researchItemTemplate.update({
      where: { id: t.id },
      data: { key: cand },
    });

    usedLower.add(candLower);
    fixedDuplicates++;
    changes.push({ id: t.id, label: t.label, before: k, after: cand });
  }

  // ✅ 次に「未設定 key」を生成して埋める
  for (const t of templates) {
    const before = String(t.key ?? "").trim();
    if (before) continue;

    let base = slugifyAscii(t.label);
    if (!base) base = makeFallbackKey(t.order, t.id);

    let cand = base;
    let candLower = cand.toLowerCase();
    let i = 1;
    while (usedLower.has(candLower) || !candLower) {
      i += 1;
      cand = `${base}_${i}`;
      candLower = cand.toLowerCase();
    }

    await prisma.researchItemTemplate.update({
      where: { id: t.id },
      data: { key: cand },
    });

    usedLower.add(candLower);
    updated++;
    changes.push({ id: t.id, label: t.label, before, after: cand });
  }

  return {
    scope,
    updated,
    fixedDuplicates,
    total: templates.length,
    changes,
  };
}
