DROP TABLE "clients" CASCADE;--> statement-breakpoint
DROP TABLE "devis" CASCADE;--> statement-breakpoint
DROP TABLE "devis_lignes" CASCADE;--> statement-breakpoint
DROP TABLE "facture_lignes" CASCADE;--> statement-breakpoint
DROP TABLE "factures" CASCADE;--> statement-breakpoint
DROP TABLE "relances" CASCADE;--> statement-breakpoint
ALTER TABLE "profiles" DROP COLUMN "company_name";--> statement-breakpoint
ALTER TABLE "profiles" DROP COLUMN "logo_url";--> statement-breakpoint
ALTER TABLE "profiles" DROP COLUMN "paypal_me_username";--> statement-breakpoint
ALTER TABLE "profiles" DROP COLUMN "siret";--> statement-breakpoint
ALTER TABLE "profiles" DROP COLUMN "adresse";--> statement-breakpoint
ALTER TABLE "profiles" DROP COLUMN "code_postal";--> statement-breakpoint
ALTER TABLE "profiles" DROP COLUMN "ville";--> statement-breakpoint
ALTER TABLE "profiles" DROP COLUMN "tva_applicable";--> statement-breakpoint
ALTER TABLE "profiles" DROP COLUMN "numero_tva";--> statement-breakpoint
ALTER TABLE "profiles" DROP COLUMN "iban";--> statement-breakpoint
DROP TYPE "public"."devis_statut";--> statement-breakpoint
DROP TYPE "public"."facture_statut";--> statement-breakpoint
DROP TYPE "public"."relance_statut";