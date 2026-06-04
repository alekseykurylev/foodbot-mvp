import type { CollectionConfig } from "payload";

import { isAuthenticated } from "@/lib/cms/access";

export const Customers: CollectionConfig = {
  slug: "customers",
  labels: {
    singular: "Клиент",
    plural: "Клиенты",
  },
  admin: {
    group: "CRM",
    useAsTitle: "displayName",
    defaultColumns: ["displayName", "phone", "telegramUserId", "status"],
  },
  defaultSort: "-updatedAt",
  access: {
    read: isAuthenticated,
    create: isAuthenticated,
    update: isAuthenticated,
    delete: isAuthenticated,
  },
  fields: [
    {
      name: "displayName",
      type: "text",
      label: "Имя",
      required: true,
    },
    {
      name: "phone",
      type: "text",
      label: "Телефон",
      admin: {
        placeholder: "+7...",
      },
    },
    {
      name: "email",
      type: "email",
      label: "Email",
    },
    {
      name: "telegramUserId",
      type: "text",
      label: "Telegram user ID",
      unique: true,
      admin: {
        description: "Идентификатор пользователя Telegram для связки с ботом.",
      },
    },
    {
      name: "telegramUsername",
      type: "text",
      label: "Telegram username",
    },
    {
      name: "maxUserId",
      type: "text",
      label: "MAX user ID",
      unique: true,
      admin: {
        description: "Идентификатор пользователя MAX для связки с ботом.",
      },
    },
    {
      name: "maxFirstName",
      type: "text",
      label: "MAX имя",
    },
    {
      name: "maxLastName",
      type: "text",
      label: "MAX фамилия",
    },
    {
      name: "status",
      type: "select",
      label: "Статус",
      required: true,
      defaultValue: "active",
      options: [
        { label: "Активен", value: "active" },
        { label: "Новый", value: "new" },
        { label: "VIP", value: "vip" },
        { label: "Заблокирован", value: "blocked" },
      ],
    },
    {
      name: "addresses",
      type: "join",
      label: "Адреса",
      collection: "customer-addresses",
      on: "customer",
      defaultLimit: 10,
      defaultSort: "-isDefault",
      maxDepth: 1,
      admin: {
        allowCreate: true,
        defaultColumns: ["label", "fullAddress", "isDefault", "status"],
      },
    },
    {
      name: "preferences",
      type: "group",
      label: "Предпочтения",
      fields: [
        {
          name: "favoriteCategories",
          type: "relationship",
          label: "Любимые категории",
          relationTo: "categories",
          hasMany: true,
          maxDepth: 1,
        },
        {
          name: "dislikes",
          type: "text",
          label: "Не любит",
          hasMany: true,
        },
        {
          name: "noPork",
          type: "checkbox",
          label: "Без свинины",
          defaultValue: false,
        },
        {
          name: "noSpicy",
          type: "checkbox",
          label: "Без острого",
          defaultValue: false,
        },
      ],
    },
    {
      name: "marketing",
      type: "group",
      label: "Маркетинг",
      fields: [
        {
          name: "acceptsTelegramMessages",
          type: "checkbox",
          label: "Согласен на сообщения в Telegram",
          defaultValue: true,
        },
        {
          name: "acceptsMaxMessages",
          type: "checkbox",
          label: "Согласен на сообщения в MAX",
          defaultValue: true,
        },
        {
          name: "source",
          type: "select",
          label: "Источник",
          options: [
            { label: "Telegram", value: "telegram" },
            { label: "MAX", value: "max" },
            { label: "Админка", value: "admin" },
            { label: "Агрегатор", value: "aggregator" },
            { label: "Другое", value: "other" },
          ],
        },
      ],
    },
    {
      name: "notes",
      type: "textarea",
      label: "Заметки",
      admin: {
        description: "Внутренние заметки для администратора.",
      },
    },
  ],
};
