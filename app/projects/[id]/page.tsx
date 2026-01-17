import Link from "next/link";
import { unstable_noStore as noStore } from "next/cache";
import ResearchItemsEditor from "./ResearchItemsEditor";
import { getProjectResearchItems } from "@/app/actions/researchItems";

export default async function ProjectDetailPage({
  params,
}: {
  params: { id: string };
}) {
  noStore();

  const id = params.id;
  const scope = "PPC";

  // ★ isActive=true のテンプレだけ + 新方式値を合体した正しい入力行を作る
  const initialItems = await getProjectResearchItems(id, scope);

  return (
    <main style={{ padding: 18, maxWidth: 1100, margin: "0 auto" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "baseline",
          gap: 12,
          flexWrap: "wrap",
        }}
      >
        <div>
          <h1 style={{ fontSize: 28, margin: 0 }}>プロジェクト詳細</h1>
          <div style={{ color: "#666", fontSize: 12, marginTop: 6 }}>
            projectId: {id} / scope: {scope}
          </div>
        </div>

        <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
          <Link href="/projects" style={{ color: "blue", textDecoration: "underline" }}>
            一覧へ戻る
          </Link>
          <Link
            href={`/projects/${id}/apply`}
            style={{ color: "blue", textDecoration: "underline" }}
          >
            Apply（autorun）
          </Link>
          <Link
            href={`/projects/${id}/runs`}
            style={{ color: "blue", textDecoration: "underline" }}
          >
            Run履歴
          </Link>
          <Link
            href={`/projects/${id}/export`}
            style={{ color: "blue", textDecoration: "underline" }}
          >
            Export
          </Link>
          <Link
            href={`/templates/keys?scope=${scope}`}
            style={{ color: "blue", textDecoration: "underline" }}
          >
            テンプレkey
          </Link>
        </div>
      </div>

      <div style={{ marginTop: 18 }}>
        <ResearchItemsEditor {...({ projectId: id, initialItems } as any)} />
      </div>
    </main>
  );
}
