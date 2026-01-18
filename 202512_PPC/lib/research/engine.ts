// lib/research/engine.ts
export type ResearchItemLike = {
    label: string;
    value: string | null;
    type?: "text" | "url" | "number" | "money" | "note";
    order?: number;
  };
  
  export type KeywordCandidate = {
    keyword: string;
    profitScore: number; // 0-100
    trademarkRisk: number; // 0-100
    adPolicyRisk: number; // 0-100
    bridgePageRisk: number; // 0-100
    opportunityScore: number; // 0-100 (profit - risk*0.8)
    reasons: string[];
  };
  
  export type ResearchSummary = {
    text: string;
    candidates: KeywordCandidate[];
    scores: {
      trademarkRisk: number;
      adPolicyRisk: number;
      bridgePageRisk: number;
      totalRiskScore: number;
      profitScore: number;
      opportunityScore: number;
    };
    evidence: Array<{ type: string; hit: string; weight: number; note: string }>;
    recommendations: Array<{ offer: string; why: string; confidence: number }>;
  };
  
  const clamp = (n: number, min = 0, max = 100) => Math.max(min, Math.min(max, n));
  
  function normalizeText(s: string) {
    return (s ?? "").replace(/\r\n/g, "\n").replace(/[ \t]+/g, " ").trim();
  }
  
  function mergeItems(items: ResearchItemLike[]) {
    const parts: string[] = [];
    for (const it of items) {
      const label = normalizeText(it.label ?? "");
      const value = normalizeText(it.value ?? "");
      if (label) parts.push(label);
      if (value) parts.push(value);
    }
    return parts.join("\n");
  }
  
  function extractTokens(text: string) {
    const hits = text.match(/[一-龥ぁ-んァ-ンa-zA-Z0-9]+/g) ?? [];
    return hits.map((t) => t.trim()).filter((t) => t.length >= 2 && t.length <= 40);
  }
  
  function extractCandidateKeywords(items: ResearchItemLike[], mergedText: string) {
    const raw: string[] = [];
    for (const it of items) {
      const v = normalizeText(it.value ?? "");
      if (!v) continue;
      const lines = v.split(/\n|,|、|;|・/g).map((x) => x.trim());
      for (const line of lines) {
        if (line.length >= 2 && line.length <= 60) raw.push(line);
      }
    }
  
    const tokens = extractTokens(mergedText);
    const freq = new Map<string, number>();
    for (const t of tokens) freq.set(t, (freq.get(t) ?? 0) + 1);
  
    const freqTop = [...freq.entries()]
      .sort((a, b) => b[1] - a[1])
      .map(([t]) => t)
      .slice(0, 40);
  
    const merged = [...raw, ...freqTop]
      .map((s) => s.replace(/\s+/g, " ").trim())
      .filter(Boolean);
  
    const seen = new Set<string>();
    const uniq: string[] = [];
    for (const s of merged) {
      const k = s.toLowerCase();
      if (seen.has(k)) continue;
      seen.add(k);
      uniq.push(s);
    }
  
    const intentBoostWords = [
      "比較","おすすめ","口コミ","評判","料金","相場","見積","資料請求","申し込み","予約","最安","割引","クーポン","無料相談",
    ];
    uniq.sort((a, b) => {
      const sa = intentBoostWords.some((w) => a.includes(w)) ? 1 : 0;
      const sb = intentBoostWords.some((w) => b.includes(w)) ? 1 : 0;
      return sb - sa;
    });
  
    return uniq.slice(0, 20);
  }
  
  /** ========= ルール辞書（MVP） ========= **/
  
  const BRAND_TOKENS = [
    "google","youtube","amazon","rakuten","mercari","disney","nintendo",
    "playstation","iphone","ipad","apple","line","tiktok","instagram",
    "chatgpt","openai","meta",
    "楽天","メルカリ","ディズニー","任天堂","アップル","ライン",
  ];
  
  const TRADEMARK_CUES = ["公式","正規","純正","本物","商標","登録商標","™","®"];
  
  const ADPOLICY_HARD = [
    "オンラインカジノ","カジノ","ギャンブル","闇金","クレカ現金化","違法",
    "大麻","覚醒剤","ドラッグ","アダルト","風俗","出会い系",
    "ハッキング","クラッキング","盗聴","スパイ",
    "武器","銃","ナイフ",
  ];
  
  const ADPOLICY_SOFT = [
    "必ず稼げる","確実に儲かる","誰でも簡単","絶対","100%","即日融資",
    "1週間で10kg","一発で治る","医学的に証明","副作用なし",
  ];
  
  const BRIDGE_CUES = [
    "ランキング","おすすめ","比較","口コミ","評判","最安","クーポン",
    "アフィ","案件","A8","セルフバック","ASP","LPだけ",
    "誘導","リンクだけ","コピペ",
  ];
  
  const HIGH_CPC_CATEGORIES: Array<{ token: string; weight: number; offer: string; why: string }> = [
    { token: "保険", weight: 22, offer: "保険相談（無料相談/面談）", why: "リード単価が比較的高く、成約導線が作りやすい" },
    { token: "債務整理", weight: 28, offer: "債務整理/法律相談", why: "高単価になりやすいが広告ポリシー/表現は慎重に" },
    { token: "クレジットカード", weight: 18, offer: "クレカ発行", why: "成果条件が明確でLP最適化しやすい" },
    { token: "住宅ローン", weight: 22, offer: "住宅ローン比較/借換", why: "高単価・需要大、ただし競合強め" },
    { token: "脱毛", weight: 16, offer: "医療脱毛/サロン予約", why: "購買意図が強いが表現が強いと広告で落ちやすい" },
    { token: "転職", weight: 16, offer: "転職エージェント", why: "成果地点が多く運用余地がある" },
    { token: "光回線", weight: 14, offer: "回線契約", why: "成果発生が多いが競合も多い" },
    { token: "不動産", weight: 16, offer: "不動産査定/売却相談", why: "リード単価が上がりやすい" },
    { token: "英会話", weight: 10, offer: "オンライン英会話", why: "継続課金でLTVが出やすい" },
  ];
  
  function scoreTrademark(keyword: string, mergedLower: string, evidence: ResearchSummary["evidence"]) {
    const k = keyword.toLowerCase();
    let risk = 0;
  
    for (const b of BRAND_TOKENS) {
      if (k.includes(b) || mergedLower.includes(b)) {
        risk += 35;
        evidence.push({ type: "trademark", hit: b, weight: 35, note: "ブランド/固有名詞っぽい" });
        break;
      }
    }
    for (const cue of TRADEMARK_CUES) {
      if (keyword.includes(cue)) {
        risk += 20;
        evidence.push({ type: "trademark", hit: cue, weight: 20, note: "商標ワードの匂い" });
      }
    }
    return clamp(risk);
  }
  
  function scoreAdPolicy(keyword: string, mergedText: string, evidence: ResearchSummary["evidence"]) {
    let risk = 0;
    for (const w of ADPOLICY_HARD) {
      if (mergedText.includes(w) || keyword.includes(w)) {
        risk += 60;
        evidence.push({ type: "adPolicy", hit: w, weight: 60, note: "ハードNG寄り領域" });
      }
    }
    for (const w of ADPOLICY_SOFT) {
      if (mergedText.includes(w) || keyword.includes(w)) {
        risk += 18;
        evidence.push({ type: "adPolicy", hit: w, weight: 18, note: "誇大表現/危険表現" });
      }
    }
    return clamp(risk);
  }
  
  function scoreBridgeRisk(mergedText: string, evidence: ResearchSummary["evidence"]) {
    const totalLen = Math.max(mergedText.length, 1);
    let hits = 0;
    for (const w of BRIDGE_CUES) {
      if (mergedText.includes(w)) {
        hits += 1;
        evidence.push({ type: "bridge", hit: w, weight: 8, note: "薄いアフィ/ドアウェイに寄りやすい語" });
      }
    }
    const density = hits / Math.max(1, totalLen / 200);
    const risk = density * 12;
    return clamp(risk);
  }
  
  function scoreProfit(keyword: string, mergedText: string, evidence: ResearchSummary["evidence"]) {
    let score = 8;
  
    for (const c of HIGH_CPC_CATEGORIES) {
      if (keyword.includes(c.token) || mergedText.includes(c.token)) {
        score += c.weight;
        evidence.push({ type: "profit", hit: c.token, weight: c.weight, note: `高単価カテゴリ候補: ${c.offer}` });
      }
    }
  
    const intent = ["料金","相場","見積","資料請求","申し込み","予約","無料相談","比較","おすすめ","最安","割引","クーポン"];
    for (const w of intent) {
      if (keyword.includes(w)) score += 4;
    }
  
    const len = keyword.replace(/\s+/g, "").length;
    if (len <= 3) score -= 18;
    else if (len <= 5) score -= 10;
    else if (len >= 12) score += 6;
  
    const infoCues = ["とは","やり方","方法","意味","なぜ"];
    if (infoCues.some((w) => keyword.includes(w))) score -= 10;
  
    return clamp(score);
  }
  
  function buildRecommendations(mergedText: string) {
    const rec: ResearchSummary["recommendations"] = [];
    for (const c of HIGH_CPC_CATEGORIES) {
      if (mergedText.includes(c.token)) {
        rec.push({
          offer: c.offer,
          why: c.why,
          confidence: clamp(60 + c.weight),
        });
      }
    }
    const seen = new Set<string>();
    return rec.filter((r) => (seen.has(r.offer) ? false : (seen.add(r.offer), true))).slice(0, 8);
  }
  
  export function runRuleBasedResearch(items: ResearchItemLike[]): ResearchSummary {
    const mergedText = mergeItems(items);
    const mergedLower = mergedText.toLowerCase();
  
    const evidence: ResearchSummary["evidence"] = [];
    const keywords = extractCandidateKeywords(items, mergedText);
  
    const candidates: KeywordCandidate[] = keywords.map((kw) => {
      const reasons: string[] = [];
  
      const trademarkRisk = scoreTrademark(kw, mergedLower, evidence);
      if (trademarkRisk >= 40) reasons.push("商標/ブランド寄りの匂い");
  
      const adPolicyRisk = scoreAdPolicy(kw, mergedText, evidence);
      if (adPolicyRisk >= 40) reasons.push("広告ポリシーで落ちやすい領域/表現が混ざってる可能性");
  
      const bridgePageRisk = scoreBridgeRisk(mergedText, evidence);
      if (bridgePageRisk >= 35) reasons.push("薄いアフィ/ドアウェイに寄りやすい構成ワード多め");
  
      const profitScore = scoreProfit(kw, mergedText, evidence);
      if (profitScore >= 60) reasons.push("単価/購買意図が強い兆候");
  
      const riskTotal = clamp(trademarkRisk * 0.45 + adPolicyRisk * 0.35 + bridgePageRisk * 0.20);
      const opportunityScore = clamp(profitScore - riskTotal * 0.8);
  
      return {
        keyword: kw,
        profitScore,
        trademarkRisk,
        adPolicyRisk,
        bridgePageRisk,
        opportunityScore,
        reasons,
      };
    });
  
    const topByOpp = [...candidates].sort((a, b) => b.opportunityScore - a.opportunityScore).slice(0, 5);
    const avg = (arr: number[]) => (arr.length ? arr.reduce((s, x) => s + x, 0) / arr.length : 0);
  
    const trademarkRisk = clamp(avg(topByOpp.map((c) => c.trademarkRisk)));
    const adPolicyRisk = clamp(avg(topByOpp.map((c) => c.adPolicyRisk)));
    const bridgePageRisk = clamp(avg(topByOpp.map((c) => c.bridgePageRisk)));
    const totalRiskScore = clamp(trademarkRisk * 0.45 + adPolicyRisk * 0.35 + bridgePageRisk * 0.20);
  
    const profitScore = clamp(avg(topByOpp.map((c) => c.profitScore)));
    const opportunityScore = clamp(avg(topByOpp.map((c) => c.opportunityScore)));
  
    const recommendations = buildRecommendations(mergedText);
  
    return {
      text: mergedText,
      candidates: [...candidates].sort((a, b) => b.opportunityScore - a.opportunityScore).slice(0, 12),
      scores: { trademarkRisk, adPolicyRisk, bridgePageRisk, totalRiskScore, profitScore, opportunityScore },
      evidence: evidence.slice(0, 60),
      recommendations,
    };
  }
  