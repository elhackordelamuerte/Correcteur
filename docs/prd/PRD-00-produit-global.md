# PRD-00 · Produit global Margou.ia

| Champ | Valeur |
|---|---|
| Statut | Reconstitué (rétro-ingénierie, 26/10/2026) |
| Produit | Margou.ia, assistant pédagogique IA pour enseignants du secondaire |
| Marché initial | La Réunion, puis France (programmes de l'Éducation nationale) |

## 1. Vision
Faire de chaque enseignant un « professeur augmenté » : l'IA absorbe la correction répétitive, la détection des lacunes et le suivi ; l'enseignant garde chaque décision. Passer « de la pile de copies au diagnostic de vos classes, en quelques minutes ».

## 2. Problème
- Correction chronophage (plus de 4 h par classe), répétitive.
- La moyenne masque les lacunes : on sait *combien*, pas *quoi*.
- Différenciation et groupes de besoin irréalistes à la main.
- Méfiance envers l'IA : notation incohérente, gain de temps illusoire, exploitation des données d'élèves.

## 3. Personas
| Persona | Besoin principal | Déclencheur d'achat |
|---|---|---|
| **Enseignant de collège/lycée**, 3 à 6 classes | Corriger un DS/brevet blanc/bac blanc avant le week-end | Pile de copies, fin de trimestre |
| **Enseignant de français / matière rédactionnelle** | Correction fiable de copies longues manuscrites | Analyse approfondie, validation |
| **Enseignant coordinateur AP / groupes de besoin** | Constituer des groupes à partir des vraies lacunes | Carte des compétences |
| **Enseignant avec élèves à PAP** | Adapter sans stigmatiser | Variante DYS/PAP |
| **Élève** (11-18 ans, mobile) | Savoir quoi faire et pourquoi c'est faux | Retour immédiat, indices |
| **Parent** | Suivre sans intermédiaire | Accès lecture seule |
| **Chef d'établissement** (secondaire) | Démo, offre établissement, conformité RGPD | Page contact, CGU |

## 4. Objectifs produit et métriques suggérées
| Objectif | Indicateur (proposé) | Cible affichée |
|---|---|---|
| Réduire le temps de correction | minutes enseignant par copie (lancement → validation) | ≈ 2 min, -80 % |
| Garder la confiance | % de notes modifiées avant validation ; écart note IA / note validée | 100 % validées |
| Rendre le diagnostic actionnable | % d'évaluations suivies d'une génération d'exercices sous 7 jours | « 1 clic » |
| Engager l'élève | % d'exercices assignés réalisés avant date limite | n/a |
| Convertir l'essai | taux essai → payant à J15 ; taux Pro vs Expert | n/a |
| Monétiser l'usage | crédits consommés / crédits inclus ; recharges par compte | n/a |

## 5. Périmètre fonctionnel (MVP en production)
1. Comptes enseignant/élève, classes, code d'invitation → [PRD-01](PRD-01-comptes-classes-eleves.md)
2. Évaluations, énoncé et barème, collecte des copies → [PRD-02](PRD-02-evaluations.md)
3. Correction IA ou manuelle, validation, publication → [PRD-03](PRD-03-correction-validation.md)
4. Suivi par compétences → [PRD-04](PRD-04-suivi-competences.md)
5. Exercices de remédiation → [PRD-05](PRD-05-exercices-remediation.md)
6. Espace élève (et parents) → [PRD-06](PRD-06-espace-eleve.md)
7. Variantes DYS/PAP → [PRD-07](PRD-07-adaptation-dys-pap.md)
8. Appréciations de bulletin → [PRD-08](PRD-08-appreciations.md)
9. Forfaits et crédits → [PRD-09](PRD-09-monetisation.md)
10. RGPD → [PRD-10](PRD-10-rgpd-securite.md)
11. Site et acquisition → [PRD-11](PRD-11-site-acquisition.md)

## 6. Principes de conception (transverses)
1. **Margou propose, l'enseignant valide** : aucun effet visible ou durable sans validation humaine.
2. **Le cadre avant l'IA** : barème posé avant, l'IA applique, le code vérifie.
3. **Le manuel est toujours gratuit** : seules les actions IA consomment des crédits ; tout ce qui est manuel reste possible même à solde nul.
4. **Minimisation et pseudonymisation** : prénom, nom, niveau ; jamais de nom envoyé à l'IA ; jamais d'audio.
5. **Ne pas désigner l'élève** : ni groupe de besoin, ni adaptation, ni trouble visibles par l'élève.
6. **Ton bienveillant** : l'IA explique, ne sanctionne pas ; tutoiement côté élève.
7. **Pas de rupture d'usage** : papier, impression, Pronote restent possibles ; Margou s'ajoute.

## 7. Hors périmètre (déclaré)
- Remplacer Pronote / l'ENT, les bulletins officiels ou la vie scolaire.
- Établir des diagnostics médicaux (les besoins DYS sont des « leviers d'adaptation »).
- Analyser l'oral par IA.
- Prédire ou classer les élèves entre eux.

## 8. Exigences non fonctionnelles
| Domaine | Exigence |
|---|---|
| Hébergement | UE (Paris, Francfort, Lituanie) ; transfert IA hors UE sous CCT |
| Mobile | Espace élève et scan pensés mobile-first, sans application à installer |
| Accessibilité | Modales accessibles (gestion du focus observée), lecteurs d'écran pris en compte dans l'estimateur (`sr` libellés) |
| Support | Humain, réponse sous 48 h ouvrées, équipe à La Réunion |
| Conservation | Année scolaire + 1 an pour le pédagogique ; audit 1 an |

## 9. Questions ouvertes
- Intégration Pronote/ENT (import des listes, export des notes) : non prévue publiquement.
- Offre établissements : tarification, gestion multi-enseignants, DPA.
- Espace parents : mode de liaison, consentement.
- Alertes de décrochage (citées dans les CGU pour Expert) : critères de déclenchement.
- Dictée vocale (comparatif) : usage côté enseignant pour saisir retours et appréciations ? Moteur de transcription ?
