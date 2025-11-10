# 🐛 Bugfix : Liens de Formulaire Incorrects

## Problème Identifié

**Symptôme :** Après avoir créé/modifié un formulaire, le lien généré était incorrect :
- Format affiché : `/poll/poll-1761929446884/vote` ❌
- Format attendu : `/poll/satisfaction-client-yb1ardk1` ✅

**Impact :**
- Le lien ne fonctionnait pas
- Impossible de voter après avoir changé le thème
- Confusion pour l'utilisateur

---

## Cause Racine

Dans `FormCreator.tsx`, le lien utilisait `publishedPoll.id` au lieu de `publishedPoll.slug` :

```tsx
// ❌ AVANT (BUG)
to={`/poll/${publishedPoll.id}/vote`}
{window.location.origin}/poll/{publishedPoll.id}/vote
```

**Problème :**
1. Utilise l'`id` (ex: `poll-1761929446884`) au lieu du `slug` (ex: `satisfaction-client-yb1ardk1`)
2. Ajoute `/vote` alors que la route est `/poll/:slug` (sans `/vote`)

---

## Solution Appliquée

### Fichier : `src/pages/FormCreator.tsx`

**1. Bouton "Voir le formulaire" :**
```tsx
// ✅ APRÈS (CORRIGÉ)
to={`/poll/${publishedPoll.slug || publishedPoll.id}`}
```

**2. Lien affiché :**
```tsx
// ✅ APRÈS (CORRIGÉ)
{window.location.origin}/poll/{publishedPoll.slug || publishedPoll.id}
```

**3. Copie du lien :**
```tsx
// ✅ APRÈS (CORRIGÉ)
const url = `${window.location.origin}/poll/${publishedPoll.slug || publishedPoll.id}`;
```

---

## Routes Correctes

Les routes définies dans `App.tsx` :
- `/poll/:slug` → Formulaire de vote ✅
- `/poll/:slug/results` → Résultats ✅
- `/vote/:pollId` → Ancien format (rétrocompatibilité)

**Format correct :** `/poll/{slug}` (sans `/vote`)

---

## Tests à Effectuer

1. **Créer un nouveau formulaire**
   - Vérifier que le lien affiché est : `/poll/{slug}`
   - Cliquer sur "Voir le formulaire" → Doit fonctionner
   - Copier le lien → Doit être correct

2. **Modifier un formulaire existant**
   - Changer le thème
   - Sauvegarder
   - Vérifier que le lien reste le même (slug préservé)
   - Voter → Doit fonctionner

3. **Vérifier la persistance du slug**
   - Le slug ne doit pas changer lors des modifications
   - Le slug est généré une seule fois à la création

---

## Fichiers Modifiés

- `src/pages/FormCreator.tsx` (3 modifications)
- `src/components/polls/FormPollCreator.tsx` (2 modifications)

---

## ✅ Bug #2 : Slug Regénéré à Chaque Modification

### Problème

Quand on modifie un formulaire (ex: changer le thème), le **slug change** :
- **Avant :** `/poll/satisfaction-client-gy9inspg`
- **Après :** `/poll/satisfaction-client-euwcnphv`

**Impact :** L'ancien lien ne fonctionne plus !

### Cause Racine

Dans `handleFinalize()`, l'ordre des opérations était incorrect :

```tsx
// ❌ AVANT (BUG)
1. Supprimer les drafts avec le même ID
2. Sauvegarder le poll actif
```

**Problème :** L'étape 1 supprimait TOUS les polls (drafts ET actifs) avec le même ID !
Donc à l'étape 2, `upsertFormPoll` ne trouvait plus le poll existant → **générait un nouveau slug**.

### Solution

Inverser l'ordre des opérations :

```tsx
// ✅ APRÈS (CORRIGÉ)
1. Sauvegarder le poll actif (upsertFormPoll préserve le slug existant)
2. Supprimer SEULEMENT les anciens drafts
```

**Code corrigé :**
```tsx
// Créer/mettre à jour le poll actif
const saved = upsertFormPoll(draft, "active");

// Supprimer les anciens brouillons (mais garder le poll actif)
const all = getAllPolls();
const withoutOldDrafts = all.filter((p) => !(p.id === draft.id && p.status === "draft"));
savePolls(withoutOldDrafts);
```

### Logs de Debug

Ajout de logs pour tracer le problème :
```tsx
logger.debug("upsertFormPoll", "poll", { 
  draftId: draft.id, 
  existingIdx, 
  existingSlug: existingIdx >= 0 ? all[existingIdx].slug : "none",
  allPollIds: all.map(p => p.id)
});
```

---

**Statut :** ✅ CORRIGÉ - Prêt pour re-test !
