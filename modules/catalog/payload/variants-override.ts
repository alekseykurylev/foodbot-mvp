import type { CollectionOverride } from "@payloadcms/plugin-ecommerce/types";

import { compareAtPriceInRUBField } from "@/modules/catalog/payload/compare-at-price-field";
import { enableRUBPrice, requireRUBPrice } from "@/modules/catalog/payload/required-rub-price";

export const variantsCollectionOverride: CollectionOverride = ({ defaultCollection }) => ({
  ...defaultCollection,
  admin: {
    ...defaultCollection.admin,
    defaultColumns: ["title", "options", "priceInRUB", "compareAtPriceInRUB", "_status"],
  },
  fields: requireRUBPrice(defaultCollection.fields, compareAtPriceInRUBField),
  hooks: {
    ...defaultCollection.hooks,
    beforeValidate: [...(defaultCollection.hooks?.beforeValidate ?? []), enableRUBPrice],
  },
});
