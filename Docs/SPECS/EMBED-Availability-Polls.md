# Intégration des sondages de disponibilité dans un site web

## Objectif

Permettre à un site externe d’intégrer un sondage de disponibilité DooDates :

- En iframe “plug & play”.
- Avec personnalisation complète des couleurs (thèmes).
- Avec, à terme, gestion de compte intégrée (SSO / mode marque blanche).

---

## 1. Mode EMBED – Base technique

### 1.1. URL publique

Chaque sondage de dispo possède déjà une URL publique :

- Exemple : `https://app.doodates.com/availability/{slug}`

On ajoute un **mode embed** :

- `https://app.doodates.com/availability/{slug}?embed=1`

Effets du `embed=1` côté frontend :

- Masquer le `TopNav`, footer, et tout ce qui est navigation globale.
- Désactiver certains éléments non utiles en intégration (ex : liens vers dashboard).
- Adapter les marges/paddings pour un affichage dans un bloc (sans plein écran).

### 1.2. Snippet d’intégration simple

Snippet HTML standard proposé dans l’UI de partage :

```html
<iframe
  src="https://app.doodates.com/availability/{slug}?embed=1"
  style="width: 100%; max-width: 900px; height: 650px; border: 0; border-radius: 12px; overflow: hidden;"
  loading="lazy"
></iframe>
```

Options dans l’UI :

- Hauteur recommandée (600–800px).
- Bord arrondi activé / non.
- Ombre ou non.

---

## 2. Personnalisation des couleurs (thème embarqué)

### 2.1. Paramètres de thème via query string

On autorise des paramètres optionnels :

- `primary`: couleur principale (boutons, liens)  
- `accent`: couleur secondaire  
- `bg`: couleur de fond  
- `text`: couleur de texte principale  
- `border`: couleur de bordures

Exemple :

```html
<iframe
  src="https://app.doodates.com/availability/{slug}?embed=1
       &primary=%234F46E5
       &accent=%23F97316
       &bg=%23FAFAFA
       &text=%23111111"
  style="width: 100%; max-width: 900px; height: 650px; border: 0; border-radius: 12px;"
></iframe>
```

Côté app :

- Lecture des query params au montage.
- Application via variables CSS (ou thème Tailwind) :

  - `--dd-primary`
  - `--dd-accent`
  - `--dd-bg`
  - `--dd-text`
  - `--dd-border`

- Défaut : si pas de param, on garde le thème standard DooDates.

### 2.2. Thèmes nommés

Pour éviter de répéter les hex dans tous les sites, gestion de **thèmes nommés** côté DooDates :

- Dans le dashboard, l’utilisateur configure un **thème** :

  - Nom interne : `client-foo`
  - Palette : primary, accent, bg, text, border

- Persisté en base et attaché au compte.

L’embed devient :

```html
<iframe
  src="https://app.doodates.com/availability/{slug}?embed=1&theme=client-foo"
  style="width: 100%; max-width: 900px; height: 650px; border: 0; border-radius: 12px;"
></iframe>
```

Côté app :

- Si `theme={id}` est fourni, on charge le thème associé au compte.
- Les paramètres directs (`primary`, etc.) peuvent éventuellement **override** le thème s’ils sont fournis en plus (optionnel).

---

## 3. Gestion de compte intégrée / mode “marque blanche”

Objectif : un SaaS tiers peut proposer les sondages DooDates à ses propres utilisateurs :

- L’utilisateur est connecté **sur le site tiers**.
- Il voit et gère ses sondages dans ce site, sans passer par l’UI directe de DooDates.
- L’iframe apparaît déjà “connectée”.

### 3.1. Approche JWT “embed token” (iframe authentifiée)

Principe :

1. Le site tiers gère **son propre login**.
2. Quand il doit afficher un embed DooDates, il génère ou récupère un **JWT embed**.
3. Ce JWT est passé en paramètre d’URL :

   - `...?embed=1&token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

4. DooDates valide le token, associe l’utilisateur externe à un **compte/organisation DooDates** et affiche les sondages correspondants.

#### 3.1.1. Contenu recommandé du JWT

- `sub` : identifiant utilisateur côté client (ex : `user-123`).
- `external_account_id` : identifiant de l’organisation côté client.
- `scope` : `['embed:availability:read', 'embed:availability:vote']` etc.
- `exp` : expiration courte (ex : 5–15 minutes).
- (optionnel) `theme` : id de thème à utiliser par défaut.

#### 3.1.2. Flux d’intégration

- Côté SaaS :

  - L’API backend génère un JWT signé avec une clé partagée ou un couple clé privée/publique.
  - Le frontend injecte ce token dans l’URL de l’iframe.

- Côté DooDates :

  - Middleware d’auth embed :
    - Récupère `token`.
    - Vérifie signature + expiration.
    - Charge / crée l’utilisateur DooDates lié à `sub` / `external_account_id`.
  - Initialise la session “embed” pour ce user.

### 3.2. SDK JavaScript (optionnel, plus tard)

Pour simplifier la vie des intégrateurs, fournir un petit SDK :

```html
<script src="https://cdn.doodates.com/embed.js"></script>
<div id="doodates-availability"></div>
<script>
  Doodates.initAvailability({
    container: "#doodates-availability",
    pollSlug: "my-slug",
    theme: {
      primary: "#4F46E5",
      accent: "#F97316"
    },
    auth: {
      token: "JWT_EMBED_ISSU_PAR_LE_CLIENT"
    },
    callbacks: {
      onSubmit: (result) => {
        console.log("Sondage complété", result);
      },
      onError: (error) => {
        console.error("Erreur embed DooDates", error);
      }
    }
  });
</script>
```

Le SDK :

- Construit l’URL d’iframe (embed=1, thème, token).
- Gère le `postMessage` pour :
  - `onSubmit` (par ex. quand un vote est envoyé).
  - `onResize` (adapter la hauteur).
  - `onError` (erreurs côté embed).

---

## 4. Expérience utilisateur côté DooDates

### 4.1. Dans le dashboard des sondages de dispo

Pour chaque sondage :

- Bouton **“Partager”** → modal avec :
  - Lien public.
  - Onglet **“Intégrer dans un site web”** :
    - Snippet `<iframe>` prêt à copier.
    - Options de personnalisation (couleurs, coins arrondis, hauteur).
    - Aperçu live de l’embed avec les couleurs choisies.

### 4.2. Section “Branding / Thèmes”

Dans les paramètres du compte :

- Création de thèmes nommés :
  - Nom du thème.
  - Palette de couleurs.
  - Aperçu de l’interface DooDates avec ce thème.
- Génération du snippet d’embed avec `&theme={id}`.

---

## 5. Sécurité et limites

- **CORS** : l’iframe ne partage pas son DOM, la surface d’attaque est limitée.
- **XSS** : toutes les valeurs de thème / textes doivent être échappées proprement.
- **JWT** :
  - Expiration stricte.
  - Validation côté backend (pas uniquement côté frontend).
- **Quota** :
  - Possibilité de limiter certaines features en embed gratuit (ex : bannière “Powered by DooDates” non désactivable en free).

---

## 6. Roadmap recommandée

1. **V1 (rapide)**
   - `?embed=1` sur la page de vote.
   - Snippet `<iframe>` simple dans l’UI de partage.
   - Quelques params de couleur (`primary`, `bg`, `text`).

2. **V2**
   - Thèmes nommés côté dashboard + `theme={id}`.
   - UI de prévisualisation des thèmes.

3. **V3 (B2B / marque blanche)**
   - JWT embed auth.
   - SDK JS pour intégration “pro”.
   - Callbacks `onSubmit`, `onError`, `onResize`.
