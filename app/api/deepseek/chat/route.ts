import { NextResponse } from "next/server";
import { askDeepSeek } from "@/lib/deepseek";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as { text?: string };

  if (!body.text) {
    return NextResponse.json({ error: "text is required" }, { status: 400 });
  }

  try {
    return NextResponse.json({ answer: await askDeepSeek(body.text) });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "DeepSeek request failed" },
      { status: 500 },
    );
  }
}
