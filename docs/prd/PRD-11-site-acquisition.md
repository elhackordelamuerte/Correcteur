# PRD-11 · Site vitrine et acquisition

## Contexte
Le site `margouia.re` convertit des enseignants venant de campagnes payantes Meta (ex. `utm_campaign=acq-reunion`, `utm_content=video2`) et du bouche-à-oreille (« Un collègue vous en a parlé »).

## Arborescence **[Observé]**
| Page | Rôle |
|---|---|
| `/` | Accueil : problème, boucle en 6 étapes, bénéfices, chiffres, FAQ |
| `/essai-gratuit` | Landing publicitaire : 3 objections traitées, offre, simulateur, FAQ, crédits et comparatif en modales |
| `/evaluations` | Génération et correction d'évaluations (6 étapes, maquettes interactives) |
| `/exercices` | Exercices de remédiation (4 étapes) |
| `/suivi-competences` | Suivi des classes et élèves |
| `/espace-eleve` | Espace élève |
| `/tarifs` | Forfaits, crédits, estimateur, comparatif, FAQ |
| `/securite-rgpd`, `/politique-confidentialite`, `/mentions-legales`, `/cgu-cgv` | Légal |
| `/contact` | Formulaire (profil : professeur, responsable d'établissement, professeur particulier, presse, partenaire/investisseur, autre) → `POST app.margouia.re/api/contact` |
| `/centre-aide/` | 9 rubriques, 27 articles (enseignants et élèves) |
| `/inscription` | Tunnel en 3 étapes |

## Exigences fonctionnelles
| ID | Exigence |
|---|---|
| F-11.1 | CTA principal unique : « Démarrer mes 14 jours gratuits » / « Essayer gratuitement », barre collante en bas sur mobile (« Aucun débit avant le 15ᵉ jour ») |
| F-11.2 | Les CTA portent `plan` et `facturation` jusqu'à l'inscription (le récapitulatif de prélèvement doit correspondre à la période choisie) |
| F-11.3 | Bascule Mensuel / Annuel synchronisée entre cartes de prix et estimateur |
| F-11.4 | Détail des crédits et comparatif ouverts en **modales** plutôt qu'en sections (« chaque écran de plus est une occasion de partir ») ; gestion du focus accessible |
| F-11.5 | Données structurées schema.org sur les pages |
| F-11.6 | Bandeau de consentement tarteaucitron : GA4 et Pixel Meta refusables séparément, rien n'est chargé avant accord ; lien « Gérer mes cookies » dans le pied de page (pas de pastille flottante) |
| F-11.7 | Cookie de consentement et `fbclid` posés sur `.margouia.re` pour suivre le visiteur du site vers l'app |
| F-11.8 | `margou-meta.js` chargé sur le tunnel (essai-gratuit, inscription, merci) : émet un événement uniquement si le pixel est réellement chargé (`fbq.callMethod`), génère un `eventID` (UUID) pour la déduplication avec une future Conversions API serveur, conserve `fbclid` 90 jours après consentement |
| F-11.9 | Aucun prix codé dans le JS de mesure : les montants viennent de Stripe (réponse API d'inscription ou URL de retour) |
| F-11.10 | Polices auto-hébergées (Bricolage Grotesque, Figtree) pour ne rien envoyer à Google sans consentement |

## Messages clés
- Preuve sociale : « Co-construit avec des enseignants », « Conçu à La Réunion », « Support local ».
- Réassurance : « Sans engagement », « Résiliation en 3 clics », « 100 % des copies validées par vous ».
- Méthode d'essai proposée : « Prenez une évaluation déjà corrigée à la main, passez-la dans Margou, et comparez. »

## Métriques suggérées
Taux de clic CTA → `/inscription` ; complétion étape 1 → 2 (saisie carte = principale friction) ; validation e-mail ; activation (première analyse lancée sous 48 h) ; conversion J15.
