import { MigrateUpArgs, MigrateDownArgs, sql } from "@payloadcms/db-postgres";

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
  ALTER TABLE "ai_proposals" ALTER COLUMN "status" SET DATA TYPE text;
  UPDATE "ai_proposals"
  SET "status" = CASE
    WHEN "status" IN ('processing', 'ready', 'no_match', 'failed') THEN "status"
    ELSE 'failed'
  END;
  ALTER TABLE "ai_proposals" ALTER COLUMN "status" SET DEFAULT 'processing'::text;
  DROP TYPE "public"."enum_ai_proposals_status";
  CREATE TYPE "public"."enum_ai_proposals_status" AS ENUM('processing', 'ready', 'no_match', 'failed');
  ALTER TABLE "ai_proposals" ALTER COLUMN "status" SET DEFAULT 'processing'::"public"."enum_ai_proposals_status";
  ALTER TABLE "ai_proposals" ALTER COLUMN "status" SET DATA TYPE "public"."enum_ai_proposals_status" USING "status"::"public"."enum_ai_proposals_status";
  DROP INDEX "ai_proposals_provider_user_id_idx";
  ALTER TABLE "ai_proposals" DROP COLUMN "provider_user_id";
  ALTER TABLE "ai_proposals" DROP COLUMN "expires_at";
  ALTER TABLE "ai_proposals" DROP COLUMN "processing_started_at";`);
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
  ALTER TABLE "ai_proposals" ALTER COLUMN "status" SET DATA TYPE text;
  ALTER TABLE "ai_proposals" ALTER COLUMN "status" SET DEFAULT 'awaiting_prompt'::text;
  DROP TYPE "public"."enum_ai_proposals_status";
  CREATE TYPE "public"."enum_ai_proposals_status" AS ENUM('awaiting_prompt', 'processing', 'ready', 'no_match', 'failed', 'expired', 'cancelled');
  ALTER TABLE "ai_proposals" ALTER COLUMN "status" SET DEFAULT 'awaiting_prompt'::"public"."enum_ai_proposals_status";
  ALTER TABLE "ai_proposals" ALTER COLUMN "status" SET DATA TYPE "public"."enum_ai_proposals_status" USING "status"::"public"."enum_ai_proposals_status";
  ALTER TABLE "ai_proposals" ADD COLUMN "provider_user_id" varchar;
  UPDATE "ai_proposals" SET "provider_user_id" = 'legacy:' || "id" WHERE "provider_user_id" IS NULL;
  ALTER TABLE "ai_proposals" ALTER COLUMN "provider_user_id" SET NOT NULL;
  ALTER TABLE "ai_proposals" ADD COLUMN "expires_at" timestamp(3) with time zone;
  ALTER TABLE "ai_proposals" ADD COLUMN "processing_started_at" timestamp(3) with time zone;
  CREATE INDEX "ai_proposals_provider_user_id_idx" ON "ai_proposals" USING btree ("provider_user_id");`);
}
