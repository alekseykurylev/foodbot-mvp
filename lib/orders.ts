import { getPayloadSDK } from "@/lib/payload-sdk";
import type { Order } from "@/payload-types";

export type PublicCartOrder = Pick<
  Order,
  | "id"
  | "orderNumber"
  | "status"
  | "source"
  | "channel"
  | "items"
  | "totals"
  | "delivery"
  | "expiresAt"
  | "createdAt"
  | "updatedAt"
> & {
  ai?: Pick<NonNullable<Order["ai"]>, "explanation">;
  payment?: Pick<NonNullable<Order["payment"]>, "method" | "status">;
};

export async function getPublicCartOrder(token: string) {
  const response = await getPayloadSDK().request({
    method: "GET",
    path: `/orders/cart/${encodeURIComponent(token)}`,
  });

  if (response.status === 404 || response.status === 410) {
    return null;
  }

  if (!response.ok) {
    throw new Error("Failed to load cart order");
  }

  return (await response.json()) as PublicCartOrder;
}
