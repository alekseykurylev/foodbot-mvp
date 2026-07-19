import type { CollectionConfig } from "payload";
import { slugField } from "payload";
import { slugify } from "transliteration";

import { adminOrPublishedStatus, isAdmin } from "@/common/cms/access";

export const Categories: CollectionConfig = {
  slug: "categories",
  labels: {
    singular: "Категория",
    plural: "Категории",
  },
  access: {
    create: isAdmin,
    delete: isAdmin,
    read: adminOrPublishedStatus,
    update: isAdmin,
  },
  admin: {
    defaultColumns: ["name", "sortOrder", "_status"],
    group: "Ecommerce",
    listSearchableFields: ["name", "slug"],
    useAsTitle: "name",
  },
  defaultSort: "sortOrder",
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
      name: "image",
      type: "upload",
      label: "Изображение",
      relationTo: "media",
      displayPreview: true,
    },
    {
      name: "sortOrder",
      type: "number",
      label: "Порядок сортировки",
      defaultValue: 100,
      min: 0,
      required: true,
      admin: {
        position: "sidebar",
      },
    },
  ],
  trash: true,
  versions: {
    drafts: {
      autosave: true,
    },
  },
};
