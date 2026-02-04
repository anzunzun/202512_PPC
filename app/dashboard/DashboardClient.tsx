"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import type { ProjectWithRiskScore } from "@/app/actions/dashboard";

type SortKey = "genre" | "totalScore" | "adPolicy" | "trademark" | "bridgePage" | "updatedAt";
type SortOrder = "asc" | "desc";
type FilterLevel = "all" | "high" | "medium" | "low" | "none";

export default function DashboardClient({ projects }: { projects: ProjectWithRiskScore[] }) {
  const [sortKey, setSortKey] = useState<SortKey>("totalScore");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");
  const [filterLevel, setFilterLevel] = useState<FilterLevel>("all");
  const [searchTerm, setSearchTerm] = useState("");

  const filteredAndSorted = useMemo(() => {
    let result = [...projects];

    // フィルタリング
    if (filterLevel !== "all") {
      result = result.filter(p => {
        if (!p.riskScore) return filterLevel === "none";
        const score = p.riskScore.totalScore;
        if (filterLevel === "high") return score >= 50;
        if (filterLevel === "medium") return score >= 25 && score < 50;
        if (filterLevel === "low") return score < 25;
        return false;
      });
    }

    // 検索
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(p =>
        p.genre.toLowerCase().includes(term) ||
        p.id.toLowerCase().includes(term)
      );
    }

    // ソート
    result.sort((a, b) => {
      let aVal: number | string | Date = 0;
      let bVal: number | string | Date = 0;

      switch (sortKey) {
        case "genre":
          aVal = a.genre;
          bVal = b.genre;
          break;
        case "totalScore":
          aVal = a.riskScore?.totalScore ?? -1;
          bVal = b.riskScore?.totalScore ?? -1;
          break;
        case "adPolicy":
          aVal = a.riskScore?.adPolicyRisk ?? -1;
          bVal = b.riskScore?.adPolicyRisk ?? -1;
          break;
        case "trademark":
          aVal = a.riskScore?.trademarkRisk ?? -1;
          bVal = b.riskScore?.trademarkRisk ?? -1;
          break;
        case "bridgePage":
          aVal = a.riskScore?.bridgePageRisk ?? -1;
          bVal = b.riskScore?.bridgePageRisk ?? -1;
          break;
        case "updatedAt":
          aVal = a.updatedAt;
          bVal = b.updatedAt;
          break;
      }

      if (aVal < bVal) return sortOrder === "asc" ? -1 : 1;
      if (aVal > bVal) return sortOrder === "asc" ? 1 : -1;
      return 0;
    });

    return result;
  }, [projects, sortKey, sortOrder, filterLevel, searchTerm]);

  function handleSort(key: SortKey) {
    if (sortKey === key) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key);
      setSortOrder("desc");
    }
  }

  const getSortIndicator = (key: SortKey) => {
    if (sortKey !== key) return "";
    return sortOrder === "asc" ? " ▲" : " ▼";
  };

  return (
    <div>
      {/* フィルター・検索 */}
      <div style={{ display: "flex", gap: 16, marginBottom: 16, flexWrap: "wrap" }}>
        <div>
          <label style={{ fontSize: 12, color: "#666", marginRight: 8 }}>リスクレベル:</label>
          <select
            value={filterLevel}
            onChange={e => setFilterLevel(e.target.value as FilterLevel)}
            style={{ padding: "6px 12px", borderRadius: 6, border: "1px solid #ddd" }}
          >
            <option value="all">すべて</option>
            <option value="high">高リスク (50+)</option>
            <option value="medium">中リスク (25-49)</option>
            <option value="low">低リスク (0-24)</option>
            <option value="none">未評価</option>
          </select>
        </div>
        <div>
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="プロジェクト検索..."
            style={{ padding: "6px 12px", borderRadius: 6, border: "1px solid #ddd", width: 200 }}
          />
        </div>
        <div style={{ marginLeft: "auto", fontSize: 13, color: "#666" }}>
          {filteredAndSorted.length} / {projects.length} 件
        </div>
      </div>

      {/* テーブル */}
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", border: "1px solid #e5e7eb" }}>
          <thead>
            <tr style={{ background: "#f9fafb" }}>
              <Th onClick={() => handleSort("genre")}>プロジェクト{getSortIndicator("genre")}</Th>
              <Th onClick={() => handleSort("totalScore")} align="center">総合リスク{getSortIndicator("totalScore")}</Th>
              <Th onClick={() => handleSort("adPolicy")} align="center">広告ポリシー{getSortIndicator("adPolicy")}</Th>
              <Th onClick={() => handleSort("trademark")} align="center">商標{getSortIndicator("trademark")}</Th>
              <Th onClick={() => handleSort("bridgePage")} align="center">ブリッジ{getSortIndicator("bridgePage")}</Th>
              <Th align="center">競合分析</Th>
              <Th onClick={() => handleSort("updatedAt")} align="center">更新日{getSortIndicator("updatedAt")}</Th>
              <Th align="center">操作</Th>
            </tr>
          </thead>
          <tbody>
            {filteredAndSorted.length === 0 ? (
              <tr>
                <td colSpan={8} style={{ padding: 20, textAlign: "center", color: "#666" }}>
                  該当するプロジェクトがありません
                </td>
              </tr>
            ) : (
              filteredAndSorted.map(p => (
                <tr key={p.id} style={{ borderBottom: "1px solid #e5e7eb" }}>
                  <Td>
                    <Link href={`/projects/${p.id}`} style={{ color: "#0066cc", fontWeight: 600 }}>
                      {p.genre || "(未設定)"}
                    </Link>
                    <div style={{ fontSize: 11, color: "#999" }}>{p.id.slice(0, 8)}...</div>
                  </Td>
                  <Td align="center">
                    {p.riskScore ? (
                      <RiskBadge score={p.riskScore.totalScore} />
                    ) : (
                      <span style={{ color: "#999", fontSize: 12 }}>未評価</span>
                    )}
                  </Td>
                  <Td align="center">
                    {p.riskScore ? (
                      <ScoreCell score={p.riskScore.adPolicyRisk} />
                    ) : (
                      <span style={{ color: "#ccc" }}>-</span>
                    )}
                  </Td>
                  <Td align="center">
                    {p.riskScore ? (
                      <ScoreCell score={p.riskScore.trademarkRisk} />
                    ) : (
                      <span style={{ color: "#ccc" }}>-</span>
                    )}
                  </Td>
                  <Td align="center">
                    {p.riskScore ? (
                      <ScoreCell score={p.riskScore.bridgePageRisk} />
                    ) : (
                      <span style={{ color: "#ccc" }}>-</span>
                    )}
                  </Td>
                  <Td align="center">
                    {p.competitorAnalysisCount > 0 ? (
                      <span style={{ color: "#22c55e", fontWeight: 600 }}>{p.competitorAnalysisCount}件</span>
                    ) : (
                      <span style={{ color: "#ccc" }}>-</span>
                    )}
                  </Td>
                  <Td align="center">
                    <span style={{ fontSize: 12, color: "#666" }}>
                      {new Date(p.updatedAt).toLocaleDateString("ja-JP")}
                    </span>
                  </Td>
                  <Td align="center">
                    <div style={{ display: "flex", gap: 8, justifyContent: "center" }}>
                      <Link
                        href={`/projects/${p.id}/apply?scope=PPC&autorun=1`}
                        style={{
                          padding: "4px 8px",
                          background: "#eff6ff",
                          border: "1px solid #bfdbfe",
                          borderRadius: 4,
                          fontSize: 11,
                          color: "#1e40af",
                          textDecoration: "none",
                        }}
                      >
                        Run
                      </Link>
                      <Link
                        href={`/projects/${p.id}/competitor-analysis`}
                        style={{
                          padding: "4px 8px",
                          background: "#fef3c7",
                          border: "1px solid #fcd34d",
                          borderRadius: 4,
                          fontSize: 11,
                          color: "#92400e",
                          textDecoration: "none",
                        }}
                      >
                        競合
                      </Link>
                    </div>
                  </Td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Th({
  children,
  onClick,
  align = "left",
}: {
  children: React.ReactNode;
  onClick?: () => void;
  align?: "left" | "center" | "right";
}) {
  return (
    <th
      onClick={onClick}
      style={{
        padding: "12px 10px",
        textAlign: align,
        fontSize: 12,
        fontWeight: 600,
        cursor: onClick ? "pointer" : "default",
        userSelect: "none",
        borderBottom: "1px solid #e5e7eb",
      }}
    >
      {children}
    </th>
  );
}

function Td({
  children,
  align = "left",
}: {
  children: React.ReactNode;
  align?: "left" | "center" | "right";
}) {
  return (
    <td style={{ padding: "12px 10px", textAlign: align, fontSize: 13 }}>
      {children}
    </td>
  );
}

function RiskBadge({ score }: { score: number }) {
  const color = score >= 50 ? "#ef4444" : score >= 25 ? "#f59e0b" : "#22c55e";
  const bg = score >= 50 ? "#fef2f2" : score >= 25 ? "#fffbeb" : "#f0fdf4";
  const label = score >= 50 ? "高" : score >= 25 ? "中" : "低";

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 4,
        padding: "4px 10px",
        background: bg,
        borderRadius: 20,
        fontSize: 12,
        fontWeight: 700,
        color,
      }}
    >
      <span style={{ fontSize: 14 }}>{score}</span>
      <span style={{ fontSize: 10 }}>{label}</span>
    </span>
  );
}

function ScoreCell({ score }: { score: number }) {
  const color = score >= 50 ? "#ef4444" : score >= 25 ? "#f59e0b" : "#22c55e";
  return <span style={{ color, fontWeight: 600 }}>{score}</span>;
}
