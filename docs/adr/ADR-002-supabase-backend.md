# ADR-002 · Supabase (Francfort) comme backend unique

- **Statut** : Accepté · **Confiance** : [Observé]

## Contexte
Petite équipe, besoin de Postgres, d'authentification, de stockage de fichiers privés et de mises à jour en temps réel, avec hébergement dans l'UE pour des données de mineurs.

## Décision
Supabase (projet `ejjtbqmpmecerqylbgkb`), région Francfort, pour : base Postgres, authentification e-mail/mot de passe, Storage privé (copies, médias), Realtime (WebSocket). Sauvegardes conservées en Lituanie.

## Conséquences
- (+) Un seul fournisseur pour données, auth et fichiers ; contrôle d'accès au niveau des lignes possible ([ADR-011](ADR-011-cloisonnement-et-audit.md)).
- (+) URL signées natives pour les fichiers ([ADR-010](ADR-010-stockage-prive-url-signees.md)).
- (+) Realtime pour la progression des corrections par lot.
- (−) Société de droit singapourien : argument « UE » qui repose sur la localisation des données, pas sur la nationalité du prestataire.
- (−) Dépendance forte (auth, RLS, storage) : migration coûteuse.

## Preuves
CSP de l'app : `connect-src 'self' https://ejjtbqmpmecerqylbgkb.supabase.co wss://ejjtbqmpmecerqylbgkb.supabase.co`, idem `img-src`, `media-src`. Mentions légales : « SUPABASE PTE. LTD. … stockées à Francfort ».
