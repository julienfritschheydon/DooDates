# Helpers de Chat Génériques pour Tests E2E

Ce document décrit les helpers de chat améliorés qui fonctionnent pour tous les types de polls (date, form, quizz, availability).

## 🎯 Objectif

Éviter la duplication de code dans les tests E2E en fournissant des helpers génériques qui détectent automatiquement le type de poll et adaptent leur comportement.

## 📁 Fichiers

- `tests/e2e/helpers/chat-helpers.ts` - Helpers principaux
- `tests/e2e/examples/generic-chat-helpers-examples.spec.ts` - Exemples d'utilisation

## 🔧 Nouvelles Fonctions

### 1. `detectPollType(page: Page)`

Détecte automatiquement le type de poll en fonction de l'URL et du contenu.

**Stratégies de détection :**

1. Via l'URL (`/form-polls/`, `/date-polls/`, etc.)
2. Via les éléments DOM (`[data-testid="calendar"]`, `[data-testid="question-card"]`)
3. Via les placeholders du chat
4. Default vers `default`

```typescript
const pollType = await detectPollType(page);
console.log(`Type détecté: ${pollType}`); // 'form' | 'date' | 'quizz' | 'availability' | 'default'
```

### 2. `findChatZone(page: Page)`

Trouve la zone chat principale avec une stratégie robuste à 5 niveaux :

1. **Input principal** : `[data-testid="chat-input"]`
2. **Conteneurs** : `[data-testid="gemini-chat"]`, `[data-testid="chat-interface"]`
3. **Textareas spécifiques** : `textarea[placeholder*="IA"]`, etc.
4. **Zone preview** : `[data-poll-preview]`, `[data-testid="poll-preview"]`
5. **Dernier recours** : Premier textarea/input éditable

```typescript
const chatZone = await findChatZone(page);
// Retourne un locator Playwright utilisable
```

### 3. `validateChatState(page, expectedState, options?)`

Valide l'état du chat (prêt, chargement, désactivé, caché).

**États possibles :**

- `'ready'` : Visible et activé
- `'loading'` : Visible mais désactivé + indicateur de chargement
- `'disabled'` : Désactivé
- `'hidden'` : Caché

```typescript
await validateChatState(page, "ready", { timeout: 10000 });
await validateChatState(page, "loading", { timeout: 5000 });
```

### 4. `navigateToWorkspaceAuto(page, browserName, options?)`

Navigation avec détection automatique du type de poll.

```typescript
const detectedType = await navigateToWorkspaceAuto(page, browserName, {
  addE2EFlag: true,
  waitForChat: true,
  forceType: "form", // Optionnel: forcer un type
});
```

### 5. `sendChatMessage(page, message, options?)` (Amélioré)

Envoie un message avec détection automatique de la zone chat.

```typescript
await sendChatMessage(page, "Crée un sondage", {
  useAutoDetection: true, // true par défaut
  waitForResponse: true,
  timeout: 15000,
});
```

### 6. `waitForAIResponse(page, options?)` (Amélioré)

Attend une réponse IA avec patterns spécifiques au type de poll.

**Patterns par type :**

- **Form** : "Voici votre questionnaire/formulaire"
- **Quizz** : "Voici votre quiz/quizz"
- **Availability** : "Voici vos disponibilités/créneaux"
- **Date** : "Voici votre sondage"

```typescript
await waitForAIResponse(page, {
  pollType: "form", // Optionnel: détecté automatiquement
  timeout: 30000,
});
```

### 7. `verifyChatFunctionality(page, options?)`

Vérification complète du chat (détection + validation + test).

```typescript
const verification = await verifyChatFunctionality(page, {
  testMessage: "Test de fonctionnement",
  pollType: "form", // Optionnel
  timeout: 15000,
});

if (!verification.isFunctional) {
  throw new Error(`Chat non fonctionnel: ${verification.error}`);
}

console.log(`Type: ${verification.pollType}`);
console.log(`Zone: ${verification.chatZone}`);
```

## 📝 Exemples d'Utilisation

### Test Générique (fonctionne pour tous les types)

```typescript
test("Test générique de chat", async ({ page, browserName }) => {
  // 1. Navigation auto
  const pollType = await navigateToWorkspaceAuto(page, browserName);

  // 2. Vérification complète
  const verification = await verifyChatFunctionality(page);
  expect(verification.isFunctional).toBe(true);

  // 3. Interaction
  await sendChatMessage(page, "Crée un sondage de test", {
    useAutoDetection: true,
  });

  // 4. Attente réponse
  await waitForAIResponse(page, { pollType });
});
```

### Test Multi-Types avec la même logique

```typescript
const testCases = [
  { type: "date", message: "Organise une réunion demain" },
  { type: "form", message: "Crée un formulaire de feedback" },
  { type: "quizz", message: "Crée un quiz React" },
  { type: "availability", message: "Disponibilités cette semaine ?" },
];

for (const testCase of testCases) {
  await navigateToWorkspaceAuto(page, browserName, {
    forceType: testCase.type,
  });

  await verifyChatFunctionality(page, {
    testMessage: testCase.message,
  });

  await waitForAIResponse(page, { pollType: testCase.type });
}
```

## 🔄 Migration depuis les anciens helpers

### Avant (spécifique à chaque type)

```typescript
// Date polls
await navigateToDateWorkspace(page, browserName);
await waitForChatInput(page);
const chatInput = page.locator('[data-testid="chat-input"]');
await chatInput.fill("Organise une réunion");

// Form polls
await navigateToFormWorkspace(page, browserName);
await waitForChatInput(page);
const chatInput = page.locator('[data-testid="chat-input"]');
await chatInput.fill("Crée un formulaire");
```

### Après (générique)

```typescript
// Fonctionne pour tous les types
await navigateToWorkspaceAuto(page, browserName);
await sendChatMessage(page, "Organise une réunion", { useAutoDetection: true });
```

## 🎯 Avantages

1. **Moins de code** : Une fonction pour tous les types
2. **Robustesse** : Fallbacks multiples pour la détection
3. **Maintenance** : Un seul fichier à maintenir
4. **Flexibilité** : Options pour forcer un type si nécessaire
5. **Compréhension** : Code plus lisible et intentionnel

## 🔍 Debug et Logging

Les helpers incluent du logging détaillé pour faciliter le debug :

```typescript
console.log("🔍 Auto-detected poll type: form");
console.log("✅ Chat zone found");
console.log("✅ Chat state validated: ready");
console.log("✅ Test message sent successfully");
```

## ⚠️ Notes Importantes

1. **TypeScript** : Utiliser `type WorkspaceType` pour les types
2. **Fallbacks** : Les helpers ont des fallbacks robustes
3. **Timeouts** : Configurables selon les besoins
4. **Compatibilité** : Les anciens helpers sont toujours disponibles (deprecated)

## 🧪 Tests

Voir `tests/e2e/examples/generic-chat-helpers-examples.spec.ts` pour des exemples complets d'utilisation.

```bash
npx playwright test tests/e2e/examples/generic-chat-helpers-examples.spec.ts
```
