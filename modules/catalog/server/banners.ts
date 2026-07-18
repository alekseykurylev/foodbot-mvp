"use server";

import { getPayloadLocal } from "@/common/cms/payload-local";
import type { Banner } from "@/payload-types";

export async function getActiveBanners(): Promise<Banner[]> {
  const payload = await getPayloadLocal();
  const { docs } = await payload.find({
    collection: "banners",
    where: {
      isActive: {
        equals: true,
      },
    },
    sort: "sortOrder",
    limit: 100,
    depth: 1,
  });

  return docs;
}
