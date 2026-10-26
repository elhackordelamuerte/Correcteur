# PRD-06 · Espace élève et parents

## Contexte
« La motivation commence par la clarté. » Un espace unique, mobile-first, gratuit pour l'élève, inclus dans le forfait de l'enseignant.

## User stories
- **US-06.1** En ouvrant l'app, je vois ce que j'ai à faire et les derniers mots de mes professeurs.
- **US-06.2** Je fais un exercice sur mon téléphone, avec deux indices si je bloque.
- **US-06.3** Je rends un devoir en tapant, en photographiant ma feuille ou en m'enregistrant.
- **US-06.4** Je retrouve toutes mes copies corrigées et annotées.
- **US-06.5** Je vois mes compétences et ma courbe de progression.
- **US-06.6** Mes parents consultent mes résultats.

## Exigences fonctionnelles

### Accueil « À faire »
| ID | Exigence |
|---|---|
| F-06.1 | Message de bienvenue personnalisé et motivant (« Salut Maëlys ! · 4eA — Lance-toi : ton exercice du jour t'attend ») |
| F-06.2 | Onglets Exercices (n) / Évaluations (n) à faire, avec compétence et date limite |
| F-06.3 | « Dernier retour » par matière |

### Historique
| ID | Exigence |
|---|---|
| F-06.4 | Liste des évaluations et exercices rendus, avec compétence, date, score (ex. 55/100) |
| F-06.5 | Copie annotée, note et retour du professeur, conservés |

### Mes progrès
| ID | Exigence |
|---|---|
| F-06.6 | « Le mot de ton prof » (appréciation) |
| F-06.7 | Compétences classées : « Tu maîtrises ✓ » / « En cours » / « À travailler » (libellés élèves des 3 statuts) |
| F-06.8 | Courbe d'évolution (« Plus la courbe monte, plus tes compétences se solidifient ») |

### Réaliser et rendre
| ID | Exigence |
|---|---|
| F-06.9 | Exercice : énoncé, champ réponse, « Envoyer » ; pagination (« Exercice 3 / 10 ») |
| F-06.10 | Deux indices à ouvrir à la demande ; consigne d'essayer seul d'abord |
| F-06.11 | Réponse orale si autorisée : enregistrement dans le navigateur, jamais envoyé à l'IA |
| F-06.12 | Rendu de devoir : texte, photo (conseils de cadrage : à plat, lumière, toute la feuille, toutes les pages), PDF, audio |
| F-06.13 | Un seul envoi, non remplaçable ; dépôt fermable par le prof après date limite |

### Confidentialité et visibilité
| ID | Exigence |
|---|---|
| F-06.14 | L'élève ne voit que ses propres résultats **validés** ; rien avant validation (« ce n'est pas un bug ») |
| F-06.15 | Les autres élèves ne voient rien le concernant |
| F-06.16 | Parents : accès en lecture seule depuis un « espace dédié », compte « relié » à celui de l'élève |

## Non fonctionnel
- Mobile-first, aucune app à installer ; ordinateur possible.
- Public : collège et lycée.
- Ton : tutoiement, bienveillant, « explique, ne sanctionne pas ».

## Questions ouvertes
- Notifications (e-mail, push PWA) quand un exercice est assigné ou corrigé : « il est prévenu » mais canal non précisé.
- Création et liaison du compte parent : non documentées.
