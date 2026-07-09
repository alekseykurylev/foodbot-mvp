import { parseJsonParam, verifyInitData } from "@/modules/mini-app/verify/init-data";
import type { MiniAppSession } from "@/modules/mini-app/types";

type TelegramUser = {
  id: number;
  first_name?: string;
  last_name?: string;
  username?: string;
  language_code?: string;
  photo_url?: string;
};

export function verifyTelegramInitData(initData: string, botToken: string): MiniAppSession {
  const params = verifyInitData(initData, botToken);
  const user = parseJsonParam<TelegramUser>(params.user, "user");

  return {
    provider: "telegram",
    user: {
      id: String(user.id),
      firstName: user.first_name,
      lastName: user.last_name,
      username: user.username,
      languageCode: user.language_code,
      photoUrl: user.photo_url,
    },
    authDate: params.auth_date ? Number(params.auth_date) : undefined,
    startParam: params.start_param,
  };
}
