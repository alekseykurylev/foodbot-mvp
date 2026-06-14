import type { CollectionConfig } from "payload";

import { isAuthenticated } from "@/lib/cms/access";

const ORDER_STATUSES = [
  { label: "Отправлен", value: "submitted" },
  { label: "Оплачен", value: "paid" },
  { label: "Выполнен", value: "completed" },
  { label: "Отменен", value: "cancelled" },
] as const;

export const Orders: CollectionConfig = {
  slug: "orders",
  labels: {
    singular: "Заказ",
    plural: "Заказы",
  },
  admin: {
    group: "CRM",
    useAsTitle: "status",
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
    }
  ],
};
