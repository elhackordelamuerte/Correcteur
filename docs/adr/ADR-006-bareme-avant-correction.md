# ADR-006 · Barème fixé avant la correction et vérifié par le code

- **Statut** : Accepté · **Confiance** : [Observé]

## Contexte
Reproche principal aux IA de correction : notation trop généreuse et instable (« deux fois la même copie donne deux notes différentes »). Les concurrents « déduisent le barème après coup ».

## Décision
1. Le barème (3 à 8 critères : intitulé, attendu, points, compétence) est posé **avant** toute correction, généré gratuitement ou saisi.
2. L'IA applique la grille critère par critère ; elle ne décide pas de ce qui compte.
3. Invariants vérifiés **par le logiciel**, pas par consigne au modèle : somme des points = total de l'évaluation ; note par critère ≤ maximum du critère ; note totale ≤ total.
4. Le barème est offert pour inciter à toujours en poser un.

## Conséquences
- (+) Cadre stable et auditable ; différenciation marketing nette.
- (+) Chaque critère rattaché à une compétence produit un signal de suivi ([ADR-013](ADR-013-modele-competences.md)).
- (−) Une main humaine peut déséquilibrer le total en éditant : l'interface doit avertir.
- (−) Ne garantit pas la reproductibilité stricte de l'évaluation qualitative du LLM, seulement ses bornes.

## Preuves
Articles « Ajuster son barème », « Générer un énoncé et un barème » (« Ce n'est pas une consigne donnée à l'analyse, c'est une vérification faite par le logiciel ») ; page Évaluations (« aucune note ne dépasse votre total »).
