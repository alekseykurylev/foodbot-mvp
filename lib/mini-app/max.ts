import { parseJsonParam, verifyInitData } from "@/lib/mini-app/init-data";
import type { MiniAppSession } from "@/lib/mini-app/types";

type MaxUser = {
  id: number;
  first_name?: string | null;
  last_name?: string | null;
  username?: string | null;
  language_code?: string | null;
  photo_url?: string | null;
};

type MaxChat = {
  id: number;
  type?: string;
};

export function verifyMaxInitData(initData: string, botToken: string): MiniAppSession {
  const params = verifyInitData(initData, botToken);
  const user = parseJsonParam<MaxUser>(params.user, "user");
  const chat = params.chat ? parseJsonParam<MaxChat>(params.chat, "chat") : undefined;

  return {
    provider: "max",
    user: {
      id: String(user.id),
      firstName: user.first_name ?? undefined,
      lastName: user.last_name ?? undefined,
      username: user.username ?? undefined,
      languageCode: user.language_code ?? undefined,
      photoUrl: user.photo_url ?? undefined,
    },
    chat: chat ? { id: String(chat.id), type: chat.type } : undefined,
    authDate: params.auth_date ? Number(params.auth_date) : undefined,
    startParam: params.start_param,
  };
}
