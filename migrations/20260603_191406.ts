import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_customer_addresses_status" AS ENUM('active', 'archived');
  CREATE TYPE "public"."enum_orders_status" AS ENUM('proposal', 'cart', 'submitted', 'pending_payment', 'paid', 'completed', 'cancelled', 'expired');
  CREATE TYPE "public"."enum_orders_source" AS ENUM('ai', 'manual', 'admin', 'reorder');
  CREATE TYPE "public"."enum_orders_channel" AS ENUM('telegram', 'max', 'mini_app', 'admin');
  CREATE TYPE "public"."enum_orders_payment_method" AS ENUM('not_selected', 'cash', 'card_on_delivery', 'online');
  CREATE TYPE "public"."enum_orders_payment_status" AS ENUM('not_required', 'pending', 'paid', 'failed', 'refunded');
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
  
  CREATE TABLE "orders_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"product_id" integer NOT NULL,
  	"product_name_snapshot" varchar NOT NULL,
  	"unit_price_snapshot" numeric NOT NULL,
  	"quantity" numeric DEFAULT 1 NOT NULL,
  	"line_total_snapshot" numeric NOT NULL,
  	"comment" varchar
  );
  
  CREATE TABLE "orders" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order_number" varchar,
  	"public_token" varchar NOT NULL,
  	"customer_id" integer NOT NULL,
  	"status" "enum_orders_status" DEFAULT 'proposal' NOT NULL,
  	"source" "enum_orders_source" DEFAULT 'ai' NOT NULL,
  	"channel" "enum_orders_channel" NOT NULL,
  	"totals_subtotal_amount" numeric DEFAULT 0 NOT NULL,
  	"totals_discount_amount" numeric DEFAULT 0,
  	"totals_delivery_amount" numeric DEFAULT 0,
  	"totals_total_amount" numeric DEFAULT 0 NOT NULL,
  	"delivery_address_id" integer,
  	"delivery_address_snapshot" varchar,
  	"delivery_apartment_snapshot" varchar,
  	"delivery_intercom_snapshot" varchar,
  	"delivery_entrance_snapshot" varchar,
  	"delivery_floor_snapshot" varchar,
  	"delivery_customer_comment" varchar,
  	"delivery_courier_comment" varchar,
  	"delivery_requested_at" timestamp(3) with time zone,
  	"payment_method" "enum_orders_payment_method" DEFAULT 'not_selected',
  	"payment_status" "enum_orders_payment_status" DEFAULT 'not_required',
  	"payment_provider" varchar,
  	"payment_external_payment_id" varchar,
  	"ai_prompt" varchar,
  	"ai_explanation" varchar,
  	"ai_model" varchar,
  	"ai_raw_response" jsonb,
  	"expires_at" timestamp(3) with time zone,
  	"submitted_at" timestamp(3) with time zone,
  	"paid_at" timestamp(3) with time zone,
  	"cancelled_at" timestamp(3) with time zone,
  	"internal_notes" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  ALTER TABLE "customers_addresses" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "customers_addresses" CASCADE;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "customer_addresses_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "orders_id" integer;
  ALTER TABLE "customer_addresses" ADD CONSTRAINT "customer_addresses_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "orders_items" ADD CONSTRAINT "orders_items_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "orders_items" ADD CONSTRAINT "orders_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "orders" ADD CONSTRAINT "orders_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "orders" ADD CONSTRAINT "orders_delivery_address_id_customer_addresses_id_fk" FOREIGN KEY ("delivery_address_id") REFERENCES "public"."customer_addresses"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "customer_addresses_customer_idx" ON "customer_addresses" USING btree ("customer_id");
  CREATE INDEX "customer_addresses_updated_at_idx" ON "customer_addresses" USING btree ("updated_at");
  CREATE INDEX "customer_addresses_created_at_idx" ON "customer_addresses" USING btree ("created_at");
  CREATE INDEX "orders_items_order_idx" ON "orders_items" USING btree ("_order");
  CREATE INDEX "orders_items_parent_id_idx" ON "orders_items" USING btree ("_parent_id");
  CREATE INDEX "orders_items_product_idx" ON "orders_items" USING btree ("product_id");
  CREATE UNIQUE INDEX "orders_order_number_idx" ON "orders" USING btree ("order_number");
  CREATE UNIQUE INDEX "orders_public_token_idx" ON "orders" USING btree ("public_token");
  CREATE INDEX "orders_customer_idx" ON "orders" USING btree ("customer_id");
  CREATE INDEX "orders_delivery_delivery_address_idx" ON "orders" USING btree ("delivery_address_id");
  CREATE INDEX "orders_updated_at_idx" ON "orders" USING btree ("updated_at");
  CREATE INDEX "orders_created_at_idx" ON "orders" USING btree ("created_at");
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_customer_addresses_fk" FOREIGN KEY ("customer_addresses_id") REFERENCES "public"."customer_addresses"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_orders_fk" FOREIGN KEY ("orders_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "payload_locked_documents_rels_customer_addresses_id_idx" ON "payload_locked_documents_rels" USING btree ("customer_addresses_id");
  CREATE INDEX "payload_locked_documents_rels_orders_id_idx" ON "payload_locked_documents_rels" USING btree ("orders_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   CREATE TABLE "customers_addresses" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"label" varchar,
  	"apartment" varchar,
  	"intercom" varchar,
  	"entrance" varchar,
  	"floor" varchar,
  	"comment" varchar,
  	"is_default" boolean DEFAULT false
  );
  
  ALTER TABLE "customer_addresses" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "orders_items" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "orders" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "customer_addresses" CASCADE;
  DROP TABLE "orders_items" CASCADE;
  DROP TABLE "orders" CASCADE;
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_customer_addresses_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_orders_fk";
  
  DROP INDEX "payload_locked_documents_rels_customer_addresses_id_idx";
  DROP INDEX "payload_locked_documents_rels_orders_id_idx";
  ALTER TABLE "customers_addresses" ADD CONSTRAINT "customers_addresses_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."customers"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "customers_addresses_order_idx" ON "customers_addresses" USING btree ("_order");
  CREATE INDEX "customers_addresses_parent_id_idx" ON "customers_addresses" USING btree ("_parent_id");
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "customer_addresses_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "orders_id";
  DROP TYPE "public"."enum_customer_addresses_status";
  DROP TYPE "public"."enum_orders_status";
  DROP TYPE "public"."enum_orders_source";
  DROP TYPE "public"."enum_orders_channel";
  DROP TYPE "public"."enum_orders_payment_method";
  DROP TYPE "public"."enum_orders_payment_status";`)
}
