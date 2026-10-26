# ADR-017 · Dégradation gracieuse : solde épuisé et fin d'abonnement

- **Statut** : Accepté · **Confiance** : [Observé]

## Contexte
Un enseignant ne doit jamais perdre l'accès à ses données ni bloquer ses élèves parce que son solde ou son abonnement s'arrête.

## Décision
- **Solde nul** : « rien ne se ferme ». Correction manuelle, création d'exercices, consultation du suivi restent disponibles ; les réponses d'exercices en correction automatique basculent en attente de correction par l'enseignant.
- **Fin d'abonnement** : accès complet jusqu'au terme payé, puis **lecture seule** (classes, élèves, évaluations, copies, barèmes, profils consultables) ; aucune action consommant des crédits ; fonctions Expert coupées (carte, courbes, alertes) ; la lecture détaillée des compétences demeure.
- **Fin d'essai en Pro** : les fonctions Expert ouvertes pendant l'essai se referment au 15ᵉ jour.

## Conséquences
- (+) Confiance, conformité (portabilité préservée), réactivation facilitée.
- (−) Gestion d'états de droits (feature flags par forfait et par statut d'abonnement) dans toute l'application.

## Preuves
Tarifs (FAQ), CGU §6, articles « Comprendre les crédits » et « Régler la correction automatique ».
