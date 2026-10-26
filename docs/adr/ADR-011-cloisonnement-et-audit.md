# ADR-011 · Cloisonnement des accès par ligne et journal d'audit

- **Statut** : Accepté · **Confiance** : [Observé] (règles) / [Déduit] (Row Level Security)

## Contexte
Multi-locataire : des milliers d'enseignants et d'élèves dans la même base ; données de mineurs ; obligations de traçabilité RGPD.

## Décision
- Règles d'accès : un enseignant ne voit que ses classes ; un élève ne voit que **ses propres résultats validés** ; un parent, ceux de l'élève relié, en lecture seule.
- Avec Supabase, ces règles sont très probablement implémentées en **Row Level Security** Postgres (la condition « validé » faisant partie de la politique côté élève).
- Journal d'audit des opérations sensibles (accès, exports, effacements), conservé 1 an.

## Conséquences
- (+) Défense en profondeur : même un bug d'interface ne peut exposer les données d'une autre classe.
- (+) Preuve de traitement des demandes RGPD.
- (−) Politiques RLS complexes (élève multi-classes, parent relié, visibilité conditionnelle à la validation et à la publication).

## Preuves
Sécurité §5-7 ; Politique §7 ; article « Exporter ou effacer les données d'un élève ».
