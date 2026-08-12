/**
 * Schéma Drizzle ORM — source de vérité de la base Supabase (Postgres).
 * `npm run db:generate` produit les migrations SQL à partir de ce fichier.
 *
 * L'authentification est gérée par Supabase Auth (`auth.users`, hors de ce
 * schéma). `authUsers` ci-dessous est une déclaration minimale qui permet à
 * Drizzle de générer la contrainte de clé étrangère `profiles.id -> auth.users.id`.
 */

import { pgTable, pgEnum, pgSchema, text, timestamp, uuid, numeric, integer, date, index } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

const authSchema = pgSchema("auth");
export const authUsers = authSchema.table("users", {
  id: uuid("id").primaryKey(),
});

const id = () => uuid("id").primaryKey().defaultRandom();

// -----------------------------------------------------------------------------
// ENUMS
// -----------------------------------------------------------------------------
export const planTierEnum = pgEnum("plan_tier", ["free", "solo", "solo_plus"]);
export const devisStatutEnum = pgEnum("devis_statut", ["brouillon", "envoye", "accepte", "refuse"]);
export const factureStatutEnum = pgEnum("facture_statut", ["brouillon", "envoyee", "payee"]);
export const relanceStatutEnum = pgEnum("relance_statut", ["envoyee", "echec"]);

// -----------------------------------------------------------------------------
// profiles — extension de auth.users (créé par trigger à l'inscription)
// -----------------------------------------------------------------------------
export const profiles = pgTable("profiles", {
  id: uuid("id")
    .primaryKey()
    .references(() => authUsers.id, { onDelete: "cascade" }),
  fullName: text("full_name"),
  companyName: text("company_name"),
  logoUrl: text("logo_url"),
  plan: planTierEnum("plan").notNull().default("free"),
  stripeCustomerId: text("stripe_customer_id").unique(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

// -----------------------------------------------------------------------------
// clients
// -----------------------------------------------------------------------------
export const clients = pgTable(
  "clients",
  {
    id: id(),
    userId: uuid("user_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),
    nom: text("nom").notNull(),
    email: text("email"),
    telephone: text("telephone"),
    adresse: text("adresse"),
    notes: text("notes"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index("idx_clients_user_id").on(table.userId)]
);

// -----------------------------------------------------------------------------
// devis + lignes
// -----------------------------------------------------------------------------
export const devis = pgTable(
  "devis",
  {
    id: id(),
    userId: uuid("user_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),
    clientId: uuid("client_id")
      .notNull()
      .references(() => clients.id, { onDelete: "cascade" }),
    numero: text("numero").notNull(),
    statut: devisStatutEnum("statut").notNull().default("brouillon"),
    montantTotal: numeric("montant_total", { precision: 10, scale: 2 }).notNull().default("0"),
    dateValidite: date("date_validite"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index("idx_devis_user_id").on(table.userId), index("idx_devis_client_id").on(table.clientId)]
);

export const devisLignes = pgTable(
  "devis_lignes",
  {
    id: id(),
    devisId: uuid("devis_id")
      .notNull()
      .references(() => devis.id, { onDelete: "cascade" }),
    description: text("description").notNull(),
    quantite: numeric("quantite", { precision: 10, scale: 2 }).notNull().default("1"),
    prixUnitaire: numeric("prix_unitaire", { precision: 10, scale: 2 }).notNull().default("0"),
    ordre: integer("ordre").notNull().default(0),
  },
  (table) => [index("idx_devis_lignes_devis_id").on(table.devisId)]
);

// -----------------------------------------------------------------------------
// factures + lignes
// -----------------------------------------------------------------------------
export const factures = pgTable(
  "factures",
  {
    id: id(),
    userId: uuid("user_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),
    clientId: uuid("client_id")
      .notNull()
      .references(() => clients.id, { onDelete: "cascade" }),
    devisId: uuid("devis_id").references(() => devis.id, { onDelete: "set null" }),
    numero: text("numero").notNull(),
    // "en_retard" n'est jamais stocké : calculé à la volée
    // (statut = 'envoyee' AND date_echeance < now()) pour ne jamais se périmer.
    statut: factureStatutEnum("statut").notNull().default("brouillon"),
    montantTotal: numeric("montant_total", { precision: 10, scale: 2 }).notNull().default("0"),
    dateEmission: date("date_emission"),
    dateEcheance: date("date_echeance"),
    datePaiement: timestamp("date_paiement", { withTimezone: true }),
    stripePaymentLinkId: text("stripe_payment_link_id"),
    stripePaymentLinkUrl: text("stripe_payment_link_url"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("idx_factures_user_id").on(table.userId),
    index("idx_factures_client_id").on(table.clientId),
    index("idx_factures_statut").on(table.statut),
  ]
);

export const factureLignes = pgTable(
  "facture_lignes",
  {
    id: id(),
    factureId: uuid("facture_id")
      .notNull()
      .references(() => factures.id, { onDelete: "cascade" }),
    description: text("description").notNull(),
    quantite: numeric("quantite", { precision: 10, scale: 2 }).notNull().default("1"),
    prixUnitaire: numeric("prix_unitaire", { precision: 10, scale: 2 }).notNull().default("0"),
    ordre: integer("ordre").notNull().default(0),
  },
  (table) => [index("idx_facture_lignes_facture_id").on(table.factureId)]
);

// -----------------------------------------------------------------------------
// relances
// -----------------------------------------------------------------------------
export const relances = pgTable(
  "relances",
  {
    id: id(),
    factureId: uuid("facture_id")
      .notNull()
      .references(() => factures.id, { onDelete: "cascade" }),
    dateEnvoi: timestamp("date_envoi", { withTimezone: true }).notNull().defaultNow(),
    type: text("type").notNull().default("email"),
    statut: relanceStatutEnum("statut").notNull().default("envoyee"),
  },
  (table) => [index("idx_relances_facture_id").on(table.factureId)]
);

// -----------------------------------------------------------------------------
// RELATIONS
// -----------------------------------------------------------------------------
export const profilesRelations = relations(profiles, ({ many }) => ({
  clients: many(clients),
  devis: many(devis),
  factures: many(factures),
}));

export const clientsRelations = relations(clients, ({ one, many }) => ({
  profile: one(profiles, { fields: [clients.userId], references: [profiles.id] }),
  devis: many(devis),
  factures: many(factures),
}));

export const devisRelations = relations(devis, ({ one, many }) => ({
  client: one(clients, { fields: [devis.clientId], references: [clients.id] }),
  lignes: many(devisLignes),
  factures: many(factures),
}));

export const devisLignesRelations = relations(devisLignes, ({ one }) => ({
  devis: one(devis, { fields: [devisLignes.devisId], references: [devis.id] }),
}));

export const facturesRelations = relations(factures, ({ one, many }) => ({
  client: one(clients, { fields: [factures.clientId], references: [clients.id] }),
  devis: one(devis, { fields: [factures.devisId], references: [devis.id] }),
  lignes: many(factureLignes),
  relances: many(relances),
}));

export const factureLignesRelations = relations(factureLignes, ({ one }) => ({
  facture: one(factures, { fields: [factureLignes.factureId], references: [factures.id] }),
}));

export const relancesRelations = relations(relances, ({ one }) => ({
  facture: one(factures, { fields: [relances.factureId], references: [factures.id] }),
}));

// -----------------------------------------------------------------------------
// TYPES INFÉRÉS
// -----------------------------------------------------------------------------
export type Profile = typeof profiles.$inferSelect;
export type Client = typeof clients.$inferSelect;
export type NewClient = typeof clients.$inferInsert;
export type Devis = typeof devis.$inferSelect;
export type NewDevis = typeof devis.$inferInsert;
export type DevisLigne = typeof devisLignes.$inferSelect;
export type NewDevisLigne = typeof devisLignes.$inferInsert;
export type Facture = typeof factures.$inferSelect;
export type NewFacture = typeof factures.$inferInsert;
export type FactureLigne = typeof factureLignes.$inferSelect;
export type NewFactureLigne = typeof factureLignes.$inferInsert;
export type Relance = typeof relances.$inferSelect;

export type PlanTier = (typeof planTierEnum.enumValues)[number];
export type DevisStatut = (typeof devisStatutEnum.enumValues)[number];
export type FactureStatut = (typeof factureStatutEnum.enumValues)[number];
export type RelanceStatut = (typeof relanceStatutEnum.enumValues)[number];
