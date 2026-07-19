import type { CollectionOverride } from "@payloadcms/plugin-ecommerce/types";
import { slugField } from "payload";

export const productsCollectionOverride: CollectionOverride = ({ defaultCollection }) => ({
  ...defaultCollection,
  admin: {
    ...defaultCollection.admin,
    defaultColumns: ["name", "category", "sku", "priceInRUB", "_status"],
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
    ...defaultCollection.fields,
  ],
});
