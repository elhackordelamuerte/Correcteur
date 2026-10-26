# PRD-08 · Appréciations de bulletin

## Contexte
« Trente appréciations à écrire un dimanche de fin de trimestre. » Margou propose une appréciation par élève fondée sur ce que ses copies ont réellement montré.

## User stories
- **US-08.1** Je génère une proposition d'appréciation pour un élève à partir de ses compétences.
- **US-08.2** Je la relis, la réécris et la valide avant de la reporter dans Pronote.
- **US-08.3** J'écris moi-même une appréciation générale ou par matière, gratuitement.

## Exigences fonctionnelles
| ID | Exigence |
|---|---|
| F-08.1 | Entrées : compétences de l'élève, moyennes, erreurs récurrentes, tendance du trimestre |
| F-08.2 | Sortie : 3 à 5 phrases ; commence par un point d'appui réel ; nomme **un seul** axe de progression, le plus important |
| F-08.3 | Aucun prénom, aucune marque de genre (formulation neutre, copier-coller sans erreur d'accord) |
| F-08.4 | Proposition éditable, jamais enregistrée sans relecture |
| F-08.5 | Deux niveaux : appréciation générale (fiche élève) et appréciation par matière |
| F-08.6 | Coût : 1 crédit par appréciation générée ; saisie manuelle offerte |
| F-08.7 | L'appréciation validée apparaît à l'élève (« Le mot de ton prof ») |

## Règles
- Pas de modèle de phrase : le texte part des compétences nommées, défendables en conseil de classe.
- Pas d'export vers Pronote : report manuel.

## Questions ouvertes
- Génération en lot pour toute une classe (30 crédits) : non documentée explicitement.
