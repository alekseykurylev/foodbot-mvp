import type { CollectionConfig } from "payload";

import { isAuthenticated } from "@/lib/cms/access";

export const Media: CollectionConfig = {
  slug: "media",
  labels: {
    singular: "Медиа",
    plural: "Медиа",
  },
  admin: {
    group: "Каталог",
    useAsTitle: "filename",
    defaultColumns: ["filename", "alt", "mimeType", "filesize"],
  },
  access: {
    read: () => true,
    create: isAuthenticated,
    update: isAuthenticated,
    delete: isAuthenticated,
  },
  upload: {
    staticDir: "media",
    imageSizes: [
      {
        name: "thumbnail",
        width: 400,
        position: "centre",
      },
      {
        name: "card",
        width: 768,
        position: "centre",
      },
      {
        name: "wide",
        width: 1200,
        position: "centre",
      },
    ],
    adminThumbnail: "thumbnail",
    mimeTypes: ["image/*"],
  },
  fields: [
    {
      name: "alt",
      type: "text",
      label: "Alt-текст",
      required: true,
    },
    {
      name: "caption",
      type: "text",
      label: "Подпись",
    },
  ],
};
