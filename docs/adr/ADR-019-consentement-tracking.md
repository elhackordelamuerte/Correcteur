# ADR-019 · Consentement strict : tarteaucitron, sans Consent Mode Google

- **Statut** : Accepté · **Confiance** : [Observé] (code commenté publiquement)

## Contexte
Acquisition par publicité Meta, besoin de mesurer les conversions, cible sensible (enseignants, données d'élèves), exigence CNIL.

## Décision
- Bandeau **tarteaucitron** (`highPrivacy: true`, refus et acceptation en un clic, services refusables séparément) ; lien « Gérer mes cookies » en pied de page plutôt qu'une pastille flottante qui masquait des boutons.
- **Google Consent Mode désactivé** volontairement : mesuré, il envoyait une requête `page_view` (avec l'IP) à Google avant tout accord.
- **Polices auto-hébergées** pour qu'aucune requête ne parte chez Google sans consentement.
- Cookie de consentement sur `.margouia.re` pour que le choix suive le visiteur vers l'app.
- `margou-meta.js` : n'émet un événement que si `fbq.callMethod` existe (seul témoin fiable du chargement réel après consentement) ; génère un `eventID` UUID en prévision d'une Conversions API serveur ; conserve `fbclid` 90 jours après consentement ; **aucun prix dans le JS**, les montants venant de Stripe.

## Conséquences
- (+) Conformité réelle et démontrable ; cohérence avec le discours sur les données.
- (−) Perte de mesure pour les visiteurs qui refusent (pas de modélisation Google).
- (−) La déduplication navigateur/serveur ne prendra effet qu'avec une CAPI à venir.

## Preuves
Scripts en ligne de `/essai-gratuit` et `/tarifs` ; `/assets/js/margou-meta.js` ; Politique §10.
