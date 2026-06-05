import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_orders_last_edited_by" AS ENUM('ai', 'customer', 'admin');
  ALTER TABLE "orders" ALTER COLUMN "status" SET DATA TYPE text;
  ALTER TABLE "orders" ALTER COLUMN "status" SET DEFAULT 'cart'::text;
  DROP TYPE "public"."enum_orders_status";
  CREATE TYPE "public"."enum_orders_status" AS ENUM('cart', 'submitted', 'paid', 'completed', 'cancelled');
  ALTER TABLE "orders" ALTER COLUMN "status" SET DEFAULT 'cart'::"public"."enum_orders_status";
  ALTER TABLE "orders" ALTER COLUMN "status" SET DATA TYPE "public"."enum_orders_status" USING "status"::"public"."enum_orders_status";
  ALTER TABLE "orders" ADD COLUMN "last_edited_by" "enum_orders_last_edited_by";`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TYPE "public"."enum_orders_status" ADD VALUE 'proposal' BEFORE 'cart';
  ALTER TYPE "public"."enum_orders_status" ADD VALUE 'pending_payment' BEFORE 'paid';
  ALTER TYPE "public"."enum_orders_status" ADD VALUE 'expired';
  ALTER TABLE "orders" ALTER COLUMN "status" SET DEFAULT 'proposal';
  ALTER TABLE "orders" DROP COLUMN "last_edited_by";
  DROP TYPE "public"."enum_orders_last_edited_by";`)
}
