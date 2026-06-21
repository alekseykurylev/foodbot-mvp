import type { CollectionConfig } from "payload";

import { isAuthenticated } from "@/lib/cms/access";

export const AiProposals: CollectionConfig = {
  slug: "ai-proposals",
  labels: {
    singular: "AI-предложение",
    plural: "AI-предложения",
  },
  admin: {
    group: "CRM",
    useAsTitle: "id",
    defaultColumns: ["customer", "channel", "totalAmount", "status", "createdAt"],
  },
  defaultSort: "-createdAt",
  access: {
    read: () => true,
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
      defaultValue: "processing",
      options: [
        { label: "Обрабатывается", value: "processing" },
        { label: "Готово", value: "ready" },
        { label: "Нет совпадений", value: "no_match" },
        { label: "Ошибка", value: "failed" },
      ],
    },
    {
      name: "userPrompt",
      type: "textarea",
      label: "Запрос пользователя",
    },
    {
      name: "explanation",
      type: "textarea",
      label: "Объяснение от AI",
      admin: {
        description: "Почему AI выбрал именно эти товары.",
      },
    },
    {
      name: "items",
      type: "json",
      label: "Предложенные товары",
      admin: {
        description: "Массив [{ productId, productName, quantity, unitPrice, lineTotal }].",
      },
    },
    {
      name: "totalAmount",
      type: "number",
      label: "Итоговая сумма",
      min: 0,
      defaultValue: 0,
      admin: {
        step: 1,
      },
    },
    {
      name: "errorMessage",
      type: "textarea",
      label: "Ошибка",
    },
    {
      name: "aiRawResponse",
      type: "json",
      label: "Сырой ответ AI",
    },
    {
      name: "model",
      type: "text",
      label: "Модель AI",
    },
  ],
};
