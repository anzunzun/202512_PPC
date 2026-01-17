// lib/emptyLike.ts
export const EMPTY_LIKE_SET = new Set([
    "",
    "—",
    "–",
    "―",
    "-",
    "ー",
    "null",
    "undefined",
    "n/a",
    "N/A",
  ]);
  
  export function normalizeEmptyLike(input: unknown): string {
    const t = String(input ?? "").trim();
    if (EMPTY_LIKE_SET.has(t)) return "";
    return t;
  }
  
  export function isEmptyLike(input: unknown, opts?: { treatZeroAsEmpty?: boolean }) {
    const t = String(input ?? "").trim();
    if (opts?.treatZeroAsEmpty && t === "0") return true;
    return normalizeEmptyLike(t) === "";
  }
  