ALTER TABLE "profiles" ADD COLUMN "stripe_connect_account_id" text;--> statement-breakpoint
ALTER TABLE "profiles" ADD COLUMN "stripe_connect_charges_enabled" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "profiles" ADD CONSTRAINT "profiles_stripe_connect_account_id_unique" UNIQUE("stripe_connect_account_id");