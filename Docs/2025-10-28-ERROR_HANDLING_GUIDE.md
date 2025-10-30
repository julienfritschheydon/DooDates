# Guide - Error Handling Enforcement

## 🎯 Objectif

Garantir une gestion d'erreurs cohérente et centralisée dans tout le projet.

## ⚠️ Règle principale

**INTERDICTION d'utiliser `throw new Error()` directement**

❌ **Mauvais :**
```typescript
throw new Error("Something went wrong");
```

✅ **Bon :**
```typescript
import { ErrorFactory } from "@/lib/error-handling";

throw ErrorFactory.validation(
  "Something went wrong",
  "Message utilisateur convivial"
);
```

## 🛡️ Protections en place

### 1. Pre-commit Hook (LOCAL)
Le hook `.husky/pre-commit` vérifie automatiquement avant chaque commit :
```bash
npm run test:error-handling
```

**Si violation détectée :**
- ❌ Commit bloqué
- 💡 Message d'aide affiché
- 🔧 Tu dois corriger avant de commit

### 2. CI/CD (GITHUB)
Le workflow `.github/workflows/pr-validation.yml` vérifie sur chaque PR :
- Job "error-handling-enforcement"
- Bloque le merge si violations

### 3. Tests automatisés
Fichier : `tests/error-handling-enforcement.test.ts`
- Scanne tous les fichiers `.ts` et `.tsx`
- Détecte les `throw new Error` directs
- Ignore les fichiers de test et mocks

## 📚 ErrorFactory - Catégories disponibles

### `ErrorFactory.validation()`
Pour les erreurs de validation de données
```typescript
throw ErrorFactory.validation(
  "Invalid email format",
  "L'adresse email n'est pas valide"
);
```

### `ErrorFactory.network()`
Pour les erreurs réseau
```typescript
throw ErrorFactory.network(
  "Failed to fetch data",
  "Impossible de charger les données"
);
```

### `ErrorFactory.storage()`
Pour les erreurs de stockage (localStorage, DB)
```typescript
throw ErrorFactory.storage(
  "Failed to save poll",
  "Impossible de sauvegarder le sondage"
);
```

### `ErrorFactory.auth()`
Pour les erreurs d'authentification
```typescript
throw ErrorFactory.auth(
  "Invalid credentials",
  "Identifiants incorrects"
);
```

### `ErrorFactory.api()`
Pour les erreurs d'API externe
```typescript
throw ErrorFactory.api(
  "Gemini API error",
  "Le service IA est temporairement indisponible"
);
```

### `ErrorFactory.rateLimit()`
Pour les erreurs de limitation de taux
```typescript
throw ErrorFactory.rateLimit(
  "Too many requests",
  "Trop de tentatives, veuillez patienter"
);
```

### `ErrorFactory.critical()`
Pour les erreurs critiques système
```typescript
throw ErrorFactory.critical(
  "Database connection lost",
  "Une erreur critique s'est produite"
);
```

## 🔧 Comment corriger une violation

### Étape 1 : Identifier le fichier
Le test affiche le chemin exact :
```
components/prototype/UIStateProvider.tsx:170
```

### Étape 2 : Ajouter l'import
```typescript
import { ErrorFactory } from "@/lib/error-handling";
```

### Étape 3 : Remplacer throw new Error
```typescript
// Avant
throw new Error("useUIState must be used within UIStateProvider");

// Après
throw ErrorFactory.validation(
  "useUIState must be used within UIStateProvider",
  "Une erreur s'est produite lors de l'initialisation de l'interface"
);
```

### Étape 4 : Choisir la bonne catégorie
- Validation de contexte React → `validation`
- Erreur réseau → `network`
- Erreur de sauvegarde → `storage`
- etc.

## 🚀 Bypass temporaire (DÉCONSEILLÉ)

Si tu as vraiment besoin de bypass temporairement :

```bash
# Mode rapide (ignore error-handling)
FAST_HOOKS=1 git commit -m "WIP: temporary bypass"
```

⚠️ **Attention :** Le CI GitHub bloquera quand même le merge !

## 📖 Ressources

- Fichier source : `src/lib/error-handling.ts`
- Tests enforcement : `tests/error-handling-enforcement.test.ts`
- Pre-commit hook : `.husky/pre-commit`

## ❓ Questions fréquentes

### Pourquoi cette règle ?
- ✅ Messages d'erreur cohérents
- ✅ Logging centralisé
- ✅ Meilleure UX (messages utilisateur vs messages dev)
- ✅ Facilite le debugging

### Que faire pour les tests ?
Les fichiers de test sont automatiquement exclus :
- `**/*.test.ts`
- `**/*.test.tsx`
- `**/__tests__/**`
- `**/__mocks__/**`

Tu peux utiliser `throw new Error()` dans les tests sans problème.

### Et pour les libraries externes ?
Les `node_modules` sont exclus automatiquement.

---

**Dernière mise à jour :** 29/10/2025
