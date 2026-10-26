# ADR-005 · Validation humaine obligatoire (human-in-the-loop)

- **Statut** : Accepté · **Confiance** : [Observé]

## Contexte
Une note engage l'élève et l'enseignant. Les LLM peuvent se tromper. Le RGPD (art. 22) encadre les décisions fondées exclusivement sur un traitement automatisé. Les enseignants se méfient de l'IA qui « note n'importe comment ».

## Décision
Toute production IA est une **proposition**. La validation explicite de l'enseignant est le seul déclencheur de deux effets : (1) visibilité par l'élève ; (2) mise à jour du profil de compétences. Une validation peut être annulée. Même principe pour variantes DYS (pas d'impression avant validation), exercices (relecture avant assignation), appréciations (jamais enregistrées seules).

Exception assumée : la correction automatique des **exercices d'entraînement**, choisie explicitement par l'enseignant à l'assignation, est envoyée directement à l'élève, avec un poids réduit dans le profil.

## Conséquences
- (+) Argument de confiance central (« 100 % des copies validées par vous ») et protection juridique (« c'est votre nom qui accompagne le résultat »).
- (+) Le profil n'est jamais pollué par une analyse non relue.
- (−) Le gain de temps est plafonné par la relecture.
- (−) Machine à états plus riche (proposée / validée / publiée / dévalidée).

## Preuves
Articles « Valider une correction », « Créer une variante adaptée », « Générer une appréciation » ; Sécurité §8 ; CGU §2.
