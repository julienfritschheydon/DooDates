# 📋 Règles de Développement DooDates

## 🎯 Objectif
Maintenir un code propre, maintenable et sans warnings ESLint pour garantir la qualité et la performance de l'application.

---

## 🔧 Règle #1 : ZÉRO TOLÉRANCE AUX `any`

### ❌ À ne JAMAIS faire :
```typescript
// ❌ Interdit
const data: any = response.data;
function handler(event: any) { ... }
const settings = (poll.settings as any)?.resultsVisibility;
```

### ✅ TOUJOURS faire :
```typescript
// ✅ Préféré : Interface spécifique
interface ApiResponse {
  data: SpecificType;
}
const data: ApiResponse = response.data;

// ✅ Alternative : Type union
type EventHandler = (event: MouseEvent | KeyboardEvent) => void;

// ✅ Dernier recours : unknown avec vérification
const settings = (poll.settings as unknown as { resultsVisibility?: string })?.resultsVisibility;
```

### 🛡️ **Règle d'or** : `any` = dernier recours, jamais première option

---

## 🔧 Règle #2 : TYPAGE EXPLICITE DES FONCTIONS

### ❌ À ne JAMAIS faire :
```typescript
// ❌ Interdit
function process(data) { ... }
const handleClick = (e) => { ... }
```

### ✅ TOUJOURS faire :
```typescript
// ✅ Préféré
interface UserData {
  id: string;
  name: string;
}

function process(data: UserData): ProcessedData { ... }
const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => { ... }
```

### 📋 **Checklist** :
- [ ] Paramètres typés
- [ ] Type de retour explicite
- [ ] Types des callbacks/event handlers

---

## 🔧 Règle #3 : HOOKS REACT - DEPENDANCES COMPLÈTES

### ❌ À ne JAMAIS faire :
```typescript
// ❌ Interdit
useCallback(() => {
  // Utilise 'poll' mais pas dans les deps
}, [setClosureReason]);

useEffect(() => {
  // Utilise 'calculateUpcomingDeletions' mais pas dans les deps
}, []);
```

### ✅ TOUJOURS faire :
```typescript
// ✅ Préféré
useCallback(() => {
  // Utilise 'poll'
}, [poll, setClosureReason]);

const calculateUpcomingDeletions = useCallback(async (settings) => {
  // ...
}, [retentionService]);

useEffect(() => {
  calculateUpcomingDeletions(savedSettings);
}, [calculateUpcomingDeletions]);
```

### 🛡️ **Règle d'or** : Toute variable externe utilisée dans un hook doit être dans les dépendances

---

## 🔧 Règle #4 : GESTION DES ERREURS

### ❌ À ne JAMAIS faire :
```typescript
// ❌ Interdit
} catch (err: any) {
  console.error(err);
  throw err;
}
```

### ✅ TOUJOURS faire :
```typescript
// ✅ Préféré
} catch (error: unknown) {
  const errorMessage = error instanceof Error ? error.message : "Unknown error";
  logger.error("Operation failed", "context", { error: errorMessage });
  throw ErrorFactory.operationFailed("Operation failed", { originalError: error });
}
```

### 📋 **Checklist** :
- [ ] `catch (error: unknown)`
- [ ] Vérification `instanceof Error`
- [ ] Logging avec contexte
- [ ] Utilisation `ErrorFactory`

---

## 🔧 Règle #5 : IMPORTS ET TYPES

### ❌ À ne JAMAIS faire :
```typescript
// ❌ Interdit
import type { Poll } from "@/lib/pollsCore"; // Si non utilisé
import { something } from "./utils"; // Si non utilisé
```

### ✅ TOUJOURS faire :
```typescript
// ✅ Préféré
// Importer seulement ce qui est utilisé
import { getQuizzBySlugOrId, type Quizz } from "@/lib/quizz/quizz-service";

// Types au début, logique après
import type { Poll } from "@/lib/pollStorage";
import { useState, useEffect } from "react";
```

### 🛡️ **Règle d'or** : Importer uniquement ce qui est utilisé

---

## 🔧 Règle #6 : DÉCLARATION DES VARIABLES

### ❌ À ne JAMAIS faire :
```typescript
// ❌ Interdit
let data;
const settings = {};
```

### ✅ TOUJOURS faire :
```typescript
// ✅ Préféré
let data: UserData | null = null;
const settings: PollSettings = {
  resultsVisibility: "public",
  showLogo: true,
};
```

### 📋 **Checklist** :
- [ ] Toutes les variables ont un type
- [ ] `null` et `undefined` explicitement typés
- [ ] Objets avec interfaces ou types explicites

---

## 🔧 Règle #7 : COMPOSANTS REACT

### ❌ À ne JAMAIS faire :
```typescript
// ❌ Interdit
export default function Component({ data, onClick }) {
  // Props non typées
}
```

### ✅ TOUJOURS faire :
```typescript
// ✅ Préféré
interface ComponentProps {
  data: UserData;
  onClick: (id: string) => void;
}

export default function Component({ data, onClick }: ComponentProps) {
  // Props typées
}
```

### 📋 **Checklist** :
- [ ] Interface des props
- [ ] Props typées individuellement
- [ ] Props optionnelles avec `?`

---

## 🔧 Règle #8 : TS-COMMENTS

### ❌ À ne JAMAIS faire :
```typescript
// ❌ Interdit
// @ts-nocheck
// @ts-ignore
```

### ✅ TOUJOURS faire :
```typescript
// ✅ Préféré
// @ts-expect-error - Justification spécifique
const result = someUntypedFunction(); // @ts-expect-error - Legacy function, à migrer

// Ou mieux : créer le type manquant
interface LegacyResponse {
  data: unknown;
}
const result = someUntypedFunction() as LegacyResponse;
```

### 🛡️ **Règle d'or** : `@ts-expect-error` uniquement avec justification, jamais `@ts-nocheck`

---

## 🔧 Règle #9 : VALIDATION AVANT COMMIT

### 📋 **Checklist pré-commit** :
1. **Compiler** : `npm run type-check` ✅
2. **Linting** : `npm run lint` ✅ (0 warnings)
3. **Tests** : `npm run test:unit` ✅
4. **Build** : `npm run build` ✅

### 🚫 **INTERDICTION** : Jamais commettre si une de ces étapes échoue

---

## 🔧 Règle #10 : DOCUMENTATION

### ✅ TOUJOURS documenter :
- [ ] Interfaces complexes
- [ ] Fonctions avec logique métier
- [ ] Types personnalisés
- [ ] Raisons des `@ts-expect-error`

### 📝 **Exemple** :
```typescript
/**
 * Calcule les suppressions à venir selon les paramètres de rétention
 * @param settings - Paramètres de rétention utilisateur
 * @returns Liste des suppressions planifiées avec dates
 * @throws ErrorFactory - Si le service de rétention est indisponible
 */
async function calculateUpcomingDeletions(settings: RetentionSettings): Promise<DeletionWarning[]>
```

---

## 🎯 **RÈGLES D'OR RÉCAPITULATIVES**

1. **Jamais `any`** sans justification
2. **Toujours typer** les fonctions et variables
3. **Hooks** = dépendances complètes
4. **Erreurs** = `unknown` + `instanceof`
5. **Imports** = seulement ce qui est utilisé
6. **Props** = interfaces obligatoires
7. **`@ts-expect-error`** = avec justification
8. **Validation** = avant chaque commit
9. **Documentation** = code complexe
10. **Tests** = logique critique

---

## 🚨 **SANCTIONS AUTOMATIQUES**

### ⚠️ **CI/CD bloquera si** :
- Erreurs TypeScript
- Warnings ESLint > 30
- Tests en échec
- Build échoué

### 💡 **Prévention** :
- Configurer ESLint dans l'IDE
- Activer les suggestions TypeScript
- Utiliser les pre-commit hooks

---

## 📚 **Références**

- [TypeScript Best Practices](https://typescript-eslint.io/rules/)
- [React Hooks Rules](https://reactjs.org/docs/hooks-rules.html)
- [ESLint Configuration](https://eslint.org/docs/latest/user-guide/configuring/)

---

## 🔄 **Révision et Maintenance**

Cette documentation doit être :
- ✅ Revue trimestriellement
- ✅ Mis à jour avec nouvelles règles
- ✅ Partagée avec toute l'équipe
- ✅ Référencée dans les onboarding

**Dernière révision** : 30/12/2025  
**Auteur** : Équipe de développement DooDates
