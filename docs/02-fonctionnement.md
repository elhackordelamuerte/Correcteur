# 02 · Fonctionnement de bout en bout

## 1. Acteurs et rôles

| Rôle | Création du compte | Voit | Peut faire |
|---|---|---|---|
| **Enseignant** (payant) | Inscription e-mail pro + mot de passe + carte bancaire (Stripe), lien de validation par e-mail | Uniquement ses classes | Tout : classes, évaluations, corrections, exercices, suivi, RGPD |
| **Élève** (gratuit) | Inscription « élève » : prénom, nom, mot de passe, puis code classe à 6 caractères. Ou créé par l'enseignant (saisie / CSV) | Uniquement ses propres résultats **validés** | Rendre un devoir, faire un exercice, consulter retours et progrès |
| **Parent** | Compte « relié » à celui de l'élève (modalités non documentées) | Résultats de l'élève, en lecture seule | Consulter |
| **Service d'analyse IA** (Anthropic) | n/a | Copie + barème + identifiant neutre, **jamais** nom/prénom ni audio | Proposer une correction, générer des contenus |

Sources : centre d'aide (rejoindre-sa-classe, voir-ses-retours), page suivi-competences (FAQ parents), politique de confidentialité. **[Observé]**

## 2. Modèle de domaine reconstitué **[Déduit]**

```
Enseignant 1───* Classe 1───* Inscription *───1 Élève
   │               │  (code_invitation 6 car., régénérable)
   │               │
   │               1───* Évaluation ─────1 Barème 1───* Critère ──0..1 Compétence (code programme)
   │                       │  (titre, matière, date, total, mode_correction,
   │                       │   depot_en_ligne ouvert/fermé, date_limite, qr_token)
   │                       ├──* Média joint (PDF, image, audio, vidéo)
   │                       ├──* Variante adaptée (intensité 1-3, besoins[], statut proposition/validée)
   │                       └──* Copie ──1 Élève
   │                               │ (fichier(s), statut: importée → analysée → validée → publiée)
   │                               ├──1 Analyse (mode rapide|approfondie, transcription?, notes par critère,
   │                               │            note proposée, forces, lacunes, erreurs récurrentes,
   │                               │            synthèse prof, retour élève)
   │                               └──* Annotation (position sur la copie)
   │
   ├──* Exercice (bibliothèque) ── compétence principale + étiquettes
   │        (titre, énoncé, solution, indice_1, indice_2, difficulté 1-5, réponse orale autorisée?)
   │        └──* Assignation (classe | élèves, date limite, mode correction auto|prof)
   │                 └──* Réponse élève (texte | photo | audio) ── Correction (score, retour)
   │
   ├──1 Abonnement (Pro|Expert, mensuel|annuel, Stripe) ── Solde crédits (inclus + achetés)
   │        └──* Mouvement de crédits (débit au lancement, restitution si échec)
   │
   └──* Entrée journal d'audit (export, effacement, accès sensibles)

Élève 1───* Signal de compétence (source: copie validée | réponse d'exercice, poids différent)
      1───* Appréciation (générale | par matière, saisie ou générée)
```

## 3. Parcours enseignant : du devoir au suivi

### Étape 0 · Onboarding (≈ 3 min)
1. `margouia.re/inscription?plan=pro|expert&facturation=mois|an` → 3 écrans : **Votre compte → Vos informations bancaires → Confirmation**.
2. Carte enregistrée sans débit ; e-mail de validation ; premier débit au 15ᵉ jour.
3. Arrivée sur l'onboarding de `app.margouia.re` : **aucun réglage obligatoire** (ni matière, ni niveau, ni barème type).
4. Créer une classe (nom libre : « 4e B ») → code d'invitation à 6 caractères.
5. Remplir la classe : code élève, saisie un par un (prénom, nom, niveau) ou CSV collé/importé.

### Étape 1 · Définir l'évaluation
Titre, classe, matière, date, « noté sur », compétences à évaluer, **mode de correction** (IA ou manuel, modifiable ensuite).

### Étape 2 · Énoncé et barème
- **« Générer avec Margou »** : consigne libre + compétences + durée indicative → énoncé (questions du plus accessible au plus exigeant, points par partie, **sans corrigé**) + barème (3 à 8 critères). Coût : 2 crédits.
- **« J'ai déjà mon énoncé »** : coller le sujet → barème seul, **offert**.
- La somme des points est **vérifiée par le logiciel** et tombe toujours sur le total.
- Optionnel : variante DYS/PAP (2 crédits), médias joints.

### Étape 3 · Faire passer le devoir
Impression papier **ou** dépôt en ligne (ouverture/fermeture manuelle, date limite, un dépôt par élève, non remplaçable).

### Étape 4 · Collecter les copies
- **Scan QR** : le QR de l'évaluation ouvre une page web mobile, sans compte ni app ; photo copie par copie ; rattachement automatique à l'élève, à vérifier.
- **Ordinateur** : dépôt PDF/images en lot, ou texte collé.
- **Dépôt en ligne** : les copies arrivent déjà rattachées.

### Étape 5 · Corriger
- **Analyse rapide** (1 passe, 1 crédit) ou **approfondie** (transcription puis analyse, 2 crédits), mélangeables dans un même paquet.
- Progression visible (« Correction en cours… 18 / 28 »).
- Résultat par copie : note par critère (bornée), note proposée, points forts et lacunes rattachés aux codes de compétence, erreurs récurrentes, synthèse enseignant, retour élève.
- Ou correction **manuelle** (0 crédit, mais n'alimente pas le profil de compétences).

### Étape 6 · Valider puis publier
- Tout est éditable ; annotations posées directement sur la copie.
- **Valider** = la copie devient visible par l'élève **et** ses compétences remontent dans le profil. Dévalidation possible.
- **Publier les résultats** (optionnel) = toute la classe voit en même temps, avec un mot collectif.

### Étape 7 · Exploiter le diagnostic
- Carte des compétences (élèves × compétences, tri maîtrise/priorité/alphabétique, « À prioriser en classe »).
- Clic sur une case vide → créer une évaluation ciblée ; clic sur un en-tête de colonne → exercices liés ; clic sur une tuile → fiche élève.
- « Compétences les plus fragiles » → « 8 élèves concernés · Générer des exercices ».

### Étape 8 · Remédier
Générer 1 à 10 exercices (compétence, niveau, nombre, difficulté 1-5) ou à partir des erreurs récurrentes d'un élève → relire → enregistrer en bibliothèque → assigner (classe ou élèves, date limite, correction auto ou prof). Pas de doublon d'assignation. Aucun élève ne sait qu'il est dans un groupe.

### Étape 9 · Suivre et rendre compte
Courbes d'évolution (dès 2 points), appréciations de bulletin proposées (3-5 phrases, neutres), export JSON RGPD par élève.

## 4. Parcours élève
1. Créer son compte « élève », saisir le code de classe (un code par professeur, un seul compte).
2. Accueil : « Salut Maëlys ! · 4eA », exercices et évaluations à faire, derniers retours.
3. Faire un exercice : réponse écrite ou orale, **deux indices** progressifs, retour immédiat (IA, tutoiement) ou différé (prof).
4. Rendre un devoir : texte tapé, photo de la feuille, PDF ou audio ; **un seul envoi**.
5. Voir ses copies corrigées **une fois validées** : note, annotations, mot du prof.
6. « Mes progrès » : compétences maîtrisées / en cours / à travailler, courbe d'évolution.

## 5. Cycles de vie (machines à états) **[Déduit]**

### Copie
```
importée ──(rattachement vérifié)──► prête ──(analyse lancée: débit)──► en_analyse
   en_analyse ──succès──► proposée        en_analyse ──échec──► prête (+ crédits restitués)
   prête ──(correction manuelle)──► proposée
   proposée ──(éditer)──► proposée
   proposée ──valider──► validée  [visible élève*, profil MAJ*]
   validée ──dévalider──► proposée
   validée ──publication groupée──► publiée  [*si publication groupée utilisée, la visibilité attend cette étape]
```

### Variante DYS/PAP
`proposition ──valider──► validée (imprimable)` ; toute modification d'une variante validée la renvoie en `proposition`.

### Réponse d'exercice
```
soumise ──(assignation en correction auto ET solde > 0)──► corrigée_auto ──► visible
soumise ──(correction prof OU solde épuisé OU réponse orale)──► en_attente_prof ──► corrigée_prof ──► visible
```

### Abonnement
```
essai (14 j, fonctions Expert) ──J15──► actif (Pro|Expert)  [Pro : carte + courbes se referment]
essai ──résiliation avant J15──► résilié sans débit
actif ──résiliation──► actif jusqu'à fin de période ──► lecture seule (crédits perdus, fonctions Expert coupées)
```

## 6. Règles métier clés (récapitulatif)
| Règle | Source |
|---|---|
| Rien n'est visible par l'élève ni n'alimente son profil sans validation | valider-une-correction **[Observé]** |
| Note par critère bornée au maximum du critère, somme = total | analyse-rapide-ou-approfondie, generer-enonce-et-bareme **[Observé]** |
| Correction manuelle et réponse orale : 0 crédit, pas de signal de compétence (manuel) | corriger-une-copie-sans-ia **[Observé]** |
| Réponse d'exercice : signal de compétence de poids inférieur à une copie | regler-correction-automatique **[Observé]** |
| Crédit débité au lancement, restitué si pas de livrable | comprendre-les-credits, CGU §8 **[Observé]** |
| Crédits inclus remis à niveau chaque mois sans report ; crédits achetés consommés après, valables pendant l'abonnement | CGU §8 **[Observé]** |
| Retirer un élève d'une classe ≠ effacer ses données | ajouter-ses-eleves **[Observé]** |
| Effacement RGPD définitif et tracé | exporter-ou-effacer-donnees-eleve **[Observé]** |
| Pro : 3 classes max ; Expert : illimité | Tarifs **[Observé]** |
