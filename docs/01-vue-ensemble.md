# 01 · Vue d'ensemble : ce que fait Margou.ia

## En une phrase
Margou.ia est un SaaS pour enseignants du secondaire français (6ᵉ → Terminale) qui **corrige des copies avec l'IA selon un barème fixé par l'enseignant**, **en déduit un profil de compétences** par élève et par classe, puis **génère des exercices de remédiation ciblés** que l'élève fait dans son propre espace. L'enseignant valide tout. **[Observé]**

Slogan : *« Le professeur augmenté par l'IA »* / *« Margou propose, vous validez »* / *« Margou gère la répétition. Vous gérez l'humain. »*

## Éditeur
| Élément | Valeur | Source |
|---|---|---|
| Société | MARGOU.IA, SARL au capital de 1 000 € | Mentions légales **[Observé]** |
| Siège | 10 rue Edmond Albius, 97400 Saint-Denis (La Réunion) | **[Observé]** |
| RCS | Saint-Denis 108 734 054 | **[Observé]** |
| Gérant / directeur de publication | Keyriam Boisedu--Cadet | **[Observé]** |
| TVA | Franchise en base (art. 293 B CGI) : micro-structure | CGU **[Observé]** |
| Contact | contact@margouia.re · +262 693 70 78 72 | **[Observé]** |
| Réseaux | LinkedIn, Instagram `@margou_ia`, Facebook | **[Observé]** |

Le domaine `.re` et les données de démonstration (noms réunionnais : Payet, Hoarau, Técher, Grondin ; sorties « au marché de Saint-Denis ») montrent un ancrage local assumé. La campagne qui a amené sur la page d'essai s'appelle `acq-reunion` (Meta, vidéo). **[Observé]**

## Le problème adressé
Repris de la page d'accueil **[Observé]** :
- 41 h 30 de travail hebdomadaire moyen pour un enseignant ; plus de 4 h pour corriger une classe.
- ~26 élèves par classe, plusieurs classes : les premières difficultés passent inaperçues.
- « Une bonne moyenne peut cacher une lacune » : la note ne dit pas *quoi* retravailler.
- Outils éclatés (Pronote, Excel, ENT), sans vue d'ensemble.

Le site répond aussi frontalement à trois objections contre l'IA éducative **[Observé]** :
1. *« L'IA note n'importe comment »* → le barème est fixé **avant**, l'IA s'y tient critère par critère.
2. *« Le gain de temps est un mythe »* → scan de la pile par QR code, retour direct dans l'espace élève, rien à recopier.
3. *« C'est nourrir les big data »* → aucun nom d'élève envoyé à l'IA, hébergement UE, pas d'entraînement de modèle.

## La boucle de valeur

```
 Créer l'évaluation ──► Générer énoncé + barème ──► Collecter les copies (scan QR / PDF / dépôt en ligne)
        ▲                                                        │
        │                                                        ▼
 Suivre dans le temps                                Correction IA proposée (rapide / approfondie)
        ▲                                                        │
        │                                                        ▼
 L'élève fait les exercices ◄── Assigner ◄── Générer exercices ◄── Enseignant valide ──► Profil de compétences MAJ
   (retour immédiat ou prof)                   ciblés sur lacunes        (+ publication)        + carte de classe
```

## Les six modules fonctionnels
| Module | Ce qu'il fait | PRD |
|---|---|---|
| Évaluations | Définition du devoir, énoncé et barème générés ou collés, médias joints, impression ou dépôt en ligne, import des copies | [PRD-02](prd/PRD-02-evaluations.md) |
| Correction | Analyse IA (1 ou 2 passes) ou manuelle, annotations, validation copie par copie, publication groupée | [PRD-03](prd/PRD-03-correction-validation.md) |
| Compétences | Trois statuts (à besoins / fragile / satisfaisante), carte de classe, profil élève, courbes | [PRD-04](prd/PRD-04-suivi-competences.md) |
| Exercices | Génération ciblée (compétence ou erreurs d'un élève), 5 niveaux, 2 indices, bibliothèque, assignation | [PRD-05](prd/PRD-05-exercices-remediation.md) |
| Espace élève | À faire, historique, progrès, réponses écrites/photo/orales, retour bienveillant | [PRD-06](prd/PRD-06-espace-eleve.md) |
| Transverses | Variantes DYS/PAP, appréciations de bulletin, RGPD | [PRD-07](prd/PRD-07-adaptation-dys-pap.md), [PRD-08](prd/PRD-08-appreciations.md), [PRD-10](prd/PRD-10-rgpd-securite.md) |

## Positionnement
- **Complément, pas remplaçant de Pronote/ENT** : « Pronote reste votre registre. Margou travaille à côté. » Pas d'intégration Pronote annoncée. **[Observé]**
- **Toutes matières** (maths, français, histoire-géo, langues, sciences), compétences rattachées au socle commun et aux repères officiels de l'Éducation nationale, codes du type `FR.GRAM.03`, `FR.ECRIT.01`. **[Observé]**
- **Vente directe à l'enseignant** (B2C pro, carte bancaire personnelle, abonnement « déductible fiscalement »), avec une « offre établissements » citée dans les CGU mais non détaillée. **[Observé]**

## Chiffres revendiqués (marketing, non vérifiés)
| Promesse | Valeur |
|---|---|
| Temps de correction économisé | 80 % |
| Temps par copie | ≈ 2 min |
| Copies validées par l'enseignant | 100 % |
| Génération d'un exercice ciblé | 1 min |
| Scan d'une pile au téléphone | 30 s |
| Démarrage | 3 min |
