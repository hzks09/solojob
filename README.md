# RoomAI

Plateforme SaaS de réaménagement d'intérieur par IA. Prends une photo d'une pièce, choisis un style, obtiens un rendu photoréaliste + une liste de mobilier avec estimation de prix.

## Stack

- **Next.js 15** (App Router, Server Actions) + React 19 + TypeScript
- **Neon** (Postgres serverless) + **Drizzle ORM**
- **Auth.js v5** (Google, Apple, e-mail/mot de passe) + adapter Drizzle
- **Vercel Blob** pour le stockage des photos
- **Stripe** pour les abonnements (Pro / Premium)
- **Resend** pour les e-mails transactionnels (vérification, reset password)
- Fournisseur IA modulaire (`mock` par défaut, `replicate` en option) — voir `src/lib/ai/`
- Tailwind CSS v4, `next-themes` (dark mode), `sonner` (toasts), `framer-motion`

## Démarrer en local (100% gratuit)

```bash
npm install
cp .env.example .env.local
npm run dev
```

Par défaut `.env.local` peut rester avec `AI_PROVIDER=mock` : aucune génération IA réelle n'est facturée, une image de substitution est renvoyée. Il faut quand même une vraie base **Neon** (gratuite) pour que l'auth et les données fonctionnent — [créer un projet Neon](https://neon.tech), copier la connection string dans `DATABASE_URL`, puis :

```bash
npm run db:push      # applique le schéma directement (dev)
# ou
npm run db:generate  # régénère les migrations SQL (drizzle/) après une modif du schéma
npm run db:migrate   # applique les migrations générées
npm run db:studio    # explorateur de données Drizzle Studio
```

## Coûts

| Service | Gratuit ? |
|---|---|
| Neon, Vercel, Auth.js, Resend, Vercel Blob | Oui, tiers gratuits suffisants pour démarrer |
| Stripe | Oui à l'intégration (commission uniquement sur les vrais paiements clients) |
| Fournisseur IA (Replicate) | **Payant à l'usage**, désactivé par défaut (`AI_PROVIDER=mock`) |

## Architecture

```
src/
  app/                          Routes (App Router)
    page.tsx                    Landing page
    login/ signup/ forgot-password/ reset-password/ verify-email/   Pages d'auth
    dashboard/ studio/ history/ favorites/ billing/                 Espace utilisateur connecté
    gallery/ gallery/[id]/      Galerie publique + détail d'un design
    admin/                      Panneau admin (stats, users, abonnements, contenus, signalements)
    api/
      auth/[...nextauth]/       Route handler Auth.js
      generate/                 Lance une génération IA (débite les crédits)
      generate/[id]/status/     Poll du statut d'une génération
      upload/                   Upload d'image vers Vercel Blob
      stripe/checkout|portal|webhook/   Abonnements Stripe

  components/
    ui/                         Primitives (Button, Card, Input, Badge...)
    auth/ studio/ dashboard/ billing/ gallery/ history/ admin/   Composants métier par domaine
    providers/                  ThemeProvider, SessionProvider

  lib/
    db/schema.ts                Schéma Drizzle (source de vérité de la base)
    db/index.ts                 Client Drizzle (driver HTTP Neon)
    db/credits.ts                Débit/crédit atomique des crédits (CTE SQL)
    auth/auth.config.ts         Config Auth.js "edge-safe" (middleware)
    auth/config.ts              Config Auth.js complète (providers, adapter)
    auth/actions.ts             Inscription, vérification e-mail, reset password
    ai/provider.ts              Interface commune aux fournisseurs IA
    ai/providers/mock.ts        Fournisseur gratuit (dev/test)
    ai/providers/replicate.ts   Fournisseur payant (production)
    stripe/                     Client Stripe + mapping des price IDs
    shopping/detect.ts          Détection d'objets + estimation de prix (placeholder)
    actions/                    Server actions (projects, generations, gallery, admin)
    validations/                Schémas Zod
    rate-limit.ts               Rate limiting en mémoire
    constants.ts                Styles, types de pièces, forfaits, coûts en crédits

drizzle/                        Migrations SQL générées (drizzle-kit generate)
```

## Notes de sécurité

- Toutes les clés secrètes (`DATABASE_URL`, `STRIPE_SECRET_KEY`, `SUPABASE_SERVICE_ROLE_KEY`-like, `REPLICATE_API_TOKEN`...) ne sont lues que côté serveur, jamais préfixées `NEXT_PUBLIC_`.
- Toute écriture en base passe par une server action ou une route API qui vérifie la session (`auth()`) et la propriété de la ressource — pas d'accès direct à la base depuis le client (contrairement à un modèle RLS type Supabase, ici la base Neon n'est jamais exposée au navigateur).
- Validation Zod sur toutes les entrées utilisateur (auth, génération, upload, Stripe).
- Rate limiting sur `/api/generate` et `/api/upload`.
- Le panneau admin est protégé par le middleware (redirection) **et** par un contrôle de rôle dans chaque server action (`requireAdmin()`), en défense en profondeur.
