import type { CollectionOverride } from "@payloadcms/plugin-ecommerce/types";

export const variantOptionsCollectionOverride: CollectionOverride = ({ defaultCollection }) => ({
  ...defaultCollection,
  fields: [
    ...defaultCollection.fields,
    {
      name: "image",
      type: "upload",
      label: "Изображение",
      relationTo: "media",
      displayPreview: true,
    },
  ],
});
