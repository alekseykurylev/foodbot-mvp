import { NextResponse } from "next/server";
import { verifyTelegramInitData } from "@/lib/mini-app/verify/telegram";

export async function POST(request: Request) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const body = (await request.json().catch(() => ({}))) as { initData?: string };

  if (!token) {
    return NextResponse.json({ error: "TELEGRAM_BOT_TOKEN is not set" }, { status: 500 });
  }

  if (!body.initData) {
    return NextResponse.json({ error: "initData is required" }, { status: 400 });
  }

  try {
    return NextResponse.json({ session: verifyTelegramInitData(body.initData, token) });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Invalid initData" },
      { status: 401 },
    );
  }
}
