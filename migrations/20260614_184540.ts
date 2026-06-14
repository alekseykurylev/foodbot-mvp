import { MigrateUpArgs, MigrateDownArgs, sql } from "@payloadcms/db-postgres";

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_ai_proposals_channel" AS ENUM('telegram', 'max');
  CREATE TYPE "public"."enum_ai_proposals_status" AS ENUM('active', 'applied', 'expired');
  CREATE TABLE "ai_proposals" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"customer_id" integer NOT NULL,
  	"channel" "enum_ai_proposals_channel" NOT NULL,
  	"status" "enum_ai_proposals_status" DEFAULT 'active' NOT NULL,
  	"user_prompt" varchar NOT NULL,
  	"explanation" varchar NOT NULL,
  	"items" jsonb NOT NULL,
  	"total_amount" numeric NOT NULL,
  	"ai_raw_response" jsonb,
  	"model" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );

  DROP TABLE IF EXISTS "customer_addresses" CASCADE;
  DROP TABLE IF EXISTS "ai_conversations" CASCADE;

  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT IF EXISTS "payload_locked_documents_rels_customer_addresses_fk";
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT IF EXISTS "payload_locked_documents_rels_ai_conversations_fk";

  DROP INDEX IF EXISTS "orders_delivery_delivery_address_idx";
  DROP INDEX IF EXISTS "payload_locked_documents_rels_customer_addresses_id_idx";
  DROP INDEX IF EXISTS "payload_locked_documents_rels_ai_conversations_id_idx";
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN IF NOT EXISTS "ai_proposals_id" integer;
  ALTER TABLE "ai_proposals" ADD CONSTRAINT "ai_proposals_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX IF NOT EXISTS "ai_proposals_customer_idx" ON "ai_proposals" USING btree ("customer_id");
  CREATE INDEX IF NOT EXISTS "ai_proposals_updated_at_idx" ON "ai_proposals" USING btree ("updated_at");
  CREATE INDEX IF NOT EXISTS "ai_proposals_created_at_idx" ON "ai_proposals" USING btree ("created_at");
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_ai_proposals_fk" FOREIGN KEY ("ai_proposals_id") REFERENCES "public"."ai_proposals"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_ai_proposals_id_idx" ON "payload_locked_documents_rels" USING btree ("ai_proposals_id");
  ALTER TABLE "orders_items" DROP COLUMN IF EXISTS "comment";
  ALTER TABLE "orders" DROP COLUMN IF EXISTS "source";
  ALTER TABLE "orders" DROP COLUMN IF EXISTS "channel";
  ALTER TABLE "orders" DROP COLUMN IF EXISTS "last_edited_by";
  ALTER TABLE "orders" DROP COLUMN IF EXISTS "totals_discount_amount";
  ALTER TABLE "orders" DROP COLUMN IF EXISTS "totals_delivery_amount";
  ALTER TABLE "orders" DROP COLUMN IF EXISTS "delivery_address_id";
  ALTER TABLE "orders" DROP COLUMN IF EXISTS "delivery_address_snapshot";
  ALTER TABLE "orders" DROP COLUMN IF EXISTS "delivery_apartment_snapshot";
  ALTER TABLE "orders" DROP COLUMN IF EXISTS "delivery_intercom_snapshot";
  ALTER TABLE "orders" DROP COLUMN IF EXISTS "delivery_entrance_snapshot";
  ALTER TABLE "orders" DROP COLUMN IF EXISTS "delivery_floor_snapshot";
  ALTER TABLE "orders" DROP COLUMN IF EXISTS "delivery_customer_comment";
  ALTER TABLE "orders" DROP COLUMN IF EXISTS "delivery_courier_comment";
  ALTER TABLE "orders" DROP COLUMN IF EXISTS "delivery_requested_at";
  ALTER TABLE "orders" DROP COLUMN IF EXISTS "payment_method";
  ALTER TABLE "orders" DROP COLUMN IF EXISTS "payment_status";
  ALTER TABLE "orders" DROP COLUMN IF EXISTS "payment_provider";
  ALTER TABLE "orders" DROP COLUMN IF EXISTS "payment_external_payment_id";
  ALTER TABLE "orders" DROP COLUMN IF EXISTS "ai_prompt";
  ALTER TABLE "orders" DROP COLUMN IF EXISTS "ai_explanation";
  ALTER TABLE "orders" DROP COLUMN IF EXISTS "ai_model";
  ALTER TABLE "orders" DROP COLUMN IF EXISTS "ai_raw_response";
  ALTER TABLE "orders" DROP COLUMN IF EXISTS "submitted_at";
  ALTER TABLE "orders" DROP COLUMN IF EXISTS "paid_at";
  ALTER TABLE "orders" DROP COLUMN IF EXISTS "cancelled_at";
  ALTER TABLE "orders" DROP COLUMN IF EXISTS "internal_notes";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN IF EXISTS "customer_addresses_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN IF EXISTS "ai_conversations_id";
  DROP TYPE IF EXISTS "public"."enum_customer_addresses_status";
  DROP TYPE IF EXISTS "public"."enum_orders_source";
  DROP TYPE IF EXISTS "public"."enum_orders_channel";
  DROP TYPE IF EXISTS "public"."enum_orders_last_edited_by";
  DROP TYPE IF EXISTS "public"."enum_orders_payment_method";
  DROP TYPE IF EXISTS "public"."enum_orders_payment_status";
  DROP TYPE IF EXISTS "public"."enum_ai_conversations_channel";
  DROP TYPE IF EXISTS "public"."enum_ai_conversations_status";`);
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "ai_proposals" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "ai_proposals" CASCADE;
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_ai_proposals_fk";
  DROP INDEX "payload_locked_documents_rels_ai_proposals_id_idx";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "ai_proposals_id";
  DROP TYPE "public"."enum_ai_proposals_channel";
  DROP TYPE "public"."enum_ai_proposals_status";`);
}
