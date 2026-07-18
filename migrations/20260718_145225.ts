import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TABLE "banners" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"image_id" integer NOT NULL,
  	"link" varchar,
  	"is_active" boolean DEFAULT true,
  	"sort_order" numeric DEFAULT 100,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "banners_id" integer;
  ALTER TABLE "banners" ADD CONSTRAINT "banners_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "banners_image_idx" ON "banners" USING btree ("image_id");
  CREATE INDEX "banners_updated_at_idx" ON "banners" USING btree ("updated_at");
  CREATE INDEX "banners_created_at_idx" ON "banners" USING btree ("created_at");
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_banners_fk" FOREIGN KEY ("banners_id") REFERENCES "public"."banners"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "payload_locked_documents_rels_banners_id_idx" ON "payload_locked_documents_rels" USING btree ("banners_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "banners" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "banners" CASCADE;
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_banners_fk";
  
  DROP INDEX "payload_locked_documents_rels_banners_id_idx";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "banners_id";`)
}
