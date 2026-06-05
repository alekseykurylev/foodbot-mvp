import { randomUUID } from "crypto";
import type { CollectionConfig } from "payload";

import { getRelationshipID } from "@/lib/utils/relationship";
import { isAuthenticated } from "@/lib/cms/access";

const ORDER_STATUSES = [
  { label: "Корзина", value: "cart" },
  { label: "Отправлен", value: "submitted" },
  { label: "Оплачен", value: "paid" },
  { label: "Выполнен", value: "completed" },
  { label: "Отменен", value: "cancelled" },
] as const;

function createOrderNumber() {
  const timestamp = Date.now().toString(36).toUpperCase();
  const suffix = randomUUID().slice(0, 8).toUpperCase();

  return `FB-${timestamp}-${suffix}`;
}

function buildAddressSnapshot(address: {
  apartment?: null | string;
  comment?: null | string;
  entrance?: null | string;
  floor?: null | string;
  fullAddress: string;
  intercom?: null | string;
}) {
  return [
    address.fullAddress,
    address.apartment ? `кв./офис ${address.apartment}` : undefined,
    address.entrance ? `подъезд ${address.entrance}` : undefined,
    address.floor ? `этаж ${address.floor}` : undefined,
    address.intercom ? `домофон ${address.intercom}` : undefined,
    address.comment ? `комментарий: ${address.comment}` : undefined,
  ]
    .filter(Boolean)
    .join(", ");
}

export const Orders: CollectionConfig = {
  slug: "orders",
  labels: {
    singular: "Заказ",
    plural: "Заказы",
  },
  admin: {
    group: "CRM",
    useAsTitle: "orderNumber",
    defaultColumns: ["orderNumber", "customer", "status", "totals.totalAmount", "createdAt"],
  },
  defaultSort: "-createdAt",
  hooks: {
    beforeValidate: [
      async ({ data, req }) => {
        if (!data) {
          return data;
        }

        data.publicToken ??= randomUUID();
        data.orderNumber ??= createOrderNumber();

        if (Array.isArray(data.items)) {
          let subtotal = 0;

          data.items = data.items.map((item) => {
            const quantity = Number(item.quantity ?? 0);
            const unitPrice = Number(item.unitPriceSnapshot ?? 0);
            const lineTotal = Math.max(quantity, 0) * Math.max(unitPrice, 0);

            subtotal += lineTotal;

            return {
              ...item,
              lineTotalSnapshot: lineTotal,
            };
          });

          const discountAmount = Number(data.totals?.discountAmount ?? 0);
          const deliveryAmount = Number(data.totals?.deliveryAmount ?? 0);

          data.totals = {
            ...data.totals,
            subtotalAmount: subtotal,
            totalAmount: Math.max(subtotal - discountAmount + deliveryAmount, 0),
          };
        }

        const delivery = data.delivery;
        const addressID = getRelationshipID(delivery?.address);

        if (delivery && addressID && !delivery.addressSnapshot) {
          const address = await req.payload.findByID({
            collection: "customer-addresses",
            id: addressID,
            overrideAccess: true,
          });

          delivery.addressSnapshot = buildAddressSnapshot(address);
          delivery.apartmentSnapshot = address.apartment;
          delivery.intercomSnapshot = address.intercom;
          delivery.entranceSnapshot = address.entrance;
          delivery.floorSnapshot = address.floor;
          delivery.courierComment = delivery.courierComment || address.comment;
        }

        return data;
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
      name: "orderNumber",
      type: "text",
      label: "Номер заказа",
      unique: true,
      admin: {
        description: "Генерируется автоматически при создании.",
        readOnly: true,
      },
    },
    {
      name: "publicToken",
      type: "text",
      label: "Публичный токен корзины",
      required: true,
      unique: true,
      admin: {
        description: "Используется в ссылке на корзину. Не должен быть предсказуемым.",
        readOnly: true,
      },
    },
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
      options: [...ORDER_STATUSES],
    },
    {
      name: "source",
      type: "select",
      label: "Источник формирования",
      required: true,
      defaultValue: "ai",
      options: [
        { label: "AI", value: "ai" },
        { label: "Вручную клиентом", value: "manual" },
        { label: "Админка", value: "admin" },
        { label: "Повтор заказа", value: "reorder" },
      ],
    },
    {
      name: "channel",
      type: "select",
      label: "Канал",
      required: true,
      options: [
        { label: "Telegram", value: "telegram" },
        { label: "MAX", value: "max" },
        { label: "Mini App", value: "mini_app" },
        { label: "Админка", value: "admin" },
      ],
    },
    {
      name: "lastEditedBy",
      type: "select",
      label: "Кто последним менял корзину",
      options: [
        { label: "AI", value: "ai" },
        { label: "Клиент", value: "customer" },
        { label: "Админ", value: "admin" },
      ],
      admin: {
        description: "Для корзины показывает, кто последним применил изменение.",
      },
    },
    {
      name: "items",
      type: "array",
      label: "Товары",
      required: true,
      minRows: 1,
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
          label: "Название на момент заказа",
          required: true,
        },
        {
          name: "unitPriceSnapshot",
          type: "number",
          label: "Цена за единицу",
          required: true,
          min: 0,
          admin: {
            step: 1,
          },
        },
        {
          name: "quantity",
          type: "number",
          label: "Количество",
          required: true,
          min: 1,
          defaultValue: 1,
          admin: {
            step: 1,
          },
        },
        {
          name: "lineTotalSnapshot",
          type: "number",
          label: "Сумма строки",
          required: true,
          min: 0,
          admin: {
            readOnly: true,
            step: 1,
          },
        },
        {
          name: "comment",
          type: "text",
          label: "Комментарий к позиции",
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
          admin: {
            readOnly: true,
            step: 1,
          },
        },
        {
          name: "discountAmount",
          type: "number",
          label: "Скидка",
          min: 0,
          defaultValue: 0,
          admin: {
            step: 1,
          },
        },
        {
          name: "deliveryAmount",
          type: "number",
          label: "Доставка",
          min: 0,
          defaultValue: 0,
          admin: {
            step: 1,
          },
        },
        {
          name: "totalAmount",
          type: "number",
          label: "Итого",
          required: true,
          min: 0,
          defaultValue: 0,
          admin: {
            readOnly: true,
            step: 1,
          },
        },
      ],
    },
    {
      name: "delivery",
      type: "group",
      label: "Доставка",
      fields: [
        {
          name: "address",
          type: "relationship",
          label: "Адрес клиента",
          relationTo: "customer-addresses",
          maxDepth: 1,
          filterOptions: ({ data }) => {
            const customerID = getRelationshipID(data.customer);

            if (!customerID) {
              return true;
            }

            return {
              customer: {
                equals: customerID,
              },
              status: {
                equals: "active",
              },
            };
          },
        },
        {
          name: "addressSnapshot",
          type: "textarea",
          label: "Адрес на момент заказа",
          admin: {
            description:
              "Заполняется из выбранного адреса, но хранится отдельно для истории заказа.",
          },
        },
        {
          name: "apartmentSnapshot",
          type: "text",
          label: "Квартира / офис",
        },
        {
          name: "intercomSnapshot",
          type: "text",
          label: "Домофон",
        },
        {
          name: "entranceSnapshot",
          type: "text",
          label: "Подъезд",
        },
        {
          name: "floorSnapshot",
          type: "text",
          label: "Этаж",
        },
        {
          name: "customerComment",
          type: "textarea",
          label: "Комментарий клиента",
        },
        {
          name: "courierComment",
          type: "textarea",
          label: "Комментарий курьеру",
        },
        {
          name: "requestedAt",
          type: "date",
          label: "Желаемое время",
          admin: {
            date: {
              pickerAppearance: "dayAndTime",
            },
          },
        },
      ],
    },
    {
      name: "payment",
      type: "group",
      label: "Оплата",
      fields: [
        {
          name: "method",
          type: "select",
          label: "Способ",
          options: [
            { label: "Не выбран", value: "not_selected" },
            { label: "Наличными", value: "cash" },
            { label: "Картой курьеру", value: "card_on_delivery" },
            { label: "Онлайн", value: "online" },
          ],
          defaultValue: "not_selected",
        },
        {
          name: "status",
          type: "select",
          label: "Статус оплаты",
          options: [
            { label: "Не требуется", value: "not_required" },
            { label: "Ожидает оплаты", value: "pending" },
            { label: "Оплачено", value: "paid" },
            { label: "Ошибка", value: "failed" },
            { label: "Возврат", value: "refunded" },
          ],
          defaultValue: "not_required",
        },
        {
          name: "provider",
          type: "text",
          label: "Провайдер",
        },
        {
          name: "externalPaymentId",
          type: "text",
          label: "Внешний ID платежа",
        },
      ],
    },
    {
      name: "ai",
      type: "group",
      label: "AI-подбор",
      fields: [
        {
          name: "prompt",
          type: "textarea",
          label: "Запрос пользователя",
        },
        {
          name: "explanation",
          type: "textarea",
          label: "Объяснение предложения",
        },
        {
          name: "model",
          type: "text",
          label: "Модель",
        },
        {
          name: "rawResponse",
          type: "json",
          label: "Сырой ответ AI",
        },
      ],
    },
    {
      name: "expiresAt",
      type: "date",
      label: "Действует до",
      admin: {
        description: "Для AI-предложений можно ограничить срок действия ссылки.",
        date: {
          pickerAppearance: "dayAndTime",
        },
      },
    },
    {
      name: "submittedAt",
      type: "date",
      label: "Отправлен",
      admin: {
        date: {
          pickerAppearance: "dayAndTime",
        },
      },
    },
    {
      name: "paidAt",
      type: "date",
      label: "Оплачен",
      admin: {
        date: {
          pickerAppearance: "dayAndTime",
        },
      },
    },
    {
      name: "cancelledAt",
      type: "date",
      label: "Отменен",
      admin: {
        date: {
          pickerAppearance: "dayAndTime",
        },
      },
    },
    {
      name: "internalNotes",
      type: "textarea",
      label: "Внутренние заметки",
    },
  ],
};
