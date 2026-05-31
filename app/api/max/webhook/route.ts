import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  console.log("[GET]", request.nextUrl.pathname);
  return NextResponse.json({ ok: true });
}
