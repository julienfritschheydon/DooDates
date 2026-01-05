# Migration DooDates → Bonvot - Plan Complet

**Date de création:** 10 Novembre 2025  
**Priorité:** 🔥 CRITIQUE - À faire AVANT beta publique  
**Durée estimée:** 2-3 jours  
**Responsable:** Équipe technique

---

## 📋 Table des Matières

1. [Contexte](#contexte)
2. [Statistiques de Migration](#statistiques)
3. [Plan de Migration par Phases](#plan-de-migration)
4. [Migration des Données Utilisateurs](#migration-données)
5. [Checklist Complète](#checklist)
6. [Tests de Validation](#tests)
7. [Rollback Plan](#rollback)

---

## 🎯 Contexte

### Pourquoi "Bonvot" ?

**Analyse stratégique complète (voir brief de création):**

- **Néologisme réussi:** Combine "Bon" (positif français) + "Vot" (évocation "Vote")
- **Double sens pertinent:** Association "Bon Vote" = fonction produit (sondages/formulaires)
- **Prononciation:** Excellente - court, simple, international
- **Disponibilité:** Nom de domaine + juridique (néologisme = distinctif)
- **Sans connotations négatives:** Validé sur plusieurs langues

### Décision Stratégique

**Modèle "Glocal":** Nom global unique (Bonvot) pour cohérence de marque et économies d'échelle.

---

## 📊 Statistiques de Migration

- **2302 occurrences** de "doodates" (insensible à la casse)
- **306 fichiers** impactés
- **Catégories principales:**
  - Configuration & identité (5 fichiers critiques)
  - Code source (50+ fichiers)
  - Tests (42 fichiers)
  - Documentation (135 fichiers)
  - Assets & resources (10+ fichiers)

---

## 🚀 Plan de Migration par Phases

### Phase 0: Préparation (2h)

#### Backup & Sécurité

- [ ] Créer branche dédiée: `feature/rebrand-bonvot`
- [ ] Backup complet du projet (ZIP + Git tag `v0-doodates-final`)
- [ ] Créer backup Supabase (export SQL complet)
- [ ] Documenter état actuel (screenshot dashboard, liste features)

#### Assets Visuels

- [ ] Créer logo Bonvot: `logo-bonvot.svg`
- [ ] Générer favicon Bonvot (plusieurs tailles)
- [ ] Préparer assets PWA (192x192, 512x512)
- [ ] Créer mockups pour tests (avant/après)

---

### Phase 1: Configuration & Identité (3h)

**Priorité:** CRITIQUE - Ces fichiers définissent l'identité publique

#### 1.1 `package.json`

```json
{
  "name": "bonvot", // au lieu de "vite_react_shadcn_ts"
  "description": "Bonvot - Modern AI scheduling and surveys"
  // ... reste du fichier
}
```

#### 1.2 `index.html` (20+ occurrences)

**Ligne 6:** Titre

```html
<title>Bonvot - Assistant IA pour Planification Collaborative</title>
```

**Lignes 7-8:** Meta description & author

```html
<meta
  name="description"
  content="Bonvot - Modern AI scheduling, no subscriptions. L'assistant IA révolutionnaire pour planifier vos rendez-vous collaboratifs."
/>
<meta name="author" content="Bonvot" />
```

**Lignes 15-16:** Favicon

```html
<link rel="icon" type="image/svg+xml" href="/Bonvot/logo-bonvot.svg" />
<link rel="apple-touch-icon" href="/Bonvot/logo-bonvot.svg" />
```

**Lignes 18-26:** Open Graph & Twitter

```html
<meta property="og:title" content="Bonvot - Assistant IA Planification" />
<meta
  property="og:description"
  content="Modern AI scheduling, no subscriptions. Planifiez vos rendez-vous avec l'IA conversationnelle."
/>
<meta property="og:image" content="https://julienfritschheydon.github.io/Bonvot/logo-bonvot.svg" />
<meta property="og:url" content="https://julienfritschheydon.github.io/Bonvot/" />

<meta name="twitter:site" content="@bonvot" />
<meta name="twitter:image" content="https://julienfritschheydon.github.io/Bonvot/logo-bonvot.svg" />
```

**Lignes 33, 40-41, 43, 49, 54, 60, 65, 72, 76, 84, 87, 114:** PWA Manifest

```javascript
// Remplacer toutes les occurrences de "DooDates" par "Bonvot" dans le manifest dynamique
const baseUrl = path.includes("/Bonvot") ? "/Bonvot/" : "/";

const manifest = {
  name: "Bonvot - Assistant IA Planification",
  short_name: "Bonvot",
  description: "Modern AI scheduling, no subscriptions. L'assistant IA révolutionnaire...",
  // ... (voir ligne 54, 60, 65, 72, 76, 84, 87)
};
```

```html
<meta name="apple-mobile-web-app-title" content="Bonvot" />
```

#### 1.3 `README.md`

**Ligne 1:** Titre principal

```markdown
# Bonvot 🗓️
```

**Ligne 10:** Overview

```markdown
Bonvot revolutionizes event scheduling through:
```

**Ligne 18:** Différenciation

```markdown
Bonvot se distingue par son **interface conversationnelle IA**...
```

**Remplacer toutes les autres occurrences** (environ 50 dans le fichier)

#### 1.4 `vite.config.ts`

**Base URL GitHub Pages:**

```typescript
export default defineConfig({
  base: process.env.NODE_ENV === "production" ? "/Bonvot/" : "/",
  // ... reste du fichier
});
```

#### 1.5 Repository GitHub

**Actions à faire sur github.com:**

1. Aller dans Settings → Repository name
2. Renommer: `DooDates` → `Bonvot`
3. URL devient: `https://github.com/julienfritschheydon/Bonvot`
4. GitHub Pages URL devient: `https://julienfritschheydon.github.io/Bonvot/`

⚠️ **Impact:** Tous les liens existants vers l'ancien repo seront redirigés automatiquement par GitHub (redirection 301)

---

### Phase 2: Migration Données Utilisateurs (4h) ⚠️ CRITIQUE

**Objectif:** Préserver les données des utilisateurs existants lors du changement des clés localStorage

#### 2.1 Script de Migration Automatique

**Créer:** `src/lib/migration/migrateDooDatesToBonvot.ts`

```typescript
/**
 * Migration automatique DooDates → Bonvot
 * Exécuté une seule fois au chargement de l'app
 */

const MIGRATION_KEY = "bonvot_migration_completed";
const OLD_PREFIX = "doodates";
const NEW_PREFIX = "bonvot";

const KEYS_TO_MIGRATE = [
  "conversations",
  "messages",
  "tags",
  "folders",
  "ai_quota",
  "quota_consumed",
  "quota_journal",
  "-error-logs", // Notez le tiret au lieu du underscore
];

export function migrateDooDatesToBonvot(): void {
  // Vérifier si migration déjà effectuée
  if (localStorage.getItem(MIGRATION_KEY)) {
    console.log("✅ Migration DooDates → Bonvot déjà effectuée");
    return;
  }

  console.log("🔄 Début migration DooDates → Bonvot...");
  let migratedCount = 0;

  try {
    KEYS_TO_MIGRATE.forEach((keySuffix) => {
      const oldKey = `${OLD_PREFIX}_${keySuffix}`;
      const newKey = `${NEW_PREFIX}_${keySuffix}`;

      const data = localStorage.getItem(oldKey);

      if (data) {
        // Copier vers nouvelle clé
        localStorage.setItem(newKey, data);
        migratedCount++;
        console.log(`  ✓ Migré: ${oldKey} → ${newKey}`);
      }
    });

    // Marquer migration comme complétée
    localStorage.setItem(MIGRATION_KEY, new Date().toISOString());

    console.log(`✅ Migration terminée: ${migratedCount} clés migrées`);
    console.log('ℹ️  Les anciennes clés "doodates_*" sont conservées pour rollback');
  } catch (error) {
    console.error("❌ Erreur lors de la migration:", error);
    // Ne pas bloquer l'app en cas d'erreur
  }
}

/**
 * Fonction de nettoyage (à exécuter manuellement après 30 jours)
 */
export function cleanupOldDooDatesKeys(): void {
  KEYS_TO_MIGRATE.forEach((keySuffix) => {
    const oldKey = `${OLD_PREFIX}_${keySuffix}`;
    localStorage.removeItem(oldKey);
  });
  console.log("🗑️ Anciennes clés DooDates supprimées");
}
```

#### 2.2 Intégration dans App

**Modifier:** `src/main.tsx`

```typescript
import { migrateDooDatesToBonvot } from './lib/migration/migrateDooDatesToBonvot';

// Exécuter migration AVANT le rendu de l'app
migrateDooDatesToBonvot();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
```

#### 2.3 Mise à Jour des Clés dans le Code

**Fichiers à modifier avec nouvelles clés:**

**`src/lib/logger.ts`** (lignes 211, 219, 228, 241)

```typescript
const STORAGE_KEY = "bonvot-error-logs"; // au lieu de 'doodates-error-logs'
```

**`tests/e2e/dashboard-complete.spec.ts`** (lignes 43, 52, 95, 543)

```typescript
localStorage.setItem("bonvot_tags", JSON.stringify(tags));
localStorage.setItem("bonvot_folders", JSON.stringify(folders));
localStorage.setItem("bonvot_conversations", JSON.stringify(conversations));
```

**Rechercher et remplacer dans tout le codebase:**

- `doodates_conversations` → `bonvot_conversations`
- `doodates_messages` → `bonvot_messages`
- `doodates_tags` → `bonvot_tags`
- `doodates_folders` → `bonvot_folders`
- `doodates_ai_quota` → `bonvot_ai_quota`
- `doodates_quota_consumed` → `bonvot_quota_consumed`
- `doodates_quota_journal` → `bonvot_quota_journal`
- `doodates-error-logs` → `bonvot-error-logs`

#### 2.4 Stratégie de Transition (30 jours)

**Jours 1-30:** Période de grace

- Anciennes clés `doodates_*` conservées en localStorage
- Nouvelles clés `bonvot_*` utilisées par l'app
- Permet rollback manuel si besoin

**Après 30 jours:** Nettoyage (optionnel)

- Exécuter `cleanupOldDooDatesKeys()` dans console développeur
- Ou laisser les anciennes clés (impact négligeable <50KB)

---

### Phase 3: Code Source - Classes & Types (2h)

#### 3.1 `src/lib/error-handling.ts` (19 occurrences)

**Ligne 37:** Classe principale

```typescript
export class BonvotError extends Error {
  // ... reste de la classe
}
```

**Ligne 52:** Nom de la classe

```typescript
this.name = "BonvotError";
```

**Ligne 64:** Signature fonction

```typescript
export function logError(error: Error | BonvotError, context: ErrorContext = {}): void {
```

**Ligne 71, 80:** Vérifications d'instance

```typescript
...(error instanceof BonvotError && {
  // ...
})

console.error("🚨 Bonvot Error:", errorInfo);
```

**Lignes 97-157:** Toutes les signatures de retour

```typescript
): BonvotError {
  let processedError: BonvotError;

  if (error instanceof BonvotError) {
    // ...
  } else {
    processedError = new BonvotError(
      // ...
    );
  }
  // ... (répété ~10 fois)
}
```

#### 3.2 `src/types/conversation.d.ts` (10 occurrences)

**Ligne 147:** Import

```typescript
import { BonvotError, ErrorSeverity, ErrorCategory, ErrorContext } from "../lib/error-handling";
```

**Ligne 148:** Classe héritée

```typescript
export declare class ConversationError extends BonvotError {
```

**Lignes 169-175:** Signatures de retour

```typescript
quotaExceeded: (maxConversations: number) => BonvotError;
notFound: (conversationId: string) => BonvotError;
invalidRole: (role: string) => BonvotError;
storageFull: () => BonvotError;
migrationFailed: (reason: string) => BonvotError;
syncConflict: (conversationId: string) => BonvotError;
corruptedData: (details: string) => BonvotError;
```

#### 3.3 Autres fichiers TypeScript

**Rechercher dans tous les `.ts` et `.tsx`:**

```bash
# Commande pour trouver toutes les occurrences
grep -r "DooDatesError" src/
```

**Remplacer partout:** `DooDatesError` → `BonvotError`

---

### Phase 4: Prompts IA & Identité (1h)

#### 4.1 `src/lib/gemini.ts` (4 occurrences)

**Ligne 811:** Prompt Temporal Parsing

```typescript
return `Tu es l'IA Bonvot, expert en planification temporelle avec techniques Counterfactual-Consistency.
```

**Ligne 1031:** Prompt Poll Creation

```typescript
return `Tu es l'assistant IA de Bonvot, une application de création de sondages pour planifier des rendez-vous.
```

**Ligne 1063:** Prompt Form Conversion

```typescript
return `Tu es l'IA Bonvot, expert en conversion de questionnaires.
```

**Ligne 1138:** Prompt Questionnaire Creation

```typescript
return `Tu es l'IA Bonvot, expert en création de questionnaires et formulaires.
```

---

### Phase 5: Tests & CI/CD (3h)

#### 5.1 Tests d'Intégration

**`tests/integration/real-supabase.test.ts`** (lignes 18-19)

```typescript
const BASE_URL = process.env.BASE_URL || "https://julienfritschheydon.github.io/Bonvot";
const TEST_EMAIL = "test-integration@bonvot.com";
```

**`tests/integration/real-supabase-simplified.test.ts`** (lignes 18-19)

```typescript
const BASE_URL = process.env.BASE_URL || "https://julienfritschheydon.github.io/Bonvot";
const TEST_EMAIL = "test-integration@bonvot.com";
```

#### 5.2 Compte de Test Supabase

⚠️ **Action manuelle requise:**

1. Créer nouveau compte: `test-integration@bonvot.com`
2. Mettre à jour secrets GitHub Actions:
   - `SUPABASE_TEST_EMAIL` → `test-integration@bonvot.com`
   - `SUPABASE_TEST_PASSWORD` → (conserver le même ou générer nouveau)
3. Tester connexion manuellement
4. Supprimer ancien compte `test-integration@doodates.com` (après validation)

#### 5.3 Scripts de Validation

**`scripts/verify-integration-test-setup.ps1`** (ligne 148, 159)

```powershell
Write-Host "   Email attendu: test-integration@bonvot.com" -ForegroundColor Gray
# ...
Write-Host "   1. Aller sur: https://github.com/julienfritschheydon/Bonvot/settings/secrets/actions" -ForegroundColor Gray
```

**`scripts/verify-integration-test-setup.sh`** (lignes similaires)

```bash
echo "   Email attendu: test-integration@bonvot.com"
# ...
echo "   1. Aller sur: https://github.com/julienfritschheydon/Bonvot/settings/secrets/actions"
```

#### 5.4 Workflows GitHub Actions

**Chercher dans `.github/workflows/*.yml`:**

- Toutes les URLs contenant `/DooDates/` → `/Bonvot/`
- Mentions de "DooDates" dans commentaires ou noms de jobs

---

### Phase 6: Documentation (4h)

**135 fichiers Markdown à mettre à jour**

#### 6.1 Documentation Prioritaire (2h)

**`Docs/README.md`**
**`Docs/0. Index-Documentation.md`**
**`Docs/1. Strategy.md`** (21 occurrences)
**`Docs/2. Planning.md`** (13 occurrences)
**`Docs/TESTS/TESTS-GUIDE.md`**
**`Docs/TESTS/DATA-TESTID-GUIDELINES.md`** (ligne 314)

#### 6.2 Documentation Utilisateur (1h)

**Tous les fichiers dans `Docs/USER-DOCUMENTATION/`:**

- 01-Guide-Demarrage-Rapide.md (13 occurrences)
- 02-Concepts-Base.md (8 occurrences)
- 03-Sondages-Dates.md (7 occurrences)
- 04-Formulaires-Questionnaires.md (6 occurrences)
- 05-Assistant-IA.md (10 occurrences)
- 06-Gestion-Resultats.md (3 occurrences)
- 07-Tableau-Bord.md (2 occurrences)
- 08-FAQ.md (20 occurrences)
- DOCUMENTATION_INTEGRATION-GUIDE.md (7 occurrences)

#### 6.3 Documentation Publique (1h)

**Tous les fichiers dans `public/docs/`:**

- Mêmes fichiers que USER-DOCUMENTATION (copie synchronisée)

#### 6.4 Script de Remplacement Automatique

```bash
# Script bash pour remplacer dans tous les fichiers markdown
find Docs/ public/docs/ -name "*.md" -type f -exec sed -i 's/DooDates/Bonvot/g' {} +
find Docs/ public/docs/ -name "*.md" -type f -exec sed -i 's/doodates/bonvot/g' {} +

# Vérifier le nombre de fichiers modifiés
git status --short | grep "\.md$" | wc -l
```

---

### Phase 7: Assets & Ressources (2h)

#### 7.1 Logo & Icônes

**Fichiers à créer:**

- `public/logo-bonvot.svg` (remplace `logo-doodates.svg`)
- `dist/logo-bonvot.svg`

**Fichiers à supprimer (après migration):**

- `public/logo-doodates.svg`
- `dist/logo-doodates.svg`

#### 7.2 Manifest PWA

**`public/manifest.json`**

```json
{
  "name": "Bonvot - Assistant IA Planification",
  "short_name": "Bonvot",
  "description": "Modern AI scheduling, no subscriptions...",
  "start_url": "/",
  "icons": [
    {
      "src": "/logo-bonvot.svg",
      "sizes": "any",
      "type": "image/svg+xml"
    }
  ]
}
```

#### 7.3 Service Worker

**`public/sw.js`** (4 occurrences)

```javascript
// Remplacer mentions de "DooDates" dans commentaires et logs
console.log("Bonvot Service Worker installed");
```

---

### Phase 8: SQL & Base de Données (1h)

#### 8.1 Scripts SQL

**22 fichiers dans `sql-scripts/`**

**Exemples:**

- `sql-scripts/README.md` (commentaires)
- `sql-scripts/00-INIT-DATABASE-COMPLETE.sql` (commentaires documentation)
- `sql-scripts/create-beta-keys-and-quotas.sql` (métadonnées)

**Action:** Remplacer mentions de "DooDates" dans les commentaires SQL

#### 8.2 Email de Test

**Dans Supabase Dashboard:**

1. Créer `test-integration@bonvot.com`
2. Générer mot de passe fort
3. Tester auth manuellement
4. Mettre à jour secrets GitHub (voir Phase 5.2)

---

### Phase 9: Configuration Déploiement (1h)

#### 9.1 Netlify

**`netlify.toml`**

```toml
[build]
  publish = "dist"
  command = "npm run build"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200

# Variables d'environnement
[context.production.environment]
  VITE_APP_NAME = "Bonvot"
```

#### 9.2 Variables d'Environnement

**Vérifier `.env.example` et `.env.local`:**

```bash
# Pas de changement nécessaire (clés Supabase/Gemini inchangées)
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
[DEPRECATED_KEY]=...
```

---

## ✅ Checklist Complète

### Avant de Commencer

- [ ] Créer branche `feature/rebrand-bonvot`
- [ ] Backup complet (ZIP + Git tag)
- [ ] Backup Supabase (export SQL)
- [ ] Créer logo `logo-bonvot.svg`
- [ ] Informer équipe + beta testeurs (si déjà lancés)

### Configuration & Identité

- [ ] `package.json` - Nom du package
- [ ] `index.html` - 20+ occurrences (titre, meta, favicon, PWA)
- [ ] `README.md` - Toutes les mentions
- [ ] `vite.config.ts` - Base URL
- [ ] **Repository GitHub - Renommer `DooDates` → `Bonvot`**

### Migration Données Utilisateurs ⚠️

- [ ] Créer `src/lib/migration/migrateDooDatesToBonvot.ts`
- [ ] Intégrer dans `src/main.tsx`
- [ ] Mettre à jour toutes les clés localStorage (8 clés)
- [ ] Tester migration avec données réelles
- [ ] Vérifier aucune perte de données

### Code Source

- [ ] `src/lib/error-handling.ts` - `DooDatesError` → `BonvotError` (19×)
- [ ] `src/types/conversation.d.ts` - Types (10×)
- [ ] Rechercher `DooDatesError` dans tous les `.ts/.tsx`
- [ ] `src/lib/logger.ts` - Clé storage (4×)

### Prompts IA

- [ ] `src/lib/gemini.ts` - 4 prompts système

### Tests & CI/CD

- [ ] `tests/integration/real-supabase.test.ts` - URL + email
- [ ] `tests/integration/real-supabase-simplified.test.ts` - URL + email
- [ ] `tests/e2e/dashboard-complete.spec.ts` - localStorage (4×)
- [ ] Créer compte Supabase `test-integration@bonvot.com`
- [ ] Mettre à jour secrets GitHub Actions
- [ ] `scripts/verify-integration-test-setup.ps1`
- [ ] `scripts/verify-integration-test-setup.sh`
- [ ] Workflows `.github/workflows/*.yml` - URLs

### Documentation

- [ ] `Docs/README.md`
- [ ] `Docs/0. Index-Documentation.md`
- [ ] `Docs/1. Strategy.md` (21×)
- [ ] `Docs/2. Planning.md` (13×)
- [ ] `Docs/TESTS/` - Tous les fichiers
- [ ] `Docs/USER-DOCUMENTATION/` - 9 fichiers
- [ ] `public/docs/` - 19 fichiers (synchronisé)
- [ ] Script remplacement automatique

### Assets

- [ ] Créer `public/logo-bonvot.svg`
- [ ] Créer `dist/logo-bonvot.svg`
- [ ] `public/manifest.json`
- [ ] `public/sw.js`
- [ ] Supprimer anciens logos (après validation)

### Base de Données

- [ ] Scripts SQL `sql-scripts/` - Commentaires (22 fichiers)
- [ ] Compte test Supabase

### Déploiement

- [ ] `netlify.toml`
- [ ] Vérifier variables d'environnement
- [ ] Configuration GitHub Pages

---

## 🧪 Tests de Validation

### Tests Manuels Post-Migration

#### 1. Test Migration LocalStorage (CRITIQUE)

```javascript
// Dans console navigateur AVANT migration:
localStorage.setItem("doodates_conversations", '[{"id":"test"}]');
localStorage.setItem("doodates_tags", '["tag1"]');

// Recharger page (migration automatique)

// Vérifier APRÈS migration:
console.log(localStorage.getItem("bonvot_conversations")); // doit afficher '[{"id":"test"}]'
console.log(localStorage.getItem("bonvot_tags")); // doit afficher '["tag1"]'
console.log(localStorage.getItem("doodates_conversations")); // doit toujours exister (backup)
```

**Résultat attendu:** Données copiées, anciennes clés conservées

#### 2. Test Utilisateur Existant

1. Créer compte avec données (conversations, polls, tags)
2. Déployer version Bonvot
3. Se reconnecter avec même compte
4. Vérifier toutes les données présentes

**Résultat attendu:** Aucune perte de données

#### 3. Test Nouvel Utilisateur

1. Mode navigation privée
2. Créer conversation + poll
3. Vérifier clés utilisées = `bonvot_*` (pas `doodates_*`)

**Résultat attendu:** Nouvelles clés utilisées directement

#### 4. Test GitHub Pages

1. Accéder `https://julienfritschheydon.github.io/Bonvot/`
2. Vérifier titre = "Bonvot"
3. Vérifier favicon = logo Bonvot
4. Vérifier fonctionnalités (créer conversation, poll, voter)

**Résultat attendu:** Site accessible et fonctionnel

#### 5. Test Ancien Lien (Redirection)

1. Accéder `https://julienfritschheydon.github.io/DooDates/`
2. Vérifier redirection automatique → `/Bonvot/`

**Résultat attendu:** Redirection 301 (GitHub automatique)

### Tests Automatisés

#### Test Suite Complète

```bash
# Tests unitaires
npm run test:unit

# Tests E2E
npm run test:e2e

# Tests intégration
npm run test:integration
```

**Résultat attendu:** 100% des tests passent (même score qu'avant)

#### Test CI/CD

```bash
# Push branche et vérifier GitHub Actions
git push origin feature/rebrand-bonvot

# Vérifier dans Actions:
# - Tests unitaires ✅
# - Tests E2E ✅
# - Tests intégration ✅
# - Build production ✅
```

---

## 🔄 Rollback Plan

### En Cas de Problème Critique

#### Option 1: Rollback Git (< 1h après déploiement)

```bash
# Revenir au tag avant migration
git reset --hard v0-doodates-final
git push --force origin main

# Redéployer GitHub Pages
npm run build
npm run deploy
```

#### Option 2: Rollback LocalStorage (pour utilisateurs)

```javascript
// Script à exécuter dans console si perte de données
const KEYS = [
  "conversations",
  "messages",
  "tags",
  "folders",
  "ai_quota",
  "quota_consumed",
  "quota_journal",
];

KEYS.forEach((key) => {
  const oldData = localStorage.getItem(`doodates_${key}`);
  if (oldData) {
    localStorage.setItem(`bonvot_${key}`, oldData);
    console.log(`Restauré: ${key}`);
  }
});
```

#### Option 3: Rollback Partiel

- Garder nom "Bonvot" en frontend (branding)
- Revenir aux clés `doodates_*` en localStorage (technique)
- Modifier uniquement `migrateDooDatesToBonvot.ts`

---

## 📊 Métriques de Succès

### Critères de Validation

- ✅ 0 perte de données utilisateurs
- ✅ Tous les tests passent (100%)
- ✅ Site accessible sur nouvelle URL
- ✅ Aucune erreur console critique
- ✅ Performance identique (< 5% variation)

### Monitoring Post-Migration (7 jours)

- [ ] Suivre taux d'erreur Sentry
- [ ] Vérifier analytics (pas de chute trafic)
- [ ] Recueillir feedback utilisateurs
- [ ] Vérifier logs migration localStorage

---

## ⏱️ Planning & Estimation

### Timeline Recommandée

**Jour 1 (6h):**

- Phase 0: Préparation (2h)
- Phase 1: Configuration & Identité (3h)
- Phase 2: Migration Données (début, 1h)

**Jour 2 (7h):**

- Phase 2: Migration Données (suite, 3h)
- Phase 3: Code Source (2h)
- Phase 4: Prompts IA (1h)
- Phase 5: Tests (début, 1h)

**Jour 3 (7h):**

- Phase 5: Tests (suite, 2h)
- Phase 6: Documentation (4h)
- Phase 7: Assets (1h)

**Jour 4 (2h):**

- Phase 8: SQL (1h)
- Phase 9: Déploiement (1h)
- Tests validation finale

**Total:** 22h réparties sur 4 jours

### Jalons Critiques

- [x] Document de migration créé
- [ ] Branche créée + backup complet
- [ ] Logo Bonvot créé
- [ ] Phase 1-2 complétées (identité + migration données)
- [ ] Tests passent à 100%
- [ ] Déploiement beta interne (testeurs privilégiés)
- [ ] Monitoring 48h sans erreurs critiques
- [ ] Déploiement beta publique

---

## 🚨 Risques & Mitigation

### Risque 1: Perte de Données Utilisateurs

**Impact:** CRITIQUE  
**Probabilité:** FAIBLE  
**Mitigation:**

- Script migration avec conservation anciennes clés
- Tests extensifs avant déploiement
- Backup Supabase
- Rollback plan documenté

### Risque 2: Liens Cassés

**Impact:** MOYEN  
**Probabilité:** FAIBLE  
**Mitigation:**

- GitHub redirige automatiquement ancien repo
- Tester tous les liens importants
- Mettre à jour liens externes (docs, social media)

### Risque 3: Tests CI/CD Échouent

**Impact:** MOYEN  
**Probabilité:** MOYEN  
**Mitigation:**

- Compte test Supabase créé AVANT migration
- Secrets GitHub Actions mis à jour
- Tests locaux avant push

### Risque 4: Confusion Utilisateurs Beta

**Impact:** FAIBLE  
**Probabilité:** MOYEN  
**Mitigation:**

- Email notification 48h avant
- Message in-app expliquant changement
- FAQ "Pourquoi Bonvot ?"

---

## 📞 Communication

### Email Beta Testeurs (48h avant)

**Sujet:** DooDates devient Bonvot 🎉

**Corps:**

```
Bonjour [Prénom],

Nous sommes ravis de vous annoncer que DooDates devient **Bonvot** !

**Pourquoi ce changement ?**
- Nom plus international et mémorable
- Évocation directe du "vote" (fonction principale)
- Identité de marque plus forte

**Qu'est-ce qui change pour vous ?**
✅ Vos données sont conservées (conversations, sondages, paramètres)
✅ Votre compte reste actif
✅ Les fonctionnalités restent identiques
✅ L'URL devient: https://julienfritschheydon.github.io/Bonvot/

**Quand ?**
Migration prévue le [DATE] à [HEURE]. Le site sera accessible sans interruption.

**Questions ?**
N'hésitez pas à nous contacter: [EMAIL]

Merci pour votre soutien ! 🙏

L'équipe Bonvot
```

### Message In-App

**Modal au premier login post-migration:**

```
🎉 DooDates est maintenant Bonvot !

Nouveau nom, mêmes fonctionnalités que vous aimez.
Toutes vos données sont conservées.

[En savoir plus] [OK, compris!]
```

---

## 📝 Notes Finales

### Après la Migration

**Nettoyage (J+30):**

- [ ] Supprimer anciennes clés localStorage (optionnel)
- [ ] Supprimer ancien compte test `test-integration@doodates.com`
- [ ] Archiver anciens logos
- [ ] Mettre à jour liens externes (social media, docs partagées)

**Suivi Long Terme:**

- [ ] Acheter domaine `bonvot.com`, `bonvot.io`, `bonvot.app`
- [ ] Configurer redirections DNS
- [ ] Enregistrer marque auprès INPI/EUIPO/USPTO

---

**Document créé le:** 10 Novembre 2025  
**Dernière mise à jour:** 10 Novembre 2025  
**Version:** 1.0  
**Statut:** 🟡 EN ATTENTE VALIDATION
