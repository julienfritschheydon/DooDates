# 📋 Guidelines: data-testid

**Date**: 2025-11-10  
**Objectif**: Améliorer la testabilité et la maintenabilité des tests E2E

---

## 🎯 Pourquoi data-testid ?

### **Problèmes avec les sélecteurs CSS classiques**

```typescript
// ❌ FRAGILE - Casse si on change le style
page.locator('button[title="Vue grille"]');

// ❌ FRAGILE - Casse si on change la structure HTML
page.locator("div.header > button.view-toggle");

// ❌ FRAGILE - Casse si on change le texte (i18n)
page.getByText("Vue grille");
```

### **Avantages de data-testid**

```typescript
// ✅ ROBUSTE - Découple le test du style et de la structure
page.locator('[data-testid="view-toggle-grid"]');

// ✅ INTENTION CLAIRE - On sait immédiatement ce qui est testé
// ✅ MAINTENABLE - Un seul endroit à changer
// ✅ PERFORMANT - Sélecteur direct, pas de traversée DOM
```

---

## 📐 Convention de Nommage

### **Format général**

```
data-testid="{component}-{element}-{action}"
```

### **Exemples**

| Élément                   | data-testid            | Raison                                         |
| ------------------------- | ---------------------- | ---------------------------------------------- |
| Bouton de connexion       | `auth-button-login`    | auth = contexte, button = type, login = action |
| Input email               | `auth-input-email`     | auth = contexte, input = type, email = champ   |
| Toggle vue grille         | `view-toggle-grid`     | view = contexte, toggle = type, grid = valeur  |
| Card de conversation      | `conversation-card`    | conversation = type, card = élément            |
| Résultat de test Supabase | `supabase-test-result` | supabase = contexte, test-result = type        |

### **Règles**

1. **Kebab-case** (`my-test-id` pas `myTestId`)
2. **Descriptif** (comprendre en 3 secondes ce que c'est)
3. **Unique** dans la page (ou utiliser un index si besoin)
4. **Pas de valeurs dynamiques** (`user-${id}` → préférer `data-user-id="${id}"`)

---

## ✅ Quand Ajouter data-testid ?

### **TOUJOURS sur**

- ✅ **Boutons d'action** (submit, delete, cancel, etc.)
- ✅ **Inputs de formulaire** (email, password, search, etc.)
- ✅ **Toggles / Switches** (view mode, dark mode, etc.)
- ✅ **Éléments cliquables critiques** (cards, links importants)
- ✅ **Résultats de tests / diagnostics**

### **OPTIONNEL sur**

- ⚪ Texte statique (titre, paragraphes)
- ⚪ Icônes décoratives
- ⚪ Containers génériques

### **JAMAIS sur**

- ❌ Éléments purement CSS (divs de layout)
- ❌ Éléments qui n'ont pas de rôle fonctionnel

---

## 🛠️ Exemples Pratiques

### **1. Boutons de toggle view (Dashboard)**

```tsx
// src/components/dashboard/DashboardFilters.tsx
<button
  data-testid="view-toggle-grid"
  onClick={() => setView('grid')}
  title="Vue grille"
>
  <LayoutGrid />
</button>

<button
  data-testid="view-toggle-table"
  onClick={() => setView('table')}
  title="Vue table"
>
  <Table />
</button>
```

```typescript
// tests/e2e/dashboard-complete.spec.ts
const gridButton = page.locator('[data-testid="view-toggle-grid"]');
const tableButton = page.locator('[data-testid="view-toggle-table"]');

await expect(gridButton).toHaveClass(/bg-blue-500/);
await tableButton.click();
```

### **2. Diagnostic Supabase**

```tsx
// src/pages/SupabaseDiagnostic.tsx
<div
  key={index}
  data-test-name={result.name}
  data-test-status={result.status}
  className="border rounded-lg p-4"
>
  <h3>{result.name}</h3>
  <p>{result.message}</p>
</div>
```

```typescript
// tests/e2e/supabase-integration.spec.ts
const testResults = await page.$$eval("[data-test-status]", (elements) =>
  elements.map((el) => ({
    name: el.getAttribute("data-test-name"),
    status: el.getAttribute("data-test-status"),
  })),
);

expect(testResults[0].status).toBe("success");
```

### **3. Form avec validation**

```tsx
// Composant
<form data-testid="poll-creation-form">
  <input data-testid="poll-input-title" placeholder="Titre du sondage" />
  <button data-testid="poll-button-submit" type="submit">
    Créer
  </button>
</form>
```

```typescript
// Test
await page.locator('[data-testid="poll-input-title"]').fill("Mon sondage");
await page.locator('[data-testid="poll-button-submit"]').click();

await expect(page.locator('[data-testid="poll-creation-form"]')).not.toBeVisible();
```

---

## 🚨 Pre-commit Hook

Le hook `.husky/pre-commit` vérifie automatiquement :

```bash
# 2b. Vérification testabilité (data-testid, tests pour nouveau code)
echo "🧪 Vérification testabilité..."
node scripts/verify-testability.cjs
```

### **Ce qui est vérifié**

1. ✅ **Fichiers critiques ont des tests** (`src/lib/`, `src/services/`, `src/hooks/`)
2. ✅ **Éléments interactifs ont data-testid**
   - Compte les `<button>`, `<input>`, `onClick`, etc.
   - Vérifie la présence de `data-testid`
   - Avertit si ratio trop faible

### **Exemple de sortie**

```
🔍 Vérification de la testabilité du code...

📂 2 fichier(s) à vérifier:

⚠️ AVERTISSEMENTS:

  📄 src/components/MyButton.tsx
     ⚠️ 3 élément(s) interactif(s) sans data-testid
     💡 Ajouter data-testid="..." aux boutons, inputs, etc.

============================================================
📊 Résumé: 2 fichier(s) vérifié(s)
   ❌ 0 erreur(s)
   ⚠️  1 avertissement(s)
   ℹ️  0 info(s)
============================================================

✅ Aucune erreur bloquante détectée.
💡 Considérez les avertissements ci-dessus pour améliorer la testabilité.
```

---

## 📚 Ressources

### **Playwright Best Practices**

- [Playwright Locators](https://playwright.dev/docs/locators)
- [Testing Best Practices](https://playwright.dev/docs/best-practices)

### **Testing Library Philosophy**

- [Guiding Principles](https://testing-library.com/docs/guiding-principles/)
- Priorité: User-centric tests (ce que l'utilisateur voit/fait)

### **Nos Patterns**

| Pattern       | Quand l'utiliser               | Exemple                                   |
| ------------- | ------------------------------ | ----------------------------------------- |
| `data-testid` | Éléments interactifs critiques | `[data-testid="submit-button"]`           |
| `getByRole`   | Sémantique HTML claire         | `getByRole('button', { name: 'Submit' })` |
| `getByLabel`  | Labels de formulaire           | `getByLabelText('Email')`                 |
| `getByText`   | Contenu unique                 | `getByText('Welcome back!')`              |

**Ordre de préférence** (du plus stable au plus fragile):

1. `data-testid` (si élément critique)
2. `getByRole` avec name
3. `getByLabelText`
4. `getByText`
5. CSS selector (en dernier recours)

---

## 🔄 Migration Progressive

### **Phase 1: Nouveaux composants** ✅ EN COURS

- Tous les nouveaux composants **DOIVENT** avoir `data-testid`
- Pre-commit hook vérifie (mode warning)

### **Phase 2: Composants existants** 🔜 À VENIR

- Ajouter `data-testid` lors de la modification d'un composant
- Priorité: Composants les plus testés

### **Phase 3: Mode strict** 🎯 OBJECTIF

- Pre-commit hook passe en mode bloquant
- Tous les éléments interactifs **DOIVENT** avoir `data-testid`

---

## 💡 Tips

### **1. Grouper les data-testid liés**

```tsx
<div data-testid="user-profile">
  <img data-testid="user-profile-avatar" />
  <h2 data-testid="user-profile-name">John Doe</h2>
  <button data-testid="user-profile-edit">Edit</button>
</div>
```

### **2. Utiliser des data-attributes pour les valeurs**

```tsx
// ✅ BON - data-attribute pour la valeur
<div
  data-testid="test-result"
  data-test-status="success"
  data-test-name="Connexion Supabase"
>

// ❌ MAUVAIS - valeur dans le data-testid
<div data-testid="test-result-success-connexion-supabase">
```

### **3. Éviter les indices si possible**

```tsx
// ❌ FRAGILE
<button data-testid="delete-button-0">Delete</button>
<button data-testid="delete-button-1">Delete</button>

// ✅ MIEUX - contexte parent
<div data-testid="conversation-item" data-conversation-id="123">
  <button data-testid="conversation-delete">Delete</button>
</div>
```

```typescript
// Test
const conversation = page.locator('[data-conversation-id="123"]');
await conversation.locator('[data-testid="conversation-delete"]').click();
```

---

**Date**: 2025-11-10  
**Auteur**: DooDates Team  
**Version**: 1.0
