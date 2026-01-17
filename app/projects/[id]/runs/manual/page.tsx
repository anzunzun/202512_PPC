import { unstable_noStore as noStore } from "next/cache";
import ManualRunClient from "./ManualRunClient";

export default async function ManualRunPage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams?: { scope?: string };
}) {
  noStore();

  const projectId = params.id;
  const scope = searchParams?.scope ?? "PPC";

  return (
    <main style={{ padding: 20, maxWidth: 980, margin: "0 auto" }}>
      <h1 style={{ fontSize: 28, fontWeight: 900, margin: "0 0 12px 0" }}>
        手動Run作成（manual）
      </h1>
      <p style={{ margin: "0 0 16px 0", color: "#6b7280" }}>
        template.key に対して値（kv）を入力して ResearchRun と RiskScore を保存します。保存後は Apply で反映できます。
      </p>

      <ManualRunClient projectId={projectId} scope={scope} />
    </main>
  );
}
