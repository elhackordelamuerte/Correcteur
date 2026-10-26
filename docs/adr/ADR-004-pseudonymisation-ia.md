# ADR-004 · Pseudonymisation avant tout appel IA

- **Statut** : Accepté · **Confiance** : [Observé] (principe) / [Hypothèse] (masquage image)

## Contexte
Données de mineurs, transfert hors UE vers le fournisseur IA, objection marketing majeure (« nourrir les big data »).

## Décision
Aucun nom ni prénom d'élève n'est envoyé au service d'analyse. L'élève y est désigné par un identifiant neutre ; la correspondance identifiant ↔ identité n'existe que dans la base Supabase. À l'import, un « masquage du nom » est proposé pour les copies.

## Conséquences
- (+) Le transfert hors UE ne porte jamais d'identité directe.
- (+) Appréciations générées sans prénom ni genre ([ADR-018](ADR-018-contrats-de-sortie-generation.md)), cohérent avec ce principe.
- (−) L'efficacité dépend du masquage effectif du nom manuscrit sur l'image ; le contenu d'une copie peut aussi contenir des éléments identifiants (récit personnel).
- (−) Les retours générés ne peuvent pas être personnalisés par le prénom côté IA ; la personnalisation (« Salut Maëlys ! ») est faite par l'application.

## Preuves
Page Sécurité §5 ; Politique §5 ; FAQ « Les noms d'élèves ne sont jamais transmis à l'IA » ; comparatif : « Import, scan au téléphone, masquage du nom ».
