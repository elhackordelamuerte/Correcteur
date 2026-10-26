# PRD-01 · Comptes, classes et élèves

## Contexte
« Le seul passage obligé avant de corriger votre première copie » : un compte et une classe. L'objectif est un démarrage en 3 minutes, sans paramétrage.

## User stories
- **US-01.1** En tant qu'enseignant, je crée mon compte avec mon e-mail professionnel et commence sans rien configurer.
- **US-01.2** En tant qu'enseignant, je crée une classe avec le nom que j'utilise déjà (« 2nde 3 »).
- **US-01.3** En tant qu'enseignant, j'obtiens un code à 6 caractères pour que mes élèves s'inscrivent seuls.
- **US-01.4** En tant qu'enseignant, je saisis ou j'importe ma liste pour corriger avant que les élèves soient inscrits.
- **US-01.5** En tant qu'élève, je rejoins plusieurs classes (plusieurs professeurs) avec un seul compte.
- **US-01.6** En tant qu'enseignant, je régénère le code s'il a circulé ou en fin d'année.

## Exigences fonctionnelles
| ID | Exigence | Source |
|---|---|---|
| F-01.1 | Inscription enseignant : e-mail, mot de passe, prénom, nom, téléphone, établissement (facultatif), puis carte bancaire (Stripe), puis confirmation par lien e-mail | Inscription, politique de confidentialité |
| F-01.2 | Connexion e-mail + mot de passe ; récupération par `/mot-de-passe-oublie` | `/connexion` |
| F-01.3 | Aucun réglage obligatoire avant la première analyse | creer-compte-premiere-classe |
| F-01.4 | Classe : nom libre ; nombre illimité en Expert, 3 en Pro | Tarifs |
| F-01.5 | Chaque classe a un code d'invitation de 6 caractères, régénérable ; l'ancien code est invalidé | creer-compte-premiere-classe |
| F-01.6 | Ajout « Un par un » : prénom, nom, niveau uniquement | ajouter-ses-eleves |
| F-01.7 | « Coller une liste » / « Importer la liste » (CSV) | ajouter-ses-eleves |
| F-01.8 | Inscription élève : rôle « élève », prénom, nom, mot de passe, code classe | rejoindre-sa-classe |
| F-01.9 | Un compte élève peut saisir plusieurs codes et voir toutes ses classes au même endroit | rejoindre-sa-classe |
| F-01.10 | Liste modifiable à tout moment ; retirer un élève d'une classe ne supprime pas ses données | ajouter-ses-eleves |
| F-01.11 | Classe, élèves, évaluations sont indépendants : on peut créer une évaluation avant d'ajouter les élèves | creer-compte-premiere-classe |

## Règles et cas limites
- Un élève non inscrit « n'existe pas » dans Margou : recommandation de saisir la liste si on veut corriger rapidement.
- Confusion `0` / `O` dans les codes signalée aux élèves → **suggestion** : alphabet sans caractères ambigus.
- **[Hypothèse]** Fusion d'un élève saisi par l'enseignant avec le compte que l'élève crée ensuite via le code : mécanisme non documenté (risque de doublons).

## Données collectées
Enseignant : prénom, nom, e-mail, téléphone, établissement (opt.). Élève : prénom, nom, niveau. Jamais de date de naissance, d'adresse ni de photo.

## Hors périmètre
SSO ENT / EduConnect / Google ; synchronisation automatique des listes Pronote.
