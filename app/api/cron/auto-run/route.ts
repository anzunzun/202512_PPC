import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { runResearchProjectAction } from "@/app/actions/research";

// Cron secret for security (set in environment variables)
const CRON_SECRET = process.env.CRON_SECRET || "dev-secret";

export async function GET(request: NextRequest) {
  // Verify cron secret
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await executeAutoRun();
    return NextResponse.json(result);
  } catch (error) {
    console.error("Auto-run error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Auto-run failed" },
      { status: 500 }
    );
  }
}

// POST method for manual trigger
export async function POST(request: NextRequest) {
  // Verify cron secret
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json().catch(() => ({}));
    const { projectIds } = body as { projectIds?: string[] };

    const result = await executeAutoRun(projectIds);
    return NextResponse.json(result);
  } catch (error) {
    console.error("Auto-run error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Auto-run failed" },
      { status: 500 }
    );
  }
}

async function executeAutoRun(specificProjectIds?: string[]) {
  const startTime = Date.now();

  // Get auto-run settings
  const autoRunSetting = await prisma.appSetting.findUnique({
    where: { key: "autoRunEnabled" },
  });
  const isEnabled = autoRunSetting?.value === "true";

  if (!isEnabled && !specificProjectIds) {
    return {
      success: true,
      message: "Auto-run is disabled",
      projectsProcessed: 0,
      durationMs: Date.now() - startTime,
    };
  }

  // Get projects to process
  let projectsToRun;
  if (specificProjectIds) {
    projectsToRun = await prisma.researchProject.findMany({
      where: { id: { in: specificProjectIds } },
      include: {
        researchRuns: {
          orderBy: { startedAt: "desc" },
          take: 1,
        },
      },
    });
  } else {
    // Get interval setting (default: 24 hours)
    const intervalSetting = await prisma.appSetting.findUnique({
      where: { key: "autoRunIntervalHours" },
    });
    const intervalHours = parseInt(intervalSetting?.value || "24", 10);
    const cutoffDate = new Date(Date.now() - intervalHours * 60 * 60 * 1000);

    // Find projects that haven't been run recently
    const allProjects = await prisma.researchProject.findMany({
      include: {
        researchRuns: {
          orderBy: { startedAt: "desc" },
          take: 1,
        },
      },
    });

    projectsToRun = allProjects.filter(p => {
      const lastRun = p.researchRuns[0];
      // No run yet, or last run is older than interval
      return !lastRun || lastRun.startedAt < cutoffDate;
    });
  }

  // Limit to 10 projects per run to avoid timeout
  const maxProjectsPerRun = 10;
  const projectsToProcess = projectsToRun.slice(0, maxProjectsPerRun);

  const results: { projectId: string; success: boolean; error?: string }[] = [];

  for (const project of projectsToProcess) {
    try {
      // Run research using the server action
      const result = await runResearchProjectAction({
        projectId: project.id,
        scope: "PPC",
        provider: "ppc",
      });

      if (result.status === "ok") {
        results.push({ projectId: project.id, success: true });
      } else {
        results.push({
          projectId: project.id,
          success: false,
          error: result.errorMessage || "Research failed",
        });
      }
    } catch (error) {
      results.push({
        projectId: project.id,
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  const successCount = results.filter(r => r.success).length;
  const failCount = results.filter(r => !r.success).length;

  // Log auto-run execution
  await prisma.appSetting.upsert({
    where: { key: "lastAutoRunAt" },
    update: { value: new Date().toISOString() },
    create: { key: "lastAutoRunAt", value: new Date().toISOString() },
  });

  return {
    success: true,
    message: `Auto-run completed: ${successCount} success, ${failCount} failed`,
    projectsProcessed: results.length,
    projectsRemaining: projectsToRun.length - projectsToProcess.length,
    results,
    durationMs: Date.now() - startTime,
  };
}
