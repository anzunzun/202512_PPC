"use client";

import { CONFIG, type ProductType } from "../config";

export default function CompareClient() {
  const products = CONFIG.products;

  return (
    <div style={styles.container}>
      {/* ページタイトル */}
      <div style={styles.pageHeader}>
        <h2 style={styles.pageTitle}>{CONFIG.genre}を条件で比較</h2>
        <p style={styles.pageSubtitle}>
          素材・価格・スタイルなど、条件別に比較して自分に合ったものを見つけましょう。
        </p>
      </div>

      {/* 比較表 */}
      <div style={styles.compareSection}>
        <h3 style={styles.sectionTitle}>
          <span style={styles.sectionIcon}>📊</span>
          条件別 比較表
        </h3>
        <div style={styles.tableWrapper}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>比較項目</th>
                {products.map((p) => (
                  <th key={p.id} style={styles.th}>
                    {p.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {CONFIG.compareItems.map((item, idx) => (
                <tr key={item.key} style={idx % 2 === 0 ? styles.trEven : undefined}>
                  <td style={styles.tdLabel}>{item.label}</td>
                  {products.map((p) => (
                    <td
                      key={p.id}
                      style={
                        item.key === "price" ? styles.tdPrice : styles.td
                      }
                    >
                      {CONFIG.compareData[p.id]?.[item.key] || "-"}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 商品カード一覧 */}
      <div style={styles.productsSection}>
        <h3 style={styles.sectionTitle}>
          <span style={styles.sectionIcon}>💍</span>
          各ラインの詳細
        </h3>

        {products.map((product, index) => (
          <ProductCard key={product.id} product={product} index={index} />
        ))}
      </div>

      {/* 選び方ガイド */}
      <div style={styles.guideSection}>
        <h3 style={styles.guideSectionTitle}>選び方のポイント</h3>
        <div style={styles.guideGrid}>
          <div style={styles.guideItem}>
            <div style={styles.guideIcon}>💰</div>
            <div style={styles.guideLabel}>予算で選ぶ</div>
            <div style={styles.guideText}>
              6,800円〜15,800円の価格帯から、予算に合わせて選べます。
            </div>
          </div>
          <div style={styles.guideItem}>
            <div style={styles.guideIcon}>✨</div>
            <div style={styles.guideLabel}>素材で選ぶ</div>
            <div style={styles.guideText}>
              ステンレス、チタン、レザーなど、用途に合った素材を選択。
            </div>
          </div>
          <div style={styles.guideItem}>
            <div style={styles.guideIcon}>👔</div>
            <div style={styles.guideLabel}>シーンで選ぶ</div>
            <div style={styles.guideText}>
              日常使い、特別な日、カジュアルなど、シーンに合わせて。
            </div>
          </div>
        </div>
      </div>

      {/* 診断への誘導 */}
      <div style={styles.quizBanner}>
        <div style={styles.quizBannerText}>
          どれが自分に合うかわからない方は
        </div>
        <a href="/lp/quiz" style={styles.quizLink}>
          🔍 診断で見つける（約1分）
        </a>
      </div>
    </div>
  );
}

function ProductCard({ product, index }: { product: ProductType; index: number }) {
  const labelColors = ["#3498db", "#9b59b6", "#27ae60"];
  const labelColor = labelColors[index % labelColors.length];

  return (
    <div style={styles.productCard}>
      {/* 商品画像 */}
      <div style={styles.imageContainer}>
        <img
          src={product.image}
          alt={`${product.name}のイメージ`}
          style={styles.productImage}
        />
      </div>

      {/* カードヘッダー */}
      <div style={styles.cardHeader}>
        <span style={{ ...styles.cardLabel, background: labelColor }}>
          {product.name}
        </span>
      </div>

      {/* 価格（目立たせる） */}
      <div style={styles.priceBlock}>
        <span style={styles.priceValue}>{product.price}</span>
        <span style={styles.priceNote}>{product.priceNote}</span>
      </div>

      {/* 説明 */}
      <p style={styles.productDesc}>{product.description}</p>

      {/* 特徴リスト */}
      <div style={styles.featuresBlock}>
        <div style={styles.featuresTitle}>特徴</div>
        <ul style={styles.featuresList}>
          {product.features.map((f, i) => (
            <li key={i} style={styles.featureItem}>
              <span style={styles.checkIcon}>✓</span>
              {f}
            </li>
          ))}
        </ul>
      </div>

      {/* スペック表 */}
      <div style={styles.specsBlock}>
        <div style={styles.specsTitle}>スペック詳細</div>
        <table style={styles.specsTable}>
          <tbody>
            {Object.entries(product.specs).map(([key, val]) => (
              <tr key={key}>
                <td style={styles.specLabel}>{key}</td>
                <td style={styles.specValue}>{val}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* CTAボタン */}
      <a
        href={product.ctaUrl}
        target="_blank"
        rel="noopener noreferrer sponsored"
        style={styles.ctaButton}
      >
        ≫ {product.ctaText}
      </a>
      <p style={styles.ctaNote}>※ 公式サイトへ移動します</p>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    maxWidth: 800,
    margin: "0 auto",
  },
  pageHeader: {
    background: "#fff",
    borderRadius: 12,
    padding: "24px 20px",
    marginBottom: 20,
    boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
    textAlign: "center",
  },
  pageTitle: {
    fontSize: 22,
    fontWeight: 700,
    color: "#333",
    margin: 0,
    marginBottom: 8,
  },
  pageSubtitle: {
    fontSize: 14,
    color: "#666",
    margin: 0,
    lineHeight: 1.6,
  },
  compareSection: {
    background: "#fff",
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 700,
    color: "#333",
    margin: 0,
    marginBottom: 16,
    paddingBottom: 12,
    borderBottom: "2px solid #333",
    display: "flex",
    alignItems: "center",
    gap: 8,
  },
  sectionIcon: {
    fontSize: 20,
  },
  tableWrapper: {
    overflowX: "auto",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
    fontSize: 14,
    minWidth: 500,
  },
  th: {
    padding: "12px 10px",
    background: "#32373c",
    color: "#fff",
    fontWeight: 600,
    textAlign: "center",
    borderBottom: "1px solid #ddd",
  },
  trEven: {
    background: "#f8f9fa",
  },
  tdLabel: {
    padding: "12px 10px",
    fontWeight: 600,
    background: "#f0f0f0",
    borderBottom: "1px solid #eee",
    textAlign: "left",
  },
  td: {
    padding: "12px 10px",
    borderBottom: "1px solid #eee",
    textAlign: "center",
  },
  tdPrice: {
    padding: "12px 10px",
    borderBottom: "1px solid #eee",
    textAlign: "center",
    fontWeight: 700,
    color: "#e74c3c",
  },
  productsSection: {
    marginBottom: 20,
  },
  productCard: {
    background: "#fff",
    borderRadius: 12,
    padding: 24,
    marginBottom: 20,
    boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
    border: "1px solid #eee",
  },
  imageContainer: {
    marginBottom: 16,
    borderRadius: 8,
    overflow: "hidden",
    background: "#f8f9fa",
  },
  productImage: {
    width: "100%",
    height: 200,
    objectFit: "cover",
    display: "block",
  },
  cardHeader: {
    marginBottom: 16,
  },
  cardLabel: {
    display: "inline-block",
    padding: "6px 16px",
    borderRadius: 20,
    color: "#fff",
    fontWeight: 700,
    fontSize: 14,
  },
  priceBlock: {
    marginBottom: 16,
    paddingBottom: 16,
    borderBottom: "1px dashed #ddd",
  },
  priceValue: {
    fontSize: 28,
    fontWeight: 700,
    color: "#e74c3c",
  },
  priceNote: {
    fontSize: 12,
    color: "#888",
    marginLeft: 8,
  },
  productDesc: {
    fontSize: 14,
    color: "#555",
    lineHeight: 1.8,
    marginBottom: 20,
  },
  featuresBlock: {
    marginBottom: 20,
  },
  featuresTitle: {
    fontSize: 13,
    fontWeight: 700,
    color: "#333",
    marginBottom: 10,
    paddingLeft: 8,
    borderLeft: "3px solid #3498db",
  },
  featuresList: {
    listStyle: "none",
    padding: 0,
    margin: 0,
    display: "grid",
    gridTemplateColumns: "repeat(2, 1fr)",
    gap: 8,
  },
  featureItem: {
    fontSize: 13,
    color: "#444",
    padding: "6px 0",
    display: "flex",
    alignItems: "center",
    gap: 6,
  },
  checkIcon: {
    color: "#27ae60",
    fontWeight: 700,
  },
  specsBlock: {
    marginBottom: 20,
    background: "#f8f9fa",
    borderRadius: 8,
    padding: 16,
  },
  specsTitle: {
    fontSize: 13,
    fontWeight: 700,
    color: "#333",
    marginBottom: 10,
  },
  specsTable: {
    width: "100%",
    fontSize: 13,
    borderCollapse: "collapse",
  },
  specLabel: {
    padding: "8px 0",
    color: "#666",
    width: "30%",
    borderBottom: "1px solid #eee",
  },
  specValue: {
    padding: "8px 0",
    color: "#333",
    borderBottom: "1px solid #eee",
  },
  ctaButton: {
    display: "block",
    width: "100%",
    padding: "16px 24px",
    fontSize: 15,
    fontWeight: 700,
    background: "#32373c",
    color: "#fff",
    border: "none",
    borderRadius: 9999,
    cursor: "pointer",
    textAlign: "center",
    textDecoration: "none",
    transition: "background 0.2s",
  },
  ctaNote: {
    fontSize: 11,
    color: "#888",
    textAlign: "center",
    marginTop: 8,
  },
  guideSection: {
    background: "#fff",
    borderRadius: 12,
    padding: 24,
    marginBottom: 20,
    boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
  },
  guideSectionTitle: {
    fontSize: 16,
    fontWeight: 700,
    color: "#333",
    marginBottom: 16,
    textAlign: "center",
  },
  guideGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: 16,
  },
  guideItem: {
    textAlign: "center",
    padding: 12,
  },
  guideIcon: {
    fontSize: 28,
    marginBottom: 8,
  },
  guideLabel: {
    fontSize: 14,
    fontWeight: 700,
    color: "#333",
    marginBottom: 4,
  },
  guideText: {
    fontSize: 12,
    color: "#666",
    lineHeight: 1.5,
  },
  quizBanner: {
    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    borderRadius: 12,
    padding: 24,
    textAlign: "center",
    marginBottom: 20,
  },
  quizBannerText: {
    fontSize: 14,
    color: "rgba(255,255,255,0.9)",
    marginBottom: 12,
  },
  quizLink: {
    display: "inline-block",
    padding: "12px 32px",
    background: "#fff",
    color: "#667eea",
    fontWeight: 700,
    fontSize: 15,
    borderRadius: 9999,
    textDecoration: "none",
  },
};
