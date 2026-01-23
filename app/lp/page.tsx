import Link from "next/link";
import { CONFIG } from "./config";

const styles: Record<string, React.CSSProperties> = {
  card: {
    background: "#fff",
    borderRadius: 16,
    padding: 24,
    boxShadow: "0 4px 20px rgba(0,0,0,0.15)",
    marginBottom: 16,
  },
  intro: {
    fontSize: 15,
    color: "#555",
    lineHeight: 1.8,
    marginBottom: 24,
    textAlign: "center",
  },
  optionTitle: {
    fontSize: 14,
    fontWeight: 600,
    color: "#667eea",
    marginBottom: 16,
    textAlign: "center",
  },
  optionsGrid: {
    display: "flex",
    flexDirection: "column",
    gap: 16,
  },
  optionCard: {
    display: "block",
    padding: 20,
    borderRadius: 12,
    border: "2px solid #eee",
    textDecoration: "none",
    transition: "all 0.2s ease",
    background: "#fff",
  },
  optionIcon: {
    fontSize: 32,
    marginBottom: 12,
    display: "block",
  },
  optionName: {
    fontSize: 16,
    fontWeight: 700,
    color: "#333",
    marginBottom: 8,
  },
  optionDesc: {
    fontSize: 13,
    color: "#666",
    lineHeight: 1.6,
  },
  optionTime: {
    fontSize: 12,
    color: "#888",
    marginTop: 8,
  },
  quizOption: {
    borderColor: "#667eea",
    background: "linear-gradient(135deg, rgba(102,126,234,0.05) 0%, rgba(118,75,162,0.05) 100%)",
  },
  compareOption: {
    borderColor: "#27ae60",
    background: "linear-gradient(135deg, rgba(39,174,96,0.05) 0%, rgba(46,204,113,0.05) 100%)",
  },
};

export default function LpTopPage() {
  return (
    <div style={styles.card}>
      <p style={styles.intro}>
        {CONFIG.genre}の選び方は2つの方法からお選びいただけます。
        <br />
        あなたに合った方法でご確認ください。
      </p>

      <div style={styles.optionTitle}>選び方を選択</div>

      <div style={styles.optionsGrid}>
        {/* 診断型 */}
        <Link href="/lp/quiz" style={{ ...styles.optionCard, ...styles.quizOption }}>
          <span style={styles.optionIcon}>&#128269;</span>
          <div style={styles.optionName}>診断で選ぶ</div>
          <p style={styles.optionDesc}>
            5つの質問に答えるだけで、あなたに合ったタイプが分かります。
            迷っている方におすすめです。
          </p>
          <div style={styles.optionTime}>所要時間: 約1分</div>
        </Link>

        {/* 比較記事型 */}
        <Link href="/lp/compare" style={{ ...styles.optionCard, ...styles.compareOption }}>
          <span style={styles.optionIcon}>&#128202;</span>
          <div style={styles.optionName}>比較表で選ぶ</div>
          <p style={styles.optionDesc}>
            条件別の比較表で、各タイプの特徴を一覧で確認できます。
            じっくり検討したい方におすすめです。
          </p>
          <div style={styles.optionTime}>所要時間: 約3分</div>
        </Link>
      </div>
    </div>
  );
}
