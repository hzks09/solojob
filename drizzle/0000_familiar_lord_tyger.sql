CREATE TYPE "public"."devis_statut" AS ENUM('brouillon', 'envoye', 'accepte', 'refuse');--> statement-breakpoint
CREATE TYPE "public"."facture_statut" AS ENUM('brouillon', 'envoyee', 'payee');--> statement-breakpoint
CREATE TYPE "public"."plan_tier" AS ENUM('free', 'solo', 'solo_plus');--> statement-breakpoint
CREATE TYPE "public"."relance_statut" AS ENUM('envoyee', 'echec');--> statement-breakpoint
CREATE TABLE "clients" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"nom" text NOT NULL,
	"email" text,
	"telephone" text,
	"adresse" text,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "devis" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"client_id" uuid NOT NULL,
	"numero" text NOT NULL,
	"statut" "devis_statut" DEFAULT 'brouillon' NOT NULL,
	"montant_total" numeric(10, 2) DEFAULT '0' NOT NULL,
	"date_validite" date,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "devis_lignes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"devis_id" uuid NOT NULL,
	"description" text NOT NULL,
	"quantite" numeric(10, 2) DEFAULT '1' NOT NULL,
	"prix_unitaire" numeric(10, 2) DEFAULT '0' NOT NULL,
	"ordre" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "facture_lignes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"facture_id" uuid NOT NULL,
	"description" text NOT NULL,
	"quantite" numeric(10, 2) DEFAULT '1' NOT NULL,
	"prix_unitaire" numeric(10, 2) DEFAULT '0' NOT NULL,
	"ordre" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "factures" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"client_id" uuid NOT NULL,
	"devis_id" uuid,
	"numero" text NOT NULL,
	"statut" "facture_statut" DEFAULT 'brouillon' NOT NULL,
	"montant_total" numeric(10, 2) DEFAULT '0' NOT NULL,
	"date_emission" date,
	"date_echeance" date,
	"date_paiement" timestamp with time zone,
	"stripe_payment_link_id" text,
	"stripe_payment_link_url" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "profiles" (
	"id" uuid PRIMARY KEY NOT NULL,
	"full_name" text,
	"company_name" text,
	"logo_url" text,
	"plan" "plan_tier" DEFAULT 'free' NOT NULL,
	"stripe_customer_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "profiles_stripe_customer_id_unique" UNIQUE("stripe_customer_id")
);
--> statement-breakpoint
CREATE TABLE "relances" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"facture_id" uuid NOT NULL,
	"date_envoi" timestamp with time zone DEFAULT now() NOT NULL,
	"type" text DEFAULT 'email' NOT NULL,
	"statut" "relance_statut" DEFAULT 'envoyee' NOT NULL
);
--> statement-breakpoint
ALTER TABLE "clients" ADD CONSTRAINT "clients_user_id_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "devis" ADD CONSTRAINT "devis_user_id_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "devis" ADD CONSTRAINT "devis_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "devis_lignes" ADD CONSTRAINT "devis_lignes_devis_id_devis_id_fk" FOREIGN KEY ("devis_id") REFERENCES "public"."devis"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "facture_lignes" ADD CONSTRAINT "facture_lignes_facture_id_factures_id_fk" FOREIGN KEY ("facture_id") REFERENCES "public"."factures"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "factures" ADD CONSTRAINT "factures_user_id_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "factures" ADD CONSTRAINT "factures_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "factures" ADD CONSTRAINT "factures_devis_id_devis_id_fk" FOREIGN KEY ("devis_id") REFERENCES "public"."devis"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "profiles" ADD CONSTRAINT "profiles_id_users_id_fk" FOREIGN KEY ("id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "relances" ADD CONSTRAINT "relances_facture_id_factures_id_fk" FOREIGN KEY ("facture_id") REFERENCES "public"."factures"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_clients_user_id" ON "clients" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_devis_user_id" ON "devis" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_devis_client_id" ON "devis" USING btree ("client_id");--> statement-breakpoint
CREATE INDEX "idx_devis_lignes_devis_id" ON "devis_lignes" USING btree ("devis_id");--> statement-breakpoint
CREATE INDEX "idx_facture_lignes_facture_id" ON "facture_lignes" USING btree ("facture_id");--> statement-breakpoint
CREATE INDEX "idx_factures_user_id" ON "factures" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_factures_client_id" ON "factures" USING btree ("client_id");--> statement-breakpoint
CREATE INDEX "idx_factures_statut" ON "factures" USING btree ("statut");--> statement-breakpoint
CREATE INDEX "idx_relances_facture_id" ON "relances" USING btree ("facture_id");