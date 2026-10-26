# PRD-03 · Correction et validation

## Contexte
Cœur de la promesse : « Vos paquets de copies corrigés avant le week-end », sans perdre la main. L'IA propose une correction complète ; l'enseignant relit, ajuste, valide.

## User stories
- **US-03.1** Je lance la correction d'un paquet et je suis la progression.
- **US-03.2** Je choisis une analyse rapide pour un QCM, approfondie pour une dissertation.
- **US-03.3** Je relis chaque copie : note par critère, forces, lacunes, retour élève, et je modifie ce que je veux.
- **US-03.4** J'annote directement la copie, là où est l'erreur.
- **US-03.5** Je corrige certaines copies entièrement à la main, sans crédit.
- **US-03.6** Je valide copie par copie puis je publie à toute la classe en même temps.
- **US-03.7** Je reviens sur une validation si je repère une erreur.

## Exigences fonctionnelles

### Lancement
| ID | Exigence |
|---|---|
| F-03.1 | Mode « Automatique (IA) » ou « Manuelle » par évaluation, mélangeable par copie |
| F-03.2 | Analyse **rapide** : 1 passe, 1 crédit/copie ; pour réponses identifiables (contrôle, application, questionnaire) |
| F-03.3 | Analyse **approfondie** : passe 1 transcription fidèle, passe 2 analyse de la transcription ; 2 crédits/copie ; pour copies longues, écriture difficile, raisonnements, commentaires, dissertations |
| F-03.4 | On peut passer un paquet en rapide puis repasser certaines copies en approfondie |
| F-03.5 | Coût affiché avant lancement ; progression affichée (« Correction en cours… 18 / 28 ») |
| F-03.6 | Échec d'analyse → crédits restitués |

### Résultat d'analyse (identique dans les deux modes)
| ID | Exigence |
|---|---|
| F-03.7 | Note par critère, bornée au maximum du critère |
| F-03.8 | Note totale proposée (ex. 13,5 / 20), justifiée critère par critère (« Schéma narratif amorcé mais incomplet… » 1,2 / 3) |
| F-03.9 | Points forts et lacunes rattachés aux codes de compétence (`FR.ECRIT.01`, `FR.GRAM.03`) |
| F-03.10 | Erreurs récurrentes de la copie, et détection des erreurs récurrentes à l'échelle de la classe |
| F-03.11 | Synthèse destinée à l'enseignant + retour rédigé destiné à l'élève (« mot bienveillant ») |
| F-03.12 | Mot douteux dans une écriture manuscrite → signalé à l'enseignant plutôt qu'interprété |

### Relecture et validation
| ID | Exigence |
|---|---|
| F-03.13 | Navigation copie par copie (« Copie 12 / 28 »), « Voir la copie » |
| F-03.14 | Tout est modifiable : note critère, note totale, synthèse, retour élève, forces, lacunes |
| F-03.15 | Annotations libres posées sur la copie (entourer, souligner, remarque en marge) ; invisibles avant validation |
| F-03.16 | **Valider** déclenche : (1) visibilité de la copie, note, retour et annotations pour l'élève ; (2) remontée des compétences dans le profil et la carte |
| F-03.17 | **Dévalider** possible |
| F-03.18 | Correction manuelle : note + retour élève, 0 crédit, n'alimente **pas** le profil de compétences |

### Publication groupée
| ID | Exigence |
|---|---|
| F-03.19 | « Publier les résultats » : notes, copies annotées et mot à la classe visibles par tous au même moment |
| F-03.20 | Les compétences de l'ensemble des copies remontent d'un coup |
| F-03.21 | Facultative : à ignorer pour un dépôt en ligne corrigé au fil de l'eau ou un élève absent |

## Non fonctionnel
- ≈ 2 minutes par copie (analyse + relecture), promesse marketing.
- Reproductibilité : réponse explicite à l'objection « deux fois la même copie donne deux notes différentes » par le barème figé et la vérification logicielle. **Note** : la reproductibilité stricte d'un LLM n'est pas garantie ; le site ne promet pas une note identique, seulement un cadre fixe.

## Questions ouvertes
- Granularité d'une annotation (coordonnées sur image ? couche vectorielle ?) et stylet mobile.
- Interaction exacte entre validation unitaire et publication groupée (la copie validée est-elle visible avant publication si la publication groupée est prévue ?). Le centre d'aide indique que la validation rend visible ; la publication sert à « retenir » via dévalidation. **[Déduit]** : un réglage « publication différée » existe probablement au niveau de l'évaluation.
