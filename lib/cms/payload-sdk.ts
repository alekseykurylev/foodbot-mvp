import { PayloadSDK } from "@payloadcms/sdk";

import type { Config } from "@/payload-types";

export const sdk = new PayloadSDK<Config>({
  baseURL: process.env.NEXT_PUBLIC_PAYLOAD_REST_API_URL || "http://localhost:3000/api",
});
