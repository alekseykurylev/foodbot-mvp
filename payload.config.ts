import sharp from "sharp";
import { postgresAdapter } from "@payloadcms/db-postgres";
import { ecommercePlugin } from "@payloadcms/plugin-ecommerce";
import { ruTranslations as ecommerceRu } from "@payloadcms/plugin-ecommerce/translations/languages/ru";
import { ru } from "@payloadcms/translations/languages/ru";
import { vercelBlobStorage } from "@payloadcms/storage-vercel-blob";
import { buildConfig } from "payload";
import path from "path";
import { fileURLToPath } from "url";
import { Media } from "./common/cms/payload/media";
import { ecommerceCurrenciesConfig } from "./common/ecommerce/currencies";
import { Banners } from "./modules/catalog/payload/banners";
import { Categories } from "./modules/catalog/payload/categories";
import { productsCollectionOverride } from "./modules/catalog/payload/products-override";
import { variantsCollectionOverride } from "./modules/catalog/payload/variants-override";
import { Customers } from "./modules/customers/payload/customers";
import { Users } from "./modules/users/payload/users";
import {
  adminOnlyFieldAccess,
  adminOrPublishedStatus,
  isAdmin,
  isAuthenticated,
  isCustomer,
  isDocumentOwner,
} from "./common/cms/access";

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
  collections: [Users, Customers, Media, Banners, Categories],
  plugins: [
    ecommercePlugin({
      access: {
        adminOnlyFieldAccess,
        adminOrPublishedStatus,
        isAdmin,
        isAuthenticated,
        isCustomer,
        isDocumentOwner,
      },
      customers: {
        slug: Customers.slug,
      },
      currencies: ecommerceCurrenciesConfig,
      inventory: false,
      payments: {
        paymentMethods: [],
      },
      products: {
        productsCollectionOverride,
        variants: {
          variantsCollectionOverride,
        },
      },
    }),
    vercelBlobStorage({
      collections: {
        media: true,
      },
      // addRandomSuffix: true,
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
        ...ecommerceRu,
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
