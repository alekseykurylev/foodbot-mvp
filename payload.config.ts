import sharp from "sharp";
import { postgresAdapter } from "@payloadcms/db-postgres";
import { ru } from "@payloadcms/translations/languages/ru";
import { buildConfig } from "payload";
import path from "path";
import { fileURLToPath } from "url";
import { Categories } from "./collections/categories";
import { Customers } from "./collections/customers";
import { Media } from "./collections/media";
import { Products } from "./collections/products";
import { Users } from "./collections/users";

const filename = fileURLToPath(import.meta.url);
const dirname = path.dirname(filename);

export default buildConfig({
  admin: {
    user: Users.slug,
    importMap: {
      baseDir: path.resolve(dirname),
    },
    components: {
      graphics: {
        Logo: "/components/logo",
        Icon: "/components/logo",
      },
    },
    dateFormat: "dd.MM.yyyy HH:mm",
    timezones: {
      defaultTimezone: "Europe/Moscow",
    },
  },
  collections: [Users, Media, Categories, Products, Customers],
  secret: process.env.PAYLOAD_SECRET || "",
  typescript: {
    outputFile: path.resolve(dirname, "payload-types.ts"),
  },
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
