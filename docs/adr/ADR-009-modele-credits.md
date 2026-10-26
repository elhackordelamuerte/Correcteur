# ADR-009 · Modèle économique à crédits

- **Statut** : Accepté · **Confiance** : [Observé]

## Contexte
Le coût marginal d'une action IA est variable ; un forfait illimité exposerait la marge. Les enseignants redoutent les factures surprises.

## Décision
- Abonnement donnant un quota mensuel (120 / 250) + recharges (50 / 150 / 400).
- Unité = « une action de Margou » ; grille publique ; tout ce qui est manuel = 0.
- **Débit à l'engagement, restitution si pas de livrable** (« Pas de livrable, pas de débit »).
- Ordre de consommation : inclus d'abord, achetés ensuite ; inclus remis à niveau chaque mois sans report ; achetés conservés pendant l'abonnement, perdus à son expiration.
- Coût affiché avant chaque action ; alerte avant épuisement.
- Exceptions tarifaires délibérées : barème offert, variante DYS au même prix quelle que soit l'intensité ([ADR-015](ADR-015-variantes-dys-pap.md)).

## Conséquences
- (+) Coût IA répercuté proportionnellement ; upsell naturel vers Expert ou recharges.
- (+) Transparence = confiance.
- (−) Charge cognitive (estimateur nécessaire sur le site).
- (−) Implémentation : registre de mouvements de crédits idempotent, compensation en cas d'échec, gestion concurrente des lots.

## Implémentation probable **[Hypothèse]**
Table de mouvements (débit / restitution / recharge / remise à niveau mensuelle) avec solde calculé ou verrouillé côté base (fonction Postgres transactionnelle), webhook Stripe pour les recharges et les échéances.

## Preuves
Tarifs, CGU §4 et §8, article « Comprendre les crédits ».
