import sharp from "sharp";
import { postgresAdapter } from "@payloadcms/db-postgres";
import { ru } from "@payloadcms/translations/languages/ru";
import { vercelBlobStorage } from "@payloadcms/storage-vercel-blob";
import { buildConfig } from "payload";
import path from "path";
import { fileURLToPath } from "url";
import { Media } from "./common/cms/payload/media";
import { AiProposals } from "./modules/ai/payload/ai-proposals";
import { Categories } from "./modules/catalog/payload/categories";
import { Products } from "./modules/catalog/payload/products";
import { Customers } from "./modules/customers/payload/customers";
import { Orders } from "./modules/orders/payload/orders";
import { Users } from "./modules/users/payload/users";

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
        Logo: "/shell/payload/admin/logo-payload",
        Icon: "/shell/payload/admin/icon-payload",
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
  collections: [Users, Media, Categories, Products, Customers, Orders, AiProposals],
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
