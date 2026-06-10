import { NextResponse } from "next/server";

import { findActiveCart } from "@/lib/domain/orders";
import type { MiniAppProvider } from "@/lib/mini-app/types";
import { verifyMiniAppSession } from "@/lib/mini-app/verify/session";

type CartRequestBody = {
  initData?: string;
  provider?: MiniAppProvider;
};

function isMiniAppProvider(provider: unknown): provider is MiniAppProvider {
  return provider === "telegram" || provider === "max";
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as CartRequestBody;

  if (!isMiniAppProvider(body.provider) || !body.initData) {
    return NextResponse.json({ error: "provider and initData are required." }, { status: 400 });
  }

  try {
    const session = verifyMiniAppSession(body.provider, body.initData);

    return NextResponse.json({ cart: customer ? await findActiveCart(customer.id) : null });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Cart request failed." },
      { status: 400 },
    );
  }
}
