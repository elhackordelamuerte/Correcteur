# Margou.ia : dossier de rétro-ingénierie produit

> Analyse réalisée le 26 octobre 2026 à partir des sources publiques de `margouia.re` et `app.margouia.re`.
> Ce dossier **reconstitue** les PRD et ADR : Margou.ia ne les publie pas. Chaque affirmation porte un niveau de confiance.

## Niveaux de confiance

| Marqueur | Sens |
|---|---|
| **[Observé]** | Écrit tel quel sur le site, dans les CGU, la politique de confidentialité, le centre d'aide, les en-têtes HTTP ou le JavaScript public. |
| **[Déduit]** | Conclusion directe tirée de plusieurs éléments observés (ex. : CSP qui autorise `wss://…supabase.co` → usage de Supabase Realtime). |
| **[Hypothèse]** | Interprétation plausible, non vérifiable sans accès au code ou à un compte. |

## Sommaire

### Comprendre
- [01 · Vue d'ensemble : ce que fait Margou.ia](01-vue-ensemble.md)
- [02 · Fonctionnement de bout en bout : parcours, modèle de données, cycles de vie](02-fonctionnement.md)
- [03 · Architecture technique observée](03-architecture-technique.md)

### PRD (exigences produit reconstituées)
| # | Document | Périmètre |
|---|---|---|
| 00 | [PRD-00 · Produit global](prd/PRD-00-produit-global.md) | Vision, personas, objectifs, métriques, périmètre |
| 01 | [PRD-01 · Comptes, classes et élèves](prd/PRD-01-comptes-classes-eleves.md) | Inscription, code classe, import CSV |
| 02 | [PRD-02 · Évaluations : création, énoncé, barème, collecte des copies](prd/PRD-02-evaluations.md) | Génération, médias, dépôt en ligne, scan QR |
| 03 | [PRD-03 · Correction et validation](prd/PRD-03-correction-validation.md) | Analyse rapide/approfondie, manuelle, annotations, publication |
| 04 | [PRD-04 · Suivi des compétences](prd/PRD-04-suivi-competences.md) | Profil élève, carte de classe, groupes d'AP, courbes |
| 05 | [PRD-05 · Exercices de remédiation](prd/PRD-05-exercices-remediation.md) | Génération ciblée, bibliothèque, assignation, correction auto |
| 06 | [PRD-06 · Espace élève et parents](prd/PRD-06-espace-eleve.md) | À faire, historique, progrès, oral |
| 07 | [PRD-07 · Adaptation DYS / PAP](prd/PRD-07-adaptation-dys-pap.md) | Variantes, 3 intensités, 8 besoins |
| 08 | [PRD-08 · Appréciations de bulletin](prd/PRD-08-appreciations.md) | Génération assistée, neutralité |
| 09 | [PRD-09 · Monétisation : forfaits, crédits, essai](prd/PRD-09-monetisation.md) | Pro/Expert, recharges, Stripe, estimateur |
| 10 | [PRD-10 · Confidentialité, RGPD, sécurité](prd/PRD-10-rgpd-securite.md) | Minimisation, pseudonymisation, export, audit |
| 11 | [PRD-11 · Site vitrine et acquisition](prd/PRD-11-site-acquisition.md) | Landing pages, tunnel, consentement, Meta |

### ADR (décisions d'architecture reconstituées)
| # | Décision | Statut |
|---|---|---|
| 001 | [Site vitrine statique séparé de l'application Next.js](adr/ADR-001-site-statique-et-app-nextjs.md) | Accepté (déduit) |
| 002 | [Supabase (Francfort) comme backend unique](adr/ADR-002-supabase-backend.md) | Accepté (observé) |
| 003 | [Anthropic comme fournisseur d'analyse IA](adr/ADR-003-anthropic-fournisseur-ia.md) | Accepté (observé) |
| 004 | [Pseudonymisation avant tout appel IA](adr/ADR-004-pseudonymisation-ia.md) | Accepté (observé) |
| 005 | [Validation humaine obligatoire (human-in-the-loop)](adr/ADR-005-validation-humaine.md) | Accepté (observé) |
| 006 | [Barème fixé avant la correction et vérifié par le code](adr/ADR-006-bareme-avant-correction.md) | Accepté (observé) |
| 007 | [Deux modes d'analyse : une passe ou transcription + analyse](adr/ADR-007-analyse-une-ou-deux-passes.md) | Accepté (observé) |
| 008 | [L'audio n'est jamais transmis à l'IA](adr/ADR-008-audio-hors-ia.md) | Accepté (observé) |
| 009 | [Modèle économique à crédits, débit au lancement, restitution en cas d'échec](adr/ADR-009-modele-credits.md) | Accepté (observé) |
| 010 | [Stockage privé et URL signées d'une heure](adr/ADR-010-stockage-prive-url-signees.md) | Accepté (observé) |
| 011 | [Cloisonnement des accès par ligne et journal d'audit](adr/ADR-011-cloisonnement-et-audit.md) | Accepté (déduit) |
| 012 | [Scan mobile par QR code, sans application native](adr/ADR-012-scan-qr-sans-app.md) | Accepté (observé) |
| 013 | [Modèle de compétences à trois statuts, alimenté par critères validés](adr/ADR-013-modele-competences.md) | Accepté (observé) |
| 014 | [Rattachement des élèves par code de classe à six caractères](adr/ADR-014-code-classe.md) | Accepté (observé) |
| 015 | [Variantes DYS/PAP à coût fixe, total conservé, sans marquage](adr/ADR-015-variantes-dys-pap.md) | Accepté (observé) |
| 016 | [Publication groupée distincte de la validation](adr/ADR-016-publication-groupee.md) | Accepté (observé) |
| 017 | [Dégradation gracieuse : solde épuisé et fin d'abonnement](adr/ADR-017-degradation-gracieuse.md) | Accepté (observé) |
| 018 | [Contrats de sortie stricts pour les contenus générés](adr/ADR-018-contrats-de-sortie-generation.md) | Accepté (observé) |
| 019 | [Consentement strict : tarteaucitron, sans Consent Mode Google](adr/ADR-019-consentement-tracking.md) | Accepté (observé) |

## Sources consultées
- 49 URL du `sitemap.xml` (accueil, 4 pages fonctionnalités, tarifs, essai gratuit, sécurité/RGPD, contact, mentions légales, politique de confidentialité, CGU/CGV, 30 articles et rubriques du centre d'aide).
- `https://margouia.re/inscription` (tunnel d'inscription).
- `https://app.margouia.re/connexion` : en-têtes HTTP (CSP, `x-powered-by`) et chunks JavaScript publics.
- `https://margouia.re/assets/js/margou-meta.js` et scripts en ligne (estimateur, consentement).

## Limites
- Aucun accès à un compte : l'interface interne est décrite d'après le centre d'aide et les maquettes des pages marketing.
- Le modèle IA exact (version de Claude), le schéma de base de données et la logique serveur ne sont pas publics.
- L'« offre établissements » et l'« espace parents » sont mentionnés mais pas documentés publiquement.
