CREATE TYPE "public"."video_suggestion_status" AS ENUM('pending', 'approved', 'rejected');--> statement-breakpoint
CREATE TABLE "video_suggestions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"youtube_video_id" text NOT NULL,
	"status" "video_suggestion_status" DEFAULT 'pending' NOT NULL,
	"submitted_at" timestamp with time zone DEFAULT now() NOT NULL,
	"reviewed_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "profiles" ADD COLUMN "is_admin" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "videos" ADD COLUMN "from_suggestion" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "video_suggestions" ADD CONSTRAINT "video_suggestions_user_id_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_video_suggestions_status" ON "video_suggestions" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_video_suggestions_user_id" ON "video_suggestions" USING btree ("user_id");