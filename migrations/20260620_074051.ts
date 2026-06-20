import { MigrateUpArgs, MigrateDownArgs, sql } from "@payloadcms/db-postgres";

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "ai_proposals" ALTER COLUMN "status" SET DATA TYPE text;
  UPDATE "ai_proposals"
  SET "status" = CASE
    WHEN "status" IN ('active', 'applied') THEN 'ready'
    WHEN "status" = 'expired' THEN 'expired'
    ELSE 'failed'
  END;
  ALTER TABLE "ai_proposals" ALTER COLUMN "status" SET DEFAULT 'awaiting_prompt'::text;
  DROP TYPE "public"."enum_ai_proposals_status";
  CREATE TYPE "public"."enum_ai_proposals_status" AS ENUM('awaiting_prompt', 'processing', 'ready', 'no_match', 'failed', 'expired', 'cancelled');
  ALTER TABLE "ai_proposals" ALTER COLUMN "status" SET DEFAULT 'awaiting_prompt'::"public"."enum_ai_proposals_status";
  ALTER TABLE "ai_proposals" ALTER COLUMN "status" SET DATA TYPE "public"."enum_ai_proposals_status" USING "status"::"public"."enum_ai_proposals_status";
  ALTER TABLE "ai_proposals" ALTER COLUMN "user_prompt" DROP NOT NULL;
  ALTER TABLE "ai_proposals" ALTER COLUMN "explanation" DROP NOT NULL;
  ALTER TABLE "ai_proposals" ALTER COLUMN "items" DROP NOT NULL;
  ALTER TABLE "ai_proposals" ALTER COLUMN "total_amount" SET DEFAULT 0;
  ALTER TABLE "ai_proposals" ALTER COLUMN "total_amount" DROP NOT NULL;
  ALTER TABLE "ai_proposals" ADD COLUMN "provider_user_id" varchar;
  UPDATE "ai_proposals" SET "provider_user_id" = 'legacy:' || "id" WHERE "provider_user_id" IS NULL;
  ALTER TABLE "ai_proposals" ALTER COLUMN "provider_user_id" SET NOT NULL;
  ALTER TABLE "ai_proposals" ADD COLUMN "expires_at" timestamp(3) with time zone;
  ALTER TABLE "ai_proposals" ADD COLUMN "processing_started_at" timestamp(3) with time zone;
  ALTER TABLE "ai_proposals" ADD COLUMN "error_message" varchar;
  CREATE INDEX "ai_proposals_provider_user_id_idx" ON "ai_proposals" USING btree ("provider_user_id");`);
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "ai_proposals" ALTER COLUMN "status" SET DATA TYPE text;
  UPDATE "ai_proposals"
  SET "status" = CASE
    WHEN "status" = 'expired' THEN 'expired'
    ELSE 'active'
  END;
  ALTER TABLE "ai_proposals" ALTER COLUMN "status" SET DEFAULT 'active'::text;
  DROP TYPE "public"."enum_ai_proposals_status";
  CREATE TYPE "public"."enum_ai_proposals_status" AS ENUM('active', 'applied', 'expired');
  ALTER TABLE "ai_proposals" ALTER COLUMN "status" SET DEFAULT 'active'::"public"."enum_ai_proposals_status";
  ALTER TABLE "ai_proposals" ALTER COLUMN "status" SET DATA TYPE "public"."enum_ai_proposals_status" USING "status"::"public"."enum_ai_proposals_status";
  DROP INDEX "ai_proposals_provider_user_id_idx";
  UPDATE "ai_proposals" SET "user_prompt" = '' WHERE "user_prompt" IS NULL;
  UPDATE "ai_proposals" SET "explanation" = '' WHERE "explanation" IS NULL;
  UPDATE "ai_proposals" SET "items" = '[]'::jsonb WHERE "items" IS NULL;
  UPDATE "ai_proposals" SET "total_amount" = 0 WHERE "total_amount" IS NULL;
  ALTER TABLE "ai_proposals" ALTER COLUMN "user_prompt" SET NOT NULL;
  ALTER TABLE "ai_proposals" ALTER COLUMN "explanation" SET NOT NULL;
  ALTER TABLE "ai_proposals" ALTER COLUMN "items" SET NOT NULL;
  ALTER TABLE "ai_proposals" ALTER COLUMN "total_amount" DROP DEFAULT;
  ALTER TABLE "ai_proposals" ALTER COLUMN "total_amount" SET NOT NULL;
  ALTER TABLE "ai_proposals" DROP COLUMN "provider_user_id";
  ALTER TABLE "ai_proposals" DROP COLUMN "expires_at";
  ALTER TABLE "ai_proposals" DROP COLUMN "processing_started_at";
  ALTER TABLE "ai_proposals" DROP COLUMN "error_message";`);
}
