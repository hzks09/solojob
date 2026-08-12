/**
 * Schéma Drizzle ORM — source de vérité de la base Neon (Postgres).
 * `npm run db:generate` produit les migrations SQL à partir de ce fichier,
 * `npm run db:migrate` les applique sur la base.
 *
 * Les tables users/accounts/sessions/verificationTokens suivent la forme
 * attendue par @auth/drizzle-adapter (Auth.js v5). Les tables emailVerificationTokens
 * et passwordResetTokens sont notre propre implémentation (flux credentials).
 */

import {
  pgTable,
  pgEnum,
  text,
  timestamp,
  integer,
  numeric,
  boolean,
  jsonb,
  primaryKey,
  uniqueIndex,
  index,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

const id = () =>
  text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID());

// -----------------------------------------------------------------------------
// ENUMS
// -----------------------------------------------------------------------------
export const userRoleEnum = pgEnum("user_role", ["user", "admin"]);
export const planTierEnum = pgEnum("plan_tier", ["free", "pro", "premium"]);
export const roomTypeEnum = pgEnum("room_type", [
  "salon",
  "chambre",
  "cuisine",
  "salle_de_bain",
  "bureau",
  "jardin",
]);
export const budgetModeEnum = pgEnum("budget_mode", [
  "moins_500",
  "moins_1000",
  "moins_3000",
  "illimite",
]);
export const transformationLevelEnum = pgEnum("transformation_level", [
  "leger",
  "modere",
  "complet",
]);
export const generationQualityEnum = pgEnum("generation_quality", ["standard", "hd", "ultra_hd"]);
export const generationStatusEnum = pgEnum("generation_status", [
  "pending",
  "processing",
  "completed",
  "failed",
]);
export const aiProviderEnum = pgEnum("ai_provider", ["replicate", "fal", "openai", "gemini", "mock"]);
export const subscriptionStatusEnum = pgEnum("subscription_status", [
  "active",
  "trialing",
  "past_due",
  "canceled",
  "incomplete",
]);
export const paymentStatusEnum = pgEnum("payment_status", [
  "succeeded",
  "pending",
  "failed",
  "refunded",
]);
export const objectCategoryEnum = pgEnum("object_category", [
  "canape",
  "lit",
  "chaise",
  "table",
  "tapis",
  "lampe",
  "meuble_tv",
  "decoration",
  "plantes",
  "rideaux",
]);
export const reportStatusEnum = pgEnum("report_status", [
  "pending",
  "reviewed",
  "dismissed",
  "actioned",
]);
export const creditReasonEnum = pgEnum("credit_reason", [
  "signup_bonus",
  "subscription_renewal",
  "generation_standard",
  "generation_hd",
  "generation_ultra_hd",
  "purchase",
  "admin_adjustment",
  "refund",
]);

// -----------------------------------------------------------------------------
// AUTH.JS — users / accounts / sessions / verificationTokens
// -----------------------------------------------------------------------------
export const users = pgTable("users", {
  id: id(),
  name: text("name"),
  email: text("email").notNull().unique(),
  emailVerified: timestamp("email_verified", { mode: "date" }),
  image: text("image"),
  passwordHash: text("password_hash"),
  role: userRoleEnum("role").notNull().default("user"),
  plan: planTierEnum("plan").notNull().default("free"),
  creditsRemaining: integer("credits_remaining").notNull().default(5),
  stripeCustomerId: text("stripe_customer_id").unique(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const accounts = pgTable(
  "accounts",
  {
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: text("type").notNull(),
    provider: text("provider").notNull(),
    providerAccountId: text("provider_account_id").notNull(),
    refresh_token: text("refresh_token"),
    access_token: text("access_token"),
    expires_at: integer("expires_at"),
    token_type: text("token_type"),
    scope: text("scope"),
    id_token: text("id_token"),
    session_state: text("session_state"),
  },
  (table) => [primaryKey({ columns: [table.provider, table.providerAccountId] })]
);

export const sessions = pgTable("sessions", {
  sessionToken: text("session_token").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expires: timestamp("expires").notNull(),
});

export const verificationTokens = pgTable(
  "verification_tokens",
  {
    identifier: text("identifier").notNull(),
    token: text("token").notNull(),
    expires: timestamp("expires").notNull(),
  },
  (table) => [primaryKey({ columns: [table.identifier, table.token] })]
);

// Flux "vérifier mon e-mail" (lien envoyé via Resend après inscription)
export const emailVerificationTokens = pgTable("email_verification_tokens", {
  id: id(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  token: text("token").notNull().unique(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Flux "mot de passe oublié"
export const passwordResetTokens = pgTable("password_reset_tokens", {
  id: id(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  token: text("token").notNull().unique(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// -----------------------------------------------------------------------------
// MÉTIER — projects / generations / detected_objects
// -----------------------------------------------------------------------------
export const projects = pgTable(
  "projects",
  {
    id: id(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    title: text("title").notNull().default("Sans titre"),
    roomType: roomTypeEnum("room_type").notNull(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => [index("idx_projects_user_id").on(table.userId)]
);

export const generations = pgTable(
  "generations",
  {
    id: id(),
    projectId: text("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    originalImageUrl: text("original_image_url").notNull(),
    resultImageUrl: text("result_image_url"),
    style: text("style").notNull(),
    budgetMode: budgetModeEnum("budget_mode").notNull().default("illimite"),
    dominantColors: text("dominant_colors").array().notNull().default([]),
    furnitureType: text("furniture_type"),
    materials: text("materials"),
    ambiance: text("ambiance"),
    transformationLevel: transformationLevelEnum("transformation_level").notNull().default("modere"),
    customPrompt: text("custom_prompt"),
    quality: generationQualityEnum("quality").notNull().default("standard"),
    creditsUsed: integer("credits_used").notNull().default(1),
    status: generationStatusEnum("status").notNull().default("pending"),
    provider: aiProviderEnum("provider").notNull().default("mock"),
    providerJobId: text("provider_job_id"),
    errorMessage: text("error_message"),
    isPublic: boolean("is_public").notNull().default(false),
    isFavorite: boolean("is_favorite").notNull().default(false),
    watermarked: boolean("watermarked").notNull().default(true),
    estimatedTotalCost: numeric("estimated_total_cost", { precision: 10, scale: 2 }),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => [
    index("idx_generations_user_id").on(table.userId),
    index("idx_generations_project_id").on(table.projectId),
    index("idx_generations_status").on(table.status),
  ]
);

export const detectedObjects = pgTable(
  "detected_objects",
  {
    id: id(),
    generationId: text("generation_id")
      .notNull()
      .references(() => generations.id, { onDelete: "cascade" }),
    category: objectCategoryEnum("category").notNull(),
    name: text("name").notNull(),
    estimatedPrice: numeric("estimated_price", { precision: 10, scale: 2 }),
    buyUrl: text("buy_url"),
    cheaperAlternativeName: text("cheaper_alternative_name"),
    cheaperAlternativePrice: numeric("cheaper_alternative_price", { precision: 10, scale: 2 }),
    cheaperAlternativeUrl: text("cheaper_alternative_url"),
    premiumAlternativeName: text("premium_alternative_name"),
    premiumAlternativePrice: numeric("premium_alternative_price", { precision: 10, scale: 2 }),
    premiumAlternativeUrl: text("premium_alternative_url"),
    boundingBox: jsonb("bounding_box"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => [index("idx_detected_objects_generation_id").on(table.generationId)]
);

// -----------------------------------------------------------------------------
// CRÉDITS / ABONNEMENTS / PAIEMENTS
// -----------------------------------------------------------------------------
export const creditsLedger = pgTable(
  "credits_ledger",
  {
    id: id(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    amount: integer("amount").notNull(),
    reason: creditReasonEnum("reason").notNull(),
    generationId: text("generation_id").references(() => generations.id, { onDelete: "set null" }),
    metadata: jsonb("metadata").notNull().default({}),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => [index("idx_credits_ledger_user_id").on(table.userId)]
);

export const subscriptions = pgTable(
  "subscriptions",
  {
    id: id(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    stripeSubscriptionId: text("stripe_subscription_id").unique(),
    stripeCustomerId: text("stripe_customer_id").notNull(),
    plan: planTierEnum("plan").notNull().default("free"),
    status: subscriptionStatusEnum("status").notNull().default("active"),
    currentPeriodStart: timestamp("current_period_start"),
    currentPeriodEnd: timestamp("current_period_end"),
    cancelAtPeriodEnd: boolean("cancel_at_period_end").notNull().default(false),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => [uniqueIndex("idx_subscriptions_user_id").on(table.userId)]
);

export const payments = pgTable(
  "payments",
  {
    id: id(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    stripePaymentIntentId: text("stripe_payment_intent_id"),
    stripeInvoiceId: text("stripe_invoice_id"),
    amount: numeric("amount", { precision: 10, scale: 2 }).notNull(),
    currency: text("currency").notNull().default("eur"),
    status: paymentStatusEnum("status").notNull().default("pending"),
    description: text("description"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => [index("idx_payments_user_id").on(table.userId)]
);

// -----------------------------------------------------------------------------
// FAVORIS / GALERIE / VOTES / SIGNALEMENTS / LOGS
// -----------------------------------------------------------------------------
export const favorites = pgTable(
  "favorites",
  {
    id: id(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    generationId: text("generation_id")
      .notNull()
      .references(() => generations.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => [uniqueIndex("idx_favorites_unique").on(table.userId, table.generationId)]
);

export const gallery = pgTable(
  "gallery",
  {
    id: id(),
    generationId: text("generation_id")
      .notNull()
      .unique()
      .references(() => generations.id, { onDelete: "cascade" }),
    featured: boolean("featured").notNull().default(false),
    votesCount: integer("votes_count").notNull().default(0),
    viewsCount: integer("views_count").notNull().default(0),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => [index("idx_gallery_votes").on(table.votesCount)]
);

export const votes = pgTable(
  "votes",
  {
    id: id(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    galleryId: text("gallery_id")
      .notNull()
      .references(() => gallery.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => [uniqueIndex("idx_votes_unique").on(table.userId, table.galleryId)]
);

export const reports = pgTable(
  "reports",
  {
    id: id(),
    reporterId: text("reporter_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    generationId: text("generation_id")
      .notNull()
      .references(() => generations.id, { onDelete: "cascade" }),
    reason: text("reason").notNull(),
    status: reportStatusEnum("status").notNull().default("pending"),
    reviewedBy: text("reviewed_by").references(() => users.id),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => [index("idx_reports_status").on(table.status)]
);

export const activityLogs = pgTable(
  "activity_logs",
  {
    id: id(),
    userId: text("user_id").references(() => users.id, { onDelete: "set null" }),
    action: text("action").notNull(),
    metadata: jsonb("metadata").notNull().default({}),
    ipAddress: text("ip_address"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => [index("idx_activity_logs_created_at").on(table.createdAt)]
);

// -----------------------------------------------------------------------------
// RELATIONS (API de requêtage Drizzle)
// -----------------------------------------------------------------------------
export const usersRelations = relations(users, ({ many }) => ({
  projects: many(projects),
  generations: many(generations),
  favorites: many(favorites),
  subscription: many(subscriptions),
}));

export const projectsRelations = relations(projects, ({ one, many }) => ({
  user: one(users, { fields: [projects.userId], references: [users.id] }),
  generations: many(generations),
}));

export const generationsRelations = relations(generations, ({ one, many }) => ({
  project: one(projects, { fields: [generations.projectId], references: [projects.id] }),
  user: one(users, { fields: [generations.userId], references: [users.id] }),
  detectedObjects: many(detectedObjects),
  galleryEntry: one(gallery, { fields: [generations.id], references: [gallery.generationId] }),
}));

export const detectedObjectsRelations = relations(detectedObjects, ({ one }) => ({
  generation: one(generations, { fields: [detectedObjects.generationId], references: [generations.id] }),
}));

export const galleryRelations = relations(gallery, ({ one, many }) => ({
  generation: one(generations, { fields: [gallery.generationId], references: [generations.id] }),
  votes: many(votes),
}));

export const votesRelations = relations(votes, ({ one }) => ({
  user: one(users, { fields: [votes.userId], references: [users.id] }),
  gallery: one(gallery, { fields: [votes.galleryId], references: [gallery.id] }),
}));

export const favoritesRelations = relations(favorites, ({ one }) => ({
  user: one(users, { fields: [favorites.userId], references: [users.id] }),
  generation: one(generations, { fields: [favorites.generationId], references: [generations.id] }),
}));

// -----------------------------------------------------------------------------
// TYPES INFÉRÉS
// -----------------------------------------------------------------------------
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Project = typeof projects.$inferSelect;
export type NewProject = typeof projects.$inferInsert;
export type Generation = typeof generations.$inferSelect;
export type NewGeneration = typeof generations.$inferInsert;
export type DetectedObject = typeof detectedObjects.$inferSelect;
export type NewDetectedObject = typeof detectedObjects.$inferInsert;
export type CreditLedgerEntry = typeof creditsLedger.$inferSelect;
export type Subscription = typeof subscriptions.$inferSelect;
export type Payment = typeof payments.$inferSelect;
export type Favorite = typeof favorites.$inferSelect;
export type GalleryEntry = typeof gallery.$inferSelect;
export type Vote = typeof votes.$inferSelect;
export type Report = typeof reports.$inferSelect;
export type ActivityLog = typeof activityLogs.$inferSelect;

// -----------------------------------------------------------------------------
// TYPES D'ENUM (dérivés des pgEnum ci-dessus)
// -----------------------------------------------------------------------------
export type UserRole = (typeof userRoleEnum.enumValues)[number];
export type PlanTier = (typeof planTierEnum.enumValues)[number];
export type RoomType = (typeof roomTypeEnum.enumValues)[number];
export type BudgetMode = (typeof budgetModeEnum.enumValues)[number];
export type TransformationLevel = (typeof transformationLevelEnum.enumValues)[number];
export type GenerationQuality = (typeof generationQualityEnum.enumValues)[number];
export type GenerationStatus = (typeof generationStatusEnum.enumValues)[number];
export type AiProvider = (typeof aiProviderEnum.enumValues)[number];
export type SubscriptionStatus = (typeof subscriptionStatusEnum.enumValues)[number];
export type PaymentStatus = (typeof paymentStatusEnum.enumValues)[number];
export type ObjectCategory = (typeof objectCategoryEnum.enumValues)[number];
export type ReportStatus = (typeof reportStatusEnum.enumValues)[number];
export type CreditReason = (typeof creditReasonEnum.enumValues)[number];
