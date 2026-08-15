# Loupick

Trouve une vidéo YouTube qui va vraiment te plaire, sans passer 20 minutes à scroller. Indique tes centres d'intérêt, swipe les propositions une par une (garder / passer, façon Tinder), et Loupick affine ses suggestions à chaque swipe.

## Stack

- **Next.js 15** (App Router, Server Actions) + React 19 + TypeScript
- **Supabase** — Postgres, Auth (e-mail/mot de passe), RLS
- **Drizzle ORM** (`postgres-js`) pour les tables métier
- **API YouTube Data v3** — recherche et métadonnées vidéo, jamais appelée au moment d'un swipe (voir plus bas)
- **Stripe** — abonnement Loupick+ (Checkout, Billing Portal, webhook idempotent)
- **Framer Motion** — geste de swipe sur la carte vidéo
- **Vercel Cron** — job quotidien qui alimente le pool de vidéos
- **Sentry** (optionnel) — suivi d'erreurs, inactif sans `SENTRY_DSN`
- **Vercel Analytics** — mesure d'audience sans cookie

## Démarrer en local

```bash
npm install
cp .env.example .env.local
```

Renseigne dans `.env.local` :
1. Un projet [Supabase](https://supabase.com) (gratuit) — URL, clé publique, clé secrète, connection string Postgres
2. Une clé [YouTube Data API v3](https://console.cloud.google.com) (gratuite, projet Google Cloud → activer l'API → créer une clé "Données publiques")
3. Des clés [Stripe](https://dashboard.stripe.com) + un Price ID pour l'abonnement Loupick+
4. Un `CRON_SECRET` (`openssl rand -hex 24`)

Puis applique le schéma et lance le serveur :

```bash
npm run db:generate   # migrations SQL (drizzle/) à partir de src/lib/db/schema.ts
npm run db:migrate    # applique les migrations sur Supabase
npm run dev
```

## Architecture

```
src/
  app/
    page.tsx                       Landing page
    login/ signup/ forgot-password/ reset-password/   Pages d'auth (Supabase Auth)
    auth/callback/                 Échange le code des liens Supabase contre une session
    (app)/                         Espace connecté (protégé par le middleware)
      onboarding/                  2-3 questions sur les centres d'intérêt à l'inscription
      dashboard/                   Écran de découverte (swipe des vidéos)
      liste/                       Vidéos sauvegardées ("à regarder plus tard")
      settings/                    Profil utilisateur
      billing/                     Abonnement Stripe
    api/
      stripe/checkout|portal|webhook/   Abonnement Loupick+
      cron/refresh-videos/         Job quotidien qui alimente/rafraîchit le pool de vidéos (protégé par CRON_SECRET)

  components/
    ui/                            Primitives (Button, Card, Input, Badge, Logo...)
    discovery/                     Carte vidéo swipable, liste sauvegardée
    settings/ billing/ dashboard/ auth/ legal/   Composants par domaine

  lib/
    db/schema.ts                   Schéma Drizzle (profiles, videos, swipes, userTagWeights,
                                    savedVideos, moodSearchCursors, stripeWebhookEvents)
    db/index.ts                    Client Drizzle (postgres-js, pool minimal + cache HMR)
    supabase/client.ts|server.ts|middleware.ts|admin.ts   Clients Supabase
    auth/current-user.ts           Utilisateur Supabase Auth courant + son profil
    actions/                       Server actions (auth, discovery, onboarding, saved-videos, profil)
    youtube/client.ts              Client minimal API YouTube Data v3 (search.list, videos.list)
    youtube/moods.ts               Catégories/moods prédéfinies (onboarding + alimentation du pool)
    stripe/client.ts               Client Stripe + Price ID
    constants.ts                   Forfaits (Gratuit/Loupick+), limite de découvertes/jour

drizzle/                           Migrations SQL générées (drizzle-kit generate)
vercel.json                        Planification du cron de rafraîchissement des vidéos
```

## Comment fonctionne la découverte de vidéos

L'API YouTube Data v3 est limitée à 10 000 unités/jour gratuites (`search.list` coûte 100 unités). Les swipes utilisateur **ne font jamais d'appel direct à l'API** — ils piochent dans la table `videos`, un pool mis en cache et alimenté uniquement par le job planifié (`api/cron/refresh-videos`, une fois/jour) :

1. Une recherche par mood prédéfinie (8 moods, `src/lib/youtube/moods.ts`), avec pagination et rotation de formulations pour faire grossir le pool dans le temps plutôt que de toujours récupérer les mêmes résultats.
2. Rafraîchissement (ou suppression) des vidéos en cache depuis plus de 30 jours, conformément à la politique YouTube API Services.
3. Budget total ≈ 800-900 unités/exécution, largement sous le quota gratuit.

Le choix de la prochaine vidéo (`getNextVideoAction`) combine un score appris par tag (`userTagWeights`, ajusté à chaque swipe) et un mécanisme d'exploration epsilon-greedy pour éviter de ne renforcer que les 2-3 centres d'intérêt de départ.

## Notes de sécurité

- Toutes les clés secrètes (`DATABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `STRIPE_SECRET_KEY`, `YOUTUBE_API_KEY`, `CRON_SECRET`...) ne sont lues que côté serveur, jamais préfixées `NEXT_PUBLIC_`.
- RLS activé sur les tables métier en défense en profondeur ; l'accès normal passe par des server actions qui vérifient explicitement la propriété de la ressource.
- La route de cron vérifie l'en-tête `Authorization: Bearer $CRON_SECRET` avant d'appeler l'API YouTube.
- Rate limiting (`src/lib/rate-limit.ts`) sur l'authentification et les actions de découverte (`getNextVideoAction`, `recordSwipeAction`).
- Le quota quotidien du forfait Gratuit est revérifié côté serveur à chaque action, jamais dépendant de l'ordre d'appel côté client.
