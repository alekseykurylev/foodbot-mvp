import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "variant_options" ADD COLUMN "image_id" integer;
  ALTER TABLE "variant_options" ADD CONSTRAINT "variant_options_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "variant_options_image_idx" ON "variant_options" USING btree ("image_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "variant_options" DROP CONSTRAINT "variant_options_image_id_media_id_fk";
  
  DROP INDEX "variant_options_image_idx";
  ALTER TABLE "variant_options" DROP COLUMN "image_id";`)
}
