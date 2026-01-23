"use client";

import { CONFIG, type ResultType } from "../config";

const styles: Record<string, React.CSSProperties> = {
  intro: {
    background: "#fff",
    borderRadius: 16,
    padding: 24,
    marginBottom: 20,
    boxShadow: "0 4px 20px rgba(0,0,0,0.15)",
  },
  introTitle: {
    fontSize: 20,
    fontWeight: 700,
    color: "#333",
    marginBottom: 12,
  },
  introText: {
    fontSize: 14,
    color: "#555",
    lineHeight: 1.8,
  },
  compareTable: {
    background: "#fff",
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    boxShadow: "0 4px 20px rgba(0,0,0,0.15)",
    overflowX: "auto",
  },
  tableTitle: {
    fontSize: 16,
    fontWeight: 700,
    color: "#333",
    marginBottom: 16,
    paddingBottom: 12,
    borderBottom: "2px solid #667eea",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
    fontSize: 14,
  },
  th: {
    padding: "12px 8px",
    background: "#f8f9fa",
    fontWeight: 600,
    textAlign: "left",
    borderBottom: "1px solid #eee",
  },
  td: {
    padding: "12px 8px",
    borderBottom: "1px solid #eee",
    verticalAlign: "top",
  },
  typeCard: {
    background: "#fff",
    borderRadius: 16,
    padding: 24,
    marginBottom: 20,
    boxShadow: "0 4px 20px rgba(0,0,0,0.15)",
  },
  typeHeader: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    marginBottom: 16,
  },
  typeIcon: {
    width: 48,
    height: 48,
    borderRadius: "50%",
    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#fff",
    fontWeight: 700,
    fontSize: 18,
  },
  typeTitle: {
    fontSize: 18,
    fontWeight: 700,
    color: "#333",
  },
  typeDesc: {
    fontSize: 14,
    color: "#555",
    lineHeight: 1.7,
    marginBottom: 20,
  },
  suitableTitle: {
    fontSize: 13,
    fontWeight: 600,
    color: "#667eea",
    marginBottom: 10,
  },
  suitableList: {
    listStyle: "none",
    padding: 0,
    margin: "0 0 20px 0",
  },
  suitableItem: {
    padding: "6px 0",
    paddingLeft: 20,
    fontSize: 13,
    color: "#444",
    lineHeight: 1.5,
  },
  cautionTitle: {
    fontSize: 13,
    fontWeight: 600,
    color: "#e67e22",
    marginBottom: 10,
  },
  cautionList: {
    listStyle: "none",
    padding: 0,
    margin: "0 0 20px 0",
  },
  cautionItem: {
    padding: "6px 0",
    paddingLeft: 20,
    fontSize: 13,
    color: "#666",
    lineHeight: 1.5,
  },
  ctaButton: {
    display: "block",
    width: "100%",
    padding: "16px 24px",
    fontSize: 15,
    fontWeight: 700,
    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    color: "#fff",
    border: "none",
    borderRadius: 10,
    cursor: "pointer",
    textAlign: "center",
    textDecoration: "none",
  },
  ctaNote: {
    fontSize: 11,
    color: "#888",
    textAlign: "center",
    marginTop: 8,
  },
  summary: {
    background: "#fff",
    borderRadius: 16,
    padding: 24,
    boxShadow: "0 4px 20px rgba(0,0,0,0.15)",
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: 700,
    color: "#333",
    marginBottom: 16,
  },
  summaryText: {
    fontSize: 14,
    color: "#555",
    lineHeight: 1.8,
    marginBottom: 16,
  },
  quizLink: {
    display: "block",
    textAlign: "center",
    padding: "14px 20px",
    background: "#fff",
    border: "2px solid #667eea",
    borderRadius: 10,
    color: "#667eea",
    fontWeight: 600,
    textDecoration: "none",
    fontSize: 14,
  },
};

// 比較軸の定義
const COMPARE_AXES = [
  { key: "cost", label: "コスト" },
  { key: "features", label: "機能の充実度" },
  { key: "support", label: "サポート体制" },
  { key: "flexibility", label: "柔軟性" },
];

// タイプごとの比較データ
const TYPE_COMPARE_DATA: Record<string, Record<string, string>> = {
  "type-a": {
    cost: "低コスト",
    features: "必要最低限",
    support: "基本的",
    flexibility: "高い（短期解約可）",
  },
  "type-b": {
    cost: "高め",
    features: "豊富",
    support: "手厚い",
    flexibility: "中程度",
  },
  "type-c": {
    cost: "中程度",
    features: "バランス良好",
    support: "標準的",
    flexibility: "高い",
  },
};

export default function CompareClient() {
  const types = Object.entries(CONFIG.results) as [string, ResultType][];

  return (
    <>
      {/* 導入 */}
      <div style={styles.intro}>
        <h2 style={styles.introTitle}>選び方のポイント</h2>
        <p style={styles.introText}>
          {CONFIG.genre}を選ぶ際には、コスト・機能・サポート体制など複数の軸で比較することが重要です。
          自分の利用目的や予算に合った条件を見つけましょう。
        </p>
      </div>

      {/* 比較表 */}
      <div style={styles.compareTable}>
        <h3 style={styles.tableTitle}>条件別 比較表</h3>
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>比較軸</th>
              {types.map(([key, type]) => (
                <th key={key} style={styles.th}>
                  {type.title}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {COMPARE_AXES.map((axis) => (
              <tr key={axis.key}>
                <td style={{ ...styles.td, fontWeight: 600 }}>{axis.label}</td>
                {types.map(([key]) => (
                  <td key={key} style={styles.td}>
                    {TYPE_COMPARE_DATA[key]?.[axis.key] || "-"}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* 各タイプの詳細 */}
      {types.map(([key, type], index) => (
        <div key={key} style={styles.typeCard}>
          <div style={styles.typeHeader}>
            <div style={styles.typeIcon}>{String.fromCharCode(65 + index)}</div>
            <h3 style={styles.typeTitle}>{type.title}</h3>
          </div>

          <p style={styles.typeDesc}>{type.description}</p>

          <div style={styles.suitableTitle}>こんな人に向いています</div>
          <ul style={styles.suitableList}>
            {type.points.map((point, i) => (
              <li key={i} style={styles.suitableItem}>
                &#10003; {point}
              </li>
            ))}
          </ul>

          <div style={styles.cautionTitle}>注意点</div>
          <ul style={styles.cautionList}>
            {type.cautions.map((caution, i) => (
              <li key={i} style={styles.cautionItem}>
                &#9888; {caution}
              </li>
            ))}
          </ul>

          <a
            href={type.ctaUrl}
            target="_blank"
            rel="noopener noreferrer sponsored"
            style={styles.ctaButton}
          >
            {type.ctaText}
          </a>
          <p style={styles.ctaNote}>※ 外部サイトへ移動します</p>
        </div>
      ))}

      {/* まとめ */}
      <div style={styles.summary}>
        <h3 style={styles.summaryTitle}>まとめ</h3>
        <p style={styles.summaryText}>
          上記の比較を参考に、自分の条件に合ったタイプを選びましょう。
          どのタイプが自分に合うか分からない場合は、診断機能もご活用ください。
        </p>
        <a href="/lp/quiz" style={styles.quizLink}>
          診断で自分に合うタイプを見つける
        </a>
      </div>
    </>
  );
}
