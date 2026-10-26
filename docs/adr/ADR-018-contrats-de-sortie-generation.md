# ADR-018 · Contrats de sortie stricts pour les contenus générés

- **Statut** : Accepté · **Confiance** : [Observé] (formats) / [Déduit] (validation par schéma)

## Contexte
Des contenus générés hétérogènes sont difficiles à afficher, à éditer et à exploiter dans le suivi. La qualité pédagogique exige une forme constante.

## Décision
Chaque type de génération respecte un format fixe, vraisemblablement imposé par sortie structurée (JSON) et vérifié côté serveur :

| Génération | Contrat |
|---|---|
| Barème | 3 à 8 critères {intitulé, attendu, points, compétence} ; Σ points = total |
| Énoncé | Contexte, questions du plus accessible au plus exigeant, points par partie, **sans corrigé**, calibré sur la durée |
| Analyse de copie | Note par critère bornée, note proposée, forces/lacunes avec codes de compétence, erreurs récurrentes, synthèse prof, retour élève, mots douteux signalés |
| Exercice | Titre, énoncé autonome, solution pas à pas, **exactement deux indices** progressifs, difficulté 1 à 5 |
| Retour d'exercice à l'élève | Score, point positif réel, pourquoi de l'erreur, solution, « Et maintenant ? » ; **tutoiement**, ton encourageant |
| Appréciation | 3 à 5 phrases, un point d'appui puis **un seul** axe de progrès, **sans prénom ni marque de genre** |
| Variante DYS | Liste des transformations appliquées, total inchangé |

## Conséquences
- (+) Interfaces d'édition prévisibles ; contrôles automatiques possibles (bornes, nombre d'indices, longueur).
- (+) Cohérence de ton sur toute la plateforme.
- (−) Prompts et schémas à maintenir par type ; régénération en cas de sortie non conforme (avec restitution du crédit si échec final, [ADR-009](ADR-009-modele-credits.md)).

## Preuves
Articles « Générer un énoncé et un barème », « Générer des exercices ciblés », « Faire un exercice », « Régler la correction automatique », « Générer une appréciation », « Analyse rapide ou approfondie ».
