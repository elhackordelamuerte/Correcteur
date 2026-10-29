# Copia — MVP

Assistant de correction pour enseignants du secondaire, construit à partir de la rétro-ingénierie documentée dans [`../docs`](../docs/README.md). Principe : **l'IA propose, l'enseignant valide**.

- **Stack** : Next.js 16 (App Router, Server Actions) · Supabase (Postgres + RLS, Auth, Storage privé) · Vercel
- **IA** : Google Gemini et OpenRouter, interchangeables, avec bascule automatique de l'un à l'autre

## Fonctionnalités et correspondance avec les PRD

| Fonction | PRD | Où |
|---|---|---|
| Comptes enseignant / élève, classes, code classe à 6 caractères | PRD-01 | `/inscription`, `/app/classes/[id]` |
| Évaluation générée (énoncé + barème, 2 cr.) ou manuelle ; barème proposé (offert) ; **barème figé avant correction**, somme vérifiée | PRD-02 | `/app/evaluations/[id]` |
| Dépôt des copies (photos / PDF), **scan par QR code sans compte**, compression des photos côté navigateur | PRD-03 | `CopyUploader`, `/scan/[token]` |
| Analyse rapide (1 cr.) ou approfondie (transcription + analyse, 2 cr.), en lot | PRD-03 | `AnalyzePanel` |
| **Validation humaine obligatoire**, publication groupée | PRD-03 | `/app/copies/[id]` |
| Compétences en 3 statuts, carte élèves × compétences, suivi dans le temps (Expert) | PRD-04 | page classe, profil élève |
| Exercices de remédiation (1 cr.) : 2 indices, difficulté 1-5, assignation ciblée, correction IA (1 cr.) ou manuelle | PRD-05 | `/app/classes/[id]/exercices` |
| Espace élève mobile : résultats publiés, exercices, compétences, « Le mot de ton prof » | PRD-06 | `/eleve` |
| Variantes DYS/PAP (2 cr.) : 8 besoins, 3 intensités, même total, impression après validation | PRD-07 | page évaluation, `/app/variantes/[id]` |
| Appréciations (1 cr.) neutres, validées avant affichage | PRD-08 | profil élève |
| Crédits : grille, débit atomique, restitution si échec, quota mensuel, essai 14 j Expert, lecture seule à expiration | PRD-09 | `consume_credits`, `/app/compte` |
| RGPD : pseudonyme, export JSON, effacement en cascade, journal d'audit | PRD-10 | profil élève, `/api/eleves/[id]/export` |

## Architecture

```
Navigateur ──► Vercel (fra1) : Next.js
                 ├─ proxy.ts : rafraîchit la session, protège /app et /eleve
                 ├─ Server Actions : toute écriture, avec la session de l'utilisateur ⇒ RLS
                 └─ src/lib/ai : Gemini ⇄ OpenRouter, sorties validées par zod
Navigateur ──► Supabase Storage (URL de dépôt signées, sans passer par Vercel)
Supabase (Francfort) : Postgres + RLS · Auth · Storage privé « copies »
```

Choix structurants, avec leurs ADR d'origine :

- **ADR-004, pseudonymisation** : l'IA ne reçoit jamais de nom. Elle reçoit l'image, l'énoncé et le barème. Les sorties passent par `scrubNames`.
- **ADR-005, validation humaine** : les observations de compétences ne sont créées qu'à la validation par l'enseignant.
- **ADR-006, barème figé** : `balanceRubric` garantit que la somme tombe exactement sur le total. Le gel est refusé sinon.
- **ADR-009, crédits** : débit et restitution passent par des fonctions SQL `security definer`. Les soldes ne sont pas modifiables par le client.
- **ADR-011, cloisonnement** : la RLS couvre chaque table. Les écritures vérifient que la classe, l'élève ou l'évaluation parents appartiennent à l'enseignant (`public.owns`).
- **ADR-017, dégradation gracieuse** : 2 tentatives par fournisseur, puis bascule. En cas d'échec total, les crédits sont restitués et la copie reste corrigeable à la main.
- **ADR-018, contrats de sortie** : `src/lib/ai/schemas.ts`. Le schéma JSON est injecté dans le prompt et la réponse est validée par zod.
- **Durée des fonctions** : chaque copie est analysée par un appel serveur séparé (3 en parallèle). Aucun appel ne dépasse ainsi la limite de 60 s de Vercel.

## Déploiement

### 1. Supabase

1. Créez un projet dans la région **Frankfurt (eu-central-1)**.
2. Appliquez la migration, avec l'une des deux méthodes :
   - **SQL Editor** : collez `supabase/migrations/20261026000000_init.sql` puis exécutez ;
   - **CLI** : `npx supabase link --project-ref <ref>` puis `npx supabase db push`.
3. Réglez **Authentication → URL Configuration** :
   - *Site URL* : `https://<votre-domaine>` ;
   - *Redirect URLs* : `https://<votre-domaine>/auth/callback`.
4. Récupérez dans **Project Settings → API** l'URL du projet, la clé `anon` et la clé `service_role`.

### 2. Clés IA

- **Gemini** : clé sur https://aistudio.google.com/apikey. Utilisez un **projet facturé** : sur le niveau gratuit, Google peut utiliser les données pour améliorer ses modèles, ce qui est incompatible avec des copies d'élèves.
- **OpenRouter** : clé sur https://openrouter.ai/keys. Le code impose `provider.data_collection = "deny"`.
- **Modèle** : vérifiez le nom du modèle actuel avant de déployer (`GEMINI_MODEL`, `OPENROUTER_MODEL`). Les valeurs par défaut sont des exemples. Il faut un modèle **multimodal** (image + PDF).

### 3. Vercel

1. Importez le dossier `app/` (Root Directory = `app` si le dépôt contient aussi `docs/`).
2. Renseignez les variables listées dans `.env.example` :

| Variable | Portée | Remarque |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Toutes | |
| `SUPABASE_SERVICE_ROLE_KEY` | **Serveur uniquement** | Sert à la page de scan sans compte |
| `AI_PROVIDER` | Toutes | `gemini` ou `openrouter` |
| `GEMINI_API_KEY`, `GEMINI_MODEL` | Serveur | |
| `OPENROUTER_API_KEY`, `OPENROUTER_MODEL` | Serveur | Facultatif : sert de secours |
| `NEXT_PUBLIC_SITE_URL` | Toutes | Facultatif sur Vercel (repli sur le domaine de production) |

3. Déployez, puis vérifiez `https://<domaine>/api/health`. La réponse indique quels fournisseurs sont configurés, sans exposer les clés.

`vercel.json` place les fonctions à **fra1**, à côté de la base, pour la latence et pour garder les données dans l'UE.

## Développement

```bash
cp .env.example .env.local   # puis renseigner les valeurs
npm install
npm run dev
```

| Commande | Contenu |
|---|---|
| `npm test` | Tests unitaires : règles métier, couche IA avec `fetch` simulé (bascule, contrats, PDF) |
| `npm run test:db` | Exécute la migration sur un vrai Postgres en WASM (PGlite) et vérifie 40 propriétés : RLS entre enseignants, visibilité élève, crédits, rattachement, stockage, cascade RGPD |
| `npm run lint` | Vérification TypeScript |
| `npm run build` | Build de production |

## Limites connues du MVP

- **Paiement** : Stripe n'est pas branché. Forfaits, essai, quotas et lecture seule sont gérés en base. Pour changer un forfait, il faut aujourd'hui passer par SQL (`update teacher_accounts set plan = 'pro' …`). À faire : Checkout, webhook mettant à jour `plan`, recharges ajoutées à `purchased_balance`.
- **Nom sur la copie** : le nom manuscrit peut figurer sur la photo. Le prompt interdit de le recopier et les sorties sont filtrées, mais l'image transmise peut le contenir (risque R2 du PRD-10). À faire : un recadrage ou un masquage du bandeau de nom avant l'envoi.
- **Rattachement automatique** : lors du scan, l'enseignant choisit l'élève. Il n'y a pas d'OCR du nom, par choix (voir le point précédent).
- **Essais multiples** : rien n'empêche de créer plusieurs comptes d'essai. À prévoir : vérification d'e-mail obligatoire (activée par défaut dans Supabase) et limitation de débit.
- **Non implémentés** : temps réel, dictée vocale, recharges, offre établissement.
