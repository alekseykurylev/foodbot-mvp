import type { CollectionConfig, TextFieldSingleValidation } from "payload";

import { isAuthenticated } from "@/common/cms/access";

const validateBannerLink: TextFieldSingleValidation = (value) => {
  if (!value) {
    return true;
  }

  if (value.startsWith("/") && !value.startsWith("//")) {
    return true;
  }

  try {
    const url = new URL(value);

    return (
      ["http:", "https:"].includes(url.protocol) ||
      "Допустимы только ссылки с http:// или https://."
    );
  } catch {
    return "Укажите внутренний путь, начинающийся с /, или полный URL.";
  }
};

export const Banners: CollectionConfig = {
  slug: "banners",
  labels: {
    singular: "Баннер",
    plural: "Баннеры",
  },
  admin: {
    group: "Каталог",
    defaultColumns: ["image", "link", "isActive", "sortOrder"],
  },
  defaultSort: "sortOrder",
  access: {
    read: () => true,
    create: isAuthenticated,
    update: isAuthenticated,
    delete: isAuthenticated,
  },
  fields: [
    {
      name: "image",
      type: "upload",
      label: "Изображение",
      relationTo: "media",
      required: true,
      displayPreview: true,
    },
    {
      name: "link",
      type: "text",
      label: "Ссылка",
      admin: {
        description:
          "Необязательно. Укажите внутренний путь или полный адрес с http:// или https://.",
        placeholder: "/catalog или https://example.com",
      },
      validate: validateBannerLink,
    },
    {
      name: "isActive",
      type: "checkbox",
      label: "Показывать баннер",
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
