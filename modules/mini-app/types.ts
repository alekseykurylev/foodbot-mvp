export type MiniAppProvider = "telegram" | "max";

export type MiniAppSession = {
  provider: MiniAppProvider;
  user: {
    id: string;
    firstName?: string;
    lastName?: string;
    username?: string;
    languageCode?: string;
    photoUrl?: string;
  };
  chat?: {
    id: string;
    type?: string;
  };
  authDate?: number;
  startParam?: string;
};
