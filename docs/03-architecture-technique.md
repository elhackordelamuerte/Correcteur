# 03 · Architecture technique observée

## Vue d'ensemble

```
                    ┌────────────────────────── Navigateur (desktop / mobile) ──────────────────────────┐
                    │                                                                                   │
        margouia.re │ HTML statique + JS vanilla                    app.margouia.re │ Next.js (App Router) │
                    │ tarteaucitron, GA4*, Pixel Meta*               │ caméra / micro (self), WASM, workers │
                    └──────────────┬────────────────────────────────┴──────────────┬───────────────────┘
                                   │ (* après consentement)                         │
                  Hostinger Paris (LiteSpeed)                         Hostinger Paris (LiteSpeed + Node)
                                   │                                                │  /api/contact, /api/…
                                   └──── POST app.margouia.re/api/contact ──────────┤
                                                                                    │
                                    ┌───────────────────────────────────────────────┼──────────────────┐
                                    │ Supabase — Francfort (ejjtbqmpmecerqylbgkb)    │                  │
                                    │ Postgres + Auth + Storage privé + Realtime     │  sauvegardes LT  │
                                    └───────────────────────────────────────────────┘                  │
                                                                                    │
                                     Anthropic (USA, CCT) ◄── copie + barème + ID neutre (pas de nom, pas d'audio)
                                     Stripe ◄── abonnement, carte, recharges
```

## Constat par composant

| Composant | Constat | Preuve | Confiance |
|---|---|---|---|
| Site vitrine `margouia.re` | Pages HTML statiques, JS vanilla commenté en français, servi par Hostinger (LiteSpeed, `platform: hostinger`, `panel: hpanel`) | En-têtes HTTP, sources HTML | **[Observé]** |
| Application `app.margouia.re` | Next.js App Router (`x-powered-by: Next.js`, en-têtes `vary: rsc, next-router-state-tree`, chunks `/_next/static/chunks/app/connexion/page-*.js`) | En-têtes, HTML | **[Observé]** |
| Hébergement de l'app | Hostinger aussi (Node.js derrière LiteSpeed), Paris | En-têtes + mentions légales | **[Observé]** |
| Base de données / Auth / fichiers | Supabase, projet `ejjtbqmpmecerqylbgkb`, région Francfort | CSP `connect-src`, `img-src`, `media-src` ; mentions légales | **[Observé]** |
| Temps réel | `wss://…supabase.co` autorisé dans la CSP → Supabase Realtime (probablement progression « 18 / 28 » et notifications) | CSP | **[Déduit]** |
| Authentification | E-mail + mot de passe, page `/mot-de-passe-oublie`, lien de confirmation par e-mail ; aucun SSO (Google, ENT, EduConnect) visible | Page `/connexion`, tunnel d'inscription | **[Observé]** |
| Stockage des copies | Bucket privé, URL signées valables 1 h | Politique de confidentialité | **[Observé]** |
| IA | Anthropic (modèles Claude), hors UE, encadré par clauses contractuelles types | Politique de confidentialité §4-5 | **[Observé]** ; version de modèle inconnue |
| Paiement | Stripe (carte), montants remontés au front par l'API d'inscription ou l'URL de retour | CGU §5, commentaires de `margou-meta.js` | **[Observé]** |
| API de l'app | Route Next.js `https://app.margouia.re/api/contact` appelée par le site vitrine | JS de `/contact` | **[Observé]** |
| Capture média | `permissions-policy: camera=(self), microphone=(self)` → photo des copies et enregistrement audio dans le navigateur | En-têtes | **[Déduit]** |
| Traitement côté client | `script-src 'wasm-unsafe-eval'`, `worker-src blob:` → WebAssembly et workers (rendu PDF, compression ou redressement d'image, lecture QR, encodage audio possibles) | CSP | **[Hypothèse]** sur l'usage exact |
| Sécurité HTTP de l'app | CSP stricte (`default-src 'self'`, `frame-ancestors 'none'`, `object-src 'none'`, `form-action 'self'`), HSTS 2 ans + sous-domaines, `X-Frame-Options: DENY`, `nosniff`, pas de cache sur les pages | En-têtes | **[Observé]** |
| Sauvegardes | Lituanie (UE) | Politique de confidentialité | **[Observé]** |
| Mesure d'audience | GA4 `G-FF7VBL6FKZ`, Pixel Meta `889144787306453`, uniquement après consentement ; polices auto-hébergées (Bricolage Grotesque, Figtree) | Scripts en ligne | **[Observé]** |

## Flux d'une correction IA **[Déduit]**

```
Enseignant (app)                 Serveur Next.js / fonctions          Supabase                Anthropic
     │ lancer analyse (N copies)        │                                │                        │
     │────────────────────────────────►│ vérifier solde, débiter N×coût │                        │
     │                                  │───────────────────────────────►│ (mouvement crédits)    │
     │                                  │ pour chaque copie :             │                        │
     │                                  │   URL signée 1 h du fichier ◄──│                        │
     │                                  │   payload {id_neutre, barème,  │                        │
     │                                  │   énoncé, image/PDF}           │                        │
     │                                  │──────────────────────────────────────────────────────►│
     │                                  │   [approfondie : passe 1 transcription, passe 2 analyse]│
     │                                  │◄──────────────────────────────────────────────────────│ JSON structuré
     │                                  │   valider le JSON : bornes par critère, somme = total  │
     │                                  │   écrire Analyse (statut proposée)  ─────────────────►│
     │◄──── Realtime : progression ─────┤                                │                        │
     │                                  │   si échec : restituer crédits ►│                        │
```

## Points d'attention techniques (pour une équipe qui voudrait s'en inspirer)
- **Un seul hébergeur applicatif mutualisé** (Hostinger) pour du Next.js avec traitements IA longs : les analyses par lot doivent tourner hors du cycle requête/réponse (file d'attente, Edge Functions Supabase ou worker). Non observable de l'extérieur.
- **Transfert hors UE assumé** vers Anthropic malgré le discours « 100 % UE » : la page Sécurité dit « l'ensemble se trouve dans l'UE » pour l'hébergement, la politique de confidentialité précise le transfert IA. La cohérence du message repose entièrement sur la pseudonymisation ([ADR-004](adr/ADR-004-pseudonymisation-ia.md)).
- **Les copies manuscrites peuvent contenir le nom de l'élève** écrit en haut de la feuille. Le comparatif des forfaits mentionne un « masquage du nom » à l'import : c'est probablement le mécanisme qui rend la pseudonymisation effective sur l'image elle-même. **[Hypothèse]** sur son fonctionnement (zone masquée manuellement, détection automatique ou recadrage).
