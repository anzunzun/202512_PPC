import Link from "next/link";
import { unstable_noStore as noStore } from "next/cache";
import { getProjectsWithRiskScores, getDashboardStats } from "@/app/actions/dashboard";
import DashboardClient from "./DashboardClient";

export default async function DashboardPage() {
  noStore();

  const [projects, stats] = await Promise.all([
    getProjectsWithRiskScores(),
    getDashboardStats(),
  ]);

  return (
    <main style={{ padding: 20, maxWidth: 1200, margin: "0 auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <h1 style={{ margin: 0 }}>ダッシュボード</h1>
        <div style={{ display: "flex", gap: 12 }}>
          <Link href="/projects" style={{ color: "#0066cc" }}>
            プロジェクト一覧
          </Link>
          <Link href="/a8-finder" style={{ color: "#0066cc" }}>
            A8案件管理
          </Link>
        </div>
      </div>

      {/* 統計カード */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 16, marginBottom: 24 }}>
        <StatCard label="総プロジェクト" value={stats.totalProjects} />
        <StatCard label="リスク評価済み" value={stats.projectsWithRiskScore} />
        <StatCard label="高リスク" value={stats.highRiskProjects} color="#ef4444" />
        <StatCard label="競合分析済み" value={stats.projectsWithCompetitorAnalysis} color="#22c55e" />
        <StatCard label="平均リスクスコア" value={stats.avgRiskScore} unit="pt" />
      </div>

      {/* プロジェクト一覧（クライアントコンポーネント） */}
      <DashboardClient projects={projects} />
    </main>
  );
}

function StatCard({
  label,
  value,
  unit,
  color,
}: {
  label: string;
  value: number;
  unit?: string;
  color?: string;
}) {
  return (
    <div
      style={{
        padding: 16,
        background: "#fff",
        border: "1px solid #e5e7eb",
        borderRadius: 12,
        textAlign: "center",
      }}
    >
      <div style={{ fontSize: 12, color: "#666", marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 28, fontWeight: 800, color: color || "#333" }}>
        {value}
        {unit && <span style={{ fontSize: 14, fontWeight: 400 }}>{unit}</span>}
      </div>
    </div>
  );
}
