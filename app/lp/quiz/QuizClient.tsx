"use client";

import { useState, useMemo } from "react";
import { CONFIG, getResultType, type ResultType } from "../config";

const styles: Record<string, React.CSSProperties> = {
  card: {
    background: "#fff",
    borderRadius: 16,
    padding: 24,
    boxShadow: "0 4px 20px rgba(0,0,0,0.15)",
  },
  progressContainer: {
    marginBottom: 20,
  },
  progressText: {
    fontSize: 14,
    color: "#666",
    marginBottom: 8,
  },
  progressBar: {
    height: 8,
    background: "#eee",
    borderRadius: 4,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    background: "linear-gradient(90deg, #667eea, #764ba2)",
    borderRadius: 4,
    transition: "width 0.3s ease",
  },
  questionText: {
    fontSize: 18,
    fontWeight: 600,
    color: "#333",
    marginBottom: 24,
    lineHeight: 1.5,
  },
  buttonGroup: {
    display: "flex",
    flexDirection: "column",
    gap: 12,
  },
  answerBtn: {
    padding: "16px 24px",
    fontSize: 16,
    fontWeight: 600,
    border: "2px solid #667eea",
    borderRadius: 12,
    cursor: "pointer",
    transition: "all 0.2s ease",
    background: "#fff",
    color: "#667eea",
  },
  answerBtnYes: {
    background: "#667eea",
    color: "#fff",
  },
  resultTitle: {
    fontSize: 14,
    color: "#667eea",
    fontWeight: 600,
    marginBottom: 8,
  },
  resultType: {
    fontSize: 24,
    fontWeight: 700,
    color: "#333",
    marginBottom: 16,
  },
  resultDesc: {
    fontSize: 15,
    color: "#555",
    lineHeight: 1.7,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 600,
    color: "#333",
    marginBottom: 12,
    paddingBottom: 8,
    borderBottom: "2px solid #667eea",
  },
  pointsList: {
    listStyle: "none",
    padding: 0,
    margin: "0 0 24px 0",
  },
  pointItem: {
    padding: "8px 0",
    paddingLeft: 24,
    position: "relative",
    fontSize: 14,
    color: "#444",
    lineHeight: 1.6,
  },
  cautionItem: {
    padding: "8px 0",
    paddingLeft: 24,
    position: "relative",
    fontSize: 14,
    color: "#666",
    lineHeight: 1.6,
  },
  ctaButton: {
    display: "block",
    width: "100%",
    padding: "18px 24px",
    fontSize: 16,
    fontWeight: 700,
    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    color: "#fff",
    border: "none",
    borderRadius: 12,
    cursor: "pointer",
    textAlign: "center",
    textDecoration: "none",
    marginTop: 24,
  },
  ctaNote: {
    fontSize: 12,
    color: "#888",
    textAlign: "center",
    marginTop: 12,
  },
  restartBtn: {
    display: "block",
    width: "100%",
    padding: "12px",
    fontSize: 14,
    background: "transparent",
    color: "#667eea",
    border: "1px solid #667eea",
    borderRadius: 8,
    cursor: "pointer",
    marginTop: 16,
  },
};

type Phase = "quiz" | "result";

export default function QuizClient() {
  const [phase, setPhase] = useState<Phase>("quiz");
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});

  const questions = CONFIG.questions;
  const totalQuestions = questions.length;
  const currentQuestion = questions[step];

  const totalScore = useMemo(() => {
    return Object.values(answers).reduce((sum, v) => sum + v, 0);
  }, [answers]);

  const resultTypeKey = useMemo(() => getResultType(totalScore), [totalScore]);
  const result: ResultType = CONFIG.results[resultTypeKey];

  const handleAnswer = (value: number) => {
    const newAnswers = { ...answers, [currentQuestion.id]: value };
    setAnswers(newAnswers);

    if (step + 1 < totalQuestions) {
      setStep(step + 1);
    } else {
      setPhase("result");
    }
  };

  const handleRestart = () => {
    setPhase("quiz");
    setStep(0);
    setAnswers({});
  };

  if (phase === "quiz") {
    const progress = ((step + 1) / totalQuestions) * 100;

    return (
      <div style={styles.card}>
        <div style={styles.progressContainer}>
          <div style={styles.progressText}>
            質問 {step + 1} / {totalQuestions}
          </div>
          <div style={styles.progressBar}>
            <div style={{ ...styles.progressFill, width: `${progress}%` }} />
          </div>
        </div>

        <p style={styles.questionText}>{currentQuestion.text}</p>

        <div style={styles.buttonGroup}>
          <button
            style={{ ...styles.answerBtn, ...styles.answerBtnYes }}
            onClick={() => handleAnswer(1)}
          >
            はい
          </button>
          <button style={styles.answerBtn} onClick={() => handleAnswer(0)}>
            いいえ
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.card}>
      <div style={styles.resultTitle}>あなたの診断結果</div>
      <div style={styles.resultType}>{result.title}</div>
      <p style={styles.resultDesc}>{result.description}</p>

      <div style={styles.sectionTitle}>このタイプに合う条件</div>
      <ul style={styles.pointsList}>
        {result.points.map((point, i) => (
          <li key={i} style={styles.pointItem}>
            &#10003; {point}
          </li>
        ))}
      </ul>

      <div style={styles.sectionTitle}>注意点</div>
      <ul style={styles.pointsList}>
        {result.cautions.map((caution, i) => (
          <li key={i} style={styles.cautionItem}>
            &#9888; {caution}
          </li>
        ))}
      </ul>

      <a
        href={result.ctaUrl}
        target="_blank"
        rel="noopener noreferrer sponsored"
        style={styles.ctaButton}
      >
        {result.ctaText}
      </a>
      <p style={styles.ctaNote}>※ 外部サイトへ移動します</p>

      <button style={styles.restartBtn} onClick={handleRestart}>
        もう一度診断する
      </button>
    </div>
  );
}
