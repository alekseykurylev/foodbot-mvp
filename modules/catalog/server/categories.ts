"use server";

import { getPayloadLocal } from "@/common/cms/payload-local";
import type { Category } from "@/payload-types";

export async function getActiveCategories(): Promise<Category[]> {
  const payload = await getPayloadLocal();
  const { docs } = await payload.find({
    collection: "categories",
    where: {
      isActive: {
        equals: true,
      },
    },
    sort: "sortOrder",
    limit: 100,
  });

  return docs;
}
