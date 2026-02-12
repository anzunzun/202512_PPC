import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const SETTING_KEY = "global_negative_keywords";

/**
 * GET: グローバル除外キーワード一覧を取得
 */
export async function GET() {
  try {
    const setting = await prisma.appSetting.findUnique({
      where: { key: SETTING_KEY },
    });

    const keywords: string[] = setting?.value
      ? JSON.parse(setting.value)
      : [];

    return NextResponse.json({ keywords });
  } catch (error) {
    console.error("Failed to get negative keywords:", error);
    return NextResponse.json(
      { error: "取得に失敗しました" },
      { status: 500 }
    );
  }
}

/**
 * POST: グローバル除外キーワードを保存
 * body: { keywords: string[] } または { text: string }（改行区切り）
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    let keywords: string[];

    if (Array.isArray(body.keywords)) {
      keywords = body.keywords;
    } else if (typeof body.text === "string") {
      // 改行・カンマ区切りをパース
      keywords = body.text
        .split(/[\n,]/)
        .map((k: string) => k.trim())
        .filter((k: string) => k.length > 0);
    } else {
      return NextResponse.json(
        { error: "keywords または text が必要です" },
        { status: 400 }
      );
    }

    // 重複除去
    keywords = [...new Set(keywords)];

    await prisma.appSetting.upsert({
      where: { key: SETTING_KEY },
      create: { key: SETTING_KEY, value: JSON.stringify(keywords) },
      update: { value: JSON.stringify(keywords) },
    });

    return NextResponse.json({ keywords, count: keywords.length });
  } catch (error) {
    console.error("Failed to save negative keywords:", error);
    return NextResponse.json(
      { error: "保存に失敗しました" },
      { status: 500 }
    );
  }
}
