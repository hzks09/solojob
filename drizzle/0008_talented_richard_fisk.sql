CREATE TABLE "mood_search_cursors" (
	"tag" text PRIMARY KEY NOT NULL,
	"variant_index" integer DEFAULT 0 NOT NULL,
	"page_token" text,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
