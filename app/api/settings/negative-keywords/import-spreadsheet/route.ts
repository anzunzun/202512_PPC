import { NextRequest, NextResponse } from "next/server";

/**
 * POST: スプレッドシートURLからキーワードをインポート
 * body: { url: string, column?: number }
 *
 * 対応形式:
 * - Google Sheets公開URL
 * - CSV直接URL
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { url, column = 0 } = body;

    if (!url || typeof url !== "string") {
      return NextResponse.json(
        { error: "URLが必要です" },
        { status: 400 }
      );
    }

    // Google SheetsのURLをCSVエクスポート形式に変換
    let csvUrl = url;

    // https://docs.google.com/spreadsheets/d/{ID}/edit... の形式を検出
    const sheetIdMatch = url.match(
      /docs\.google\.com\/spreadsheets\/d\/([a-zA-Z0-9_-]+)/
    );

    if (sheetIdMatch) {
      const sheetId = sheetIdMatch[1];
      // gidパラメータがあれば取得（特定シート指定）
      const gidMatch = url.match(/gid=(\d+)/);
      const gid = gidMatch ? gidMatch[1] : "0";
      csvUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv&gid=${gid}`;
    }

    // CSVを取得
    const response = await fetch(csvUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; KeywordImporter/1.0)",
      },
    });

    if (!response.ok) {
      return NextResponse.json(
        {
          error: `スプレッドシートの取得に失敗しました (${response.status})。公開設定を確認してください。`,
          hint: "Google Sheetsの場合: ファイル → 共有 → 「リンクを知っている全員」に設定してください"
        },
        { status: 400 }
      );
    }

    const csvText = await response.text();

    // CSVをパース（シンプルな実装、引用符対応）
    const keywords = parseCSV(csvText, column);

    if (keywords.length === 0) {
      return NextResponse.json(
        { error: "キーワードが見つかりませんでした。列番号を確認してください。" },
        { status: 400 }
      );
    }

    return NextResponse.json({
      keywords,
      count: keywords.length,
      sourceUrl: csvUrl
    });
  } catch (error) {
    console.error("Failed to import from spreadsheet:", error);
    return NextResponse.json(
      { error: "インポートに失敗しました: " + (error instanceof Error ? error.message : "不明なエラー") },
      { status: 500 }
    );
  }
}

/**
 * シンプルなCSVパーサー
 */
function parseCSV(csv: string, columnIndex: number): string[] {
  const lines = csv.split(/\r?\n/);
  const keywords: string[] = [];

  for (const line of lines) {
    if (!line.trim()) continue;

    // シンプルなCSV分割（引用符内のカンマは考慮）
    const columns = parseCSVLine(line);

    if (columns.length > columnIndex) {
      const value = columns[columnIndex].trim();
      // ヘッダー行っぽいものはスキップ
      if (value && !isHeaderLike(value)) {
        keywords.push(value);
      }
    }
  }

  // 重複除去
  return [...new Set(keywords)];
}

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === "," && !inQuotes) {
      result.push(current);
      current = "";
    } else {
      current += char;
    }
  }

  result.push(current);
  return result;
}

function isHeaderLike(value: string): boolean {
  const lowerValue = value.toLowerCase();
  const headerPatterns = [
    "keyword",
    "キーワード",
    "除外",
    "negative",
    "word",
    "term",
    "phrase",
  ];
  return headerPatterns.some(p => lowerValue === p || lowerValue.includes(p + "s"));
}
