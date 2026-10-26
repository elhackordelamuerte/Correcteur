# PRD-09 · Monétisation : forfaits, crédits, essai

## Contexte
Modèle hybride : abonnement (accès + quota mensuel de crédits) et consommation (recharges). Principe : « Un crédit, c'est une action de Margou. Ce que vous faites à la main ne coûte rien. »

## Forfaits **[Observé]**
| | **Pro** | **Expert** |
|---|---|---|
| Accroche | « Pour corriger sans y passer vos week-ends » | « Pour les gros volumes et le suivi » |
| Mensuel | 29,99 € | 59,99 € |
| Annuel (2 mois offerts) | 299,90 € | 599,90 € |
| Crédits / mois | 120 (« 4 à 5 paquets ») | 250 (« 9 à 10 paquets ») |
| Classes | 3 max | Illimité |
| Correction, scan, annotations, publication groupée | ✓ | ✓ |
| Génération évaluations, barèmes, exercices | ✓ | ✓ |
| DYS/PAP | ✓ | ✓ |
| Profil élève, compétences fragiles, répartition | ✓ | ✓ |
| Appréciations, espace élève, export/effacement RGPD, dictée vocale | ✓ | ✓ |
| **Carte des compétences (radar élève, tableau classe)** | ✗ | ✓ |
| **Suivi dans le temps, courbes, alertes de décrochage** | ✗ | ✓ |
| Recharges | ✓ | ✓ |

Prix TTC, TVA non applicable (art. 293 B CGI). Une « offre établissements » est mentionnée dans les CGU, sans tarif public.

## Grille des crédits **[Observé]**
| Action | Coût |
|---|---|
| Correction d'une copie, analyse rapide | 1 |
| Correction d'une copie, analyse approfondie | 2 |
| Génération du barème | 0 (offert) |
| Génération d'une évaluation complète (énoncé + barème) | 2 |
| Génération d'un exercice ciblé | 1 |
| Correction d'un exercice rendu par un élève | 1 |
| Variante DYS / PAP (toute intensité) | 2 |
| Génération d'une appréciation | 1 |
| Création manuelle (exercice, évaluation, appréciation), correction manuelle, oral | 0 |

Recharges : +50 = 15 € (0,30 €/cr.) · +150 = 42 € (0,28 €/cr.) · +400 = 109 € (≈ 0,27 €/cr.).
Coût implicite d'un crédit inclus : Pro ≈ 0,25 € ; Expert ≈ 0,24 €.

## Exigences fonctionnelles
| ID | Exigence |
|---|---|
| F-09.1 | Coût affiché **avant** chaque action IA |
| F-09.2 | Débit à l'engagement ; restitution automatique si l'action n'aboutit pas |
| F-09.3 | Quota inclus remis à sa valeur initiale à chaque échéance mensuelle, sans report |
| F-09.4 | Crédits achetés : s'ajoutent, ne sont pas remis à zéro, survivent au changement de forfait, consommés **après** les crédits inclus ; perdus à l'expiration de l'abonnement |
| F-09.5 | Alerte avant épuisement (« Margou vous prévient avant que vous soyez à court ») |
| F-09.6 | Solde nul : tout le manuel reste disponible ; les corrections auto d'exercices basculent vers le prof |
| F-09.7 | Recharge à tout moment depuis le compte |
| F-09.8 | Changement de forfait : montée immédiate, descente à l'échéance suivante, sans pénalité |
| F-09.9 | Factures disponibles dans l'espace compte |

## Essai et souscription
| ID | Exigence |
|---|---|
| F-09.10 | Essai 14 jours avec **fonctions Expert**, quel que soit le forfait choisi |
| F-09.11 | Carte bancaire obligatoire à l'inscription (Stripe), aucun débit avant J15 |
| F-09.12 | Tunnel : `/inscription?plan={pro|expert}&facturation={mois|an}` → Compte → Infos bancaires → Confirmation → e-mail de validation |
| F-09.13 | À J15 : premier prélèvement ; si Pro, carte des compétences et suivi dans le temps se referment |
| F-09.14 | Résiliation « en 3 clics » depuis les paramètres, sans contacter le support (art. L.215-1-1 C. conso) |
| F-09.15 | Mensuel : effet à la fin du cycle. Annuel : engagement ferme 12 mois, effet à l'échéance |
| F-09.16 | Aucun remboursement prorata ; rétractation de 14 jours qui coïncide avec l'essai |
| F-09.17 | Après la période payée : **lecture seule** (classes, élèves, évaluations, copies, barèmes, profils consultables) ; plus aucune action IA ; fonctions Expert coupées |
| F-09.18 | Drapeau `SOUSCRIPTION_OUVERTE` côté site : permet de fermer les inscriptions sans toucher aux pages |

## Estimateur de forfait (site, 100 % côté client) **[Observé]**
Entrées : nombre de classes, élèves par classe, évaluations par classe/mois, exercices générés par classe/mois, case « analyse approfondie ».

```
total = élèves × classes × évaluations × coût_copie(1|2) + exercices × classes
```
Exemple par défaut : 26 × 4 × 2 × 1 + 5 × 4 = **228 crédits/mois** → Expert.

Règles de recommandation (dans l'ordre) :
1. `total > 250` → Expert + combinaison de recharges **la moins chère** couvrant le manque (recherche exhaustive sur au plus deux tailles de packs) ; en annuel, la recharge est affichée « par mois ».
2. `classes > 3` → Expert (« plus avantageux car vous avez plus de trois classes »).
3. `120 < total ≤ 250` → Pro + recharges si `29,99 + prix_recharges < 59,99`, sinon Expert. Bornes calculées, jamais codées en dur.
4. Sinon → Pro.

Limite notée : l'estimateur n'intègre pas la correction des exercices rendus par les élèves (1 crédit par réponse), qui peut dominer la consommation si les exercices sont assignés à toute la classe.

## Questions ouvertes
- Comportement exact des crédits inclus non consommés pendant l'essai.
- Offre établissements : licences, facturation sur bon de commande, mandat administratif.
