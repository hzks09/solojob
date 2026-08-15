ALTER TABLE "profiles" ADD COLUMN "siret" text;--> statement-breakpoint
ALTER TABLE "profiles" ADD COLUMN "adresse" text;--> statement-breakpoint
ALTER TABLE "profiles" ADD COLUMN "code_postal" text;--> statement-breakpoint
ALTER TABLE "profiles" ADD COLUMN "ville" text;--> statement-breakpoint
ALTER TABLE "profiles" ADD COLUMN "tva_applicable" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "profiles" ADD COLUMN "numero_tva" text;--> statement-breakpoint
ALTER TABLE "profiles" ADD COLUMN "iban" text;