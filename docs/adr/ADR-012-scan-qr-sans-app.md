# ADR-012 · Scan mobile par QR code, sans application native

- **Statut** : Accepté · **Confiance** : [Observé]

## Contexte
Objection : « scanner les copies une par une » fait perdre le temps gagné. Installer une app et s'y connecter sur son téléphone est une friction ; les copies sont en papier dans la salle des profs.

## Décision
Chaque évaluation expose un QR code. Le scanner avec l'appareil photo ouvre une page web mobile, **sans installation ni saisie d'identifiants** ; le jeton porté par le QR ne vaut que pour cette évaluation. L'enseignant photographie la pile ; chaque copie est rattachée automatiquement à un élève, avec vérification humaine en cas de doute.

## Conséquences
- (+) « Une pile de copies. Votre téléphone. 30 secondes. »
- (+) Capture via la caméra du navigateur (`permissions-policy: camera=(self)`).
- (−) Le QR est un secret porteur : quiconque le photographie peut déposer des fichiers sur l'évaluation pendant sa validité (durée et révocation non documentées).
- (−) Rattachement automatique faillible → écran de vérification indispensable (« une copie mal attribuée fausse deux suivis »).

## Preuves
Page Évaluations (« Scan de copies via smartphone ») ; article « Scanner une pile de copies avec le QR code ».
