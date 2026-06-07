"use client";

import { useEffect, useState } from "react";
import { getMiniAppLaunchData } from "@/lib/mini-app/launch-data";
import type { MiniAppSession } from "@/lib/mini-app/types";

export type UserDataState =
  | { status: "loading" }
  | { status: "error"; error: string; raw?: unknown }
  | { status: "ready"; session: MiniAppSession; raw?: unknown };

const mockSession: MiniAppSession = {
  provider: "telegram",
  user: {
    id: "dev-user-1",
    firstName: "Dev",
    lastName: "User",
    username: "dev_user",
    languageCode: "ru",
  },
  chat: {
    id: "dev-chat-1",
    type: "private",
  },
  authDate: 1767225600,
  startParam: "dev",
};

const mockRaw = {
  user: {
    id: mockSession.user.id,
    first_name: mockSession.user.firstName,
    last_name: mockSession.user.lastName,
    username: mockSession.user.username,
    language_code: mockSession.user.languageCode,
  },
  chat: mockSession.chat,
  auth_date: mockSession.authDate,
  start_param: mockSession.startParam,
  is_dev_mock: true,
};

export function useUserData(): UserDataState {
  const [state, setState] = useState<UserDataState>({ status: "loading" });

  useEffect(() => {
    const launchData = getMiniAppLaunchData();

    if (!launchData) {
      if (process.env.NODE_ENV === "development") {
        queueMicrotask(() => {
          setState({ status: "ready", session: mockSession, raw: mockRaw });
        });
        return;
      }

      queueMicrotask(() => {
        setState({
          status: "error",
          error: "initData не найдена. Откройте страницу как Mini App из Telegram или MAX.",
        });
      });
      return;
    }

    const abortController = new AbortController();

    fetch(`/api/${launchData.provider}/auth`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ initData: launchData.initData }),
      signal: abortController.signal,
    })
      .then(async (response) => {
        const data = (await response.json()) as { session?: MiniAppSession; error?: string };

        if (!response.ok || !data.session) {
          throw new Error(data.error ?? "Не удалось проверить initData.");
        }

        setState({ status: "ready", session: data.session, raw: launchData.raw });
      })
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === "AbortError") {
          return;
        }

        setState({
          status: "error",
          error:
            error instanceof Error ? error.message : "Не удалось получить данные пользователя.",
          raw: launchData.raw,
        });
      });

    return () => {
      abortController.abort();
    };
  }, []);

  return state;
}
