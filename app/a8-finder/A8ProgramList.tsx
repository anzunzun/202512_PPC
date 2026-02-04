"use client";

import { A8Program } from "@prisma/client";

interface Props {
  programs: A8Program[];
  deleteAction: (id: string) => Promise<void>;
}

function getScoreColor(score: number | null): string {
  if (score === null) return "#999";
  if (score >= 80) return "#22c55e"; // 緑
  if (score >= 60) return "#eab308"; // 黄
  if (score >= 40) return "#f97316"; // オレンジ
  return "#ef4444"; // 赤
}

function getScoreLabel(score: number | null): string {
  if (score === null) return "未計算";
  if (score >= 80) return "優良";
  if (score >= 60) return "良好";
  if (score >= 40) return "普通";
  return "要検討";
}

export default function A8ProgramList({ programs, deleteAction }: Props) {
  if (programs.length === 0) {
    return (
      <p style={{ color: "#666", textAlign: "center", padding: "40px" }}>
        まだ案件が登録されていません
      </p>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
      {programs.map((program) => (
        <div
          key={program.id}
          style={{
            border: "1px solid #e5e5e5",
            borderRadius: "8px",
            padding: "16px",
            background: "white",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div style={{ flex: 1 }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
                <span
                  style={{
                    display: "inline-block",
                    padding: "2px 8px",
                    background: "#f0f0f0",
                    borderRadius: "4px",
                    fontSize: "11px",
                    color: "#666",
                  }}
                >
                  {program.category}
                </span>
                <h3 style={{ margin: 0, fontSize: "16px" }}>{program.programName}</h3>
              </div>

              <div style={{ display: "flex", gap: "16px", fontSize: "13px", color: "#666" }}>
                <span>
                  報酬: <strong style={{ color: "#333" }}>
                    {program.reward.toLocaleString()}円
                    {program.rewardType === "percent" && "（定率）"}
                  </strong>
                </span>
                <span>
                  承認率: <strong style={{ color: "#333" }}>
                    {program.approvalRate !== null ? `${program.approvalRate}%` : "-"}
                  </strong>
                </span>
                <span>
                  EPC: <strong style={{ color: "#333" }}>
                    {program.epc !== null ? `${program.epc}円` : "-"}
                  </strong>
                </span>
                {program.cookieDays && (
                  <span>
                    Cookie: <strong style={{ color: "#333" }}>{program.cookieDays}日</strong>
                  </span>
                )}
              </div>

              {program.notes && (
                <p style={{ margin: "8px 0 0", fontSize: "12px", color: "#888" }}>
                  {program.notes}
                </p>
              )}
            </div>

            <div style={{ textAlign: "center", marginLeft: "16px" }}>
              <div
                style={{
                  width: "60px",
                  height: "60px",
                  borderRadius: "50%",
                  background: getScoreColor(program.profitScore),
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "white",
                  fontWeight: "bold",
                  fontSize: "20px",
                }}
              >
                {program.profitScore ?? "-"}
              </div>
              <span style={{ fontSize: "11px", color: getScoreColor(program.profitScore) }}>
                {getScoreLabel(program.profitScore)}
              </span>
            </div>
          </div>

          <div style={{ marginTop: "12px", display: "flex", gap: "8px" }}>
            {program.lpUrl && (
              <a
                href={program.lpUrl}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  fontSize: "12px",
                  color: "#0066cc",
                  textDecoration: "none",
                }}
              >
                LP確認 →
              </a>
            )}
            <form
              action={async () => {
                if (confirm("この案件を削除しますか？")) {
                  await deleteAction(program.id);
                }
              }}
              style={{ marginLeft: "auto" }}
            >
              <button
                type="submit"
                style={{
                  background: "none",
                  border: "none",
                  color: "#999",
                  fontSize: "12px",
                  cursor: "pointer",
                }}
              >
                削除
              </button>
            </form>
          </div>
        </div>
      ))}
    </div>
  );
}
