import { NextResponse } from "next/server";

import {
  addCartItem,
  applyAiSuggestionToCart,
  findActiveCart,
  removeCartItem,
  submitActiveCart,
  updateCartItemQuantity,
} from "@/lib/domain/orders";
import { upsertBotCustomer } from "@/lib/domain/customers";
import { verifyMiniAppSession } from "@/lib/mini-app/verify/session";
import type { MiniAppProvider, MiniAppSession } from "@/lib/mini-app/types";
import type { Order } from "@/payload-types";

type CartRequestBody = {
  action?: "add" | "apply_ai_suggestion" | "get" | "remove" | "submit" | "update";
  ai?: Order["ai"];
  comment?: null | string;
  delivery?: Partial<NonNullable<Order["delivery"]>>;
  initData?: string;
  items?: CartRequestItem[];
  mode?: "append" | "replace";
  payment?: Partial<NonNullable<Order["payment"]>>;
  product?: number;
  productId?: number;
  provider?: MiniAppProvider;
  quantity?: number;
};

type CartRequestItem = {
  comment?: null | string;
  product?: number;
  productId?: number;
  quantity?: number;
};

function getDisplayName(session: MiniAppSession) {
  return [session.user.firstName, session.user.lastName].filter(Boolean).join(" ");
}

async function upsertMiniAppCustomer(session: MiniAppSession) {
  const displayName = getDisplayName(session);

  if (session.provider === "telegram") {
    return upsertBotCustomer({
      channel: "telegram",
      displayName,
      telegramUserId: session.user.id,
      telegramUsername: session.user.username,
    });
  }

  return upsertBotCustomer({
    channel: "max",
    displayName,
    maxFirstName: session.user.firstName,
    maxLastName: session.user.lastName,
    maxUserId: session.user.id,
  });
}

function getProductID(input: CartRequestBody | CartRequestItem) {
  const productID = input.productId ?? input.product;

  if (!productID) {
    throw new Error("productId is required.");
  }

  return productID;
}

function getRequestItems(body: CartRequestBody) {
  if (!body.items?.length) {
    throw new Error("items are required.");
  }

  return body.items.map((item) => ({
    comment: item.comment,
    product: getProductID(item),
    quantity: item.quantity,
  }));
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as CartRequestBody;

  if (!body.provider || !body.initData) {
    return NextResponse.json(
      { error: "provider and initData are required." },
      { status: 400 },
    );
  }

  try {
    const session = verifyMiniAppSession(body.provider, body.initData);
    const customer = await upsertMiniAppCustomer(session);

    switch (body.action) {
      case "get":
        return NextResponse.json({ cart: await findActiveCart(customer.id) });

      case "add":
        return NextResponse.json({
          cart: await addCartItem(
            customer.id,
            {
              comment: body.comment,
              product: getProductID(body),
              quantity: body.quantity,
            },
            {
              channel: "mini_app",
              lastEditedBy: "customer",
              source: "manual",
            },
          ),
        });

      case "update":
        return NextResponse.json({
          cart: await updateCartItemQuantity(
            customer.id,
            getProductID(body),
            Number(body.quantity ?? 1),
            {
              channel: "mini_app",
              lastEditedBy: "customer",
              source: "manual",
            },
          ),
        });

      case "remove":
        return NextResponse.json({
          cart: await removeCartItem(customer.id, getProductID(body), {
            channel: "mini_app",
            lastEditedBy: "customer",
            source: "manual",
          }),
        });

      case "apply_ai_suggestion":
        if (body.mode !== "append" && body.mode !== "replace") {
          return NextResponse.json(
            { error: "mode must be append or replace." },
            { status: 400 },
          );
        }

        return NextResponse.json({
          cart: await applyAiSuggestionToCart(customer.id, getRequestItems(body), body.mode, {
            ai: body.ai,
            channel: "mini_app",
          }),
        });

      case "submit":
        return NextResponse.json({
          order: await submitActiveCart(customer.id, {
            delivery: body.delivery,
            payment: body.payment,
          }),
        });

      default:
        return NextResponse.json({ error: "Unknown cart action." }, { status: 400 });
    }
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Cart request failed." },
      { status: 400 },
    );
  }
}
