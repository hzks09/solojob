# Gabarits d'e-mail Supabase Auth

Ces fichiers sont la source de vérité des e-mails envoyés par Supabase Auth.
Ils ne sont pas déployés automatiquement : il faut les coller dans le tableau
de bord Supabase → **Authentication → Emails**, onglet correspondant.

| Fichier                | Onglet du tableau de bord |
| ---------------------- | ------------------------- |
| `confirm-signup.html`  | Confirm signup            |
| `reset-password.html`  | Reset password            |

## Pourquoi ces liens et pas `{{ .ConfirmationURL }}`

`{{ .ConfirmationURL }}` produit un lien en flux PKCE : la session ne peut être
ouverte que dans le navigateur qui a rempli le formulaire d'inscription, parce
que l'échange réclame un cookie `code-verifier` déposé à ce moment-là.

Quelqu'un qui s'inscrit sur son ordinateur puis relève son e-mail sur son
téléphone n'a pas ce cookie : le lien est refusé avec « ce lien n'est plus
valide », alors qu'il n'a ni expiré ni servi.

`{{ .TokenHash }}` envoyé sur `/auth/confirm` passe par `verifyOtp`, qui ne
dépend d'aucun cookie — le lien fonctionne depuis n'importe quel appareil.
Voir `src/app/auth/confirm/route.ts`.

## Prérequis

**Authentication → URL Configuration → Site URL** doit pointer sur l'URL de
production (c'est ce que `{{ .SiteURL }}` remplace dans les liens ci-dessous).
Si elle vaut encore `http://localhost:3000`, tous les e-mails de prod enverront
les gens sur leur propre machine.
