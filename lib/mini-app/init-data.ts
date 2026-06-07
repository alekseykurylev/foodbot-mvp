import { createHmac, timingSafeEqual } from "node:crypto";

type InitDataParams = Record<string, string>;

const MAX_INIT_DATA_AGE_SECONDS = 60 * 60;

export function parseJsonParam<T>(value: string | undefined, name: string) {
  if (!value) {
    throw new Error(`${name} is missing`);
  }

  return JSON.parse(value) as T;
}

function parseInitData(initData: string) {
  const searchParams = new URLSearchParams(initData);
  const params: InitDataParams = {};

  for (const [key, value] of searchParams.entries()) {
    if (params[key] !== undefined) {
      throw new Error(`Duplicate initData key: ${key}`);
    }

    params[key] = value;
  }

  return params;
}

function createDataCheckString(params: InitDataParams) {
  return Object.entries(params)
    .filter(([key]) => key !== "hash")
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([key, value]) => `${key}=${value}`)
    .join("\n");
}

function hmac(key: string | Buffer, value: string) {
  return createHmac("sha256", key).update(value).digest();
}

function hmacHex(key: string | Buffer, value: string) {
  return createHmac("sha256", key).update(value).digest("hex");
}

function timingSafeHexEqual(left: string, right: string) {
  const leftBuffer = Buffer.from(left, "hex");
  const rightBuffer = Buffer.from(right, "hex");

  if (leftBuffer.length !== rightBuffer.length) {
    return false;
  }

  return timingSafeEqual(leftBuffer, rightBuffer);
}

function verifyAuthDate(authDate: string | undefined) {
  if (!authDate) {
    throw new Error("initData auth_date is missing");
  }

  const timestamp = Number(authDate);

  if (!Number.isInteger(timestamp)) {
    throw new Error("initData auth_date is invalid");
  }

  const now = Math.floor(Date.now() / 1000);

  if (timestamp > now) {
    throw new Error("initData auth_date is in the future");
  }

  if (now - timestamp > MAX_INIT_DATA_AGE_SECONDS) {
    throw new Error("initData auth_date is expired");
  }
}

export function verifyInitData(initData: string, botToken: string) {
  const params = parseInitData(initData);
  const hash = params.hash;

  if (!hash) {
    throw new Error("initData hash is missing");
  }

  const secret = hmac("WebAppData", botToken);
  const expectedHash = hmacHex(secret, createDataCheckString(params));

  if (!timingSafeHexEqual(expectedHash, hash)) {
    throw new Error("initData signature is invalid");
  }

  verifyAuthDate(params.auth_date);

  return params;
}
