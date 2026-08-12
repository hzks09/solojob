# SoloJob

Devis, factures et relances de paiement pour artisans et indépendants solos (plombiers, électriciens, jardiniers, femmes de ménage, bricoleurs...). Crée un devis en 2 minutes, convertis-le en facture en un clic, encaisse en ligne, et laisse SoloJob relancer automatiquement les clients en retard.

## Stack

- **Next.js 15** (App Router, Server Actions) + React 19 + TypeScript
- **Supabase** — Postgres, Auth (e-mail/mot de passe), Storage (bucket `logos`), RLS
- **Drizzle ORM** (`postgres-js`) pour les tables métier
- **Stripe** — abonnements (Free / Solo / Solo+) et Payment Links par facture
- **Resend** — e-mails de relance
- **@react-pdf/renderer** — génération de PDF de facture à la volée (jamais stocké, pour rester dans le tier gratuit Supabase Storage)
- **Vercel Cron** — job quotidien de relance des factures en retard

## Démarrer en local

```bash
npm install
cp .env.example .env.local
```

Renseigne dans `.env.local` :
1. Un projet [Supabase](https://supabase.com) (gratuit) — URL, clé publique, clé secrète, connection string Postgres
2. Une clé [Resend](https://resend.com) (gratuit) pour les e-mails de relance
3. Des clés [Stripe](https://dashboard.stripe.com) + deux Price IDs (Solo 12€/mois, Solo+ 19€/mois)
4. Un `CRON_SECRET` (`openssl rand -hex 24`)

Puis applique le schéma et lance le serveur :

```bash
npm run db:generate   # migrations SQL (drizzle/) à partir de src/lib/db/schema.ts
npm run db:migrate    # applique les migrations sur Supabase
npm run dev
```

Le trigger de création de profil, les policies RLS et le bucket Storage `logos` sont dans `supabase/migrations/0001_profile_trigger_rls_storage.sql` (à exécuter une fois sur la base Supabase, en plus des migrations Drizzle).

## Architecture

```
src/
  app/
    page.tsx                       Landing page
    login/ signup/ forgot-password/ reset-password/   Pages d'auth (Supabase Auth)
    auth/callback/                 Échange le code des liens Supabase (confirmation, reset) contre une session
    (app)/                         Espace connecté (protégé par le middleware)
      dashboard/                   Stats + chiffre d'affaires (payé ce mois / en attente)
      clients/                     CRUD clients
      devis/                       Devis + conversion en facture
      factures/                    Factures, filtres par statut, PDF, paiement
      settings/                    Logo + infos entreprise
      billing/                     Abonnement Stripe
    api/
      factures/[id]/pdf/           Génère le PDF de la facture à la volée (jamais stocké)
      stripe/checkout|portal|webhook/   Abonnements + paiement des factures
      cron/relances/               Job quotidien de relance (protégé par CRON_SECRET)

  components/
    ui/                            Primitives (Button, Card, Input, Badge...)
    clients/ devis/ factures/ settings/ billing/ dashboard/   Composants métier par domaine

  lib/
    db/schema.ts                   Schéma Drizzle (profiles, clients, devis, factures, relances)
    db/index.ts                    Client Drizzle (postgres-js, pool minimal + cache HMR)
    supabase/client.ts|server.ts|middleware.ts|admin.ts   Clients Supabase (browser/serveur/middleware/service role)
    auth/current-user.ts           Utilisateur Supabase Auth courant + son profil
    actions/                       Server actions (clients, devis, factures, paiement, profil)
    pdf/facture-pdf.tsx            Document @react-pdf/renderer
    email/resend.ts                E-mail de relance
    stripe/client.ts                Client Stripe + Price IDs
    constants.ts                   Forfaits (Free/Solo/Solo+), limite de factures gratuites
    factures-utils.ts              Calcul du statut "en retard" (jamais stocké en base)

drizzle/                           Migrations SQL générées (drizzle-kit generate)
supabase/migrations/               Trigger profil, RLS, bucket Storage (SQL à la main)
vercel.json                        Planification du cron de relance
```

## Notes de sécurité

- Toutes les clés secrètes (`DATABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `STRIPE_SECRET_KEY`, `CRON_SECRET`...) ne sont lues que côté serveur, jamais préfixées `NEXT_PUBLIC_`.
- RLS activé sur toutes les tables métier (`user_id = auth.uid()`) en défense en profondeur ; l'accès normal passe par des server actions qui vérifient explicitement la propriété de la ressource.
- Le bucket Storage `logos` limite chaque objet à 2 Mo et restreint l'écriture au dossier `<user_id>/` du propriétaire (policy Storage).
- La route de cron vérifie l'en-tête `Authorization: Bearer $CRON_SECRET` avant d'envoyer la moindre relance.
- Le PDF de facture est généré à la demande, jamais persisté — pas de consommation de stockage liée au volume de factures.
