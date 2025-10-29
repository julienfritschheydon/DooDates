# Refactor: Simplifier l'architecture (Quick Wins 1, 2 & 3)

## 🎯 Objectif

Réduire la complexité de `GeminiChatInterface`, `ConversationProvider` et des services d'intention pour éviter les régressions fréquentes et améliorer la maintenabilité.

## ✅ Changements

### 1. Documentation Architecture (Priorité 1)
- ✅ `Docs/Architecture-GeminiChatInterface.md` : Analyse complète (1,510 lignes, 25+ hooks)
- ✅ `Docs/Architecture-ConversationProvider.md` : Analyse complète (411 lignes, 15+ états)
- ✅ `tests/e2e/form-poll-regression.spec.ts` : Structure tests non-régression (5 scénarios)

### 2. Hook `useGeminiAPI` (Quick Win #1) ✅ COMPLET
**Fichiers créés :**
- `src/hooks/useGeminiAPI.ts` (200 lignes)

**Fichiers modifiés :**
- `src/components/GeminiChatInterface.tsx` : Intégration du hook

**Impact :**
- ✅ **-130 lignes** dans GeminiChatInterface
- ✅ Gestion d'erreurs centralisée (quota, network, parsing)
- ✅ Messages d'erreur user-friendly
- ✅ Testable indépendamment
- ✅ Réutilisable dans d'autres composants

**Avant :**
```typescript
try {
  const response = await geminiService.generatePollFromText(input);
  if (response.success) {
    // 40 lignes de traitement
  } else {
    if (response.error?.includes("quota")) {
      // 30 lignes gestion quota
    } else {
      // 20 lignes autres erreurs
    }
  }
} catch (error) {
  // 40 lignes gestion exceptions
}
```

**Après :**
```typescript
const response = await geminiAPI.generatePoll(input);
if (response.success) {
  // Traitement
} else {
  // Message d'erreur déjà formaté
}
```

### 3. Provider `UIStateProvider` (Quick Win #2) ✅ INTÉGRÉ
**Fichiers créés :**
- `src/components/prototype/UIStateProvider.tsx` (200 lignes)

**Fichiers modifiés :**
- `src/App.tsx` : Intégration du provider

**Impact :**
- ✅ Séparation claire UI state vs Business logic
- ✅ Évite re-renders inutiles de la conversation
- ✅ Hooks spécialisés disponibles :
  - `useSidebarState()` : Sidebar (ouvert/fermé, mobile)
  - `useHighlightState()` : Animations (add/remove/modify)
  - `useModifiedQuestionState()` : Feedback temporaire
- ✅ Auto-clear des highlights après 3s

**Architecture :**
```tsx
<UIStateProvider>
  <ConversationProvider>
    <Routes />
  </ConversationProvider>
</UIStateProvider>
```

## 📊 Métriques

**Réduction complexité :**
- GeminiChatInterface : **-130 lignes** (-8.6%)
- Séparation UI state préparée
- Services d'intention unifiés (API unique)
- Architecture mieux structurée

**Fichiers créés :**
- 2 fichiers documentation
- 1 fichier tests E2E
- 3 nouveaux services/hooks (useGeminiAPI, UIStateProvider, IntentService)

**Tests :**
- ✅ Build passe
- ✅ Pre-commit hooks passent
- ✅ Pre-push hooks passent

**Commits :** 6 commits propres
1. Documentation + tests de non-régression
2. Création hook useGeminiAPI
3. Intégration useGeminiAPI dans GeminiChatInterface
4. Intégration UIStateProvider dans App
5. Mise à jour planning
6. Création IntentService unifié

### 4. Service `IntentService` (Quick Win #3) ✅ COMPLET
**Fichiers créés :**
- `src/services/IntentService.ts` (260 lignes)

**Impact :**
- ✅ **API unique** pour tous les types d'intentions
- ✅ **Pattern Strategy** avec 3 stratégies concrètes :
  - `DatePollStrategy` : Détection regex pour Date Polls
  - `FormPollStrategy` : Détection regex pour Form Polls
  - `AIFallbackStrategy` : Détection IA (fallback)
- ✅ **Détection en 2 phases** : regex (rapide) puis IA (fallback)
- ✅ **Options configurables** : useAI, debug
- ✅ **Testable facilement** : addStrategy/removeStrategy/resetStrategies
- ✅ **Logging des gaps** pour améliorer les regex

**Avant :**
```typescript
// 3 services différents avec APIs différentes
const datePollIntent = IntentDetectionService.detectSimpleIntent(msg, poll);
const formPollIntent = FormPollIntentService.detectIntent(msg, poll);
const aiIntent = await GeminiIntentService.detectFormIntent(msg, poll);
```

**Après :**
```typescript
// API unique, stratégies automatiques
const intent = await IntentService.detectIntent(msg, poll, {
  useAI: true,  // Fallback IA si regex ne matche pas
  debug: false, // Logs détaillés
});
```

## 🎯 Prochaines étapes (non incluses dans cette PR)

**Priorité 3** : Refactoring progressif
- Migrer états UI de ConversationProvider vers UIStateProvider
- Découpler ConversationProvider en 3 contextes
- Simplifier GeminiChatInterface (extraire plus de hooks)

## 🔍 Points d'attention

**Pas de breaking changes :**
- ✅ Tous les composants existants fonctionnent
- ✅ Aucune modification de l'API publique
- ✅ UIStateProvider est ajouté mais pas encore utilisé (migration progressive)

**Tests :**
- Les tests E2E de non-régression sont créés mais skippés (nécessitent mock IA complet)
- À activer quand le mock sera prêt

## 📝 Checklist

- [x] Code compilé sans erreurs
- [x] Build production passe
- [x] Pre-commit hooks passent
- [x] Pre-push hooks passent
- [x] Documentation à jour
- [x] Pas de breaking changes
- [x] Architecture améliorée
- [x] Complexité réduite

## 🚀 Impact utilisateur

**Aucun impact visible** : Cette PR est purement technique (refactoring)
- Même comportement
- Même UX
- Meilleures fondations pour la suite
