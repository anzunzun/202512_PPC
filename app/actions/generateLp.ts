"use server";

import { prisma } from "@/lib/prisma";
import type { LpStructure } from "@/lib/research/competitorAnalyzer";

type LpData = {
  title: string;
  subtitle: string;
  valueProposition: string;
  features: string[];
  ctaUrl: string;
  ctaText: string;
  category: string;
  // 競合分析から取得したインサイト
  competitorInsights?: {
    popularCtaTexts: string[];
    trustSignals: string[];
    hasFloatingCta: boolean;
    hasFaq: boolean;
    hasComparisonTable: boolean;
    avgOverallScore: number;
  };
};

// 競合分析からインサイトを抽出
async function getCompetitorInsights(projectId: string) {
  const analyses = await prisma.competitorAnalysisResult.findMany({
    where: { projectId, fetchError: null },
    orderBy: { analyzedAt: "desc" },
    take: 10,
  });

  if (analyses.length === 0) return undefined;

  // CTAテキストの頻度をカウント
  const ctaCounts = new Map<string, number>();
  for (const a of analyses) {
    const ctaTexts = a.ctaTexts as string[];
    for (const cta of ctaTexts) {
      ctaCounts.set(cta, (ctaCounts.get(cta) || 0) + 1);
    }
  }
  const popularCtaTexts = [...ctaCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([text]) => text);

  // 信頼シグナルを収集
  const allTrustSignals = analyses.flatMap(a => a.trustSignals as string[]);
  const uniqueTrustSignals = [...new Set(allTrustSignals)].slice(0, 5);

  // 機能フラグの統計
  const hasFloatingCta = analyses.filter(a => a.hasFloatingCta).length > analyses.length / 2;
  const hasFaq = analyses.filter(a => a.hasFaq).length > analyses.length / 2;
  const hasComparisonTable = analyses.filter(a => a.hasComparisonTable).length > analyses.length / 2;

  // 平均スコア
  const avgOverallScore = Math.round(
    analyses.reduce((sum, a) => {
      const scores = a.scores as LpStructure["scores"];
      return sum + scores.overall;
    }, 0) / analyses.length
  );

  return {
    popularCtaTexts,
    trustSignals: uniqueTrustSignals,
    hasFloatingCta,
    hasFaq,
    hasComparisonTable,
    avgOverallScore,
  };
}

// プロジェクトのリサーチ結果からLP用データを抽出
export async function extractLpData(projectId: string): Promise<LpData | null> {
  // 最新の成功したRunを取得
  const latestRun = await prisma.researchRun.findFirst({
    where: { projectId, status: "ok" },
    orderBy: { startedAt: "desc" },
  });

  if (!latestRun?.resultJson) return null;

  const resultJson = latestRun.resultJson as {
    itemsByKey?: Record<string, string>;
  };
  const itemsByKey = resultJson.itemsByKey ?? {};

  // プロジェクト情報
  const project = await prisma.researchProject.findUnique({
    where: { id: projectId },
    include: { a8Program: true },
  });

  // 広告見出しから特徴を抽出
  const features: string[] = [];
  for (let i = 1; i <= 15; i++) {
    const title = itemsByKey[`adTitle${i}`];
    if (title && !features.includes(title)) {
      features.push(title);
    }
  }

  // CTAリンク（A8案件のLP URLまたは参照URL）
  const ctaUrl = project?.a8Program?.lpUrl || itemsByKey.referenceUrl || "#";

  // 競合分析インサイトを取得
  const competitorInsights = await getCompetitorInsights(projectId);

  // CTAテキストを競合分析から決定（競合で人気のあるものを優先）
  let ctaText = "詳しく見る";
  if (competitorInsights?.popularCtaTexts.length) {
    // 「公式」を含まないCTAを優先（憲法準拠）
    const safeCta = competitorInsights.popularCtaTexts.find(
      cta => !cta.includes("公式") && !cta.includes("オフィシャル")
    );
    if (safeCta) {
      ctaText = safeCta;
    }
  }

  return {
    title: itemsByKey.pageTitle || itemsByKey.targetKw || "比較ガイド",
    subtitle: itemsByKey.pageDescription || "あなたに合った選択を",
    valueProposition: itemsByKey.adDescription1 || "比較して選ぶ",
    features: features.slice(0, 6),
    ctaUrl,
    ctaText,
    category: project?.genre || "比較",
    competitorInsights,
  };
}

// LP HTMLを生成
export async function generateLpHtml(projectId: string): Promise<string> {
  const data = await extractLpData(projectId);

  if (!data) {
    throw new Error("リサーチ結果がありません。先にRunを実行してください。");
  }

  const featuresHtml = data.features
    .map((f) => `      <li><span class="ck">✓</span> ${escapeHtml(f)}</li>`)
    .join("\n");

  // 競合分析インサイトに基づくセクション生成
  const insights = data.competitorInsights;

  // 信頼シグナルセクション（競合が使用している場合）
  const trustSignalsHtml = insights?.trustSignals.length
    ? `
<!-- 信頼シグナル（競合分析より） -->
<div class="lp-trust">
  <h3>選ばれる理由</h3>
  <div class="trust-items">
${insights.trustSignals.map(ts => `    <span class="trust-badge">${escapeHtml(ts)}</span>`).join("\n")}
  </div>
</div>
`
    : "";

  // FAQセクション（競合の過半数が使用している場合）
  const faqHtml = insights?.hasFaq
    ? `
<!-- FAQ（競合分析推奨） -->
<div class="lp-faq">
  <h3>よくある質問</h3>
  <div class="faq-item">
    <div class="faq-q">Q. どのような方におすすめですか？</div>
    <div class="faq-a">A. 比較検討して自分に合ったものを選びたい方におすすめです。</div>
  </div>
  <div class="faq-item">
    <div class="faq-q">Q. 費用はかかりますか？</div>
    <div class="faq-a">A. 当サイトでの比較・閲覧は無料です。</div>
  </div>
</div>
`
    : "";

  const html = `<!-- 自動生成LP - ${new Date().toISOString()} -->
<!-- WordPress カスタムHTMLブロック用 / モバイルファースト -->

<style>
*{box-sizing:border-box}
.lp{max-width:480px;margin:0 auto;padding:0 12px;font-family:-apple-system,BlinkMacSystemFont,"Hiragino Sans",Meiryo,sans-serif;color:#333;line-height:1.7;font-size:15px}

/* ヘッダー */
.lp-hero{background:linear-gradient(135deg,#667eea 0%,#764ba2 100%);border-radius:16px;padding:28px 16px;text-align:center;color:#fff;margin-bottom:16px}
.lp-hero h1{font-size:22px;font-weight:800;margin:0 0 6px;letter-spacing:.5px}
.lp-hero p{font-size:13px;opacity:.85;margin:0}

/* 価値提案 */
.lp-value{background:#fff;border-radius:14px;padding:20px 16px;margin-bottom:14px;box-shadow:0 2px 12px rgba(0,0,0,.06);text-align:center}
.lp-value h2{font-size:20px;font-weight:800;margin:0 0 10px;color:#333}
.lp-value p{font-size:14px;color:#666;margin:0}

/* 特徴リスト */
.lp-features{background:#fff;border-radius:14px;padding:20px 16px;margin-bottom:14px;box-shadow:0 2px 12px rgba(0,0,0,.06)}
.lp-features h3{font-size:17px;font-weight:800;text-align:center;margin:0 0 16px}
.lp-features ul{list-style:none;padding:0;margin:0}
.lp-features li{font-size:14px;color:#444;padding:10px 0;display:flex;align-items:flex-start;gap:8px;border-bottom:1px solid #f0f0f0}
.lp-features li:last-child{border-bottom:none}
.lp-features .ck{color:#27ae60;font-weight:700;flex-shrink:0}

/* CTAボタン */
.lp-cta{display:block;width:100%;max-width:320px;margin:0 auto 14px;padding:16px 24px;background:linear-gradient(135deg,#ff6b6b 0%,#ee5a5a 100%);color:#fff;text-align:center;text-decoration:none;font-size:16px;font-weight:800;border-radius:12px;box-shadow:0 4px 15px rgba(238,90,90,.4);transition:all .2s}
.lp-cta:hover{transform:translateY(-2px);box-shadow:0 6px 20px rgba(238,90,90,.5)}
.lp-cta:active{transform:scale(.98)}

/* プライバシーポリシー */
.lp-privacy{background:#f7f8fa;border-radius:14px;padding:20px 16px;margin-bottom:14px}
.lp-privacy h3{font-size:15px;font-weight:700;color:#333;margin:0 0 12px;text-align:center}
.lp-privacy p{font-size:12px;color:#666;line-height:1.7;margin:0 0 8px}

/* フローティングCTA */
@keyframes pulse{0%,100%{box-shadow:0 4px 15px rgba(238,90,90,.4)}50%{box-shadow:0 4px 25px rgba(238,90,90,.7)}}
.lp-float{position:fixed;bottom:0;left:0;right:0;background:rgba(255,255,255,.98);backdrop-filter:blur(8px);padding:12px 16px;box-shadow:0 -4px 20px rgba(0,0,0,.15);z-index:9999}
.lp-float a{display:block;max-width:320px;margin:0 auto;padding:14px 20px;background:linear-gradient(135deg,#ff6b6b 0%,#ee5a5a 100%);color:#fff;text-align:center;text-decoration:none;font-size:15px;font-weight:800;border-radius:10px;animation:pulse 2s infinite}
.lp-float a:active{transform:scale(.98);animation:none}

/* 信頼シグナル */
.lp-trust{background:#fff;border-radius:14px;padding:20px 16px;margin-bottom:14px;box-shadow:0 2px 12px rgba(0,0,0,.06)}
.lp-trust h3{font-size:17px;font-weight:800;text-align:center;margin:0 0 16px}
.trust-items{display:flex;flex-wrap:wrap;gap:8px;justify-content:center}
.trust-badge{display:inline-block;padding:6px 12px;background:linear-gradient(135deg,#dcfce7 0%,#bbf7d0 100%);color:#166534;font-size:12px;font-weight:600;border-radius:20px}

/* FAQ */
.lp-faq{background:#fff;border-radius:14px;padding:20px 16px;margin-bottom:14px;box-shadow:0 2px 12px rgba(0,0,0,.06)}
.lp-faq h3{font-size:17px;font-weight:800;text-align:center;margin:0 0 16px}
.faq-item{margin-bottom:12px;padding-bottom:12px;border-bottom:1px solid #f0f0f0}
.faq-item:last-child{margin-bottom:0;padding-bottom:0;border-bottom:none}
.faq-q{font-size:14px;font-weight:700;color:#333;margin-bottom:6px}
.faq-a{font-size:13px;color:#666;padding-left:16px}

/* フッター */
.lp-footer{text-align:center;padding:20px 0 80px;font-size:11px;color:#999}
.lp-footer a{color:#667eea}
.lp-pr{font-size:10px;color:#aaa}
</style>

<div class="lp">

<!-- ヘッダー -->
<div class="lp-hero">
  <h1>${escapeHtml(data.title)}</h1>
  <p>${escapeHtml(data.subtitle)}</p>
</div>

<!-- 価値提案 -->
<div class="lp-value">
  <h2>${escapeHtml(data.valueProposition)}</h2>
  <p>比較して、あなたに合った選択を見つけましょう。</p>
</div>

<!-- CTA -->
<a href="${escapeHtml(data.ctaUrl)}" class="lp-cta" target="_blank" rel="noopener">
  ${escapeHtml(data.ctaText)} →
</a>

<!-- 特徴 -->
<div class="lp-features">
  <h3>ポイント</h3>
  <ul>
${featuresHtml}
  </ul>
</div>
${trustSignalsHtml}
<!-- CTA -->
<a href="${escapeHtml(data.ctaUrl)}" class="lp-cta" target="_blank" rel="noopener">
  ${escapeHtml(data.ctaText)} →
</a>
${faqHtml}
<!-- プライバシーポリシー -->
<div class="lp-privacy">
  <h3>プライバシーポリシー</h3>
  <p>当サイトは、ユーザーのプライバシーを尊重し、個人情報の保護に努めます。</p>
  <p>収集した情報は、サービス提供・改善のみに使用し、第三者への提供は行いません（法令に基づく場合を除く）。</p>
  <p>お問い合わせは運営者までご連絡ください。</p>
</div>

<!-- フッター -->
<div class="lp-footer">
  <p class="lp-pr">広告・PR</p>
  <p>&copy; ${new Date().getFullYear()} 比較ガイド</p>
</div>

</div>

<!-- フローティングCTA -->
<div class="lp-float">
  <a href="${escapeHtml(data.ctaUrl)}" target="_blank" rel="noopener">
    ${escapeHtml(data.ctaText)} →
  </a>
</div>
`;

  return html;
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
