# 📊 Rapport de Monitoring des Workflows GitHub Actions

**Dernière mise à jour:** 19/11/2025 19:25:03

_Workflow run #413 (ID 19512072795) — génération UTC 2025-11-19T18:25:03.133Z_

> Ce rapport est généré automatiquement pour suivre les échecs de workflows.
> Il peut être consulté par l'IA pour comprendre l'état de santé du CI/CD.

---

## 1️⃣ PR Complete Validation

**Statut:** ⏳ unknown

**Dernier run:** 19/11/2025 19:23:32

**Statistiques:**
- ❌ Échecs (24h): **19**
- ❌ Échecs (7 jours): **19**
- 📊 Total runs analysés: **20**

### 🔴 Échecs récents (24h)

#### Run #20 - 19/11/2025 19:17:21

- **Commit:** `1d0e92a`
- **Auteur:** julienfritschheydon
- **Branche:** `test/ci-validation-fix`
- **Lien:** [Voir les détails](https://github.com/julienfritschheydon/DooDates/actions/runs/19511883082)
- **Jobs en échec:**
  - ❌ `production-smoke` (failure)
    - Steps en échec: `🔥 Run production smoke tests`
    - **Erreurs détectées (1):**
      ```
File: packageResolve (node:internal/modules/esm/resolve:873
Error: Error [ERR_MODULE_NOT_FOUND]: Cannot find package '@playwright/test' imported from /home/runner/work/DooDates/DooDates/playwright.config.ts

Error [ERR_MODULE_NOT_FOUND]: Cannot find package '@playwright/test' imported from /home/runner/work/DooDates/DooDates/playwright.config.ts
at packageResolve (node:internal/modules/esm/resolve:873:9)
##[error]Process completed with exit code 1.

```

#### Run #19 - 19/11/2025 19:11:08

- **Commit:** `4a349db`
- **Auteur:** julienfritschheydon
- **Branche:** `feature/use-gemini-api-tests`
- **Lien:** [Voir les détails](https://github.com/julienfritschheydon/DooDates/actions/runs/19511704311)
- **Jobs en échec:**
  - ❌ `production-smoke` (failure)
    - Steps en échec: `🔥 Run production smoke tests`

#### Run #18 - 19/11/2025 19:07:52

- **Commit:** `c13c0e7`
- **Auteur:** julienfritschheydon
- **Branche:** `feature/use-gemini-api-tests`
- **Lien:** [Voir les détails](https://github.com/julienfritschheydon/DooDates/actions/runs/19511606435)
- **Jobs en échec:**
  - ❌ `production-smoke` (failure)
    - Steps en échec: `🔥 Run production smoke tests`

#### Run #17 - 19/11/2025 19:06:18

- **Commit:** `f88abff`
- **Auteur:** julienfritschheydon
- **Branche:** `feature/use-gemini-api-tests`
- **Lien:** [Voir les détails](https://github.com/julienfritschheydon/DooDates/actions/runs/19511558128)
- **Jobs en échec:**
  - ❌ `production-smoke` (failure)
    - Steps en échec: `🔧 Install dependencies`

#### Run #16 - 19/11/2025 18:41:23

- **Commit:** `8dfa631`
- **Auteur:** julienfritschheydon
- **Branche:** `feature/improve-gemini-chat-tests`
- **Lien:** [Voir les détails](https://github.com/julienfritschheydon/DooDates/actions/runs/19510855483)
- **Jobs en échec:**
  - ❌ `production-smoke` (failure)
    - Steps en échec: `📦 Build production (avec base path local pour tests)`

---

## 2️⃣ Develop → Main (Auto-merge)

**Statut:** ✅ success

**Dernier run:** 19/11/2025 16:50:39

**Statistiques:**
- ❌ Échecs (24h): **6**
- ❌ Échecs (7 jours): **10**
- 📊 Total runs analysés: **20**

### 🔴 Échecs récents (24h)

#### Run #180 - 19/11/2025 13:22:18

- **Commit:** `f74c239`
- **Auteur:** julienfritschheydon
- **Branche:** `develop`
- **Lien:** [Voir les détails](https://github.com/julienfritschheydon/DooDates/actions/runs/19501135363)
- **Jobs en échec:**
  - ❌ `tests-unit` (failure)
    - Steps en échec: `🧪 Tests unitaires`
    - **Erreurs détectées (10):**
      ```
File: src/lib/error-handling.ts:141
Error: 🚨 DooDates Error: {

🚨 DooDates Error: {
name: 'DooDatesError',
stack: 'DooDatesError: Erreur synchronisation Supabase (non-bloquant)\n' +
'    at Object.storage (/home/runner/work/DooDates/DooDates/src/lib/error-handling.ts:141:5)\n' +
```
      ```
File: src/lib/services/__tests__/titleGeneration.useAutoSave.test.ts:54
Error: originalError: Error: Supabase not available in tests

originalError: Error: Supabase not available in tests
at /home/runner/work/DooDates/DooDates/src/lib/services/__tests__/titleGeneration.useAutoSave.test.ts:54:49
🚨 DooDates Error: {
name: 'DooDatesError',
stack: 'DooDatesError: Erreur synchronisation Supabase (non-bloquant)\n' +
'    at Object.storage (/home/runner/work/DooDates/DooDates/src/lib/error-handling.ts:141:5)\n' +
```
      ```
File: src/hooks/useAutoSave.ts:203
Error: originalError: TypeError: Cannot read properties of undefined (reading 'id')

originalError: TypeError: Cannot read properties of undefined (reading 'id')
at /home/runner/work/DooDates/DooDates/src/hooks/useAutoSave.ts:203:38,
🚨 DooDates Error: {
name: 'DooDatesError',
stack: 'DooDatesError: Erreur synchronisation Supabase (non-bloquant)\n' +
'    at Object.storage (/home/runner/work/DooDates/DooDates/src/lib/error-handling.ts:141:5)\n' +
```
      ```
File: src/hooks/useAutoSave.ts:203
Error: originalError: TypeError: Cannot read properties of undefined (reading 'id')

originalError: TypeError: Cannot read properties of undefined (reading 'id')
at /home/runner/work/DooDates/DooDates/src/hooks/useAutoSave.ts:203:38,
🚨 DooDates Error: {
name: 'DooDatesError',
stack: 'DooDatesError: Erreur synchronisation Supabase (non-bloquant)\n' +
'    at Object.storage (/home/runner/work/DooDates/DooDates/src/lib/error-handling.ts:141:5)\n' +
```
      ```
File: src/hooks/useAutoSave.ts:203
Error: originalError: TypeError: Cannot read properties of undefined (reading 'id')

originalError: TypeError: Cannot read properties of undefined (reading 'id')
at /home/runner/work/DooDates/DooDates/src/hooks/useAutoSave.ts:203:38,
🚨 DooDates Error: {
name: 'DooDatesError',
stack: 'DooDatesError: Erreur synchronisation Supabase (non-bloquant)\n' +
'    at Object.storage (/home/runner/work/DooDates/DooDates/src/lib/error-handling.ts:141:5)\n' +
```
      *... et 5 autre(s) erreur(s)*
  - ❌ `tests-e2e` (failure)
    - Steps en échec: `Tests E2E Smoke (develop: fast validation)`
    - **Erreurs détectées (10):**
      ```
Error: "errors": [],

"errors": [],
"title": "e2e/console-errors.spec.ts",
"file": "e2e/console-errors.spec.ts",
"title": "Console Errors & React Warnings",
"file": "e2e/console-errors.spec.ts",
```
      ```
File: src/App.tsx:449
Error: "error": {

"error": {
"message": "Error: Erreurs console trouvées:\n[vite] Internal Server Error\nFailed to resolve import \"./calendarConflictDetection\" from \"src/services/PollCreatorService.ts\". Does the file exist?\n    at TransformPluginContext._formatLog (file:///home/runner/work/DooDates/DooDates/node_modules/vite/dist/node/chunks/dep-D4NMHUTW.js:42528:41)\n    at TransformPluginContext.error (file:///home/runner/work/DooDates/DooDates/node_modules/vite/dist/node/chunks/dep-D4NMHUTW.js:42525:16)\n    at normalizeUrl (file:///home/runner/work/DooDates/DooDates/node_modules/vite/dist/node/chunks/dep-D4NMHUTW.js:40504:23)\n    at async file:///home/runner/work/DooDates/DooDates/node_modules/vite/dist/node/chunks/dep-D4NMHUTW.js:40623:37\n    at async Promise.all (index 1)\n    at async Transfor
... (truncated)
```
      ```
Error: "message": "Error: Erreurs console trouvées:\n[vite] Internal Server Error\nFailed to resolve import \"./calendarConflictDetection\" from \"src/services/PollCreatorService.ts\". Does the file exist?\n    at TransformPluginContext._formatLog (file:///home/runner/work/DooDates/DooDates/node_modules/vite/dist/node/chunks/dep-D4NMHUTW.js:42528:41)\n    at TransformPluginContext.error (file:///home/runner/work/DooDates/DooDates/node_modules/vite/dist/node/chunks/dep-D4NMHUTW.js:42525:16)\n    at normalizeUrl (file:///home/runner/work/DooDates/DooDates/node_modules/vite/dist/node/chunks/dep-D4NMHUTW.js:40504:23)\n    at async file:///home/runner/work/DooDates/DooDates/node_modules/vite/dist/node/chunks/dep-D4NMHUTW.js:40623:37\n    at async Promise.all (index 1)\n    at async TransformPluginContext.transform (file:///home/runner/work/DooDates/DooDates/node_modules/vite/dist/node/chunks/dep-D4NMHUTW.js:40550:7)\n    at async EnvironmentPluginContainer.transform (file:///home/runner/work/DooDates/DooDates/node_modules/vite/dist/node/chunks/dep-D4NMHUTW.js:42323:18)\n    at async loadAndTransform (file:///home/runner/work/DooDates/DooDates/node_modules/vite/dist/node/chunks/dep-D4NMHUTW.js:35739:27)\nFailed to load resource: the server responded with a status of 500 (Internal Server Error)\nFailed to fetch dynamically imported module: http://localhost:8080/src/app/workspace/page.tsx\nFailed to fetch dynamically imported module: http://localhost:8080/src/app/workspace/page.tsx\nThe above error occurred in one of your React components:\n\n    at Lazy\n    at RenderedRoute (http://localhost:8080/node_modules/.vite/deps/react-router-dom.js?v=bf704773:4069:5)\n    at Routes (http://localhost:8080/node_modules/.vite/deps/react-router-dom.js?v=bf704773:4508:5)\n    at ConversationProvider (http://localhost:8080/src/components/prototype/ConversationProvider.tsx:38:44)\n    at EditorStateProvider (http://localhost:8080/src/components/prototype/EditorStateProvider.tsx:45:39)\n    at ConversationStateProvider (http://localhost:8080/src/components/prototype/ConversationStateProvider.tsx:38:45)\n    at UIStateProvider (http://localhost:8080/src/components/prototype/UIStateProvider.tsx:44:39)\n    at OnboardingProvider (http://localhost:8080/src/contexts/OnboardingContext.tsx:26:38)\n    at Suspense\n    at ErrorBoundary (http://localhost:8080/src/components/ErrorBoundary.tsx:113:9)\n    at main\n    at div\n    at Layout (http://localhost:8080/src/App.tsx:380:19)\n    at Router (http://localhost:8080/node_modules/.vite/deps/react-router-dom.js?v=bf704773:4451:15)\n    at BrowserRouter (http://localhost:8080/node_modules/.vite/deps/react-router-dom.js?v=bf704773:5196:5)\n    at Provider (http://localhost:8080/node_modules/.vite/deps/chunk-NHESLBBD.js?v=af6b013f:41:15)\n    at TooltipProvider (http://localhost:8080/node_modules/.vite/deps/@radix-ui_react-tooltip.js?v=147e1eb2:57:5)\n    at AuthProvider (http://localhost:8080/src/contexts/AuthContext.tsx:54:32)\n    at QueryClientProvider (http://localhost:8080/node_modules/.vite/deps/@tanstack_react-query.js?v=bf704773:2794:3)\n    at ErrorBoundary (http://localhost:8080/src/components/ErrorBoundary.tsx:113:9)\n    at App (http://localhost:8080/src/App.tsx:449:11)\n    at O (http://localhost:8080/node_modules/.vite/deps/next-themes.js?v=65a16e8c:23:25)\n    at z (http://localhost:8080/node_modules/.vite/deps/next-themes.js?v=65a16e8c:21:18)\n\nReact will try to recreate this component tree from scratch using the error boundary you provided, ErrorBoundary.\n❌ ℹ️ React ErrorBoundary caught error {error: Failed to fetch dynamically imported module: http://localhost:8080/src/app/workspace/page.tsx, stack: TypeError: Failed to fetch dynamically imported mo… http://localhost:8080/src/app/workspace/page.tsx, componentStack: \n    at Lazy\n    at RenderedRoute (http://localhos…dules/.vite/deps/next-themes.js?v=65a16e8c:21:18)}\n\n\u001bexpect(\u001b\u001b[31mreceived\u001b\u001b).\u001btoHaveLength\u001b(\u001b\u001b[32mexpected\u001b\u001b)\u001b\n\nExpected length: \u001b[32m0\u001b\nReceived length: \u001b[31m6\u001b\nReceived array:  \u001b[31m[\"[vite] Internal Server Error\u001b\n\u001b[31mFailed to resolve import \\\"./calendarConflictDetection\\\" from \\\"src/services/PollCreatorService.ts\\\". Does the file exist?\u001b\n\u001b[31m    at TransformPluginContext._formatLog (file:///home/runner/work/DooDates/DooDates/node_modules/vite/dist/node/chunks/dep-D4NMHUTW.js:42528:41)\u001b\n\u001b[31m    at TransformPluginContext.error (file:///home/runner/work/DooDates/DooDates/node_modules/vite/dist/node/chunks/dep-D4NMHUTW.js:42525:16)\u001b\n\u001b[31m    at normalizeUrl (file:///home/runner/work/DooDates/DooDates/node_modules/vite/dist/node/chunks/dep-D4NMHUTW.js:40504:23)\u001b\n\u001b[31m    at async file:///home/runner/work/DooDates/DooDates/node_modules/vite/dist/node/chunks/dep-D4NMHUTW.js:40623:37\u001b\n\u001b[31m    at async Promise.all (index 1)\u001b\n\u001b[31m    at async TransformPluginContext.transform (file:///home/runner/work/DooDates/DooDates/node_modules/vite/dist/node/chunks/dep-D4NMHUTW.js:40550:7)\u001b\n\u001b[31m    at async EnvironmentPluginContainer.transform (file:///home/runner/work/DooDates/DooDates/node_modules/vite/dist/node/chunks/dep-D4NMHUTW.js:42323:18)\u001b\n\u001b[31m    at async loadAndTransform (file:///home/runner/work/DooDates/DooDates/node_modules/vite/dist/node/chunks/dep-D4NMHUTW.js:35739:27)\", \"Failed to load resource: the server responded with a status of 500 (Internal Server Error)\", \"Failed to fetch dynamically imported module: http://localhost:8080/src/app/workspace/page.tsx\", \"Failed to fetch dynamically imported module: http://localhost:8080/src/app/workspace/page.tsx\", \"The above error occurred in one of your React components:·\u001b\n\u001b[31m    at Lazy\u001b\n\u001b[31m    at RenderedRoute (http://localhost:8080/node_modules/.vite/deps/react-router-dom.js?v=bf704773:4069:5)\u001b\n\u001b[31m    at Routes (http://localhost:8080/node_modules/.vite/deps/react-router-dom.js?v=bf704773:4508:5)\u001b\n\u001b[31m    at ConversationProvider (http://localhost:8080/src/components/prototype/ConversationProvider.tsx:38:44)\u001b\n\u001b[31m    at EditorStateProvider (http://localhost:8080/src/components/prototype/EditorStateProvider.tsx:45:39)\u001b\n\u001b[31m    at ConversationStateProvider (http://localhost:8080/src/components/prototype/ConversationStateProvider.tsx:38:45)\u001b\n\u001b[31m    at UIStateProvider (http://localhost:8080/src/components/prototype/UIStateProvider.tsx:44:39)\u001b\n\u001b[31m    at OnboardingProvider (http://localhost:8080/src/contexts/OnboardingContext.tsx:26:38)\u001b\n\u001b[31m    at Suspense\u001b\n\u001b[31m    at ErrorBoundary (http://localhost:8080/src/components/ErrorBoundary.tsx:113:9)\u001b\n\u001b[31m    at main\u001b\n\u001b[31m    at div\u001b\n\u001b[31m    at Layout (http://localhost:8080/src/App.tsx:380:19)\u001b\n\u001b[31m    at Router (http://localhost:8080/node_modules/.vite/deps/react-router-dom.js?v=bf704773:4451:15)\u001b\n\u001b[31m    at BrowserRouter (http://localhost:8080/node_modules/.vite/deps/react-router-dom.js?v=bf704773:5196:5)\u001b\n\u001b[31m    at Provider (http://localhost:8080/node_modules/.vite/deps/chunk-NHESLBBD.js?v=af6b013f:41:15)\u001b\n\u001b[31m    at TooltipProvider (http://localhost:8080/node_modules/.vite/deps/@radix-ui_react-tooltip.js?v=147e1eb2:57:5)\u001b\n\u001b[31m    at AuthProvider (http://localhost:8080/src/contexts/AuthContext.tsx:54:32)\u001b\n\u001b[31m    at QueryClientProvider (http://localhost:8080/node_modules/.vite/deps/@tanstack_react-query.js?v=bf704773:2794:3)\u001b\n\u001b[31m    at ErrorBoundary (http://localhost:8080/src/components/ErrorBoundary.tsx:113:9)\u001b\n\u001b[31m    at App (http://localhost:8080/src/App.tsx:449:11)\u001b\n\u001b[31m    at O (http://localhost:8080/node_modules/.vite/deps/next-themes.js?v=65a16e8c:23:25)\u001b\n\u001b[31m    at z (http://localhost:8080/node_modules/.vite/deps/next-themes.js?v=65a16e8c:21:18)·\u001b\n\u001b[31mReact will try to recreate this component tree from scratch using the error boundary you provided, ErrorBoundary.\", \"❌ ℹ️ React ErrorBoundary caught error {error: Failed to fetch dynamically imported module: http://localhost:8080/src/app/workspace/page.tsx, stack: TypeError: Failed to fetch dynamically imported mo… http://localhost:8080/src/app/workspace/page.tsx, componentStack:·\u001b\n\u001b[31m    at Lazy\u001b\n\u001b[31m    at RenderedRoute (http://localhos…dules/.vite/deps/next-themes.js?v=65a16e8c:21:18)}\"]\u001b\n    at TransformPluginContext._formatLog (/home/runner/work/DooDates/DooDates/node_modules/vite/dist/node/chunks/dep-D4NMHUTW.js:42528:41)\n    at TransformPluginContext.error (/home/runner/work/DooDates/DooDates/node_modules/vite/dist/node/chunks/dep-D4NMHUTW.js:42525:16)\n    at normalizeUrl (/home/runner/work/DooDates/DooDates/node_modules/vite/dist/node/chunks/dep-D4NMHUTW.js:40504:23)\n    at async file:///home/runner/work/DooDates/DooDates/node_modules/vite/dist/node/chunks/dep-D4NMHUTW.js:40623:37\n    at async TransformPluginContext.transform (/home/runner/work/DooDates/DooDates/node_modules/vite/dist/node/chunks/dep-D4NMHUTW.js:40550:7)\n    at async EnvironmentPluginContainer.transform (/home/runner/work/DooDates/DooDates/node_modules/vite/dist/node/chunks/dep-D4NMHUTW.js:42323:18)\n    at async loadAndTransform (/home/runner/work/DooDates/DooDates/node_modules/vite/dist/node/chunks/dep-D4NMHUTW.js:35739:27)\n    at RenderedRoute (http://localhost:8080/node_modules/.vite/deps/react-router-dom.js?v=bf704773:4069:5)\n    at Routes (http://localhost:8080/node_modules/.vite/deps/react-router-dom.js?v=bf704773:4508:5)\n    at ConversationProvider (http://localhost:8080/src/components/prototype/ConversationProvider.tsx:38:44)\n    at EditorStateProvider (http://localhost:8080/src/components/prototype/EditorStateProvider.tsx:45:39)\n    at ConversationStateProvider (http://localhost:8080/src/components/prototype/ConversationStateProvider.tsx:38:45)\n    at UIStateProvider (http://localhost:8080/src/components/prototype/UIStateProvider.tsx:44:39)\n    at OnboardingProvider (http://localhost:8080/src/contexts/OnboardingContext.tsx:26:38)\n    at ErrorBoundary (http://localhost:8080/src/components/ErrorBoundary.tsx:113:9)\n    at Layout (http://localhost:8080/src/App.tsx:380:19)\n    at Router (http://localhost:8080/node_modules/.vite/deps/react-router-dom.js?v=bf704773:4451:15)\n    at BrowserRouter (http://localhost:8080/node_modules/.vite/deps/react-router-dom.js?v=bf704773:5196:5)\n    at Provider (http://localhost:8080/node_modules/.vite/deps/chunk-NHESLBBD.js?v=af6b013f:41:15)\n    at TooltipProvider (http://localhost:8080/node_modules/.vite/deps/@radix-ui_react-tooltip.js?v=147e1eb2:57:5)\n    at AuthProvider (http://localhost:8080/src/contexts/AuthContext.tsx:54:32)\n    at QueryClientProvider (http://localhost:8080/node_modules/.vite/deps/@tanstack_react-query.js?v=bf704773:2794:3)\n    at ErrorBoundary (http://localhost:8080/src/components/ErrorBoundary.tsx:113:9)\n    at App (http://localhost:8080/src/App.tsx:449:11)\n    at O (http://localhost:8080/node_modules/.vite/deps/next-themes.js?v=65a16e8c:23:25)\n    at z (http://localhost:8080/node_modules/.vite/deps/next-themes.js?v=65a16e8c:21:18)\n    at /home/runner/work/DooDates/DooDates/tests/e2e/console-errors.spec.ts:177:87"

"message": "Error: Erreurs console trouvées:\n[vite] Internal Server Error\nFailed to resolve import \"./calendarConflictDetection\" from \"src/services/PollCreatorService.ts\". Does the file exist?\n    at TransformPluginContext._formatLog (file:///home/runner/work/DooDates/DooDates/node_modules/vite/dist/node/chunks/dep-D4NMHUTW.js:42528:41)\n    at TransformPluginContext.error (file:///home/runner/work/DooDates/DooDates/node_modules/vite/dist/node/chunks/dep-D4NMHUTW.js:42525:16)\n    at normalizeUrl (file:///home/runner/work/DooDates/DooDates/node_modules/vite/dist/node/chunks/dep-D4NMHUTW.js:40504:23)\n    at async file:///home/runner/work/DooDates/DooDates/node_modules/vite/dist/node/chunks/dep-D4NMHUTW.js:40623:37\n    at async Promise.all (index 1)\n    at async TransformPluginCont
... (truncated)
```
      ```
File: src/app/workspace/page.tsx, componentStack:·\u001b[39m\n\u001b[31m    at Lazy\u001b[39m\n\u001b[31m    at RenderedRoute (http://localhos…dules/.vite/deps/next-themes.js?v=65a16e8c:21:18)}\", \"[vite] Internal Server Error\u001b[39m\n\u001b[31mFailed to resolve import \\\"./calendarConflictDetection\\\" from \\\"src/services/PollCreatorService.ts\\\". Does the file exist?\u001b[39m\n\u001b[31m    at TransformPluginContext._formatLog (file:///home/runner/work/DooDates/DooDates/node_modules/vite/dist/node/chunks/dep-D4NMHUTW.js:42528:41)\u001b[39m\n\u001b[31m    at TransformPluginContext.error (file:///home/runner/work/DooDates/DooDates/node_modules/vite/dist/node/chunks/dep-D4NMHUTW.js:42525:16)\u001b[39m\n\u001b[31m    at normalizeUrl (file:///home/runner/work/DooDates/DooDates/node_modules/vite/dist/node/chunks/dep-D4NMHUTW.js:40504:23)\u001b[39m\n\u001b[31m    at async file:///home/runner/work/DooDates/DooDates/node_modules/vite/dist/node/chunks/dep-D4NMHUTW.js:40623:37\u001b[39m\n\u001b[31m    at async Promise.all (index 1)\u001b[39m\n\u001b[31m    at async TransformPluginContext.transform (file:///home/runner/work/DooDates/DooDates/node_modules/vite/dist/node/chunks/dep-D4NMHUTW.js:40550:7)\u001b[39m\n\u001b[31m    at async EnvironmentPluginContainer.transform (file:///home/runner/work/DooDates/DooDates/node_modules/vite/dist/node/chunks/dep-D4NMHUTW.js:42323:18)\u001b[39m\n\u001b[31m    at async loadAndTransform (file:///home/runner/work/DooDates/DooDates/node_modules/vite/dist/node/chunks/dep-D4NMHUTW.js:35739:27)\u001b[39m\n\u001b[31m    at async viteTransformMiddleware (file:///home/runner/work/DooDates/DooDates/node_modules/vite/dist/node/chunks/dep-D4NMHUTW.js:37254
Error: "errorLocation": {

"errorLocation": {
"error": {
"message": "Error: Erreurs console trouvées:\nFailed to load resource: the server responded with a status of 500 (Internal Server Error)\n[vite] Internal Server Error\nFailed to resolve import \"./calendarConflictDetection\" from \"src/services/PollCreatorService.ts\". Does the file exist?\n    at TransformPluginContext._formatLog (file:///home/runner/work/DooDates/DooDates/node_modules/vite/dist/node/chunks/dep-D4NMHUTW.js:42528:41)\n    at TransformPluginContext.error (file:///home/runner/work/DooDates/DooDates/node_modules/vite/dist/node/chunks/dep-D4NMHUTW.js:42525:16)\n    at normalizeUrl (file:///home/runner/work/DooDates/DooDates/node_modules/vite/dist/node/chunks/dep-D4NMHUTW.js:40504:23)\n    at async file:///home/runner/work/DooDates/DooDates/node_mo
... (truncated)
```
      ```
File: tests/e2e/console-errors.spec.ts:177
Error: "errors": [

"errors": [
"message": "Error: Erreurs console trouvées:\nFailed to load resource: the server responded with a status of 500 (Internal Server Error)\n[vite] Internal Server Error\nFailed to resolve import \"./calendarConflictDetection\" from \"src/services/PollCreatorService.ts\". Does the file exist?\n    at TransformPluginContext._formatLog (file:///home/runner/work/DooDates/DooDates/node_modules/vite/dist/node/chunks/dep-D4NMHUTW.js:42528:41)\n    at TransformPluginContext.error (file:///home/runner/work/DooDates/DooDates/node_modules/vite/dist/node/chunks/dep-D4NMHUTW.js:42525:16)\n    at normalizeUrl (file:///home/runner/work/DooDates/DooDates/node_modules/vite/dist/node/chunks/dep-D4NMHUTW.js:40504:23)\n    at async file:///home/runner/work/DooDates/DooDates/node_modules/vite/dist/no
... (truncated)
```
      *... et 5 autre(s) erreur(s)*
  - ❌ `build-validation` (failure)
    - Steps en échec: `🏗️ Build production`
    - **Erreurs détectées (2):**
      ```
File: 2025-11-19T12:23:14.5152645Z     at getRollupError (file:///home/runner/work/DooDates/DooDates/node_modules/rollup/dist/es/shared/parseAst.js:401
Error: ✖ 17 problems (0 errors, 17 warnings)

✖ 17 problems (0 errors, 17 warnings)
error during build:
at getRollupError (file:///home/runner/work/DooDates/DooDates/node_modules/rollup/dist/es/shared/parseAst.js:401:41)
at error (file:///home/runner/work/DooDates/DooDates/node_modules/rollup/dist/es/shared/parseAst.js:397:42)
```
      ```
Error: ##[error]Process completed with exit code 1.

##[error]Process completed with exit code 1.

```

#### Run #177 - 19/11/2025 10:40:17

- **Commit:** `aa9be61`
- **Auteur:** julienfritschheydon
- **Branche:** `develop`
- **Lien:** [Voir les détails](https://github.com/julienfritschheydon/DooDates/actions/runs/19496743475)
- **Jobs en échec:**
  - ❌ `tests-unit` (failure)
    - Steps en échec: `🧪 Tests unitaires`

#### Run #176 - 19/11/2025 10:26:21

- **Commit:** `f3531a4`
- **Auteur:** julienfritschheydon
- **Branche:** `develop`
- **Lien:** [Voir les détails](https://github.com/julienfritschheydon/DooDates/actions/runs/19496347233)
- **Jobs en échec:**
  - ❌ `tests-e2e` (failure)
    - Steps en échec: `Tests E2E Smoke (develop: fast validation)`

#### Run #175 - 19/11/2025 10:03:01

- **Commit:** `01ad660`
- **Auteur:** julienfritschheydon
- **Branche:** `develop`
- **Lien:** [Voir les détails](https://github.com/julienfritschheydon/DooDates/actions/runs/19495686809)
- **Jobs en échec:**
  - ❌ `tests-e2e` (failure)
    - Steps en échec: `Tests E2E Smoke (develop: fast validation)`

#### Run #174 - 19/11/2025 09:50:46

- **Commit:** `56f9468`
- **Auteur:** julienfritschheydon
- **Branche:** `develop`
- **Lien:** [Voir les détails](https://github.com/julienfritschheydon/DooDates/actions/runs/19495352289)
- **Jobs en échec:**
  - ❌ `tests-unit` (failure)
    - Steps en échec: `🔗 Tests d'intégration`
  - ❌ `tests-e2e` (failure)
    - Steps en échec: `Tests E2E Smoke (develop: fast validation)`

---

## 3️⃣ Main Post-Merge E2E

**Statut:** ✅ success

**Dernier run:** 19/11/2025 16:54:31

**Statistiques:**
- ❌ Échecs (24h): **3**
- ❌ Échecs (7 jours): **13**
- 📊 Total runs analysés: **20**

### 🔴 Échecs récents (24h)

#### Run #84 - 19/11/2025 14:16:09

- **Commit:** `4564089`
- **Auteur:** julienfritschheydon
- **Branche:** `main`
- **Lien:** [Voir les détails](https://github.com/julienfritschheydon/DooDates/actions/runs/19502618446)
- **Jobs en échec:**
  - ❌ `⚡ E2E Functional Tests (2)` (failure)
    - Steps en échec: `⚡ Run Functional Tests (Shard 2/2)`
    - **Erreurs détectées (8):**
      ```
Error: "errors": [],

"errors": [],
"errors": [],
"errors": [],
"errors": [],
```
      ```
File: tests/e2e/ultra-simple-form.spec.ts:52
Error: "errors": [],

"errors": [],
"errors": [],
"errors": [],
"error": {
"message": "Error: Erreur lors de la création du formulaire : Désolé, je n'ai pas pu traiter votre demande. Pouvez-vous reformuler ou réessayer ?",
"stack": "Error: Erreur lors de la création du formulaire : Désolé, je n'ai pas pu traiter votre demande. Pouvez-vous reformuler ou réessayer ?\n    at createFormPollViaAI (/home/runner/work/DooDates/DooDates/tests/e2e/helpers/poll-form-helpers.ts:70:13)\n    at /home/runner/work/DooDates/DooDates/tests/e2e/ultra-simple-form.spec.ts:59:7\n    at withConsoleGuard (/home/runner/work/DooDates/DooDates/tests/e2e/utils.ts:63:12)\n    at /home/runner/work/DooDates/DooDates/tests/e2e/ultra-simple-form.spec.ts:52:5",
```
      ```
File: tests/e2e/ultra-simple-form.spec.ts:52
Error: "snippet": "   at helpers/poll-form-helpers.ts:70\n\n\u001b[0m \u001b 68 |\u001b     \u001b[36mif\u001b (hasError) {\n \u001b 69 |\u001b       \u001b[36mconst\u001b errorContent \u001b[33m=\u001b \u001b[36mawait\u001b errorText\u001b[33m.\u001btextContent()\u001b[33m;\u001b\n\u001b[31m\u001b[1m>\u001b\u001b\u001b 70 |\u001b       \u001b[36mthrow\u001b \u001b[36mnew\u001b \u001b[33mError\u001b(\u001b[32m`Erreur lors de la création du formulaire : ${errorContent}`\u001b)\u001b[33m;\u001b\n \u001b    |\u001b             \u001b[31m\u001b[1m^\u001b\u001b\n \u001b 71 |\u001b     }\n \u001b 72 |\u001b     \u001b[36mthrow\u001b error\u001b[33m;\u001b\n \u001b 73 |\u001b   }\u001b[0m"

"snippet": "   at helpers/poll-form-helpers.ts:70\n\n\u001b[0m \u001b 68 |\u001b     \u001b[36mif\u001b (hasError) {\n \u001b 69 |\u001b       \u001b[36mconst\u001b errorContent \u001b[33m=\u001b \u001b[36mawait\u001b errorText\u001b[33m.\u001btextContent()\u001b[33m;\u001b\n\u001b[31m\u001b[1m>\u001b\u001b\u001b 70 |\u001b       \u001b[36mthrow\u001b \u001b[36mnew\u001b \u001b[33mError\u001b(\u001b[32m`Erreur lors de la création du formulaire : ${errorContent}`\u001b)\u001b[33m;\u001b\n \u001b    |\u001b             \u001b[31m\u001b[1m^\u001b\u001b\n \u001b 71 |\u001b     }\n \u001b 72 |\u001b     \u001b[36mthrow\u001b error\u001b[33m;\u001b\n \u001b 73 |\u001b   }\u001b[0m"
"errors": [
"message": "Error: Erreur lors de la création du formulaire : Désolé, je n'ai pas pu traiter votre dema
... (truncated)
```
      ```
File: tests/e2e/ultra-simple-form.spec.ts:52
Error: "path": "/home/runner/work/DooDates/DooDates/test-results/ultra-simple-form-DooDates-0b3b5--dashboard-smoke-functional-chromium/error-context.md"

"path": "/home/runner/work/DooDates/DooDates/test-results/ultra-simple-form-DooDates-0b3b5--dashboard-smoke-functional-chromium/error-context.md"
"errorLocation": {
"error": {
"message": "Error: Erreur lors de la création du formulaire : Désolé, je n'ai pas pu traiter votre demande. Pouvez-vous reformuler ou réessayer ?",
"stack": "Error: Erreur lors de la création du formulaire : Désolé, je n'ai pas pu traiter votre demande. Pouvez-vous reformuler ou réessayer ?\n    at createFormPollViaAI (/home/runner/work/DooDates/DooDates/tests/e2e/helpers/poll-form-helpers.ts:70:13)\n    at /home/runner/work/DooDates/DooDates/tests/e2e/ultra-simple-form.spec.ts:59:7\n    at withConsoleGuard (/home/runner/work/DooDates/DooDates/tests/e2e/utils.ts:63:12)\n    at /home/runner/work/DooDates/DooDates/test
... (truncated)
```
      ```
File: tests/e2e/ultra-simple-form.spec.ts:52
Error: "snippet": "   at helpers/poll-form-helpers.ts:70\n\n\u001b[0m \u001b 68 |\u001b     \u001b[36mif\u001b (hasError) {\n \u001b 69 |\u001b       \u001b[36mconst\u001b errorContent \u001b[33m=\u001b \u001b[36mawait\u001b errorText\u001b[33m.\u001btextContent()\u001b[33m;\u001b\n\u001b[31m\u001b[1m>\u001b\u001b\u001b 70 |\u001b       \u001b[36mthrow\u001b \u001b[36mnew\u001b \u001b[33mError\u001b(\u001b[32m`Erreur lors de la création du formulaire : ${errorContent}`\u001b)\u001b[33m;\u001b\n \u001b    |\u001b             \u001b[31m\u001b[1m^\u001b\u001b\n \u001b 71 |\u001b     }\n \u001b 72 |\u001b     \u001b[36mthrow\u001b error\u001b[33m;\u001b\n \u001b 73 |\u001b   }\u001b[0m"

"snippet": "   at helpers/poll-form-helpers.ts:70\n\n\u001b[0m \u001b 68 |\u001b     \u001b[36mif\u001b (hasError) {\n \u001b 69 |\u001b       \u001b[36mconst\u001b errorContent \u001b[33m=\u001b \u001b[36mawait\u001b errorText\u001b[33m.\u001btextContent()\u001b[33m;\u001b\n\u001b[31m\u001b[1m>\u001b\u001b\u001b 70 |\u001b       \u001b[36mthrow\u001b \u001b[36mnew\u001b \u001b[33mError\u001b(\u001b[32m`Erreur lors de la création du formulaire : ${errorContent}`\u001b)\u001b[33m;\u001b\n \u001b    |\u001b             \u001b[31m\u001b[1m^\u001b\u001b\n \u001b 71 |\u001b     }\n \u001b 72 |\u001b     \u001b[36mthrow\u001b error\u001b[33m;\u001b\n \u001b 73 |\u001b   }\u001b[0m"
"errors": [
"message": "Error: Erreur lors de la création du formulaire : Désolé, je n'ai pas pu traiter votre dema
... (truncated)
```
      *... et 3 autre(s) erreur(s)*

#### Run #83 - 19/11/2025 11:44:22

- **Commit:** `6fa97e2`
- **Auteur:** julienfritschheydon
- **Branche:** `main`
- **Lien:** [Voir les détails](https://github.com/julienfritschheydon/DooDates/actions/runs/19498546715)
- **Jobs en échec:**
  - ❌ `⚡ E2E Functional Tests (2)` (failure)
    - Steps en échec: `⚡ Run Functional Tests (Shard 2/2)`

#### Run #82 - 19/11/2025 10:57:24

- **Commit:** `09b5ff9`
- **Auteur:** julienfritschheydon
- **Branche:** `main`
- **Lien:** [Voir les détails](https://github.com/julienfritschheydon/DooDates/actions/runs/19497203213)
- **Jobs en échec:**
  - ❌ `📋 Form Poll Regression - Suite Complète (Serial)` (failure)
    - Steps en échec: `📋 Run Form Poll Regression Suite (Serial - No Sharding)`
  - ❌ `⚡ E2E Functional Tests (2)` (failure)
    - Steps en échec: `⚡ Run Functional Tests (Shard 2/2)`
  - ❌ `📊 Analytics IA - Suite Complète (Serial)` (failure)
    - Steps en échec: `📊 Run Analytics IA Suite (Serial - No Sharding)`

---

## 📈 Résumé Global

- ❌ **Total échecs (24h):** 16
- ❌ **Total échecs (7 jours):** 17
- 📊 **Workflows monitorés:** 6

### ⚠️ Recommandations

Des échecs ont été détectés dans les 24 dernières heures. Consultez les sections ci-dessus pour plus de détails.

