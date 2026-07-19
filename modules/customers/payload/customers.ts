import type { CollectionConfig } from "payload";

import { isAdmin } from "@/common/cms/access";

export const Customers: CollectionConfig = {
  slug: "customers",
  labels: {
    singular: "Клиент",
    plural: "Клиенты",
  },
  admin: {
    group: "Ecommerce",
    useAsTitle: "email",
    defaultColumns: ["email", "createdAt"],
  },
  auth: true,
  access: {
    admin: ({ req }) => req.user?.collection === "users" && req.user.role === "admin",
    create: () => true,
    read: ({ req }) => {
      if (req.user?.collection === "users" && req.user.role === "admin") {
        return true;
      }

      return req.user?.collection === "customers"
        ? {
            id: {
              equals: req.user.id,
            },
          }
        : false;
    },
    update: ({ req }) => {
      if (req.user?.collection === "users" && req.user.role === "admin") {
        return true;
      }

      return req.user?.collection === "customers"
        ? {
            id: {
              equals: req.user.id,
            },
          }
        : false;
    },
    delete: isAdmin,
  },
  fields: [],
};
