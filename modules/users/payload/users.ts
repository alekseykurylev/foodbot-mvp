import type { CollectionConfig } from "payload";

import { isAdmin } from "@/common/cms/access";

export const Users: CollectionConfig = {
  slug: "users",
  labels: {
    singular: "Пользователь",
    plural: "Пользователи",
  },
  admin: {
    group: "Админка",
    useAsTitle: "email",
    defaultColumns: ["email", "role"],
  },
  auth: true,
  access: {
    read: isAdmin,
    create: isAdmin,
    update: isAdmin,
    delete: isAdmin,
  },
  fields: [
    {
      name: "role",
      type: "select",
      label: "Роль",
      required: true,
      defaultValue: "operator",
      options: [
        { label: "Администратор", value: "admin" },
        { label: "Оператор", value: "operator" },
      ],
    },
  ],
};
