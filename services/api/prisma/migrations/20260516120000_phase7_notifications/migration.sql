-- Phase 7: Push notifications + device tokens + preferences

-- CreateEnum (idempotent — baseline may already define PushPlatform)
DO $do$ BEGIN
  CREATE TYPE "PushPlatform" AS ENUM ('ANDROID', 'IOS', 'WEB');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $do$;

-- AlterEnum NotificationType
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'SOS_EMERGENCY';
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'DRIVER_OFFLINE';
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'TRIP_DELAYED';
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'SUBSCRIPTION_EXPIRY';
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'SCHOOL_ANNOUNCEMENT';

-- AlterEnum NotificationStatus
ALTER TYPE "NotificationStatus" ADD VALUE IF NOT EXISTS 'PROCESSING';
ALTER TYPE "NotificationStatus" ADD VALUE IF NOT EXISTS 'DELIVERED';
ALTER TYPE "NotificationStatus" ADD VALUE IF NOT EXISTS 'DEAD_LETTER';

-- AlterTable notifications
ALTER TABLE "notifications" ADD COLUMN IF NOT EXISTS "locale" TEXT NOT NULL DEFAULT 'en';
ALTER TABLE "notifications" ADD COLUMN IF NOT EXISTS "deep_link" TEXT;
ALTER TABLE "notifications" ADD COLUMN IF NOT EXISTS "metadata" JSONB;
ALTER TABLE "notifications" ADD COLUMN IF NOT EXISTS "delivered_at" TIMESTAMP(3);
ALTER TABLE "notifications" ADD COLUMN IF NOT EXISTS "clicked_at" TIMESTAMP(3);
ALTER TABLE "notifications" ADD COLUMN IF NOT EXISTS "attempt_count" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "notifications" ADD COLUMN IF NOT EXISTS "last_error" TEXT;

-- CreateTable device_push_tokens
CREATE TABLE IF NOT EXISTS "device_push_tokens" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "school_id" UUID,
    "device_id" TEXT NOT NULL,
    "fcm_token" TEXT NOT NULL,
    "platform" "PushPlatform" NOT NULL,
    "app_version" TEXT,
    "device_info" JSONB,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "last_active_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "device_push_tokens_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "uq_device_push_tokens_user_device" ON "device_push_tokens"("user_id", "device_id");
CREATE INDEX IF NOT EXISTS "idx_device_push_tokens_school_active" ON "device_push_tokens"("school_id", "is_active");
CREATE INDEX IF NOT EXISTS "idx_device_push_tokens_fcm" ON "device_push_tokens"("fcm_token");

DO $do$ BEGIN
  ALTER TABLE "device_push_tokens" ADD CONSTRAINT "device_push_tokens_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $do$;

-- CreateTable notification_preferences
CREATE TABLE IF NOT EXISTS "notification_preferences" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "school_id" UUID,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "enabled_types" JSONB,
    "quiet_hours_start" TEXT,
    "quiet_hours_end" TEXT,
    "locale" TEXT NOT NULL DEFAULT 'en',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "notification_preferences_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "notification_preferences_user_id_key" ON "notification_preferences"("user_id");

DO $do$ BEGIN
  ALTER TABLE "notification_preferences" ADD CONSTRAINT "notification_preferences_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $do$;
