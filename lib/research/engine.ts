/**
 * Research engine (demo / utility)
 * - MapIterator の downlevel 問題を避けるため、entries() の展開は Array.from を使用
 */

export type EngineOutput = {
  freqTop: Array<{ token: string; count: number }>;
};

export function runEngineDemo(text: string): EngineOutput {
  const tokens = tokenize(text);
  const freq = countFreq(tokens);

  // ✅ MapIterator をスプレッドしない（TS2802 回避）
  const freqTop = Array.from(freq.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 20)
    .map(([token, count]) => ({ token, count }));

  return { freqTop };
}

/* ----------------------------- helpers ----------------------------- */

function tokenize(text: string): string[] {
  const s = String(text ?? "");
  return s
    .toLowerCase()
    .split(/[^a-z0-9]+/g)
    .map((t) => t.trim())
    .filter(Boolean);
}

function countFreq(tokens: string[]): Map<string, number> {
  const m = new Map<string, number>();
  for (const t of tokens) {
    m.set(t, (m.get(t) ?? 0) + 1);
  }
  return m;
}
