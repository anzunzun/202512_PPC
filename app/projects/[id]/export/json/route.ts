import { NextRequest } from "next/server";
import { buildProjectExportPayload } from "../_lib";

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

    const safeScope = scope.replace(/[^a-zA-Z0-9_-]/g, "_");
    const filename = `project_${projectId}_${safeScope}_items.json`;

    return new Response(JSON.stringify(payload, null, 2), {
      status: 200,
      headers: {
        "content-type": "application/json; charset=utf-8",
        "content-disposition": `attachment; filename="${filename}"`,
        "cache-control": "no-store",
      },
    });
  } catch (e: any) {
    return new Response(
      JSON.stringify(
        { error: e?.message ?? "Export failed" },
        null,
        2
      ),
      {
        status: 400,
        headers: { "content-type": "application/json; charset=utf-8" },
      }
    );
  }
}
