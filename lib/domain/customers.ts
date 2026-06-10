"use server";

import { getPayloadLocal } from "@/lib/cms/payload-local";
import type { Customer } from "@/payload-types";

type BaseBotCustomerInput = {
  displayName?: Customer["displayName"] | null;
};

type TelegramCustomerInput = BaseBotCustomerInput & {
  channel: "telegram";
  telegramUserId: NonNullable<Customer["telegramUserId"]> | number;
  telegramUsername?: Customer["telegramUsername"];
};

type MaxCustomerInput = BaseBotCustomerInput & {
  channel: "max";
  maxFirstName?: Customer["maxFirstName"];
  maxLastName?: Customer["maxLastName"];
  maxUserId: NonNullable<Customer["maxUserId"]> | number;
};

export type BotCustomerInput = MaxCustomerInput | TelegramCustomerInput;

type BotCustomerPhoneInput = BotCustomerInput & {
  phone: NonNullable<Customer["phone"]>;
};

function getDisplayName(input: BotCustomerInput) {
  const name = input.displayName?.trim();

  if (name) {
    return name;
  }

  return input.channel === "telegram"
    ? `Telegram ${String(input.telegramUserId)}`
    : `MAX ${String(input.maxUserId)}`;
}

function buildCustomerCreateData(input: BotCustomerInput) {
  const displayName = getDisplayName(input);

  if (input.channel === "telegram") {
    return {
      displayName,
      telegramUserId: String(input.telegramUserId),
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
    maxUserId: String(input.maxUserId),
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

export async function findCustomerByBotUser(input: BotCustomerInput) {
  const payload = await getPayloadLocal();

  if (input.channel === "telegram") {
    const result = await payload.find({
      collection: "customers",
      limit: 1,
      overrideAccess: true,
      where: {
        telegramUserId: {
          equals: String(input.telegramUserId),
        },
      },
    });

    return result.docs[0] as Customer | undefined;
  }

  const result = await payload.find({
    collection: "customers",
    limit: 1,
    overrideAccess: true,
    where: {
      maxUserId: {
        equals: String(input.maxUserId),
      },
    },
  });

  return result.docs[0] as Customer | undefined;
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
      phone: input.phone.trim(),
    },
    overrideAccess: true,
  });
}
