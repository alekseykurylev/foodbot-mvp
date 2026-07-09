import type { CollectionConfig } from "payload";

import { isAuthenticated } from "@/common/cms/access";

export const Orders: CollectionConfig = {
  slug: "orders",
  labels: {
    singular: "Заказ",
    plural: "Заказы",
  },
  admin: {
    group: "CRM",
    useAsTitle: "customer",
    defaultColumns: ["customer", "status", "totals.totalAmount", "createdAt"],
  },
  defaultSort: "-createdAt",
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
      name: "status",
      type: "select",
      label: "Статус",
      required: true,
      defaultValue: "cart",
      options: [
        { label: "Корзина", value: "cart" },
        { label: "Отправлен", value: "submitted" },
        { label: "Оплачен", value: "paid" },
        { label: "Выполнен", value: "completed" },
        { label: "Отменен", value: "cancelled" },
      ],
    },
    {
      name: "items",
      type: "array",
      label: "Товары",
      labels: {
        singular: "Товар",
        plural: "Товары",
      },
      fields: [
        {
          name: "product",
          type: "relationship",
          label: "Товар",
          relationTo: "products",
          required: true,
          maxDepth: 1,
        },
        {
          name: "productNameSnapshot",
          type: "text",
          label: "Название",
          required: true,
        },
        {
          name: "unitPriceSnapshot",
          type: "number",
          label: "Цена",
          required: true,
          min: 0,
        },
        {
          name: "quantity",
          type: "number",
          label: "Количество",
          required: true,
          min: 1,
          defaultValue: 1,
        },
        {
          name: "lineTotalSnapshot",
          type: "number",
          label: "Сумма",
          required: true,
          min: 0,
        },
      ],
    },
    {
      name: "totals",
      type: "group",
      label: "Суммы",
      fields: [
        {
          name: "subtotalAmount",
          type: "number",
          label: "Товары",
          required: true,
          min: 0,
          defaultValue: 0,
        },
        {
          name: "totalAmount",
          type: "number",
          label: "Итого",
          required: true,
          min: 0,
          defaultValue: 0,
        },
      ],
    },
  ],
};
