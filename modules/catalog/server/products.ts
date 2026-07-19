import "server-only";

import { cache } from "react";

import { getPayloadLocal } from "@/common/cms/payload-local";

export const getPublishedProductCategories = cache(async () => {
  const payload = await getPayloadLocal();
  const [categories, products] = await Promise.all([
    payload.find({
      collection: "categories",
      depth: 1,
      limit: 100,
      overrideAccess: false,
      sort: "sortOrder",
    }),
    payload.find({
      collection: "products",
      depth: 1,
      limit: 100,
      overrideAccess: false,
      sort: "name",
    }),
  ]);

  return categories.docs.flatMap((category) => {
    const categoryProducts = products.docs.filter((product) => {
      const productCategoryId =
        typeof product.category === "object" ? product.category.id : product.category;

      return productCategoryId === category.id;
    });

    return categoryProducts.length > 0 ? [{ category, products: categoryProducts }] : [];
  });
});
