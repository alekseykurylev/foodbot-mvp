import { PayloadSDK } from "@payloadcms/sdk";

import type { Config } from "@/payload-types";

const DEFAULT_LOCAL_API_URL = "http://localhost:3000/api";

let payloadSDK: PayloadSDK<Config> | undefined;

function getPayloadApiUrl() {
  return (
    process.env.PAYLOAD_REST_API_URL ||
    process.env.NEXT_PUBLIC_PAYLOAD_REST_API_URL ||
    DEFAULT_LOCAL_API_URL
  );
}

export function getPayloadSDK() {
  payloadSDK ??= new PayloadSDK<Config>({
    baseURL: getPayloadApiUrl(),
  });

  return payloadSDK;
}
