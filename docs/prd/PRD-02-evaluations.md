# PRD-02 · Évaluations : création, énoncé, barème, collecte des copies

## Contexte
Une évaluation est « un devoir décrit une fois, qui vous suit ensuite de la copie scannée jusqu'au suivi de compétences ». Promesse : « Générez des évaluations en 3 clics ».

## User stories
- **US-02.1** Je définis mon devoir avec les informations d'un en-tête de sujet.
- **US-02.2** Je décris ce que je veux évaluer et Margou rédige l'énoncé et le barème, calibrés sur la durée.
- **US-02.3** J'ai déjà mon sujet : je le colle et Margou ne génère que le barème (gratuit).
- **US-02.4** Je joins un texte, une figure, un audio ou une vidéo.
- **US-02.5** J'imprime le sujet, ou j'ouvre un dépôt en ligne.
- **US-02.6** Je photographie ma pile de copies au téléphone via un QR code, sans app ni connexion.
- **US-02.7** Je dépose un PDF de toute la pile depuis mon ordinateur.

## Exigences fonctionnelles

### Définition
| ID | Exigence |
|---|---|
| F-02.1 | Champs : titre, classe, matière, date, « noté sur », compétences à évaluer, mode de correction (IA / manuel, modifiable) |
| F-02.2 | Toutes matières, tous niveaux 6ᵉ → Terminale |

### Énoncé et barème
| ID | Exigence |
|---|---|
| F-02.3 | Deux entrées : « Générer avec Margou » (consigne en texte riche B/I/U + compétences + durée indicative en minutes) ou « J'ai déjà mon énoncé » |
| F-02.4 | Énoncé généré : contexte, questions ordonnées de la plus accessible à la plus exigeante, points par partie, **sans corrigé** |
| F-02.5 | Barème : 3 à 8 critères ; chacun = intitulé, attendu concret, points, compétence rattachée (optionnelle) |
| F-02.6 | **La somme des points est vérifiée par le logiciel** et égale exactement le total ; aucune note ne peut dépasser le total |
| F-02.7 | Tout est éditable : ajouter, supprimer, réécrire des critères ; avertissement si l'enseignant déséquilibre le total |
| F-02.8 | Un barème reste attaché à son évaluation ; on peut reprendre un devoir de l'année précédente et ajuster |
| F-02.9 | Coûts : barème seul = offert ; énoncé + barème = 2 crédits ; variante DYS/PAP = 2 crédits ([PRD-07](PRD-07-adaptation-dys-pap.md)) |

### Médias joints
| ID | Exigence |
|---|---|
| F-02.10 | Formats : PDF, image, audio, vidéo |
| F-02.11 | Stockage privé, accès par liens temporaires uniquement |
| F-02.12 | PDF/images inclus à l'impression ; audio/vidéo non imprimés (diffusion en classe) |
| F-02.13 | Audio jamais transmis à l'analyse ; la compréhension orale se corrige sur les réponses écrites |

### Passation
| ID | Exigence |
|---|---|
| F-02.14 | Impression du sujet |
| F-02.15 | « Dépôt en ligne par les élèves » : ouverture/fermeture manuelle, date limite affichée, statut « a rendu / n'a pas rendu » |
| F-02.16 | Dépôt : texte, photo, PDF ou audio (oral) ; un dépôt par élève, sous son compte, non remplaçable ; dépôt fermé = plus aucun envoi |

### Collecte des copies
| ID | Exigence |
|---|---|
| F-02.17 | Chaque évaluation génère un QR code d'import, valable uniquement pour elle |
| F-02.18 | Le QR ouvre une page web mobile : pas d'installation, pas d'identifiants à saisir |
| F-02.19 | Photo copie par copie ; manuscrit = cas d'usage principal |
| F-02.20 | Rattachement automatique de chaque copie à un élève de la classe ; en cas de doute, l'enseignant valide l'identité ; correction manuelle d'un rattachement |
| F-02.21 | Import ordinateur : « Importer toute la pile d'un coup » (PDF / images), ou texte collé |
| F-02.22 | « Masquage du nom » à l'import (comparatif des forfaits) |

## Règles
- Le barème précède toujours la correction ; il ne se déduit jamais des copies.
- Une copie mal attribuée fausse deux suivis : l'interface pousse à la vérification.

## Questions ouvertes
- Mécanisme du rattachement automatique : lecture du nom manuscrit (OCR) puis masquage ? Ordre de la liste ? QR par élève imprimé sur la copie ? **[Hypothèse]**
- Découpage d'un PDF multi-copies en copies individuelles (nombre de pages par copie) : non documenté.
- Durée de validité et révocation du jeton QR.
