import { unstable_noStore as noStore } from "next/cache";
import ApplyClient from "./ApplyClient";

export default function ApplyPage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams?: { scope?: string; autorun?: string };
}) {
  noStore();

  const projectId = params.id;
  const scope = typeof searchParams?.scope === "string" ? searchParams.scope : "PPC";
  const autorun = searchParams?.autorun === "1" || searchParams?.autorun === "true";

  return <ApplyClient projectId={projectId} scope={scope} autorun={autorun} />;
}
