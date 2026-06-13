import type { CollectionConfig } from "payload";

import { isAuthenticated } from "@/lib/cms/access";

export const AiConversations: CollectionConfig = {
  slug: "ai-conversations",
  labels: {
    singular: "Диалог AI",
    plural: "Диалоги AI",
  },
  admin: {
    group: "CRM",
    useAsTitle: "id",
    defaultColumns: ["customer", "channel", "status", "updatedAt"],
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
      name: "customer",
      type: "relationship",
      label: "Клиент",
      relationTo: "customers",
      required: true,
      maxDepth: 1,
    },
    {
      name: "channel",
      type: "select",
      label: "Канал",
      required: true,
      options: [
        { label: "Telegram", value: "telegram" },
        { label: "MAX", value: "max" },
      ],
    },
    {
      name: "status",
      type: "select",
      label: "Статус",
      required: true,
      defaultValue: "active",
      options: [
        { label: "Активен", value: "active" },
        { label: "Завершён", value: "completed" },
      ],
    },
    {
      name: "originalPrompt",
      type: "textarea",
      label: "Исходный запрос",
      admin: {
        description: "Первое сообщение пользователя, с которого начался диалог.",
      },
    },
    {
      name: "messages",
      type: "json",
      label: "История сообщений",
      required: true,
      admin: {
        description:
          "Массив сообщений в формате [{ role, content }] для контекста AI.",
      },
    },
    {
      name: "collectedAnswers",
      type: "json",
      label: "Собранные ответы",
      admin: {
        description: "Ключевые параметры, собранные в ходе диалога: гости, предпочтения, бюджет, ограничения.",
      },
    },
    {
      name: "cart",
      type: "relationship",
      label: "Созданная корзина",
      relationTo: "orders",
      maxDepth: 1,
      admin: {
        description: "Заказ, созданный AI по итогам этого диалога.",
      },
    },
  ],
};
