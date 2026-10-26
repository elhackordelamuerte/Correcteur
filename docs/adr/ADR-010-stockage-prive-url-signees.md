# ADR-010 · Stockage privé et URL signées d'une heure

- **Statut** : Accepté · **Confiance** : [Observé]

## Contexte
Copies d'élèves et médias ne doivent jamais être accessibles par une adresse publique devinable ou partageable durablement.

## Décision
Tous les fichiers (copies, médias joints, audios) sont dans un stockage privé Supabase. L'accès se fait uniquement par URL signées valables **1 heure**, générées pour l'utilisateur autorisé. Le service d'analyse reçoit le contenu via ce même mécanisme ou en transfert direct.

## Conséquences
- (+) Une fuite de lien expire rapidement.
- (−) Les liens ne peuvent pas être mis en favoris ; régénération nécessaire pour les longues sessions de correction.

## Preuves
Sécurité §4 (« liens signés à durée courte (1 heure) ») ; articles « Scanner une pile », « Joindre des médias ».
