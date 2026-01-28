import Link from "next/link";
import { CONFIG } from "./config";

export const metadata = {
  title: `${CONFIG.genre}診断 | ${CONFIG.subtitle}`,
  description: CONFIG.subtitle,
};

const styles: Record<string, React.CSSProperties> = {
  body: {
    minHeight: "100vh",
    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    margin: 0,
    padding: 0,
  },
  container: {
    maxWidth: 860,
    margin: "0 auto",
    padding: "20px 16px",
  },
  header: {
    textAlign: "center",
    marginBottom: 24,
    color: "#fff",
  },
  title: {
    fontSize: 24,
    fontWeight: 700,
    margin: 0,
  },
  subtitle: {
    fontSize: 14,
    opacity: 0.9,
    marginTop: 8,
  },
  footer: {
    textAlign: "center",
    padding: "24px 16px",
    color: "rgba(255,255,255,0.7)",
    fontSize: 12,
  },
  footerLink: {
    color: "rgba(255,255,255,0.8)",
    textDecoration: "underline",
  },
  prBadge: {
    textAlign: "center",
    fontSize: 11,
    color: "rgba(255,255,255,0.7)",
    marginBottom: 8,
  },
};

export default function LpLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={styles.body}>
      <div style={styles.container}>
        {/* PR表記（景品表示法・ステマ規制対応） */}
        <div style={styles.prBadge}>当ページはアフィリエイト広告を利用しています</div>

        <header style={styles.header}>
          <h1 style={styles.title}>{CONFIG.genre}診断</h1>
          <p style={styles.subtitle}>{CONFIG.subtitle}</p>
        </header>

        <main>{children}</main>

        <footer style={styles.footer}>
          <p>運営: {CONFIG.legal.operator}</p>
          <p style={{ marginTop: 8 }}>{CONFIG.legal.disclaimer}</p>
          <p style={{ marginTop: 8 }}>
            <Link href="/lp/privacy" style={styles.footerLink}>
              プライバシーポリシー
            </Link>
          </p>
          <p style={{ marginTop: 8 }}>
            お問い合わせ:{" "}
            <a href={`mailto:${CONFIG.legal.email}`} style={styles.footerLink}>
              {CONFIG.legal.email}
            </a>
          </p>
        </footer>
      </div>
    </div>
  );
}
