# PRD-10 · Confidentialité, RGPD et sécurité

## Contexte
« Margou.ia traite des données d'élèves mineurs : nous appliquons le niveau d'exigence maximal. » La confiance est un argument de vente central (objection « nourrir les big data »).

## Exigences
| ID | Exigence | Source |
|---|---|---|
| F-10.1 | Finalités exclusivement pédagogiques : (a) analyse des copies et diagnostics pour l'enseignant ; (b) suivi et recommandation d'exercices. Pas de publicité, ni vente, ni cession, ni profilage commercial | Sécurité, Politique §3/§9 |
| F-10.2 | Bases légales : contrat (enseignant), intérêt légitime de mission pédagogique (suivi), obligations légales (facturation) | Politique §3 |
| F-10.3 | Minimisation : élève = prénom, nom, niveau. Pas de date de naissance, adresse ni photo | Politique §2 |
| F-10.4 | **Pseudonymisation** : aucun nom ni prénom transmis au service d'analyse ; identifiant neutre ; correspondance uniquement en base | Sécurité §5 |
| F-10.5 | Pas d'entraînement de modèle sur les copies ou données | Sécurité, FAQ |
| F-10.6 | Audio élève jamais transmis à l'IA | Aide |
| F-10.7 | Hébergement UE : app Paris (Hostinger), BDD + copies Francfort (Supabase), sauvegardes Lituanie | Sécurité §4 |
| F-10.8 | Transfert hors UE vers Anthropic (analyse IA) sous clauses contractuelles types, sans nom d'élève | Politique §5 |
| F-10.9 | Stockage privé des copies et médias ; liens signés valables 1 h | Sécurité §4 |
| F-10.10 | Cloisonnement : chaque enseignant ne voit que ses classes ; chaque élève que ses résultats validés | Sécurité §5 |
| F-10.11 | Conservation : pédagogique = année scolaire + 1 an ; comptes = tant qu'actif ; audit = 1 an ; facturation = durée légale | Politique §6 |
| F-10.12 | Export complet des données d'un élève au **format JSON** depuis Paramètres → « Confidentialité & RGPD » | Aide, Sécurité §7 |
| F-10.13 | Effacement définitif d'un élève depuis le même écran (copies, analyses, profil) ; distinct du retrait de classe | Aide |
| F-10.14 | Journal d'audit des exports, effacements et opérations sensibles (qui, quoi, quand) | Aide, Sécurité §6 |
| F-10.15 | Aucune note ni diagnostic définitif sans validation explicite de l'enseignant (art. 22 RGPD, décision automatisée) | Sécurité §8 |
| F-10.16 | Comptes élèves créés dans le cadre scolaire via code de l'enseignant | Politique §3 |
| F-10.17 | Chiffrement des échanges (HTTPS, HSTS), CSP stricte, anti-clickjacking | En-têtes |
| F-10.18 | Contact protection des données : contact@margouia.re ; recours CNIL | Politique §12 |

## Écarts et risques relevés (analyse critique)
| # | Constat | Impact |
|---|---|---|
| R1 | Page Sécurité : « l'ensemble se trouve dans l'Union européenne » ; la politique précise un transfert IA aux États-Unis. Message partiellement contradictoire selon la page lue | Confiance, transparence (art. 13) |
| R2 | Une copie manuscrite photographiée porte souvent le nom de l'élève : la pseudonymisation dépend du « masquage du nom » à l'import, dont le fonctionnement n'est pas décrit | Efficacité réelle de la pseudonymisation |
| R3 | La page espace élève évoque un « DPO dédié » ; aucun DPO nommé ni contact distinct dans la politique | Conformité art. 37-39 |
| R4 | Base « intérêt légitime de mission pédagogique » pour un acteur privé traitant des données de mineurs : qualification responsable / sous-traitant vis-à-vis de l'enseignant ou de l'établissement non explicitée | Répartition des responsabilités |
| R5 | Les besoins DYS (variante) peuvent révéler une donnée de santé (art. 9) s'ils sont associés à un élève | Catégorie particulière |
