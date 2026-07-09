"use server";

import { getPayloadLocal } from "@/common/cms/payload-local";
import type { Order } from "@/payload-types";

type CustomerID = Order["customer"];

export async function findActiveCart(customerID: CustomerID) {
  const payload = await getPayloadLocal();
  const id = typeof customerID === "object" ? customerID.id : customerID;

  const result = await payload.find({
    collection: "orders",
    depth: 2,
    limit: 1,
    overrideAccess: true,
    sort: "-updatedAt",
    where: {
      and: [{ customer: { equals: id } }, { status: { equals: "cart" } }],
    },
  });

  return (result.docs[0] as Order | undefined) ?? null;
}
