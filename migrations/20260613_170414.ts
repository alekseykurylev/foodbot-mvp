import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_ai_conversations_channel" AS ENUM('telegram', 'max');
  CREATE TYPE "public"."enum_ai_conversations_status" AS ENUM('active', 'completed');
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
  
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "ai_conversations_id" integer;
  ALTER TABLE "ai_conversations" ADD CONSTRAINT "ai_conversations_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "ai_conversations" ADD CONSTRAINT "ai_conversations_cart_id_orders_id_fk" FOREIGN KEY ("cart_id") REFERENCES "public"."orders"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "ai_conversations_customer_idx" ON "ai_conversations" USING btree ("customer_id");
  CREATE INDEX "ai_conversations_cart_idx" ON "ai_conversations" USING btree ("cart_id");
  CREATE INDEX "ai_conversations_updated_at_idx" ON "ai_conversations" USING btree ("updated_at");
  CREATE INDEX "ai_conversations_created_at_idx" ON "ai_conversations" USING btree ("created_at");
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_ai_conversations_fk" FOREIGN KEY ("ai_conversations_id") REFERENCES "public"."ai_conversations"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "payload_locked_documents_rels_ai_conversations_id_idx" ON "payload_locked_documents_rels" USING btree ("ai_conversations_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "ai_conversations" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "ai_conversations" CASCADE;
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_ai_conversations_fk";
  
  DROP INDEX "payload_locked_documents_rels_ai_conversations_id_idx";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "ai_conversations_id";
  DROP TYPE "public"."enum_ai_conversations_channel";
  DROP TYPE "public"."enum_ai_conversations_status";`)
}
