/**
 * Schéma Drizzle ORM — source de vérité de la base Supabase (Postgres).
 * `npm run db:generate` produit les migrations SQL à partir de ce fichier.
 *
 * L'authentification est gérée par Supabase Auth (`auth.users`, hors de ce
 * schéma). `authUsers` ci-dessous est une déclaration minimale qui permet à
 * Drizzle de générer la contrainte de clé étrangère `profiles.id -> auth.users.id`.
 */

import {
  pgTable,
  pgEnum,
  pgSchema,
  text,
  timestamp,
  uuid,
  integer,
  numeric,
  boolean,
  primaryKey,
  index,
} from "drizzle-orm/pg-core";
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
export const swipeDirectionEnum = pgEnum("swipe_direction", ["like", "skip"]);
export const swipeReasonEnum = pgEnum("swipe_reason", ["already_seen", "not_my_style", "boring_channel"]);
export const videoSuggestionStatusEnum = pgEnum("video_suggestion_status", ["pending", "approved", "rejected"]);

// -----------------------------------------------------------------------------
// profiles — extension de auth.users (créé par trigger à l'inscription)
// -----------------------------------------------------------------------------
export const profiles = pgTable("profiles", {
  id: uuid("id")
    .primaryKey()
    .references(() => authUsers.id, { onDelete: "cascade" }),
  fullName: text("full_name"),
  plan: planTierEnum("plan").notNull().default("free"),
  stripeCustomerId: text("stripe_customer_id").unique(),
  // Compte admin unique pour la modération des suggestions — pas de système
  // de rôles, mis à `true` manuellement en base sur un seul compte.
  isAdmin: boolean("is_admin").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

// -----------------------------------------------------------------------------
// videos — pool interne de vidéos YouTube mises en cache. Alimenté et
// rafraîchi uniquement par le job planifié (jamais au moment d'un swipe, pour
// rester très en dessous du quota gratuit de l'API YouTube Data v3).
// -----------------------------------------------------------------------------
export const videos = pgTable(
  "videos",
  {
    id: id(),
    youtubeVideoId: text("youtube_video_id").notNull().unique(),
    title: text("title").notNull(),
    thumbnailUrl: text("thumbnail_url").notNull(),
    // Nullable : les vidéos mises en cache avant l'ajout de ce champ ne
    // l'ont pas encore — se remplit au prochain rafraîchissement (cycle de
    // 30 jours, voir plus bas) sans nécessiter de backfill dédié.
    channelId: text("channel_id"),
    channelTitle: text("channel_title").notNull(),
    durationSeconds: integer("duration_seconds").notNull(),
    language: text("language"),
    youtubeCategoryId: text("youtube_category_id"),
    tags: text("tags").array().notNull().default([]),
    // Vrai uniquement pour une vidéo entrée dans le pool via une suggestion
    // approuvée (voir video_suggestions) — affiche un badge "Suggéré par la
    // communauté" sur la carte de swipe.
    fromSuggestion: boolean("from_suggestion").notNull().default(false),
    publishedAt: timestamp("published_at", { withTimezone: true }),
    cachedAt: timestamp("cached_at", { withTimezone: true }).notNull().defaultNow(),
    // Politique YouTube API Services : toute donnée mise en cache doit être
    // rafraîchie ou supprimée au maximum 30 jours après récupération — le
    // job planifié purge/rafraîchit sur la base de ce champ.
    lastRefreshedAt: timestamp("last_refreshed_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index("idx_videos_last_refreshed_at").on(table.lastRefreshedAt)]
);

// -----------------------------------------------------------------------------
// mood_search_cursors — un curseur par mood pour que le job planifié fasse
// vraiment grossir le pool (pagination YouTube) au lieu de redemander la même
// première page à chaque exécution. `variantIndex` avance vers la formulation
// suivante (voir MOOD_CATEGORIES.searchQueries) une fois les pages de la
// variante courante épuisées ; `pageToken` avance dans la variante courante.
// -----------------------------------------------------------------------------
export const moodSearchCursors = pgTable("mood_search_cursors", {
  tag: text("tag").primaryKey(),
  variantIndex: integer("variant_index").notNull().default(0),
  pageToken: text("page_token"),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

// -----------------------------------------------------------------------------
// swipes — historique de chaque swipe, sert aussi à compter les découvertes
// du jour (forfait Gratuit) et à exclure les vidéos déjà vues.
// -----------------------------------------------------------------------------
export const swipes = pgTable(
  "swipes",
  {
    id: id(),
    userId: uuid("user_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),
    videoId: uuid("video_id")
      .notNull()
      .references(() => videos.id, { onDelete: "cascade" }),
    direction: swipeDirectionEnum("direction").notNull(),
    // Motif optionnel renseigné uniquement sur un "skip" via le menu de
    // feedback secondaire — un skip sans motif reste juste `null`.
    reason: swipeReasonEnum("reason"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("idx_swipes_user_id").on(table.userId),
    index("idx_swipes_user_created").on(table.userId, table.createdAt),
    index("idx_swipes_user_video").on(table.userId, table.videoId),
  ]
);

// -----------------------------------------------------------------------------
// user_tag_weights — poids appris par tag pour chaque utilisateur, ajusté à
// chaque swipe (monte sur like, descend sur skip) pour affiner les
// propositions suivantes.
// -----------------------------------------------------------------------------
export const userTagWeights = pgTable(
  "user_tag_weights",
  {
    userId: uuid("user_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),
    tag: text("tag").notNull(),
    weight: numeric("weight", { precision: 6, scale: 2 }).notNull().default("0"),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [primaryKey({ columns: [table.userId, table.tag] })]
);

// -----------------------------------------------------------------------------
// saved_videos — liste "à regarder plus tard", distincte du simple like.
// -----------------------------------------------------------------------------
export const savedVideos = pgTable(
  "saved_videos",
  {
    userId: uuid("user_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),
    videoId: uuid("video_id")
      .notNull()
      .references(() => videos.id, { onDelete: "cascade" }),
    savedAt: timestamp("saved_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [primaryKey({ columns: [table.userId, table.videoId] })]
);

// -----------------------------------------------------------------------------
// stripe_webhook_events — idempotence : un event Stripe (id fourni par Stripe,
// stable en cas de retry réseau) ne doit jamais être traité deux fois.
// -----------------------------------------------------------------------------
export const stripeWebhookEvents = pgTable("stripe_webhook_events", {
  id: text("id").primaryKey(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

// -----------------------------------------------------------------------------
// favorite_channels — chaînes YouTube marquées "préférées" par l'utilisateur
// (bouton étoile sur la carte de swipe). `channelTitle` est dénormalisé pour
// afficher la liste sans jointure ; `channelId` est l'identifiant stable
// YouTube (contrairement au titre, qui peut changer).
// -----------------------------------------------------------------------------
export const favoriteChannels = pgTable(
  "favorite_channels",
  {
    userId: uuid("user_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),
    channelId: text("channel_id").notNull(),
    channelTitle: text("channel_title").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [primaryKey({ columns: [table.userId, table.channelId] })]
);

// -----------------------------------------------------------------------------
// video_suggestions — vidéo proposée par un utilisateur pour rejoindre le pool
// partagé. Ne stocke que l'ID YouTube (comme `videos`) : aucun fichier, aucun
// upload, pour ne jamais toucher au quota de stockage fichiers Supabase.
// N'entre dans `videos` (donc dans le pool proposé aux autres utilisateurs)
// qu'après passage en statut `approved` par un compte admin.
// -----------------------------------------------------------------------------
export const videoSuggestions = pgTable(
  "video_suggestions",
  {
    id: id(),
    userId: uuid("user_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),
    youtubeVideoId: text("youtube_video_id").notNull(),
    status: videoSuggestionStatusEnum("status").notNull().default("pending"),
    submittedAt: timestamp("submitted_at", { withTimezone: true }).notNull().defaultNow(),
    reviewedAt: timestamp("reviewed_at", { withTimezone: true }),
  },
  (table) => [
    index("idx_video_suggestions_status").on(table.status),
    index("idx_video_suggestions_user_id").on(table.userId),
  ]
);

// -----------------------------------------------------------------------------
// RELATIONS
// -----------------------------------------------------------------------------
export const profilesRelations = relations(profiles, ({ many }) => ({
  swipes: many(swipes),
  savedVideos: many(savedVideos),
  tagWeights: many(userTagWeights),
  favoriteChannels: many(favoriteChannels),
  videoSuggestions: many(videoSuggestions),
}));

export const videoSuggestionsRelations = relations(videoSuggestions, ({ one }) => ({
  profile: one(profiles, { fields: [videoSuggestions.userId], references: [profiles.id] }),
}));

export const videosRelations = relations(videos, ({ many }) => ({
  swipes: many(swipes),
  savedBy: many(savedVideos),
}));

export const swipesRelations = relations(swipes, ({ one }) => ({
  video: one(videos, { fields: [swipes.videoId], references: [videos.id] }),
  profile: one(profiles, { fields: [swipes.userId], references: [profiles.id] }),
}));

export const savedVideosRelations = relations(savedVideos, ({ one }) => ({
  video: one(videos, { fields: [savedVideos.videoId], references: [videos.id] }),
  profile: one(profiles, { fields: [savedVideos.userId], references: [profiles.id] }),
}));

// -----------------------------------------------------------------------------
// TYPES INFÉRÉS
// -----------------------------------------------------------------------------
export type Profile = typeof profiles.$inferSelect;
export type Video = typeof videos.$inferSelect;
export type NewVideo = typeof videos.$inferInsert;
export type Swipe = typeof swipes.$inferSelect;
export type UserTagWeight = typeof userTagWeights.$inferSelect;
export type SavedVideo = typeof savedVideos.$inferSelect;
export type FavoriteChannel = typeof favoriteChannels.$inferSelect;
export type VideoSuggestion = typeof videoSuggestions.$inferSelect;

export type PlanTier = (typeof planTierEnum.enumValues)[number];
export type SwipeDirection = (typeof swipeDirectionEnum.enumValues)[number];
export type SwipeReason = (typeof swipeReasonEnum.enumValues)[number];
export type VideoSuggestionStatus = (typeof videoSuggestionStatusEnum.enumValues)[number];
