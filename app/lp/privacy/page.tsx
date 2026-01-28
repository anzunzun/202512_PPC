import { CONFIG } from "../config";

export const metadata = {
  title: `プライバシーポリシー | ${CONFIG.genre}診断`,
};

export default function PrivacyPage() {
  return (
    <div style={styles.container}>
      <h2 style={styles.heading}>プライバシーポリシー</h2>

      <section style={styles.section}>
        <h3 style={styles.subHeading}>広告について</h3>
        <p style={styles.text}>
          当サイトは、第三者配信の広告サービス（Google広告、A8.net等のアフィリエイトプログラム）を利用しています。
          広告配信事業者は、ユーザーの興味に応じた広告を表示するためにCookieを使用することがあります。
        </p>
        <p style={styles.text}>
          当サイト内のリンクの一部はアフィリエイトリンクであり、リンク先での購入により当サイト運営者が報酬を受け取る場合があります。
          これによりユーザーに追加費用が発生することはありません。
        </p>
      </section>

      <section style={styles.section}>
        <h3 style={styles.subHeading}>個人情報の取り扱い</h3>
        <p style={styles.text}>
          当サイトでは、お問い合わせの際にメールアドレス等の個人情報をご提供いただく場合があります。
          取得した個人情報は、お問い合わせへの対応のみに利用し、第三者に提供することはありません。
        </p>
      </section>

      <section style={styles.section}>
        <h3 style={styles.subHeading}>Cookieについて</h3>
        <p style={styles.text}>
          当サイトでは、アクセス解析および広告配信のためにCookieを使用しています。
          Cookieの使用を望まない場合は、ブラウザの設定により無効にすることが可能です。
        </p>
      </section>

      <section style={styles.section}>
        <h3 style={styles.subHeading}>免責事項</h3>
        <p style={styles.text}>{CONFIG.legal.disclaimer}</p>
      </section>

      <section style={styles.section}>
        <h3 style={styles.subHeading}>運営者情報</h3>
        <p style={styles.text}>
          運営者: {CONFIG.legal.operator}
          <br />
          連絡先:{" "}
          <a href={`mailto:${CONFIG.legal.email}`} style={styles.link}>
            {CONFIG.legal.email}
          </a>
        </p>
      </section>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    background: "#fff",
    borderRadius: 12,
    padding: 24,
    boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
  },
  heading: {
    fontSize: 20,
    fontWeight: 700,
    color: "#333",
    margin: 0,
    marginBottom: 24,
    paddingBottom: 12,
    borderBottom: "2px solid #333",
  },
  section: {
    marginBottom: 24,
  },
  subHeading: {
    fontSize: 16,
    fontWeight: 700,
    color: "#333",
    marginBottom: 8,
  },
  text: {
    fontSize: 14,
    color: "#555",
    lineHeight: 1.8,
    marginBottom: 8,
  },
  link: {
    color: "#667eea",
    textDecoration: "underline",
  },
};
