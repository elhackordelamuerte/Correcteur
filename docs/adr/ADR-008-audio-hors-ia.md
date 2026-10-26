# ADR-008 · L'audio n'est jamais transmis à l'IA

- **Statut** : Accepté · **Confiance** : [Observé]

## Contexte
La voix d'un mineur est une donnée sensible (biométrique potentielle) ; l'oral se juge mal hors contexte (accent, hésitation, débit).

## Décision
Les enregistrements audio (réponses orales des élèves, audios joints aux énoncés) sont stockés et diffusés mais **jamais** envoyés au service d'analyse. Toute réponse orale est corrigée manuellement par l'enseignant, sans crédit. Une compréhension orale se corrige sur les réponses écrites.

## Conséquences
- (+) Argument de confiance (« la voix de l'élève ne quitte pas votre classe »).
- (+) Pas de coût IA sur l'audio.
- (−) Pas d'aide à la correction de l'oral, pourtant utile en langues.
- Remarque : « choix, pas une limite technique » assumé dans la documentation.

## Preuves
Articles « Corriger une réponse orale », « Joindre des médias », « Créer un exercice à la main » ; FAQ espace élève.
