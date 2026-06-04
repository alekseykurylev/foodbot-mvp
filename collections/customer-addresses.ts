import type { CollectionConfig } from "payload";

import { getRelationshipID } from "@/lib/utils/relationship";
import { isAuthenticated } from "@/lib/cms/access";

export const CustomerAddresses: CollectionConfig = {
  slug: "customer-addresses",
  labels: {
    singular: "Адрес клиента",
    plural: "Адреса клиентов",
  },
  admin: {
    group: "CRM",
    useAsTitle: "label",
    defaultColumns: ["label", "customer", "fullAddress", "isDefault", "status"],
  },
  defaultSort: "-isDefault",
  hooks: {
    afterChange: [
      async ({ doc, req }) => {
        const customerID = getRelationshipID(doc.customer);

        if (!doc.isDefault || !customerID) {
          return;
        }

        await req.payload.update({
          collection: "customer-addresses",
          data: {
            isDefault: false,
          },
          overrideAccess: true,
          where: {
            and: [
              {
                customer: {
                  equals: customerID,
                },
              },
              {
                id: {
                  not_equals: doc.id,
                },
              },
              {
                isDefault: {
                  equals: true,
                },
              },
            ],
          },
        });
      },
    ],
  },
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
      name: "label",
      type: "text",
      label: "Название",
      required: true,
      defaultValue: "Дом",
      admin: {
        placeholder: "Дом, офис, дача",
      },
    },
    {
      name: "fullAddress",
      type: "textarea",
      label: "Адрес",
      required: true,
      admin: {
        placeholder: "Город, улица, дом",
      },
    },
    {
      name: "apartment",
      type: "text",
      label: "Квартира / офис",
    },
    {
      name: "intercom",
      type: "text",
      label: "Домофон",
    },
    {
      name: "entrance",
      type: "text",
      label: "Подъезд",
    },
    {
      name: "floor",
      type: "text",
      label: "Этаж",
    },
    {
      name: "comment",
      type: "textarea",
      label: "Комментарий курьеру",
    },
    {
      name: "isDefault",
      type: "checkbox",
      label: "Адрес по умолчанию",
      defaultValue: false,
      admin: {
        description: "Если включить, остальные адреса этого клиента перестанут быть адресами по умолчанию.",
      },
    },
    {
      name: "status",
      type: "select",
      label: "Статус",
      required: true,
      defaultValue: "active",
      options: [
        { label: "Активен", value: "active" },
        { label: "Архив", value: "archived" },
      ],
    },
  ],
};
