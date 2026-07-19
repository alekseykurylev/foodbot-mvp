import type { CollectionOverride } from "@payloadcms/plugin-ecommerce/types";
import { slugField } from "payload";
import { slugify } from "transliteration";

import { compareAtPriceInRUBField } from "@/modules/catalog/payload/compare-at-price-field";
import { enableRUBPrice, requireRUBPrice } from "@/modules/catalog/payload/required-rub-price";

export const productsCollectionOverride: CollectionOverride = ({ defaultCollection }) => {
  return {
    ...defaultCollection,
    admin: {
      ...defaultCollection.admin,
      defaultColumns: [
        "name",
        "category",
        "sku",
        "priceInRUB",
        "compareAtPriceInRUB",
        "_status",
      ],
      useAsTitle: "name",
    },
    fields: [
      {
        name: "name",
        type: "text",
        label: "Название",
        required: true,
      },
      slugField({
        slugify: ({ valueToSlugify }) => slugify(String(valueToSlugify ?? "")),
        useAsSlug: "name",
      }),
      {
        name: "category",
        type: "relationship",
        label: "Категория",
        relationTo: "categories",
        required: true,
        maxDepth: 1,
      },
      {
        name: "sku",
        type: "text",
        label: "Артикул",
        index: true,
        unique: true,
        admin: {
          position: "sidebar",
        },
      },
      {
        name: "image",
        type: "upload",
        label: "Изображение",
        relationTo: "media",
        displayPreview: true,
      },
      {
        name: "description",
        type: "textarea",
        label: "Описание",
      },
      ...requireRUBPrice(defaultCollection.fields, compareAtPriceInRUBField),
    ],
    hooks: {
      ...defaultCollection.hooks,
      beforeValidate: [...(defaultCollection.hooks?.beforeValidate ?? []), enableRUBPrice],
    },
  };
};
