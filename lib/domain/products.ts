"use server";

import { getPayloadLocal } from "@/lib/cms/payload-local";
import { getActiveCategories } from "@/lib/domain/categories";
import { getRelationshipID } from "@/lib/helpers/relationship";
import type { Category, Product } from "@/payload-types";

export type ProductCategory = {
  category: Category;
  products: Product[];
};

export async function getActiveProductCategories(): Promise<ProductCategory[]> {
  const payload = await getPayloadLocal();
  const [categories, { docs: products }] = await Promise.all([
    getActiveCategories(),
    payload.find({
      collection: "products",
      where: {
        status: {
          equals: "active",
        },
      },
      sort: "sortOrder",
      limit: 100,
      depth: 1,
    }),
  ]);

  const productsByCategory = new Map<Category["id"], Product[]>();

  for (const product of products) {
    const categoryId = getRelationshipID(product.category);

    if (typeof categoryId !== "number") {
      continue;
    }

    const categoryProducts = productsByCategory.get(categoryId);

    if (categoryProducts) {
      categoryProducts.push(product);
    } else {
      productsByCategory.set(categoryId, [product]);
    }
  }

  return categories.flatMap((category) => {
    const categoryProducts = productsByCategory.get(category.id);

    if (!categoryProducts?.length) {
      return [];
    }

    return [
      {
        category,
        products: categoryProducts,
      },
    ];
  });
}
