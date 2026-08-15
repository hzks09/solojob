CREATE TYPE "public"."swipe_reason" AS ENUM('already_seen', 'not_my_style', 'boring_channel');--> statement-breakpoint
ALTER TABLE "swipes" ADD COLUMN "reason" "swipe_reason";