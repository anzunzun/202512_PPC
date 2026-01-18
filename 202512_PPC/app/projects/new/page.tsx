import { redirect } from "next/navigation";
import Link from "next/link";
import { createProject } from "@/app/actions/project";

export default function NewProjectPage() {
  async function action(formData: FormData) {
    "use server";
    const country = String(formData.get("country") ?? "");
    const genre = String(formData.get("genre") ?? "");

    const created = await createProject({ country, genre });
    redirect(`/projects/${created.id}`);
  }

  return (
    <main style={{ padding: 20, maxWidth: 720, margin: "0 auto" }}>
      <h1 style={{ fontSize: 32, fontWeight: 800 }}>新規プロジェクト作成</h1>

      <div style={{ marginTop: 10 }}>
        <Link href="/projects" style={{ color: "blue", textDecoration: "underline" }}>
          一覧へ戻る
        </Link>
      </div>

      <form action={action} style={{ marginTop: 20, display: "grid", gap: 12 }}>
        <label>
          国
          <input name="country" defaultValue="日本" style={inputStyle} />
        </label>

        <label>
          ジャンル
          <input name="genre" defaultValue="" style={inputStyle} />
        </label>

        <button type="submit" style={buttonStyle}>
          作成して詳細へ
        </button>
      </form>
    </main>
  );
}

const inputStyle: React.CSSProperties = {
  display: "block",
  width: "100%",
  padding: "10px 12px",
  border: "1px solid #ccc",
  borderRadius: 8,
  marginTop: 6,
  background: "#fff",
  color: "#111",
};

const buttonStyle: React.CSSProperties = {
  padding: "10px 14px",
  borderRadius: 8,
  border: "1px solid #111",
  background: "#111",
  color: "#fff",
  fontWeight: 700,
  cursor: "pointer",
};
