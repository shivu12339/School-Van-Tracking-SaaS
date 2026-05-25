-- PostGIS must exist before geography columns
CREATE EXTENSION IF NOT EXISTS postgis;

-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "RoleCode" AS ENUM ('SUPER_ADMIN', 'SCHOOL_ADMIN', 'DRIVER', 'PARENT');

-- CreateEnum
CREATE TYPE "TripStatus" AS ENUM ('SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "TripDirection" AS ENUM ('PICKUP', 'DROPOFF', 'RETURN');

-- CreateEnum
CREATE TYPE "TripStudentStatus" AS ENUM ('PENDING', 'PICKED', 'DROPPED', 'ABSENT');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('VAN_WITHIN_1KM', 'VAN_WITHIN_500M', 'STUDENT_PICKED', 'STUDENT_DROPPED', 'VAN_REACHED_SCHOOL', 'RETURN_TRIP_STARTED', 'SOS_EMERGENCY', 'DRIVER_OFFLINE', 'TRIP_DELAYED', 'SUBSCRIPTION_EXPIRY', 'SCHOOL_ANNOUNCEMENT');

-- CreateEnum
CREATE TYPE "NotificationStatus" AS ENUM ('QUEUED', 'PROCESSING', 'SENT', 'DELIVERED', 'FAILED', 'DEAD_LETTER');

-- CreateEnum
CREATE TYPE "PushPlatform" AS ENUM ('ANDROID', 'IOS', 'WEB');

-- CreateEnum
CREATE TYPE "SessionStatus" AS ENUM ('ACTIVE', 'REVOKED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "AuditAction" AS ENUM ('CREATE', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT', 'START_TRIP', 'STOP_TRIP', 'PICK_STUDENT', 'DROP_STUDENT');

-- CreateEnum
CREATE TYPE "EmergencySeverity" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- CreateEnum
CREATE TYPE "PlanTier" AS ENUM ('BASIC', 'STANDARD', 'PREMIUM');

-- CreateEnum
CREATE TYPE "SchoolOperationalStatus" AS ENUM ('PENDING', 'ACTIVE', 'SUSPENDED', 'TRIAL');

-- CreateEnum
CREATE TYPE "BillingStatus" AS ENUM ('TRIAL', 'ACTIVE', 'PAST_DUE', 'CANCELLED', 'GRACE');

-- CreateTable
CREATE TABLE "plan_catalog" (
    "id" UUID NOT NULL,
    "tier" "PlanTier" NOT NULL,
    "name" TEXT NOT NULL,
    "monthly_price" DECIMAL(12,2) NOT NULL,
    "max_vans" INTEGER NOT NULL,
    "max_drivers" INTEGER NOT NULL,
    "max_students" INTEGER NOT NULL,
    "tracking_logs_per_day" INTEGER NOT NULL,
    "analytics_enabled" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "plan_catalog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "schools" (
    "id" UUID NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "timezone" TEXT NOT NULL DEFAULT 'Asia/Kolkata',
    "address" TEXT,
    "language" TEXT NOT NULL DEFAULT 'en',
    "logo_url" TEXT,
    "primary_color" TEXT,
    "secondary_color" TEXT,
    "status" "SchoolOperationalStatus" NOT NULL DEFAULT 'PENDING',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "trial_ends_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "schools_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "school_settings" (
    "id" UUID NOT NULL,
    "school_id" UUID NOT NULL,
    "pickup_radius_1km" INTEGER NOT NULL DEFAULT 1000,
    "pickup_radius_500m" INTEGER NOT NULL DEFAULT 500,
    "notifications_enabled" BOOLEAN NOT NULL DEFAULT true,
    "live_tracking_enabled" BOOLEAN NOT NULL DEFAULT true,
    "sos_enabled" BOOLEAN NOT NULL DEFAULT true,
    "contact_email" TEXT,
    "contact_phone" TEXT,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "school_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "school_subscriptions" (
    "id" UUID NOT NULL,
    "school_id" UUID NOT NULL,
    "plan_catalog_id" UUID NOT NULL,
    "billing_status" "BillingStatus" NOT NULL DEFAULT 'TRIAL',
    "starts_at" TIMESTAMP(3) NOT NULL,
    "ends_at" TIMESTAMP(3),
    "grace_ends_at" TIMESTAMP(3),
    "trial_ends_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "school_subscriptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "subscription_plans" (
    "id" UUID NOT NULL,
    "school_id" UUID NOT NULL,
    "plan_name" TEXT NOT NULL,
    "monthly_price" DECIMAL(12,2) NOT NULL,
    "billing_currency" TEXT NOT NULL DEFAULT 'INR',
    "max_vans" INTEGER NOT NULL DEFAULT 0,
    "max_students" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "starts_at" TIMESTAMP(3),
    "ends_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "subscription_plans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "roles" (
    "id" UUID NOT NULL,
    "school_id" UUID,
    "code" "RoleCode" NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "is_system" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "permissions" (
    "id" UUID NOT NULL,
    "key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "permissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "role_permissions" (
    "id" UUID NOT NULL,
    "role_id" UUID NOT NULL,
    "permission_id" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "role_permissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL,
    "school_id" UUID,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "first_name" TEXT NOT NULL,
    "last_name" TEXT,
    "phone" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "failed_login_attempts" INTEGER NOT NULL DEFAULT 0,
    "locked_until" TIMESTAMP(3),
    "password_reset_token_hash" TEXT,
    "password_reset_expires_at" TIMESTAMP(3),
    "last_login_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_roles" (
    "id" UUID NOT NULL,
    "school_id" UUID,
    "user_id" UUID NOT NULL,
    "role_id" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "drivers" (
    "id" UUID NOT NULL,
    "school_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "employee_code" TEXT,
    "license_number" TEXT NOT NULL,
    "license_valid_till" TIMESTAMP(3),
    "is_available" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "drivers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "parents" (
    "id" UUID NOT NULL,
    "school_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "relationship" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "parents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "students" (
    "id" UUID NOT NULL,
    "school_id" UUID NOT NULL,
    "parent_id" UUID NOT NULL,
    "route_id" UUID,
    "admission_number" TEXT NOT NULL,
    "full_name" TEXT NOT NULL,
    "grade" TEXT,
    "section" TEXT,
    "home_address" TEXT,
    "home_latitude" DECIMAL(10,8),
    "home_longitude" DECIMAL(11,8),
    "home_location" geography(Point, 4326),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "students_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vans" (
    "id" UUID NOT NULL,
    "school_id" UUID NOT NULL,
    "registration_no" TEXT NOT NULL,
    "label" TEXT,
    "capacity" INTEGER NOT NULL,
    "gps_device_code" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "current_latitude" DECIMAL(10,8),
    "current_longitude" DECIMAL(11,8),
    "current_location" geography(Point, 4326),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "vans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "routes" (
    "id" UUID NOT NULL,
    "school_id" UUID NOT NULL,
    "van_id" UUID,
    "route_code" TEXT NOT NULL,
    "route_name" TEXT NOT NULL,
    "direction" "TripDirection" NOT NULL DEFAULT 'PICKUP',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "routes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "route_stops" (
    "id" UUID NOT NULL,
    "school_id" UUID NOT NULL,
    "route_id" UUID NOT NULL,
    "stop_name" TEXT NOT NULL,
    "stop_order" INTEGER NOT NULL,
    "stop_latitude" DECIMAL(10,8),
    "stop_longitude" DECIMAL(11,8),
    "stop_location" geography(Point, 4326),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "route_stops_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "trips" (
    "id" UUID NOT NULL,
    "school_id" UUID NOT NULL,
    "route_id" UUID NOT NULL,
    "van_id" UUID NOT NULL,
    "driver_id" UUID NOT NULL,
    "trip_date" TIMESTAMP(3) NOT NULL,
    "direction" "TripDirection" NOT NULL DEFAULT 'PICKUP',
    "status" "TripStatus" NOT NULL DEFAULT 'SCHEDULED',
    "started_at" TIMESTAMP(3),
    "ended_at" TIMESTAMP(3),
    "start_location" geography(Point, 4326),
    "end_location" geography(Point, 4326),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "trips_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "trip_students" (
    "id" UUID NOT NULL,
    "school_id" UUID NOT NULL,
    "trip_id" UUID NOT NULL,
    "student_id" UUID NOT NULL,
    "stop_id" UUID,
    "status" "TripStudentStatus" NOT NULL DEFAULT 'PENDING',
    "pickup_at" TIMESTAMP(3),
    "drop_at" TIMESTAMP(3),
    "attendance_note" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "trip_students_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tracking_logs" (
    "id" UUID NOT NULL,
    "school_id" UUID NOT NULL,
    "trip_id" UUID NOT NULL,
    "van_id" UUID,
    "latitude" DECIMAL(10,8) NOT NULL,
    "longitude" DECIMAL(11,8) NOT NULL,
    "heading" DECIMAL(6,2),
    "speed" DECIMAL(6,2),
    "accuracy" DECIMAL(6,2),
    "location" geography(Point, 4326),
    "event_timestamp" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tracking_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" UUID NOT NULL,
    "school_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "parent_id" UUID,
    "trip_id" UUID,
    "type" "NotificationType" NOT NULL,
    "status" "NotificationStatus" NOT NULL DEFAULT 'QUEUED',
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "locale" TEXT NOT NULL DEFAULT 'en',
    "deep_link" TEXT,
    "metadata" JSONB,
    "read_at" TIMESTAMP(3),
    "sent_at" TIMESTAMP(3),
    "delivered_at" TIMESTAMP(3),
    "clicked_at" TIMESTAMP(3),
    "failed_at" TIMESTAMP(3),
    "provider_ref" TEXT,
    "attempt_count" INTEGER NOT NULL DEFAULT 0,
    "last_error" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "device_push_tokens" (
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

-- CreateTable
CREATE TABLE "notification_preferences" (
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

-- CreateTable
CREATE TABLE "refresh_tokens" (
    "id" UUID NOT NULL,
    "school_id" UUID,
    "user_id" UUID NOT NULL,
    "token_hash" TEXT NOT NULL,
    "family_id" UUID NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "revoked_at" TIMESTAMP(3),
    "status" "SessionStatus" NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "refresh_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "device_sessions" (
    "id" UUID NOT NULL,
    "school_id" UUID,
    "user_id" UUID NOT NULL,
    "refresh_token_id" UUID,
    "device_id" TEXT NOT NULL,
    "platform" TEXT NOT NULL,
    "app_version" TEXT,
    "ip_address" TEXT,
    "user_agent" TEXT,
    "status" "SessionStatus" NOT NULL DEFAULT 'ACTIVE',
    "last_seen_at" TIMESTAMP(3),
    "expires_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "device_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" UUID NOT NULL,
    "school_id" UUID,
    "actor_user_id" UUID,
    "action" "AuditAction" NOT NULL,
    "entity_type" TEXT NOT NULL,
    "entity_id" TEXT,
    "metadata" JSONB,
    "ip_address" TEXT,
    "user_agent" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "emergency_alerts" (
    "id" UUID NOT NULL,
    "school_id" UUID NOT NULL,
    "trip_id" UUID,
    "triggered_by_id" UUID,
    "severity" "EmergencySeverity" NOT NULL DEFAULT 'HIGH',
    "description" TEXT,
    "latitude" DECIMAL(10,8),
    "longitude" DECIMAL(11,8),
    "location" geography(Point, 4326),
    "resolved_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "emergency_alerts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "plan_catalog_tier_key" ON "plan_catalog"("tier");

-- CreateIndex
CREATE UNIQUE INDEX "schools_code_key" ON "schools"("code");

-- CreateIndex
CREATE INDEX "idx_schools_active_created" ON "schools"("is_active", "created_at");

-- CreateIndex
CREATE INDEX "idx_schools_deleted_at" ON "schools"("deleted_at");

-- CreateIndex
CREATE INDEX "idx_schools_status_active" ON "schools"("status", "is_active");

-- CreateIndex
CREATE UNIQUE INDEX "school_settings_school_id_key" ON "school_settings"("school_id");

-- CreateIndex
CREATE UNIQUE INDEX "school_subscriptions_school_id_key" ON "school_subscriptions"("school_id");

-- CreateIndex
CREATE INDEX "idx_school_subscriptions_billing" ON "school_subscriptions"("billing_status", "ends_at");

-- CreateIndex
CREATE INDEX "idx_subscription_plans_school_active" ON "subscription_plans"("school_id", "is_active");

-- CreateIndex
CREATE INDEX "idx_subscription_plans_school_deleted" ON "subscription_plans"("school_id", "deleted_at");

-- CreateIndex
CREATE INDEX "idx_roles_school_deleted" ON "roles"("school_id", "deleted_at");

-- CreateIndex
CREATE UNIQUE INDEX "uq_roles_school_code" ON "roles"("school_id", "code");

-- CreateIndex
CREATE UNIQUE INDEX "permissions_key_key" ON "permissions"("key");

-- CreateIndex
CREATE INDEX "idx_role_permissions_permission" ON "role_permissions"("permission_id");

-- CreateIndex
CREATE UNIQUE INDEX "uq_role_permissions_role_permission" ON "role_permissions"("role_id", "permission_id");

-- CreateIndex
CREATE INDEX "idx_users_school_active" ON "users"("school_id", "is_active");

-- CreateIndex
CREATE INDEX "idx_users_school_deleted" ON "users"("school_id", "deleted_at");

-- CreateIndex
CREATE UNIQUE INDEX "uq_users_school_email" ON "users"("school_id", "email");

-- CreateIndex
CREATE INDEX "idx_user_roles_school_user" ON "user_roles"("school_id", "user_id");

-- CreateIndex
CREATE UNIQUE INDEX "uq_user_roles_user_role" ON "user_roles"("user_id", "role_id");

-- CreateIndex
CREATE UNIQUE INDEX "drivers_user_id_key" ON "drivers"("user_id");

-- CreateIndex
CREATE INDEX "idx_drivers_school_available" ON "drivers"("school_id", "is_available");

-- CreateIndex
CREATE INDEX "idx_drivers_school_deleted" ON "drivers"("school_id", "deleted_at");

-- CreateIndex
CREATE UNIQUE INDEX "uq_drivers_school_license" ON "drivers"("school_id", "license_number");

-- CreateIndex
CREATE UNIQUE INDEX "parents_user_id_key" ON "parents"("user_id");

-- CreateIndex
CREATE INDEX "idx_parents_school_deleted" ON "parents"("school_id", "deleted_at");

-- CreateIndex
CREATE INDEX "idx_students_school_parent" ON "students"("school_id", "parent_id");

-- CreateIndex
CREATE INDEX "idx_students_school_route" ON "students"("school_id", "route_id");

-- CreateIndex
CREATE INDEX "idx_students_school_deleted" ON "students"("school_id", "deleted_at");

-- CreateIndex
CREATE UNIQUE INDEX "uq_students_school_admission" ON "students"("school_id", "admission_number");

-- CreateIndex
CREATE INDEX "idx_vans_school_active" ON "vans"("school_id", "is_active");

-- CreateIndex
CREATE INDEX "idx_vans_school_deleted" ON "vans"("school_id", "deleted_at");

-- CreateIndex
CREATE UNIQUE INDEX "uq_vans_school_registration" ON "vans"("school_id", "registration_no");

-- CreateIndex
CREATE INDEX "idx_routes_school_active" ON "routes"("school_id", "is_active");

-- CreateIndex
CREATE INDEX "idx_routes_school_van" ON "routes"("school_id", "van_id");

-- CreateIndex
CREATE INDEX "idx_routes_school_deleted" ON "routes"("school_id", "deleted_at");

-- CreateIndex
CREATE UNIQUE INDEX "uq_routes_school_route_code" ON "routes"("school_id", "route_code");

-- CreateIndex
CREATE INDEX "idx_route_stops_school_route" ON "route_stops"("school_id", "route_id");

-- CreateIndex
CREATE INDEX "idx_route_stops_school_deleted" ON "route_stops"("school_id", "deleted_at");

-- CreateIndex
CREATE UNIQUE INDEX "uq_route_stops_route_order" ON "route_stops"("route_id", "stop_order");

-- CreateIndex
CREATE INDEX "idx_trips_school_date_status" ON "trips"("school_id", "trip_date", "status");

-- CreateIndex
CREATE INDEX "idx_trips_school_driver_date" ON "trips"("school_id", "driver_id", "trip_date");

-- CreateIndex
CREATE INDEX "idx_trips_school_van_date" ON "trips"("school_id", "van_id", "trip_date");

-- CreateIndex
CREATE INDEX "idx_trips_school_deleted" ON "trips"("school_id", "deleted_at");

-- CreateIndex
CREATE INDEX "idx_trip_students_school_trip_status" ON "trip_students"("school_id", "trip_id", "status");

-- CreateIndex
CREATE INDEX "idx_trip_students_school_student_status" ON "trip_students"("school_id", "student_id", "status");

-- CreateIndex
CREATE INDEX "idx_trip_students_school_deleted" ON "trip_students"("school_id", "deleted_at");

-- CreateIndex
CREATE UNIQUE INDEX "uq_trip_students_trip_student" ON "trip_students"("trip_id", "student_id");

-- CreateIndex
CREATE INDEX "idx_tracking_logs_school_trip_event" ON "tracking_logs"("school_id", "trip_id", "event_timestamp");

-- CreateIndex
CREATE INDEX "idx_tracking_logs_trip_event" ON "tracking_logs"("trip_id", "event_timestamp");

-- CreateIndex
CREATE INDEX "idx_tracking_logs_school_created" ON "tracking_logs"("school_id", "created_at");

-- CreateIndex
CREATE INDEX "idx_notifications_school_user_read" ON "notifications"("school_id", "user_id", "read_at");

-- CreateIndex
CREATE INDEX "idx_notifications_school_type_created" ON "notifications"("school_id", "type", "created_at");

-- CreateIndex
CREATE INDEX "idx_notifications_school_trip" ON "notifications"("school_id", "trip_id");

-- CreateIndex
CREATE INDEX "idx_notifications_school_status_created" ON "notifications"("school_id", "status", "created_at");

-- CreateIndex
CREATE INDEX "idx_notifications_school_deleted" ON "notifications"("school_id", "deleted_at");

-- CreateIndex
CREATE INDEX "idx_device_push_tokens_school_active" ON "device_push_tokens"("school_id", "is_active");

-- CreateIndex
CREATE INDEX "idx_device_push_tokens_fcm" ON "device_push_tokens"("fcm_token");

-- CreateIndex
CREATE UNIQUE INDEX "uq_device_push_tokens_user_device" ON "device_push_tokens"("user_id", "device_id");

-- CreateIndex
CREATE UNIQUE INDEX "notification_preferences_user_id_key" ON "notification_preferences"("user_id");

-- CreateIndex
CREATE INDEX "idx_refresh_tokens_user_status" ON "refresh_tokens"("user_id", "status");

-- CreateIndex
CREATE INDEX "idx_refresh_tokens_expires_at" ON "refresh_tokens"("expires_at");

-- CreateIndex
CREATE INDEX "idx_refresh_tokens_family" ON "refresh_tokens"("family_id");

-- CreateIndex
CREATE INDEX "idx_device_sessions_user_status" ON "device_sessions"("user_id", "status");

-- CreateIndex
CREATE INDEX "idx_device_sessions_school_status" ON "device_sessions"("school_id", "status");

-- CreateIndex
CREATE UNIQUE INDEX "uq_device_sessions_user_device" ON "device_sessions"("user_id", "device_id");

-- CreateIndex
CREATE INDEX "idx_audit_logs_school_created" ON "audit_logs"("school_id", "created_at");

-- CreateIndex
CREATE INDEX "idx_audit_logs_actor_created" ON "audit_logs"("actor_user_id", "created_at");

-- CreateIndex
CREATE INDEX "idx_audit_logs_entity" ON "audit_logs"("entity_type", "entity_id");

-- CreateIndex
CREATE INDEX "idx_emergency_alerts_school_created" ON "emergency_alerts"("school_id", "created_at");

-- CreateIndex
CREATE INDEX "idx_emergency_alerts_school_trip" ON "emergency_alerts"("school_id", "trip_id");

-- CreateIndex
CREATE INDEX "idx_emergency_alerts_school_deleted" ON "emergency_alerts"("school_id", "deleted_at");

-- AddForeignKey
ALTER TABLE "school_settings" ADD CONSTRAINT "school_settings_school_id_fkey" FOREIGN KEY ("school_id") REFERENCES "schools"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "school_subscriptions" ADD CONSTRAINT "school_subscriptions_school_id_fkey" FOREIGN KEY ("school_id") REFERENCES "schools"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "school_subscriptions" ADD CONSTRAINT "school_subscriptions_plan_catalog_id_fkey" FOREIGN KEY ("plan_catalog_id") REFERENCES "plan_catalog"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subscription_plans" ADD CONSTRAINT "subscription_plans_school_id_fkey" FOREIGN KEY ("school_id") REFERENCES "schools"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "roles" ADD CONSTRAINT "roles_school_id_fkey" FOREIGN KEY ("school_id") REFERENCES "schools"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_permission_id_fkey" FOREIGN KEY ("permission_id") REFERENCES "permissions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_school_id_fkey" FOREIGN KEY ("school_id") REFERENCES "schools"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_school_id_fkey" FOREIGN KEY ("school_id") REFERENCES "schools"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "drivers" ADD CONSTRAINT "drivers_school_id_fkey" FOREIGN KEY ("school_id") REFERENCES "schools"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "drivers" ADD CONSTRAINT "drivers_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "parents" ADD CONSTRAINT "parents_school_id_fkey" FOREIGN KEY ("school_id") REFERENCES "schools"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "parents" ADD CONSTRAINT "parents_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "students" ADD CONSTRAINT "students_school_id_fkey" FOREIGN KEY ("school_id") REFERENCES "schools"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "students" ADD CONSTRAINT "students_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "parents"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "students" ADD CONSTRAINT "students_route_id_fkey" FOREIGN KEY ("route_id") REFERENCES "routes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vans" ADD CONSTRAINT "vans_school_id_fkey" FOREIGN KEY ("school_id") REFERENCES "schools"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "routes" ADD CONSTRAINT "routes_school_id_fkey" FOREIGN KEY ("school_id") REFERENCES "schools"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "routes" ADD CONSTRAINT "routes_van_id_fkey" FOREIGN KEY ("van_id") REFERENCES "vans"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "route_stops" ADD CONSTRAINT "route_stops_school_id_fkey" FOREIGN KEY ("school_id") REFERENCES "schools"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "route_stops" ADD CONSTRAINT "route_stops_route_id_fkey" FOREIGN KEY ("route_id") REFERENCES "routes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trips" ADD CONSTRAINT "trips_school_id_fkey" FOREIGN KEY ("school_id") REFERENCES "schools"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trips" ADD CONSTRAINT "trips_route_id_fkey" FOREIGN KEY ("route_id") REFERENCES "routes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trips" ADD CONSTRAINT "trips_van_id_fkey" FOREIGN KEY ("van_id") REFERENCES "vans"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trips" ADD CONSTRAINT "trips_driver_id_fkey" FOREIGN KEY ("driver_id") REFERENCES "drivers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trip_students" ADD CONSTRAINT "trip_students_school_id_fkey" FOREIGN KEY ("school_id") REFERENCES "schools"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trip_students" ADD CONSTRAINT "trip_students_trip_id_fkey" FOREIGN KEY ("trip_id") REFERENCES "trips"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trip_students" ADD CONSTRAINT "trip_students_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trip_students" ADD CONSTRAINT "trip_students_stop_id_fkey" FOREIGN KEY ("stop_id") REFERENCES "route_stops"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tracking_logs" ADD CONSTRAINT "tracking_logs_school_id_fkey" FOREIGN KEY ("school_id") REFERENCES "schools"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tracking_logs" ADD CONSTRAINT "tracking_logs_trip_id_fkey" FOREIGN KEY ("trip_id") REFERENCES "trips"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_school_id_fkey" FOREIGN KEY ("school_id") REFERENCES "schools"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "parents"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_trip_id_fkey" FOREIGN KEY ("trip_id") REFERENCES "trips"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "device_push_tokens" ADD CONSTRAINT "device_push_tokens_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notification_preferences" ADD CONSTRAINT "notification_preferences_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "refresh_tokens" ADD CONSTRAINT "refresh_tokens_school_id_fkey" FOREIGN KEY ("school_id") REFERENCES "schools"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "refresh_tokens" ADD CONSTRAINT "refresh_tokens_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "device_sessions" ADD CONSTRAINT "device_sessions_school_id_fkey" FOREIGN KEY ("school_id") REFERENCES "schools"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "device_sessions" ADD CONSTRAINT "device_sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "device_sessions" ADD CONSTRAINT "device_sessions_refresh_token_id_fkey" FOREIGN KEY ("refresh_token_id") REFERENCES "refresh_tokens"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_school_id_fkey" FOREIGN KEY ("school_id") REFERENCES "schools"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_actor_user_id_fkey" FOREIGN KEY ("actor_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "emergency_alerts" ADD CONSTRAINT "emergency_alerts_school_id_fkey" FOREIGN KEY ("school_id") REFERENCES "schools"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "emergency_alerts" ADD CONSTRAINT "emergency_alerts_trip_id_fkey" FOREIGN KEY ("trip_id") REFERENCES "trips"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "emergency_alerts" ADD CONSTRAINT "emergency_alerts_triggered_by_id_fkey" FOREIGN KEY ("triggered_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
