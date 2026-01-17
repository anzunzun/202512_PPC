import Link from "next/link";
import { notFound } from "next/navigation";
import { unstable_noStore as noStore } from "next/cache";

import { getProject } from "@/app/actions/project";
import { getResearchRuns } from "@/app/actions/researchRuns";

export default async function ProjectRunsPage({
  params,
}: {
  params: { id: string };
}) {
  noStore();

  const projectId = params.id;
  const project = await getProject(projectId);
  if (!project) notFound();

  const runs = await getResearchRuns({ projectId, take: 30 });

  return (
    <main style={{ padding: 20, maxWidth: 980, margin: "0 auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 12 }}>
        <h1 style={{ fontSize: 32, fontWeight: 900, margin: 0 }}>Run履歴</h1>
        <div style={{ display: "flex", gap: 12 }}>
          <Link href={`/projects/${projectId}`} style={{ textDecoration: "underline", fontWeight: 800 }}>
            詳細へ戻る
          </Link>
          <Link href={`/projects/${projectId}/apply?scope=PPC&autorun=1`} style={{ textDecoration: "underline", fontWeight: 800 }}>
            Run⇒反映へ
          </Link>
        </div>
      </div>

      <p style={{ color: "#6b7280" }}>
        本物リサーチにした瞬間、ここがデバッグの生命線になる。
      </p>

      <div style={{ border: "1px solid #e5e7eb", borderRadius: 12, overflow: "hidden" }}>
        <div style={{ display: "grid", gridTemplateColumns: "220px 90px 110px 110px 1fr", padding: 10, fontWeight: 900, background: "#fafafa" }}>
          <div>startedAt</div>
          <div>status</div>
          <div>scope</div>
          <div>duration</div>
          <div>link</div>
        </div>

        {runs.map((r) => (
          <div
            key={r.id}
            style={{ display: "grid", gridTemplateColumns: "220px 90px 110px 110px 1fr", padding: 10, borderTop: "1px solid #e5e7eb" }}
          >
            <div>{new Date(r.startedAt).toLocaleString("ja-JP")}</div>
            <div style={{ fontWeight: 900 }}>{r.status}</div>
            <div>{r.scope}</div>
            <div>{r.durationMs != null ? `${r.durationMs}ms` : "-"}</div>
            <div>
              <Link href={`/projects/${projectId}/runs/${r.id}`} style={{ textDecoration: "underline", fontWeight: 800 }}>
                詳細
              </Link>
            </div>
          </div>
        ))}

        {runs.length === 0 && (
          <div style={{ padding: 12, color: "#6b7280" }}>まだRun履歴がありません。</div>
        )}
      </div>
    </main>
  );
}
