CREATE TABLE "favorite_channels" (
	"user_id" uuid NOT NULL,
	"channel_id" text NOT NULL,
	"channel_title" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "favorite_channels_user_id_channel_id_pk" PRIMARY KEY("user_id","channel_id")
);
--> statement-breakpoint
ALTER TABLE "videos" ADD COLUMN "channel_id" text;--> statement-breakpoint
ALTER TABLE "favorite_channels" ADD CONSTRAINT "favorite_channels_user_id_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;