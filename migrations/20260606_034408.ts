import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   DROP INDEX "orders_order_number_idx";
  DROP INDEX "orders_public_token_idx";
  ALTER TABLE "orders" DROP COLUMN "order_number";
  ALTER TABLE "orders" DROP COLUMN "public_token";
  ALTER TABLE "orders" DROP COLUMN "expires_at";`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "orders" ADD COLUMN "order_number" varchar;
  ALTER TABLE "orders" ADD COLUMN "public_token" varchar NOT NULL;
  ALTER TABLE "orders" ADD COLUMN "expires_at" timestamp(3) with time zone;
  CREATE UNIQUE INDEX "orders_order_number_idx" ON "orders" USING btree ("order_number");
  CREATE UNIQUE INDEX "orders_public_token_idx" ON "orders" USING btree ("public_token");`)
}
