import { sdk } from "@/lib/cms/payload-sdk";
import type { Order } from "@/payload-types";

export async function findOrderByPublicToken(token: string, init?: RequestInit) {
  const result = await sdk.find(
    {
      collection: "orders",
      depth: 2,
      limit: 1,
      where: {
        publicToken: {
          equals: token,
        },
      },
    },
    init,
  );

  const order = result.docs[0] as Order | undefined;

  if (!order) {
    return null;
  }

  if (order.expiresAt && new Date(order.expiresAt) < new Date()) {
    return null;
  }

  return order;
}

export async function updateOrderStatus(
  id: Order["id"],
  status: Order["status"],
  init?: RequestInit,
) {
  return sdk.update(
    {
      collection: "orders",
      id,
      data: {
        status,
      },
    },
    init,
  );
}

export async function updateOrderDelivery(
  id: Order["id"],
  delivery: Partial<NonNullable<Order["delivery"]>>,
  init?: RequestInit,
) {
  return sdk.update(
    {
      collection: "orders",
      id,
      data: {
        delivery,
      },
    },
    init,
  );
}

export async function updateOrderPayment(
  id: Order["id"],
  payment: Partial<NonNullable<Order["payment"]>>,
  init?: RequestInit,
) {
  return sdk.update(
    {
      collection: "orders",
      id,
      data: {
        payment,
      },
    },
    init,
  );
}

export async function cancelOrder(id: Order["id"], init?: RequestInit) {
  return sdk.update(
    {
      collection: "orders",
      id,
      data: {
        cancelledAt: new Date().toISOString(),
        status: "cancelled",
      },
    },
    init,
  );
}

export async function markOrderAsPaid(id: Order["id"], init?: RequestInit) {
  return sdk.update(
    {
      collection: "orders",
      id,
      data: {
        paidAt: new Date().toISOString(),
        payment: {
          status: "paid",
        },
        status: "paid",
      },
    },
    init,
  );
}

export async function submitOrder(id: Order["id"], init?: RequestInit) {
  return sdk.update(
    {
      collection: "orders",
      id,
      data: {
        status: "submitted",
        submittedAt: new Date().toISOString(),
      },
    },
    init,
  );
}

export async function deleteOrder(id: Order["id"], init?: RequestInit) {
  return sdk.delete(
    {
      collection: "orders",
      id,
    },
    init,
  );
}

export async function countCustomerOrders(customerID: Order["customer"], init?: RequestInit) {
  return sdk.count(
    {
      collection: "orders",
      where: {
        customer: {
          equals: typeof customerID === "object" ? customerID.id : customerID,
        },
      },
    },
    init,
  );
}
