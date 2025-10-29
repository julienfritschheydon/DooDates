# Audit Sélecteurs E2E - Phase 1 Semaine 1

> **Date** : 29 octobre 2025  
> **Objectif** : Identifier et corriger les sélecteurs fragiles dans les 10 specs E2E

---

## 📊 Résumé Exécutif

**Specs auditées** : 10 fichiers  
**Sélecteurs analysés** : 150+  
**Sélecteurs robustes** : ~40% ✅  
**Sélecteurs fragiles** : ~60% ⚠️

### Classification

| Type | Robustesse | Quantité | Exemples |
|------|-----------|----------|----------|
| `data-testid` | ✅ Excellent | ~30% | `[data-testid="calendar"]` |
| `getByRole` | ✅ Excellent | ~10% | `page.getByRole('button')` |
| `text=` | 🟡 Moyen | ~25% | `text=Créer` |
| `.locator('button')` | ⚠️ Fragile | ~20% | `page.locator('button').first()` |
| Sélecteurs CSS | ⚠️ Fragile | ~15% | `.conversation`, `button:visible` |

---

## 🔴 Problèmes Critiques Identifiés

### 1. Sélecteurs Génériques (HAUTE PRIORITÉ)

**Fichiers concernés** : `performance.spec.ts`, `security-isolation.spec.ts`, `edge-cases.spec.ts`

**Problème** :
```typescript
// ❌ FRAGILE - Trouve n'importe quel bouton
page.locator('button').filter({ hasText: /create|new|start/i }).first()

// ❌ FRAGILE - Trouve n'importe quel input
page.locator('input[type="text"], textarea').first()

// ❌ FRAGILE - Trouve n'importe quel bouton
page.locator('button').filter({ hasText: /send|submit/i }).first()
```

**Impact** :
- Casse si ordre des boutons change
- Casse si texte change (i18n)
- Casse si nouveaux boutons ajoutés

**Solution** :
```typescript
// ✅ ROBUSTE - Sélecteur dédié
page.locator('[data-testid="create-conversation-button"]')

// ✅ ROBUSTE - Input spécifique
page.locator('[data-testid="message-input"]')

// ✅ ROBUSTE - Bouton spécifique
page.locator('[data-testid="send-message-button"]')
```

**Actions requises** :
- [ ] Ajouter `data-testid` aux composants :
  - `CreateConversationButton.tsx`
  - `MessageInput.tsx`
  - `SendButton.tsx`
- [ ] Refactorer 3 specs : `performance.spec.ts`, `security-isolation.spec.ts`, `edge-cases.spec.ts`

---

### 2. Sélecteurs par Texte (MOYENNE PRIORITÉ)

**Fichiers concernés** : `ultra-simple.spec.ts`, `guest-workflow.spec.ts`, `authenticated-workflow.spec.ts`

**Problème** :
```typescript
// ❌ FRAGILE - Casse si texte change
await page.click('text=Sondage Dates');

// ❌ FRAGILE - Regex complexe
await expect(page.locator('text=/Conversation \\d+/')).toBeVisible();

// ❌ FRAGILE - Texte exact
await expect(page.locator('text=Test E2E Ultra Simple')).toBeVisible();
```

**Impact** :
- Casse si texte modifié
- Casse si traduction ajoutée
- Difficile à maintenir

**Solution** :
```typescript
// ✅ ROBUSTE - data-testid + rôle
await page.click('[data-testid="poll-type-date"]');

// ✅ ROBUSTE - Sélecteur structurel
await expect(page.locator('[data-testid="conversation-item"]')).toBeVisible();

// ✅ ROBUSTE - Sélecteur + assertion texte séparée
const pollItem = page.locator('[data-testid="poll-item"]').first();
await expect(pollItem).toContainText('Test E2E Ultra Simple');
```

**Actions requises** :
- [ ] Ajouter `data-testid` aux composants :
  - `PollTypeCard.tsx` (Sondage Dates, Sondage Form)
  - `ConversationItem.tsx`
  - `PollItem.tsx`
- [ ] Refactorer 3 specs : `ultra-simple.spec.ts`, `guest-workflow.spec.ts`, `authenticated-workflow.spec.ts`

---

### 3. Sélecteurs CSS Fragiles (BASSE PRIORITÉ)

**Fichiers concernés** : `navigation-regression.spec.ts`, `form-poll-regression.spec.ts`

**Problème** :
```typescript
// ❌ FRAGILE - Classe CSS peut changer
page.locator('.conversation')

// ❌ FRAGILE - Structure DOM
page.locator('div > button:nth-child(2)')

// ❌ FRAGILE - Pseudo-sélecteur
page.locator('button:visible')
```

**Impact** :
- Casse si refactoring CSS
- Casse si structure DOM change
- Difficile à comprendre

**Solution** :
```typescript
// ✅ ROBUSTE - data-testid
page.locator('[data-testid="conversation-card"]')

// ✅ ROBUSTE - Rôle ARIA
page.getByRole('button', { name: /suivant/i })

// ✅ ROBUSTE - Combinaison data-testid + état
page.locator('[data-testid="submit-button"]:not([disabled])')
```

**Actions requises** :
- [ ] Ajouter `data-testid` aux composants :
  - `ConversationCard.tsx`
  - Boutons de navigation
- [ ] Refactorer 2 specs : `navigation-regression.spec.ts`, `form-poll-regression.spec.ts`

---

## ✅ Bonnes Pratiques Déjà Utilisées

### Sélecteurs Robustes dans `ultra-simple.spec.ts`

```typescript
// ✅ EXCELLENT - data-testid
await expect(page.locator('[data-testid="calendar"]')).toBeVisible();

// ✅ EXCELLENT - getByTestId
const calendar = page.getByTestId('calendar');

// ✅ EXCELLENT - data-testid spécifique
const visibleSection = page.locator('[data-testid="time-slots-section"]:visible');

// ✅ EXCELLENT - data-testid pour formulaire
await page.locator('[data-testid="poll-title"]').fill('Test E2E Ultra Simple');

// ✅ EXCELLENT - data-testid pour actions
await robustClick(page.locator('[data-testid="share-poll-button"]').first());
```

**À reproduire** : Ces patterns sont excellents, à généraliser dans tous les specs.

---

## 📋 Plan d'Action Détaillé

### Étape 1 : Ajouter data-testid aux Composants (2 jours)

#### Jour 1 : Composants Critiques

**1. Boutons d'action** :
```tsx
// src/components/CreateConversationButton.tsx
<button 
  data-testid="create-conversation-button"
  onClick={handleCreate}
>
  Créer une conversation
</button>

// src/components/SendButton.tsx
<button 
  data-testid="send-message-button"
  onClick={handleSend}
>
  Envoyer
</button>
```

**2. Inputs** :
```tsx
// src/components/MessageInput.tsx
<textarea
  data-testid="message-input"
  value={message}
  onChange={handleChange}
/>

// src/components/PollTitleInput.tsx
<input
  data-testid="poll-title-input"
  type="text"
  value={title}
/>
```

**3. Cards/Items** :
```tsx
// src/components/PollTypeCard.tsx
<div 
  data-testid={`poll-type-${type}`}  // poll-type-date, poll-type-form
  onClick={handleSelect}
>
  {children}
</div>

// src/components/ConversationItem.tsx
<div 
  data-testid="conversation-item"
  data-conversation-id={id}
>
  {children}
</div>

// src/components/PollItem.tsx
<div 
  data-testid="poll-item"
  data-poll-id={id}
>
  {children}
</div>
```

#### Jour 2 : Composants Secondaires

**4. Navigation** :
```tsx
// src/components/Navigation.tsx
<nav data-testid="main-navigation">
  <button data-testid="nav-home">Accueil</button>
  <button data-testid="nav-create">Créer</button>
  <button data-testid="nav-dashboard">Dashboard</button>
</nav>
```

**5. Modals** :
```tsx
// src/components/ConfirmModal.tsx
<div data-testid="confirm-modal">
  <button data-testid="confirm-yes">Oui</button>
  <button data-testid="confirm-no">Non</button>
</div>
```

**6. Forms** :
```tsx
// src/components/PollForm.tsx
<form data-testid="poll-form">
  <input data-testid="poll-title" />
  <textarea data-testid="poll-description" />
  <button data-testid="poll-submit">Créer</button>
</form>
```

---

### Étape 2 : Refactorer Specs (3 jours)

#### Jour 3 : Specs Critiques (3 fichiers)

**1. `performance.spec.ts`** (1h30)
```typescript
// AVANT
const createButton = page.locator('button').filter({ hasText: /create|new|start/i }).first();

// APRÈS
const createButton = page.locator('[data-testid="create-conversation-button"]');
```

**2. `security-isolation.spec.ts`** (1h)
```typescript
// AVANT
const messageInput = page.locator('input[type="text"], textarea').first();

// APRÈS
const messageInput = page.locator('[data-testid="message-input"]');
```

**3. `edge-cases.spec.ts`** (1h30)
```typescript
// AVANT
const sendButton = page.locator('button').filter({ hasText: /send|submit/i }).first();

// APRÈS
const sendButton = page.locator('[data-testid="send-message-button"]');
```

#### Jour 4 : Specs Moyens (3 fichiers)

**4. `ultra-simple.spec.ts`** (1h)
- Déjà bien fait, juste quelques ajustements

**5. `guest-workflow.spec.ts`** (1h30)
```typescript
// AVANT
await page.click('text=Sondage Dates');

// APRÈS
await page.click('[data-testid="poll-type-date"]');
```

**6. `authenticated-workflow.spec.ts`** (1h30)
- Similaire à guest-workflow

#### Jour 5 : Specs Secondaires (4 fichiers)

**7-10. Autres specs** (4h)
- `navigation-regression.spec.ts`
- `form-poll-regression.spec.ts`
- `mobile-voting.spec.ts`
- `poll-actions.spec.ts`

---

### Étape 3 : Validation (1 jour)

#### Jour 6 : Tests et Validation

**Matin : Tests locaux**
```bash
# Tester chaque spec individuellement
npx playwright test ultra-simple.spec.ts --headed
npx playwright test performance.spec.ts --headed
# ... etc

# Tester tous ensemble
npm run test:e2e
```

**Après-midi : Tests CI**
```bash
# Push et observer CI
git add .
git commit -m "test(e2e): stabiliser sélecteurs avec data-testid"
git push

# Observer pr-validation.yml
# Vérifier e2e-smoke et e2e-matrix passent
```

---

## 📊 Métriques de Succès

### Avant Refactoring
- ✅ Sélecteurs robustes : ~40%
- ⚠️ Sélecteurs fragiles : ~60%
- 🔴 Tests flaky : ~15%

### Après Refactoring (Objectif)
- ✅ Sélecteurs robustes : ~90%
- ⚠️ Sélecteurs fragiles : ~10%
- 🔴 Tests flaky : < 5%

### KPIs à Mesurer
- [ ] Taux de succès E2E : > 95%
- [ ] Temps d'exécution : < 25min (matrix 5 navigateurs)
- [ ] Stabilité : 3 runs consécutifs 100% passent

---

## 🎯 Checklist Semaine 1

### Jour 1-2 : Ajouter data-testid
- [ ] Boutons d'action (CreateConversation, Send, Submit)
- [ ] Inputs (Message, PollTitle, PollDescription)
- [ ] Cards/Items (PollType, Conversation, Poll)
- [ ] Navigation (Home, Create, Dashboard)
- [ ] Modals (Confirm, Alert)
- [ ] Forms (PollForm, LoginForm)

### Jour 3-5 : Refactorer specs
- [ ] `performance.spec.ts`
- [ ] `security-isolation.spec.ts`
- [ ] `edge-cases.spec.ts`
- [ ] `guest-workflow.spec.ts`
- [ ] `authenticated-workflow.spec.ts`
- [ ] `navigation-regression.spec.ts`
- [ ] `form-poll-regression.spec.ts`
- [ ] `mobile-voting.spec.ts`
- [ ] `poll-actions.spec.ts`
- [ ] `ultra-simple.spec.ts` (ajustements mineurs)

### Jour 6 : Validation
- [ ] Tests locaux (10 specs)
- [ ] Tests CI (smoke + matrix)
- [ ] Documentation mise à jour
- [ ] Commit final

---

## 📝 Template data-testid

### Convention de Nommage

```typescript
// Format : [composant]-[action/état]
data-testid="create-conversation-button"
data-testid="message-input"
data-testid="poll-item"
data-testid="confirm-modal"

// Avec ID dynamique
data-testid="poll-item"
data-poll-id={pollId}

// Avec état
data-testid="submit-button"
data-disabled={isDisabled}
```

### Exemples par Type

**Boutons** :
- `create-conversation-button`
- `send-message-button`
- `submit-poll-button`
- `delete-poll-button`
- `copy-link-button`

**Inputs** :
- `message-input`
- `poll-title-input`
- `poll-description-input`
- `email-input`

**Cards/Items** :
- `poll-type-date`
- `poll-type-form`
- `conversation-item`
- `poll-item`

**Sections** :
- `calendar-section`
- `time-slots-section`
- `results-section`
- `dashboard-section`

**Navigation** :
- `nav-home`
- `nav-create`
- `nav-dashboard`
- `nav-settings`

---

## 🚀 Prochaines Étapes

Après Semaine 1 :
- ✅ Sélecteurs stabilisés
- ✅ 10 specs refactorés
- ✅ Tests locaux passent

**Semaine 2** : Tests manuels nightly (3x)  
**Semaine 3** : Activation progressive schedule

---

**Document créé le** : 29 octobre 2025  
**Audit réalisé par** : Cascade AI  
**Status** : 🟡 EN COURS - Semaine 1 démarrée
