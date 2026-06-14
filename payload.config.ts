import sharp from "sharp";
import { postgresAdapter } from "@payloadcms/db-postgres";
import { ru } from "@payloadcms/translations/languages/ru";
import { vercelBlobStorage } from "@payloadcms/storage-vercel-blob";
import { buildConfig } from "payload";
import path from "path";
import { fileURLToPath } from "url";
import { AiConversations } from "./collections/ai-conversations";
import { Categories } from "./collections/categories";
import { CustomerAddresses } from "./collections/customer-addresses";
import { Customers } from "./collections/customers";
import { Media } from "./collections/media";
import { Orders } from "./collections/orders";
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
        Logo: "/components/logo-payload",
        Icon: "/components/icon-payload",
      },
    },
    meta: {
      icons: [
        {
          rel: "shortcut icon",
          url: "/favicon.svg",
        },
      ],
    },
    dateFormat: "dd.MM.yyyy HH:mm",
    timezones: {
      defaultTimezone: "Europe/Moscow",
    },
  },
  collections: [
    Users,
    Media,
    Categories,
    Products,
    Customers,
    CustomerAddresses,
    Orders,
    AiConversations,
  ],
  plugins: [
    vercelBlobStorage({
      collections: {
        media: true,
      },
      token: process.env.BLOB_READ_WRITE_TOKEN,
    }),
  ],
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
