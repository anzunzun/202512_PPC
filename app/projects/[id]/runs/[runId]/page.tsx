import Link from "next/link";
import { notFound } from "next/navigation";
import { unstable_noStore as noStore } from "next/cache";

import { getProject } from "@/app/actions/project";
import { getResearchRun } from "@/app/actions/researchRuns";

export default async function ProjectRunDetailPage({
  params,
}: {
  params: { id: string; runId: string };
}) {
  noStore();

  const projectId = params.id;
  const runId = params.runId;

  const project = await getProject(projectId);
  if (!project) notFound();

  const run = await getResearchRun({ projectId, runId });
  if (!run) notFound();

  return (
    <main style={{ padding: 20, maxWidth: 980, margin: "0 auto", display: "grid", gap: 12 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 12 }}>
        <h1 style={{ fontSize: 28, fontWeight: 900, margin: 0 }}>Run詳細</h1>
        <div style={{ display: "flex", gap: 12 }}>
          <Link href={`/projects/${projectId}/runs`} style={{ textDecoration: "underline", fontWeight: 800 }}>
            履歴へ戻る
          </Link>
          <Link href={`/projects/${projectId}/apply?scope=PPC&autorun=1`} style={{ textDecoration: "underline", fontWeight: 800 }}>
            Run⇒反映へ
          </Link>
          <Link href={`/projects/${projectId}`} style={{ textDecoration: "underline", fontWeight: 800 }}>
            詳細へ戻る
          </Link>
        </div>
      </div>

      <div style={{ border: "1px solid #e5e7eb", borderRadius: 12, padding: 12, background: "#fff" }}>
        <div style={{ display: "grid", gap: 6 }}>
          <div><b>id:</b> {run.id}</div>
          <div><b>status:</b> {run.status}</div>
          <div><b>scope:</b> {run.scope}</div>
          <div><b>provider:</b> {run.provider}</div>
          <div><b>startedAt:</b> {new Date(run.startedAt).toLocaleString("ja-JP")}</div>
          <div><b>finishedAt:</b> {run.finishedAt ? new Date(run.finishedAt).toLocaleString("ja-JP") : "-"}</div>
          <div><b>duration:</b> {run.durationMs != null ? `${run.durationMs}ms` : "-"}</div>
          {run.errorMessage ? (
            <div style={{ color: "#991b1b", fontWeight: 900 }}>
              <b>error:</b> {run.errorMessage}
            </div>
          ) : null}
        </div>
      </div>

      <div style={{ border: "1px solid #e5e7eb", borderRadius: 12, padding: 12, background: "#fff" }}>
        <h2 style={{ margin: "0 0 8px 0" }}>resultJson</h2>
        <pre style={{ margin: 0, whiteSpace: "pre-wrap" }}>
{JSON.stringify(run.resultJson ?? null, null, 2)}
        </pre>
      </div>
    </main>
  );
}

