# PRD-07 · Adaptation DYS / PAP

## Contexte
« Adapter un sujet est une obligation légale depuis 2005, pas une option premium. » Une variante allège l'accès à l'épreuve sans en baisser le niveau, et sans désigner l'élève.

## User stories
- **US-07.1** Je génère une version adaptée de mon évaluation pour un élève à PAP.
- **US-07.2** Je choisis l'intensité de l'adaptation et les besoins fonctionnels concernés.
- **US-07.3** Je vois la liste des transformations appliquées pour juger si c'est trop ou pas assez.
- **US-07.4** Je valide la variante avant de pouvoir l'imprimer.

## Exigences fonctionnelles
| ID | Exigence |
|---|---|
| F-07.1 | Point d'entrée : « Adaptation nécessaire ? » sur l'évaluation, génération en un clic |
| F-07.2 | 8 besoins sélectionnables : dyslexie, dysorthographie, dysgraphie, dyspraxie, dyscalculie, dysphasie, TDAH, TSA ; ce sont des **leviers d'adaptation**, pas des diagnostics |
| F-07.3 | 3 intensités : (1) mise en page pensée pour la lecture ; (2) étayage modéré des consignes et de la production ; (3) accompagnement maximal |
| F-07.4 | Transformations de **forme** : question ouverte → choix à cocher, consigne découpée en étapes, repérage couleur, banque de mots… |
| F-07.5 | Invariants : niveau d'exigence conservé, **total de points identique**, barème recalculé tombant sur le même total → notes comparables |
| F-07.6 | Aucune mention sur la feuille : ni « adapté », ni dispositif, ni besoin |
| F-07.7 | Statut « proposition » → « validée » ; impression impossible avant validation ; toute modification d'une variante validée la repasse en proposition |
| F-07.8 | Liste des transformations appliquées affichée |
| F-07.9 | Coût fixe : 2 crédits, quelle que soit l'intensité |
| F-07.10 | Disponible dans les deux forfaits, « sans surcoût » |

## Règles
- Une variante répond à un besoin d'**aménagement** ; un groupe de remédiation répond à une **compétence fragile**. Ne pas confondre.
- L'intensité se change d'un essai à l'autre.

## Questions ouvertes
- Stockage des besoins par élève (donnée de santé potentiellement sensible au sens RGPD) : le site insiste sur l'absence de diagnostic ; **[Hypothèse]** les besoins sont paramétrés au niveau de la variante, pas du profil élève.
- Correction d'une copie issue d'une variante : barème de la variante utilisé automatiquement ?
