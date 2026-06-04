import type { CollectionConfig } from "payload";

import { generateSlug } from "@/lib/utils/slug";
import { isAuthenticated } from "@/lib/cms/access";

export const Categories: CollectionConfig = {
  slug: "categories",
  labels: {
    singular: "Категория",
    plural: "Категории",
  },
  admin: {
    group: "Каталог",
    useAsTitle: "name",
    defaultColumns: ["name", "slug", "isActive", "sortOrder"],
  },
  defaultSort: "sortOrder",
  hooks: {
    beforeValidate: [
      ({ data }) => {
        if (data?.name && !data.slug) {
          data.slug = generateSlug(data.name);
        }

        return data;
      },
    ],
  },
  access: {
    read: () => true,
    create: isAuthenticated,
    update: isAuthenticated,
    delete: isAuthenticated,
  },
  fields: [
    {
      name: "name",
      type: "text",
      label: "Название",
      required: true,
    },
    {
      name: "slug",
      type: "text",
      label: "Слаг",
      required: true,
      unique: true,
      admin: {
        description: "Заполняется автоматически из названия, но его можно отредактировать вручную.",
      },
    },
    {
      name: "description",
      type: "textarea",
      label: "Описание",
    },
    {
      name: "image",
      type: "upload",
      label: "Изображение",
      relationTo: "media",
      displayPreview: true,
    },
    {
      name: "isActive",
      type: "checkbox",
      label: "Показывать в меню",
      defaultValue: true,
    },
    {
      name: "sortOrder",
      type: "number",
      label: "Порядок сортировки",
      defaultValue: 100,
      admin: {
        step: 1,
      },
    },
  ],
};
