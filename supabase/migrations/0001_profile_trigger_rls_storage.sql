-- =============================================================================
-- SoloJob — Trigger de création de profil, RLS, bucket Storage "logos"
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Crée automatiquement un profil à l'inscription (Supabase Auth)
-- -----------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, new.raw_user_meta_data->>'full_name');
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- -----------------------------------------------------------------------------
-- ROW LEVEL SECURITY
-- -----------------------------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.clients enable row level security;
alter table public.devis enable row level security;
alter table public.devis_lignes enable row level security;
alter table public.factures enable row level security;
alter table public.facture_lignes enable row level security;
alter table public.relances enable row level security;

-- profiles ------------------------------------------------------------------
create policy "profiles_select_own" on public.profiles
  for select using (id = auth.uid());
create policy "profiles_update_own" on public.profiles
  for update using (id = auth.uid());

-- clients ---------------------------------------------------------------------
create policy "clients_all_own" on public.clients
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- devis -------------------------------------------------------------------------
create policy "devis_all_own" on public.devis
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "devis_lignes_all_own" on public.devis_lignes
  for all using (
    exists (select 1 from public.devis d where d.id = devis_lignes.devis_id and d.user_id = auth.uid())
  )
  with check (
    exists (select 1 from public.devis d where d.id = devis_lignes.devis_id and d.user_id = auth.uid())
  );

-- factures -----------------------------------------------------------------------
create policy "factures_all_own" on public.factures
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "facture_lignes_all_own" on public.facture_lignes
  for all using (
    exists (select 1 from public.factures f where f.id = facture_lignes.facture_id and f.user_id = auth.uid())
  )
  with check (
    exists (select 1 from public.factures f where f.id = facture_lignes.facture_id and f.user_id = auth.uid())
  );

-- relances (lecture propriétaire ; écriture réservée au serveur/cron via service_role) --
create policy "relances_select_own" on public.relances
  for select using (
    exists (select 1 from public.factures f where f.id = relances.facture_id and f.user_id = auth.uid())
  );

-- -----------------------------------------------------------------------------
-- STORAGE — bucket "logos" (un petit fichier par utilisateur, chemin userId/*)
-- -----------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit)
values ('logos', 'logos', true, 2097152) -- 2 Mo max
on conflict (id) do nothing;

create policy "logos_public_read" on storage.objects
  for select using (bucket_id = 'logos');

create policy "logos_owner_insert" on storage.objects
  for insert with check (bucket_id = 'logos' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "logos_owner_update" on storage.objects
  for update using (bucket_id = 'logos' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "logos_owner_delete" on storage.objects
  for delete using (bucket_id = 'logos' and (storage.foldername(name))[1] = auth.uid()::text);
