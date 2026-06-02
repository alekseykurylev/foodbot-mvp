import sharp from "sharp";
import { postgresAdapter } from "@payloadcms/db-postgres";
import { ru } from "@payloadcms/translations/languages/ru";
import { buildConfig } from "payload";

export default buildConfig({
  admin: {
    // components: {
    //   graphics: {
    //     Logo: "/components/logo#Logo",
    //     Icon: "/components/icon#Icon",
    //   },
    // },
    dateFormat: "dd.MM.yyyy HH:mm",
    timezones: {
      defaultTimezone: "Europe/Moscow",
    },
  },
  collections: [],
  secret: process.env.PAYLOAD_SECRET || "",
  db: postgresAdapter({
    pool: {
      connectionString: process.env.DATABASE_URL,
    },
  }),
  i18n: {
    supportedLanguages: { ru },
    translations: {
      ru: {
        general: {
          true: "да",
          false: "нет",
          creatingNewLabel: "Создать",
        },
      },
    },
  },
  sharp,
});
