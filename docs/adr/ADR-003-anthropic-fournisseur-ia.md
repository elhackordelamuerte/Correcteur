# ADR-003 · Anthropic comme fournisseur d'analyse IA

- **Statut** : Accepté · **Confiance** : [Observé] (fournisseur) / [Hypothèse] (modèles, motivations)

## Contexte
Il faut lire des copies manuscrites (vision), appliquer un barème critère par critère, rédiger des retours nuancés en français et générer des contenus pédagogiques structurés.

## Décision
L'analyse et la génération sont confiées à Anthropic (modèles Claude), sous-traitant listé dans la politique de confidentialité. Le transfert hors UE (États-Unis) est encadré par les clauses contractuelles types de la Commission européenne.

## Conséquences
- (+) Modèles multimodaux capables de transcrire du manuscrit et de produire des sorties structurées.
- (+) Engagement contractuel de non-entraînement sur les données d'API, cohérent avec la promesse « jamais utilisées pour entraîner un modèle ».
- (−) Transfert hors UE à justifier ; la pseudonymisation devient obligatoire ([ADR-004](ADR-004-pseudonymisation-ia.md)).
- (−) Coût variable par appel : il est répercuté via le modèle à crédits ([ADR-009](ADR-009-modele-credits.md)).

## Preuves
Politique de confidentialité §4 : « analyse par intelligence artificielle (Anthropic) » ; §5 : « L'analyse est réalisée par Anthropic, société de droit américain : elle constitue un transfert hors Union européenne, encadré par les clauses contractuelles types ».

## Inconnues
Version des modèles, éventuel routage par tâche (modèle léger pour l'analyse rapide, plus puissant pour l'approfondie), recours à une région de traitement UE.
