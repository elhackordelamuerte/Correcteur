# ADR-014 · Rattachement des élèves par code de classe à six caractères

- **Statut** : Accepté · **Confiance** : [Observé]

## Contexte
Éviter la collecte d'e-mails d'élèves mineurs et la saisie de listes, sans dépendre d'une intégration ENT.

## Décision
Chaque classe a un code de 6 caractères, régénérable (l'ancien devient invalide). L'élève crée un compte (prénom, nom, mot de passe), choisit « élève » et saisit un ou plusieurs codes : un compte unique, plusieurs classes. En parallèle, l'enseignant peut saisir ou importer sa liste (CSV).

## Conséquences
- (+) Aucun coût, aucune saisie pour l'enseignant ; base légale « cadre scolaire ».
- (+) Révocation simple en cas de fuite du code.
- (−) Un élève non inscrit n'existe pas : nécessité de la saisie manuelle pour corriger tôt.
- (−) Risque de doublon entre élève saisi par le prof et élève auto-inscrit (fusion non documentée).
- (−) Caractères ambigus (0 / O) signalés comme source d'erreur.

## Preuves
Articles « Créer son compte et sa première classe », « Ajouter ses élèves », « Rejoindre ta classe ».
