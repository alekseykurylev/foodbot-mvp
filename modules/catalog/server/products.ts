import "server-only";

import { cache } from "react";

import { getPayloadLocal } from "@/common/cms/payload-local";

export const getPublishedProductCategories = cache(async () => {
  const payload = await getPayloadLocal();
  const [categories, products, variants] = await Promise.all([
    payload.find({
      collection: "categories",
      depth: 1,
      limit: 100,
      overrideAccess: false,
      sort: "sortOrder",
    }),
    payload.find({
      collection: "products",
      depth: 2,
      limit: 100,
      overrideAccess: false,
      sort: "name",
    }),
    payload.find({
      collection: "variants",
      depth: 2,
      limit: 1000,
      overrideAccess: false,
      sort: "title",
    }),
  ]);

  const productsWithVariants = products.docs.map((product) => {
    const productVariants = variants.docs.filter((variant) => {
      const variantProductId =
        typeof variant.product === "object" ? variant.product.id : variant.product;

      return variantProductId === product.id;
    });

    return {
      ...product,
      variants: {
        docs: productVariants,
        hasNextPage: false,
        totalDocs: productVariants.length,
      },
    };
  });

  return categories.docs.flatMap((category) => {
    const categoryProducts = productsWithVariants.filter((product) => {
      const productCategoryId =
        typeof product.category === "object" ? product.category.id : product.category;

      return productCategoryId === category.id;
    });

    return categoryProducts.length > 0 ? [{ category, products: categoryProducts }] : [];
  });
});
