"use server";

import { getPayloadLocal } from "@/lib/cms/payload-local";
import type { Customer } from "@/payload-types";

type BaseBotCustomerInput = {
  displayName?: null | string;
};

type TelegramCustomerInput = BaseBotCustomerInput & {
  channel: "telegram";
  telegramUserId: number | string;
  telegramUsername?: null | string;
};

type MaxCustomerInput = BaseBotCustomerInput & {
  channel: "max";
  maxFirstName?: null | string;
  maxLastName?: null | string;
  maxUserId: number | string;
};

export type BotCustomerInput = MaxCustomerInput | TelegramCustomerInput;

type BotCustomerPhoneInput = BotCustomerInput & {
  phone: string;
};

function normalizeBotUserID(id: number | string) {
  return String(id);
}

function getDisplayName(input: BotCustomerInput) {
  const name = input.displayName?.trim();

  if (name) {
    return name;
  }

  return input.channel === "telegram"
    ? `Telegram ${normalizeBotUserID(input.telegramUserId)}`
    : `MAX ${normalizeBotUserID(input.maxUserId)}`;
}

function getCustomerLookup(input: BotCustomerInput) {
  if (input.channel === "telegram") {
    return {
      field: "telegramUserId",
      value: normalizeBotUserID(input.telegramUserId),
    } as const;
  }

  return {
    field: "maxUserId",
    value: normalizeBotUserID(input.maxUserId),
  } as const;
}

function buildCustomerCreateData(input: BotCustomerInput) {
  const displayName = getDisplayName(input);

  if (input.channel === "telegram") {
    return {
      displayName,
      telegramUserId: normalizeBotUserID(input.telegramUserId),
      telegramUsername: input.telegramUsername ?? undefined,
      status: "new" as const,
      marketing: {
        acceptsTelegramMessages: true,
        source: "telegram" as const,
      },
    };
  }

  return {
    displayName,
    maxUserId: normalizeBotUserID(input.maxUserId),
    maxFirstName: input.maxFirstName ?? displayName,
    maxLastName: input.maxLastName ?? undefined,
    status: "new" as const,
    marketing: {
      acceptsMaxMessages: true,
      source: "max" as const,
    },
  };
}

function buildMarketingUpdate(
  customer: Customer,
  channel: BotCustomerInput["channel"],
): NonNullable<Customer["marketing"]> {
  const existingMarketing = customer.marketing ?? {};

  if (channel === "telegram") {
    return {
      ...existingMarketing,
      acceptsTelegramMessages: true,
      source: existingMarketing.source ?? "telegram",
    };
  }

  return {
    ...existingMarketing,
    acceptsMaxMessages: true,
    source: existingMarketing.source ?? "max",
  };
}

function buildCustomerUpdateData(input: BotCustomerInput, customer: Customer) {
  const displayName = getDisplayName(input);

  if (input.channel === "telegram") {
    return {
      displayName,
      telegramUsername: input.telegramUsername ?? undefined,
      marketing: buildMarketingUpdate(customer, input.channel),
    };
  }

  return {
    displayName,
    maxFirstName: input.maxFirstName ?? displayName,
    maxLastName: input.maxLastName ?? undefined,
    marketing: buildMarketingUpdate(customer, input.channel),
  };
}

async function findCustomerByBotUser(input: BotCustomerInput) {
  const payload = await getPayloadLocal();
  const { field, value } = getCustomerLookup(input);

  const result = await payload.find({
    collection: "customers",
    limit: 1,
    overrideAccess: true,
    where: {
      [field]: {
        equals: value,
      },
    },
  });

  return result.docs[0] as Customer | undefined;
}

function normalizePhone(phone: string) {
  return phone.trim();
}

/**
 * Находит клиента бота по ID пользователя в канале или создает нового.
 * При повторном контакте обновляет профиль канала и не затирает существующий маркетинг.
 */
export async function upsertBotCustomer(input: BotCustomerInput) {
  const payload = await getPayloadLocal();
  const existingCustomer = await findCustomerByBotUser(input);

  if (existingCustomer) {
    return payload.update({
      collection: "customers",
      id: existingCustomer.id,
      data: buildCustomerUpdateData(input, existingCustomer),
      overrideAccess: true,
    });
  }

  try {
    return await payload.create({
      collection: "customers",
      data: buildCustomerCreateData(input),
      overrideAccess: true,
    });
  } catch (error) {
    const customer = await findCustomerByBotUser(input);

    if (customer) {
      return customer;
    }

    throw error;
  }
}

/**
 * Сохраняет телефон, который пользователь отправил через кнопку контакта бота.
 * Если клиента еще нет в CRM, сначала создает его по данным канала.
 */
export async function saveBotCustomerPhone(input: BotCustomerPhoneInput) {
  const payload = await getPayloadLocal();
  const customer = await upsertBotCustomer(input);

  return payload.update({
    collection: "customers",
    id: customer.id,
    data: {
      phone: normalizePhone(input.phone),
    },
    overrideAccess: true,
  });
}
