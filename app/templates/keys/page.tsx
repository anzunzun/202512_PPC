import Link from "next/link";
import { redirect } from "next/navigation";
import { unstable_noStore as noStore } from "next/cache";

import { prisma } from "@/lib/prisma";
import { ensureTemplateKeys } from "@/app/actions/templateKeys";

export default async function TemplateKeysPage({
  searchParams,
}: {
  searchParams?: { scope?: string; done?: string };
}) {
  noStore();

  const scope = String(searchParams?.scope ?? "PPC") || "PPC";
  const done = searchParams?.done === "1";

  const templates = await prisma.researchItemTemplate.findMany({
    where: { scope },
    orderBy: [{ order: "asc" }, { createdAt: "asc" }],
  });

  const missing = templates.filter((t) => !String(t.key ?? "").trim()).length;

  async function fixKeys() {
    "use server";
    await ensureTemplateKeys({ scope });
    redirect(`/templates/keys?scope=${encodeURIComponent(scope)}&done=1`);
  }

  return (
    <main style={{ padding: 20, maxWidth: 980, margin: "0 auto", display: "grid", gap: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 12 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 28, fontWeight: 900 }}>テンプレ key 管理</h1>
          <div style={{ fontSize: 12, opacity: 0.8 }}>
            scope: <b>{scope}</b> / key未設定: <b>{missing}</b> / 合計: <b>{templates.length}</b>
          </div>
          {done && (
            <div style={{ marginTop: 6, fontSize: 12, fontWeight: 800 }}>
              ✅ key 自動生成を実行しました
            </div>
          )}
        </div>

        <div style={{ display: "flex", gap: 12, alignItems: "baseline" }}>
          <Link href="/templates" style={{ textDecoration: "underline", fontWeight: 800 }}>
            テンプレ管理へ戻る
          </Link>
          <Link href="/projects" style={{ textDecoration: "underline", fontWeight: 800 }}>
            プロジェクト一覧へ
          </Link>
        </div>
      </div>

      <section style={{ padding: 12, border: "1px solid #e5e7eb", borderRadius: 12, background: "#fff" }}>
        <form action={fixKeys} style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
          <button
            type="submit"
            style={{
              padding: "10px 14px",
              borderRadius: 10,
              border: "1px solid #111827",
              background: "#111827",
              color: "#fff",
              fontWeight: 900,
              cursor: "pointer",
            }}
            title="key未設定を埋め、重複があればsuffixで解消します"
          >
            key を自動生成して埋める
          </button>

          <div style={{ fontSize: 12, opacity: 0.85 }}>
            生成ルール：label→英数字slug（無理なら fallback: k_{String(templates[0]?.order ?? 0).padStart(3, "0")}_xxxxxx）
            / scope内で重複したら suffix を付与
          </div>
        </form>
      </section>

      <section style={{ border: "1px solid #eee", borderRadius: 12, overflow: "hidden" }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "80px 1.2fr 1fr 140px 220px",
            gap: 0,
            padding: 10,
            fontWeight: 900,
            background: "#fafafa",
          }}
        >
          <div>order</div>
          <div>label</div>
          <div>key</div>
          <div>isActive</div>
          <div>id</div>
        </div>

        {templates.map((t) => {
          const k = String(t.key ?? "").trim();
          return (
            <div
              key={t.id}
              style={{
                display: "grid",
                gridTemplateColumns: "80px 1.2fr 1fr 140px 220px",
                padding: 10,
                borderTop: "1px solid #eee",
                alignItems: "start",
                opacity: k ? 1 : 0.75,
              }}
            >
              <div style={{ fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace" }}>
                {t.order}
              </div>
              <div style={{ fontWeight: 800 }}>{t.label}</div>
              <div style={{ fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace" }}>
                {k ? k : "（未設定）"}
              </div>
              <div>{t.isActive ? "true" : "false"}</div>
              <div style={{ fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace" }}>
                {t.id}
              </div>
            </div>
          );
        })}
      </section>

      <div style={{ fontSize: 12, opacity: 0.8 }}>
        次：Apply画面で「key未設定」が残ってる行は提案値が空になり選択不可になります（事故防止）。
      </div>
    </main>
  );
}
