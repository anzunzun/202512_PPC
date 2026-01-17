import { NextRequest } from "next/server";
import { buildProjectExportPayload, payloadToCsv } from "../_lib";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  ctx: { params: { id: string } }
) {
  const projectId = ctx.params.id;
  const scope = req.nextUrl.searchParams.get("scope") ?? "PPC";
  const includeInactive = req.nextUrl.searchParams.get("includeInactive") === "1";

  try {
    const payload = await buildProjectExportPayload({
      projectId,
      scope,
      includeInactiveTemplates: includeInactive,
    });

    const csv = payloadToCsv(payload);

    const safeScope = scope.replace(/[^a-zA-Z0-9_-]/g, "_");
    const filename = `project_${projectId}_${safeScope}_items.csv`;

    return new Response(csv, {
      status: 200,
      headers: {
        "content-type": "text/csv; charset=utf-8",
        "content-disposition": `attachment; filename="${filename}"`,
        "cache-control": "no-store",
      },
    });
  } catch (e: any) {
    return new Response(`Export failed: ${e?.message ?? "unknown error"}`, {
      status: 400,
      headers: { "content-type": "text/plain; charset=utf-8" },
    });
  }
}
