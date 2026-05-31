import { NextRequest, NextResponse } from "next/server";
import { handleMaxUpdate } from "@/lib/bots/max";
import type { Update } from "@maxhub/max-bot-api/types";

export async function POST(request: NextRequest) {
  const secret = process.env.MAX_WEBHOOK_SECRET;

  if (secret) {
    const requestSecret = request.headers.get("x-max-bot-api-secret");

    if (requestSecret !== secret) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }
  }

  const update = (await request.json()) as Update;

  await handleMaxUpdate(update);

  return NextResponse.json({ ok: true });
}
