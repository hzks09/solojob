-- =============================================================================
-- Loupick — Row Level Security sur le schéma actuel
-- =============================================================================
-- Défense en profondeur : aujourd'hui, Drizzle se connecte via DATABASE_URL
-- (connexion Postgres directe avec le rôle propriétaire), donc RLS ne
-- s'applique PAS aux requêtes de l'application actuelle — le contrôle
-- d'accès réel repose sur les server actions qui filtrent systématiquement
-- par `current.authUser.id` (audité, voir rapport de durcissement sécurité).
-- Cette migration protège spécifiquement contre un usage futur du client
-- Supabase navigateur (src/lib/supabase/client.ts) qui interrogerait
-- directement une table `public.*` — aujourd'hui ce client ne sert qu'à
-- `supabase.auth.*` (confirmé par grep, aucune requête `.from()` dessus).
-- Le service_role (utilisé par le webhook Stripe, le cron, etc. via
-- DATABASE_URL) contourne RLS par défaut sur Supabase — aucune policy
-- explicite n'est donc nécessaire pour lui, l'absence de policy pour
-- `authenticated`/`anon` suffit à leur refuser l'accès par défaut.
-- =============================================================================

alter table public.profiles enable row level security;
alter table public.videos enable row level security;
alter table public.mood_search_cursors enable row level security;
alter table public.swipes enable row level security;
alter table public.user_tag_weights enable row level security;
alter table public.saved_videos enable row level security;
alter table public.favorite_channels enable row level security;
alter table public.video_suggestions enable row level security;
alter table public.stripe_webhook_events enable row level security;

-- Chaque policy est (re)créée via drop-if-exists + create, pour que cette
-- migration reste rejouable sans erreur (ex. "profiles_select_own" existe
-- déjà depuis 0001_profile_trigger_rls_storage.sql).

-- profiles — lecture/écriture de son propre profil uniquement -----------------
drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own" on public.profiles
  for select using (id = auth.uid());
drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles
  for update using (id = auth.uid());

-- videos — lecture publique authentifiée, écriture réservée au service role --
drop policy if exists "videos_select_authenticated" on public.videos;
create policy "videos_select_authenticated" on public.videos
  for select using (auth.role() = 'authenticated');

-- mood_search_cursors — même logique que videos (état interne du cron) -------
drop policy if exists "mood_search_cursors_select_authenticated" on public.mood_search_cursors;
create policy "mood_search_cursors_select_authenticated" on public.mood_search_cursors
  for select using (auth.role() = 'authenticated');

-- swipes — propriétaire uniquement ---------------------------------------------
drop policy if exists "swipes_all_own" on public.swipes;
create policy "swipes_all_own" on public.swipes
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- user_tag_weights — propriétaire uniquement -----------------------------------
drop policy if exists "user_tag_weights_all_own" on public.user_tag_weights;
create policy "user_tag_weights_all_own" on public.user_tag_weights
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- saved_videos — propriétaire uniquement ----------------------------------------
drop policy if exists "saved_videos_all_own" on public.saved_videos;
create policy "saved_videos_all_own" on public.saved_videos
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- favorite_channels — propriétaire uniquement ------------------------------------
drop policy if exists "favorite_channels_all_own" on public.favorite_channels;
create policy "favorite_channels_all_own" on public.favorite_channels
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- video_suggestions — un utilisateur ne voit/gère que ses propres suggestions ;
-- la modération (voir toutes les suggestions pending, approuver, rejeter) passe
-- aujourd'hui exclusivement par DATABASE_URL (service role, hors RLS) -----------
drop policy if exists "video_suggestions_all_own" on public.video_suggestions;
create policy "video_suggestions_all_own" on public.video_suggestions
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- stripe_webhook_events — aucune policy pour authenticated/anon : table
-- purement technique (idempotence webhook), jamais lue/écrite par un
-- utilisateur, accès refusé par défaut sans policy.
