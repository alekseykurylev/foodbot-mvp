import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

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
  
  ALTER TABLE "customer_addresses" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "ai_conversations" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "customer_addresses" CASCADE;
  DROP TABLE "ai_conversations" CASCADE;
  ALTER TABLE "orders" DROP CONSTRAINT "orders_delivery_address_id_customer_addresses_id_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_customer_addresses_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_ai_conversations_fk";
  
  DROP INDEX "orders_delivery_delivery_address_idx";
  DROP INDEX "payload_locked_documents_rels_customer_addresses_id_idx";
  DROP INDEX "payload_locked_documents_rels_ai_conversations_id_idx";
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "ai_proposals_id" integer;
  ALTER TABLE "ai_proposals" ADD CONSTRAINT "ai_proposals_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "ai_proposals_customer_idx" ON "ai_proposals" USING btree ("customer_id");
  CREATE INDEX "ai_proposals_updated_at_idx" ON "ai_proposals" USING btree ("updated_at");
  CREATE INDEX "ai_proposals_created_at_idx" ON "ai_proposals" USING btree ("created_at");
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_ai_proposals_fk" FOREIGN KEY ("ai_proposals_id") REFERENCES "public"."ai_proposals"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "payload_locked_documents_rels_ai_proposals_id_idx" ON "payload_locked_documents_rels" USING btree ("ai_proposals_id");
  ALTER TABLE "orders_items" DROP COLUMN "comment";
  ALTER TABLE "orders" DROP COLUMN "source";
  ALTER TABLE "orders" DROP COLUMN "channel";
  ALTER TABLE "orders" DROP COLUMN "last_edited_by";
  ALTER TABLE "orders" DROP COLUMN "totals_discount_amount";
  ALTER TABLE "orders" DROP COLUMN "totals_delivery_amount";
  ALTER TABLE "orders" DROP COLUMN "delivery_address_id";
  ALTER TABLE "orders" DROP COLUMN "delivery_address_snapshot";
  ALTER TABLE "orders" DROP COLUMN "delivery_apartment_snapshot";
  ALTER TABLE "orders" DROP COLUMN "delivery_intercom_snapshot";
  ALTER TABLE "orders" DROP COLUMN "delivery_entrance_snapshot";
  ALTER TABLE "orders" DROP COLUMN "delivery_floor_snapshot";
  ALTER TABLE "orders" DROP COLUMN "delivery_customer_comment";
  ALTER TABLE "orders" DROP COLUMN "delivery_courier_comment";
  ALTER TABLE "orders" DROP COLUMN "delivery_requested_at";
  ALTER TABLE "orders" DROP COLUMN "payment_method";
  ALTER TABLE "orders" DROP COLUMN "payment_status";
  ALTER TABLE "orders" DROP COLUMN "payment_provider";
  ALTER TABLE "orders" DROP COLUMN "payment_external_payment_id";
  ALTER TABLE "orders" DROP COLUMN "ai_prompt";
  ALTER TABLE "orders" DROP COLUMN "ai_explanation";
  ALTER TABLE "orders" DROP COLUMN "ai_model";
  ALTER TABLE "orders" DROP COLUMN "ai_raw_response";
  ALTER TABLE "orders" DROP COLUMN "submitted_at";
  ALTER TABLE "orders" DROP COLUMN "paid_at";
  ALTER TABLE "orders" DROP COLUMN "cancelled_at";
  ALTER TABLE "orders" DROP COLUMN "internal_notes";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "customer_addresses_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "ai_conversations_id";
  DROP TYPE "public"."enum_customer_addresses_status";
  DROP TYPE "public"."enum_orders_source";
  DROP TYPE "public"."enum_orders_channel";
  DROP TYPE "public"."enum_orders_last_edited_by";
  DROP TYPE "public"."enum_orders_payment_method";
  DROP TYPE "public"."enum_orders_payment_status";
  DROP TYPE "public"."enum_ai_conversations_channel";
  DROP TYPE "public"."enum_ai_conversations_status";`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_customer_addresses_status" AS ENUM('active', 'archived');
  CREATE TYPE "public"."enum_orders_source" AS ENUM('ai', 'manual', 'admin', 'reorder');
  CREATE TYPE "public"."enum_orders_channel" AS ENUM('telegram', 'max', 'mini_app', 'admin');
  CREATE TYPE "public"."enum_orders_last_edited_by" AS ENUM('ai', 'customer', 'admin');
  CREATE TYPE "public"."enum_orders_payment_method" AS ENUM('not_selected', 'cash', 'card_on_delivery', 'online');
  CREATE TYPE "public"."enum_orders_payment_status" AS ENUM('not_required', 'pending', 'paid', 'failed', 'refunded');
  CREATE TYPE "public"."enum_ai_conversations_channel" AS ENUM('telegram', 'max');
  CREATE TYPE "public"."enum_ai_conversations_status" AS ENUM('active', 'completed');
  CREATE TABLE "customer_addresses" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"customer_id" integer NOT NULL,
  	"label" varchar DEFAULT 'Дом' NOT NULL,
  	"full_address" varchar NOT NULL,
  	"apartment" varchar,
  	"intercom" varchar,
  	"entrance" varchar,
  	"floor" varchar,
  	"comment" varchar,
  	"is_default" boolean DEFAULT false,
  	"status" "enum_customer_addresses_status" DEFAULT 'active' NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "ai_conversations" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"customer_id" integer NOT NULL,
  	"channel" "enum_ai_conversations_channel" NOT NULL,
  	"status" "enum_ai_conversations_status" DEFAULT 'active' NOT NULL,
  	"original_prompt" varchar,
  	"messages" jsonb NOT NULL,
  	"collected_answers" jsonb,
  	"cart_id" integer,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  ALTER TABLE "ai_proposals" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "ai_proposals" CASCADE;
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_ai_proposals_fk";
  
  DROP INDEX "payload_locked_documents_rels_ai_proposals_id_idx";
  ALTER TABLE "orders_items" ADD COLUMN "comment" varchar;
  ALTER TABLE "orders" ADD COLUMN "source" "enum_orders_source" DEFAULT 'ai' NOT NULL;
  ALTER TABLE "orders" ADD COLUMN "channel" "enum_orders_channel" NOT NULL;
  ALTER TABLE "orders" ADD COLUMN "last_edited_by" "enum_orders_last_edited_by";
  ALTER TABLE "orders" ADD COLUMN "totals_discount_amount" numeric DEFAULT 0;
  ALTER TABLE "orders" ADD COLUMN "totals_delivery_amount" numeric DEFAULT 0;
  ALTER TABLE "orders" ADD COLUMN "delivery_address_id" integer;
  ALTER TABLE "orders" ADD COLUMN "delivery_address_snapshot" varchar;
  ALTER TABLE "orders" ADD COLUMN "delivery_apartment_snapshot" varchar;
  ALTER TABLE "orders" ADD COLUMN "delivery_intercom_snapshot" varchar;
  ALTER TABLE "orders" ADD COLUMN "delivery_entrance_snapshot" varchar;
  ALTER TABLE "orders" ADD COLUMN "delivery_floor_snapshot" varchar;
  ALTER TABLE "orders" ADD COLUMN "delivery_customer_comment" varchar;
  ALTER TABLE "orders" ADD COLUMN "delivery_courier_comment" varchar;
  ALTER TABLE "orders" ADD COLUMN "delivery_requested_at" timestamp(3) with time zone;
  ALTER TABLE "orders" ADD COLUMN "payment_method" "enum_orders_payment_method" DEFAULT 'not_selected';
  ALTER TABLE "orders" ADD COLUMN "payment_status" "enum_orders_payment_status" DEFAULT 'not_required';
  ALTER TABLE "orders" ADD COLUMN "payment_provider" varchar;
  ALTER TABLE "orders" ADD COLUMN "payment_external_payment_id" varchar;
  ALTER TABLE "orders" ADD COLUMN "ai_prompt" varchar;
  ALTER TABLE "orders" ADD COLUMN "ai_explanation" varchar;
  ALTER TABLE "orders" ADD COLUMN "ai_model" varchar;
  ALTER TABLE "orders" ADD COLUMN "ai_raw_response" jsonb;
  ALTER TABLE "orders" ADD COLUMN "submitted_at" timestamp(3) with time zone;
  ALTER TABLE "orders" ADD COLUMN "paid_at" timestamp(3) with time zone;
  ALTER TABLE "orders" ADD COLUMN "cancelled_at" timestamp(3) with time zone;
  ALTER TABLE "orders" ADD COLUMN "internal_notes" varchar;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "customer_addresses_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "ai_conversations_id" integer;
  ALTER TABLE "customer_addresses" ADD CONSTRAINT "customer_addresses_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "ai_conversations" ADD CONSTRAINT "ai_conversations_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "ai_conversations" ADD CONSTRAINT "ai_conversations_cart_id_orders_id_fk" FOREIGN KEY ("cart_id") REFERENCES "public"."orders"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "customer_addresses_customer_idx" ON "customer_addresses" USING btree ("customer_id");
  CREATE INDEX "customer_addresses_updated_at_idx" ON "customer_addresses" USING btree ("updated_at");
  CREATE INDEX "customer_addresses_created_at_idx" ON "customer_addresses" USING btree ("created_at");
  CREATE INDEX "ai_conversations_customer_idx" ON "ai_conversations" USING btree ("customer_id");
  CREATE INDEX "ai_conversations_cart_idx" ON "ai_conversations" USING btree ("cart_id");
  CREATE INDEX "ai_conversations_updated_at_idx" ON "ai_conversations" USING btree ("updated_at");
  CREATE INDEX "ai_conversations_created_at_idx" ON "ai_conversations" USING btree ("created_at");
  ALTER TABLE "orders" ADD CONSTRAINT "orders_delivery_address_id_customer_addresses_id_fk" FOREIGN KEY ("delivery_address_id") REFERENCES "public"."customer_addresses"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_customer_addresses_fk" FOREIGN KEY ("customer_addresses_id") REFERENCES "public"."customer_addresses"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_ai_conversations_fk" FOREIGN KEY ("ai_conversations_id") REFERENCES "public"."ai_conversations"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "orders_delivery_delivery_address_idx" ON "orders" USING btree ("delivery_address_id");
  CREATE INDEX "payload_locked_documents_rels_customer_addresses_id_idx" ON "payload_locked_documents_rels" USING btree ("customer_addresses_id");
  CREATE INDEX "payload_locked_documents_rels_ai_conversations_id_idx" ON "payload_locked_documents_rels" USING btree ("ai_conversations_id");
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "ai_proposals_id";
  DROP TYPE "public"."enum_ai_proposals_channel";
  DROP TYPE "public"."enum_ai_proposals_status";`)
}
