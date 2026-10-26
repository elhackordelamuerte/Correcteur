# ADR-001 · Site vitrine statique séparé de l'application Next.js

- **Statut** : Accepté · **Confiance** : [Observé] pour les faits, [Déduit] pour les motivations

## Contexte
Il faut une vitrine rapide, bien référencée, modifiable sans déploiement applicatif, et une application authentifiée riche (scan, correction, tableaux de bord).

## Décision
- `margouia.re` : HTML statique écrit à la main + JavaScript vanilla, servi par Hostinger (LiteSpeed), cache public 1 h.
- `app.margouia.re` : application Next.js (App Router, RSC), pages non mises en cache (`no-store`).
- Pont entre les deux : liens vers `/connexion`, endpoint `app.margouia.re/api/contact` appelé par la vitrine, cookie de consentement sur `.margouia.re`.

## Conséquences
- (+) Vitrine très légère, SEO maîtrisé (sitemap, schema.org), aucun framework à maintenir côté marketing.
- (+) Isolation : une CSP très stricte peut s'appliquer à l'app sans gêner les traceurs marketing.
- (−) Duplication de contenus (prix, grille de crédits, FAQ) entre vitrine et app ; la règle « aucun prix dans le JS de mesure » ([ADR-019](ADR-019-consentement-tracking.md)) montre que ce risque de désynchronisation est connu.
- (−) Tunnel d'inscription sur la vitrine (`/inscription`) mais compte créé dans l'app : appels cross-origin à gérer.

## Preuves
En-têtes `server: LiteSpeed`, `platform: hostinger` sur les deux domaines ; `x-powered-by: Next.js` et `vary: rsc, next-router-state-tree` sur l'app ; chunks `/_next/static/chunks/app/...`.

## Alternatives écartées (supposées)
Site marketing dans Next.js (couplage des déploiements) ; CMS type WordPress/Webflow.
