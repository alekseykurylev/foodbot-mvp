import type { CollectionConfig } from "payload";

import { generateSlug } from "@/lib/helpers/slug";
import { isAuthenticated } from "@/lib/cms/access";

export const Products: CollectionConfig = {
  slug: "products",
  labels: {
    singular: "Товар",
    plural: "Товары",
  },
  admin: {
    group: "Каталог",
    useAsTitle: "name",
    defaultColumns: ["name", "category", "price", "status"],
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
      name: "category",
      type: "relationship",
      label: "Категория",
      relationTo: "categories",
      required: true,
      maxDepth: 2,
    },
    {
      name: "status",
      type: "select",
      label: "Статус",
      required: true,
      defaultValue: "active",
      options: [
        { label: "Активен", value: "active" },
        { label: "Скрыт", value: "hidden" },
        { label: "Стоп-лист", value: "out_of_stock" },
      ],
    },
    {
      name: "price",
      type: "number",
      label: "Цена",
      required: true,
      min: 0,
      admin: {
        step: 1,
        description: "Цена в рублях.",
      },
    },
    {
      name: "oldPrice",
      type: "number",
      label: "Старая цена",
      min: 0,
      admin: {
        step: 1,
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
      name: "details",
      type: "group",
      label: "Детали",
      fields: [
        {
          name: "weightGrams",
          type: "number",
          label: "Вес, г",
          min: 0,
          admin: {
            step: 1,
          },
        },
        {
          name: "portionSize",
          type: "text",
          label: "Размер / порция",
          admin: {
            placeholder: "30 см, 100 г, 0.5 л, 8 кусочков",
          },
        },
        {
          name: "ingredients",
          type: "textarea",
          label: "Состав",
        },
        {
          name: "nutrition",
          type: "group",
          label: "Пищевая ценность",
          fields: [
            {
              name: "servingBasis",
              type: "select",
              label: "Расчет",
              defaultValue: "per_100g",
              options: [
                { label: "На 100 г", value: "per_100g" },
                { label: "На порцию", value: "per_serving" },
              ],
            },
            {
              name: "caloriesKcal",
              type: "number",
              label: "Ккал",
              min: 0,
              admin: {
                step: 1,
              },
            },
            {
              name: "proteinGrams",
              type: "number",
              label: "Белки, г",
              min: 0,
              admin: {
                step: 0.1,
              },
            },
            {
              name: "fatGrams",
              type: "number",
              label: "Жиры, г",
              min: 0,
              admin: {
                step: 0.1,
              },
            },
            {
              name: "carbsGrams",
              type: "number",
              label: "Углеводы, г",
              min: 0,
              admin: {
                step: 0.1,
              },
            },
          ],
        },
        {
          name: "spicyLevel",
          type: "number",
          label: "Острота",
          min: 0,
          max: 5,
          defaultValue: 0,
          admin: {
            step: 1,
            description: "От 0 до 5.",
          },
        },
      ],
    },
    {
      name: "recommendation",
      type: "group",
      label: "AI и рекомендации",
      fields: [
        {
          name: "isRecommended",
          type: "checkbox",
          label: "Использовать в рекомендациях",
          defaultValue: true,
        },
        {
          name: "peopleMin",
          type: "number",
          label: "Минимум гостей",
          min: 1,
          admin: {
            step: 1,
          },
        },
        {
          name: "peopleMax",
          type: "number",
          label: "Максимум гостей",
          min: 1,
          admin: {
            step: 1,
          },
        },
        {
          name: "aiDescription",
          type: "textarea",
          label: "Описание для AI",
          admin: {
            description: "Например: хорошо подходит детям, офису, большой компании.",
          },
        },
        {
          name: "aiKeywords",
          type: "text",
          label: "Ключевые слова для AI",
          hasMany: true,
          admin: {
            description:
              "Слова и фразы, по которым AI должен находить товар: «компания», «ужин», «детское», «перекус».",
          },
        },
      ],
    },
    {
      name: "tags",
      type: "text",
      label: "Теги",
      hasMany: true,
      admin: {
        description: "Например: мясное, без свинины, детское, острое.",
      },
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
