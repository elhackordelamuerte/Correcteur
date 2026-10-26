# PRD-04 · Suivi des compétences

## Contexte
« Une note dit combien. Margou vous dit quoi retravailler. » Le suivi se construit sans saisie : chaque copie validée l'alimente. « 0 tableur à tenir à jour. »

## User stories
- **US-04.1** Je vois ma classe entière sur un écran : effectif, copies corrigées, moyenne indicative, répartition des notes.
- **US-04.2** Je vois une carte élèves × compétences et je repère les colonnes en difficulté.
- **US-04.3** Je constitue mes groupes d'AP à partir des élèves partageant une compétence fragile.
- **US-04.4** J'ouvre la fiche d'un élève : profil, compétences, progression, exercices, historique.
- **US-04.5** Je montre le profil en entretien parent/élève.

## Exigences fonctionnelles

### Modèle
| ID | Exigence |
|---|---|
| F-04.1 | Trois statuts par compétence : **à besoins** (pas en place), **fragile** (parfois oui, parfois non), **satisfaisante** (en place à ce stade) ; plus « non évaluée » |
| F-04.2 | Repères alignés sur ceux des évaluations nationales |
| F-04.3 | Compétences codées selon le programme (`FR.GRAM.03` « Accords du participe passé ») ; référentiel socle commun + repères officiels |
| F-04.4 | Sources de signal : critères de barème rattachés à une compétence sur **copies validées**, et réponses d'exercices (poids inférieur) |
| F-04.5 | Ne comptent pas : copies non validées, corrections entièrement manuelles, critères sans compétence |
| F-04.6 | Historique cumulatif ; graphique d'évolution dès 2 points |

### Vues enseignant
| ID | Exigence | Forfait |
|---|---|---|
| F-04.7 | Tableau de bord classe : effectif, copies corrigées, moyenne indicative, répartition des notes | Pro + Expert |
| F-04.8 | Profil de compétences de chaque élève (les plus évaluées) | Pro + Expert |
| F-04.9 | Compétences fragiles de la classe et répartition (Satisfaisante 36 % / Fragile 30 % / À besoins 34 %) ; « Compétences les plus fragiles · 8 élèves concernés · Générer des exercices » | Pro + Expert |
| F-04.10 | **Carte des compétences** : lignes = élèves, colonnes = compétences, regroupées par matière ; tri Maîtrise / Priorité / Alphabétique ; taux de maîtrise par élève ; bloc « À prioriser en classe » | **Expert** |
| F-04.11 | Interactions carte : tuile → fiche élève ; case vide → créer une évaluation ciblée ; en-tête de colonne → exercices liés | **Expert** |
| F-04.12 | Radar de compétences d'un élève | **Expert** |
| F-04.13 | Suivi dans le temps, courbes d'évolution classe et élève | **Expert** |
| F-04.14 | Alertes de décrochage (citées CGU) | **Expert** |
| F-04.15 | Fiche élève : appréciation générale, profil, progression, appréciation de bulletin, compétences par statut, exercices ciblés proposés, exercices assignés et évaluations récentes | Pro + Expert (courbes : Expert) |

### Groupes de besoin
| ID | Exigence |
|---|---|
| F-04.16 | Pour chaque compétence fragile : liste des élèves concernés = groupe |
| F-04.17 | Un élève peut appartenir à plusieurs groupes ; l'enseignant arbitre la priorité |
| F-04.18 | Enchaînement direct : générer les exercices → assigner aux seuls élèves du groupe |
| F-04.19 | Aucune indication de groupe côté élève |

## Règles
- Le profil décrit ce que les évaluations ont montré ; il **ne prédit pas** et **ne classe pas** les élèves entre eux.
- Besoin d'aménagement (PAP) ≠ compétence fragile : on compense l'un (variante), on retravaille l'autre (remédiation).
- Après résiliation : la lecture détaillée des compétences reste ; carte, courbes et alertes sont coupées.

## Questions ouvertes
- Algorithme de calcul du statut (seuils sur ratio points obtenus / max ? fenêtre temporelle ? décroissance ?) non publié. **[Hypothèse]** : ratio par critère → statut par seuils (par ex. < 40 % à besoins, 40-70 % fragile, > 70 % satisfaisante), agrégé avec pondération copie > exercice.
- Gestion d'un même code de compétence entre plusieurs enseignants d'un même élève.
