# PRD-05 · Exercices de remédiation

## Contexte
« C'est le moment où le diagnostic devient une séance de remédiation. » Remplacer l'heure passée sur manuels et sites tiers par une génération ciblée en une minute.

## User stories
- **US-05.1** Je génère des exercices sur une compétence fragile, au niveau de la classe.
- **US-05.2** Je génère des exercices à partir des erreurs récurrentes d'un élève précis.
- **US-05.3** J'écris mes propres exercices, gratuitement, et je peux autoriser une réponse orale.
- **US-05.4** J'enregistre mes exercices dans une bibliothèque rangée par compétence pour les années suivantes.
- **US-05.5** J'assigne à une classe, un groupe ou des élèves, avec une date limite et un mode de correction.
- **US-05.6** L'élève reçoit un retour immédiat qui explique son erreur.

## Exigences fonctionnelles

### Génération
| ID | Exigence |
|---|---|
| F-05.1 | Entrées : compétence(s), niveau (6ᵉ → Terminale), nombre (1 à 10), difficulté (1 à 5) ; « Générer N exercices » |
| F-05.2 | Entrée alternative : erreurs récurrentes relevées sur les copies validées d'un élève |
| F-05.3 | Point d'entrée depuis le diagnostic (carte, fiche élève, « compétences les plus fragiles ») ou à partir d'une compétence sans évaluation préalable |
| F-05.4 | Structure obligatoire d'un exercice : titre, énoncé autonome, solution détaillée pas à pas, **exactement deux indices** progressifs, difficulté 1-5 |
| F-05.5 | Exercices livrés comme **propositions** : relire, modifier, supprimer avant d'assigner ; prévisualisation |
| F-05.6 | Coût : 1 crédit par exercice généré |

### Création manuelle
| ID | Exigence |
|---|---|
| F-05.7 | « Créer un exercice manuellement » : titre, énoncé, solution (optionnelle), indices, difficulté, niveau, compétence |
| F-05.8 | Option « réponse orale » ; toujours corrigée par l'enseignant |
| F-05.9 | 0 crédit |

### Bibliothèque
| ID | Exigence |
|---|---|
| F-05.10 | Enregistrement des exercices générés ou manuels ; disponibles pour toutes les classes et années suivantes |
| F-05.11 | Compétence principale + étiquettes libres (chapitre, niveau, type) |
| F-05.12 | Retrouver, réutiliser, dupliquer ; imprimer ou assigner en ligne |

### Assignation
| ID | Exigence |
|---|---|
| F-05.13 | Cible : « Une classe » ou « Des élèves » |
| F-05.14 | Date limite optionnelle, affichée dans la liste « à faire » de l'élève |
| F-05.15 | Mode de correction choisi à l'assignation (« Correction automatique par Margou »), pouvant différer par élève |
| F-05.16 | Anti-doublon : un exercice déjà assigné à un élève ne lui est pas réassigné |
| F-05.17 | Aucune mention de groupe restreint côté élève |

### Correction des réponses
| ID | Exigence |
|---|---|
| F-05.18 | Automatique : retour immédiat ; 1 crédit par réponse, débité au compte de l'enseignant |
| F-05.19 | Contenu du retour : score, point positif réel, explication du pourquoi de l'erreur, solution détaillée, suggestion « Et maintenant ? » ; tutoiement ; ton motivant (« Bien joué ! ») |
| F-05.20 | Par l'enseignant : réponses en attente ; l'élève est prévenu et reçoit le retour après validation |
| F-05.21 | Solde épuisé → les réponses basculent en attente de correction manuelle, rien n'est perdu |
| F-05.22 | Une réponse d'exercice met à jour le profil de compétences, avec un poids inférieur à celui d'une copie d'évaluation |

## Questions ouvertes
- La « même compétence à cinq niveaux de difficulté » : génération d'une famille d'exercices liés ou d'exercices indépendants ?
- Correction auto d'une réponse photo (manuscrite) : même pipeline que les copies ?
