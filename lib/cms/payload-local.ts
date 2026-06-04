import config from "@payload-config";
import { getPayload } from "payload";

export function getPayloadLocal() {
  return getPayload({ config });
}
