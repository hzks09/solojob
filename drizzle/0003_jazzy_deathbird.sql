ALTER TABLE "profiles" DROP CONSTRAINT "profiles_stripe_connect_account_id_unique";--> statement-breakpoint
ALTER TABLE "profiles" DROP COLUMN "stripe_connect_account_id";--> statement-breakpoint
ALTER TABLE "profiles" DROP COLUMN "stripe_connect_charges_enabled";