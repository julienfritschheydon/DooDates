# Tests d'Intégration Réels - Supabase

> **Tests sans mocks** pour détecter les problèmes d'intégration AVANT le déploiement

---

## 🎯 Objectif

Ces tests vérifient que le **vrai système Supabase** fonctionne correctement :
- Authentification
- CRUD Database
- Row Level Security (RLS)
- Permissions
- RPC Functions
- Performance

**0 mocks = détection des vrais problèmes**

---

## 🚀 Quick Start

### Prérequis

1. Compte de test créé : `test-integration@doodates.com`
2. `.env.local` configuré avec les secrets
3. Playwright installé : `npx playwright install chromium`

### Lancer les Tests

```bash
# Tests complets
npx playwright test tests/integration/real-supabase.spec.ts --project=chromium

# Mode UI (pour débugger)
npx playwright test tests/integration/real-supabase.spec.ts --project=chromium --ui

# Mode debug (pas-à-pas)
npx playwright test tests/integration/real-supabase.spec.ts --project=chromium --debug
```

**Résultat attendu :**

```
✅ 26 passed (3-4s)
```

---

## 📁 Fichiers

```
tests/integration/
├── real-supabase.spec.ts    # 26 tests d'intégration
└── README.md                # Ce fichier
```

---

## 🧪 Tests Implémentés (26)

### 🔐 Authentification (3 tests)
```typescript
✅ AUTH-01: Compte de test connecté
✅ AUTH-02: Token Supabase valide
✅ AUTH-03: User ID correspond au compte de test
```

### 💬 Conversations CRUD (5 tests)
```typescript
✅ CONV-01: Créer une conversation via Supabase
✅ CONV-02: Lire une conversation depuis Supabase
✅ CONV-03: Mettre à jour une conversation
✅ CONV-04: Supprimer une conversation
✅ CONV-05: Lister toutes les conversations d'un utilisateur
```

### 🔒 Row Level Security (3 tests)
```typescript
✅ RLS-01: Utilisateur voit uniquement SES conversations
✅ RLS-02: Utilisateur ne peut PAS modifier conversation d'un autre
✅ RLS-03: Utilisateur ne peut PAS supprimer conversation d'un autre
```

### 📨 Messages (2 tests)
```typescript
✅ MSG-01: Ajouter un message à une conversation
✅ MSG-02: Lister les messages d'une conversation
```

### 📊 Quotas (2 tests)
```typescript
✅ QUOTA-01: Lire les quotas d'un utilisateur
✅ QUOTA-02: Consommer un crédit de conversation
```

### 🔑 Beta Keys & RPC (2 tests)
```typescript
✅ RPC-01: Appeler fonction generate_beta_key (vérifier existence)
✅ RPC-02: Lister les beta keys actives
```

### ⚡ Performance (2 tests)
```typescript
✅ PERF-01: Lecture conversations < 2s
✅ PERF-02: Création conversation < 1s
```

---

## ⚙️ Configuration

### Fichier .env.local

```bash
# Créer ce fichier à la racine du projet
VITE_SUPABASE_URL=https://outmbbisrrdiumlweira.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
INTEGRATION_TEST_PASSWORD=your-test-password-here
BASE_URL=https://julienfritschheydon.github.io/DooDates
```

**⚠️ Ne PAS commiter ce fichier** (doit être dans `.gitignore`)

### Vérifier la Configuration

**Windows :**
```powershell
.\scripts\verify-integration-test-setup.ps1
```

**Linux/Mac :**
```bash
bash scripts/verify-integration-test-setup.sh
```

---

## 🔄 Nettoyage Automatique

Les données de test sont **nettoyées automatiquement** après chaque test :

```typescript
// Avant chaque test
beforeEach: Se connecter + nettoyer données précédentes

// Test
test: Créer/Modifier/Lire/Supprimer données

// Après chaque test
afterEach: Nettoyer toutes les données créées

// Après tous les tests
afterAll: Se déconnecter
```

**Garantie :** Aucune pollution des données de production.

---

## 🔍 Structure d'un Test

```typescript
test('TEST-XX: Description', async () => {
  // 1. Préparer (utilise helpers)
  const conversation = await createTestConversation(testUserId);
  
  // 2. Exécuter (vraie API Supabase, pas de mock)
  const { data, error } = await supabaseClient
    .from('conversations')
    .select('*')
    .eq('id', conversation.id);
  
  // 3. Vérifier
  expect(error).toBeNull();
  expect(data).toBeTruthy();
  
  // 4. Nettoyage automatique (afterEach)
});
```

---

## 🐛 Dépannage

### Erreur : "No authentication token found"

**Solution :**
- Vérifier que le compte `test-integration@doodates.com` existe
- Vérifier que `INTEGRATION_TEST_PASSWORD` est correct dans `.env.local`
- Essayer de se connecter manuellement avec ce compte

### Erreur : "RLS policy violation"

**Solution :**
- Vérifier les policies RLS dans Supabase Dashboard
- Exécuter les migrations SQL manquantes
- Consulter `sql-scripts/` pour les migrations

### Erreur : "Timeout after 10000ms"

**Solution :**
- Vérifier la connexion internet
- Vérifier le statut de Supabase : https://status.supabase.com/
- Augmenter le timeout dans le test

### Tests passent localement mais échouent en CI

**Solution :**
1. Vérifier secrets GitHub : Settings > Secrets > Actions
2. Vérifier que `INTEGRATION_TEST_PASSWORD` est configuré
3. Consulter logs CI pour détails

---

## 📚 Documentation

**Quick Start (15 min) :**
- [Quick Start Phase 2](../../Docs/TESTS/QUICK-START-PHASE2.md)

**Documentation complète :**
- [Protection Production Phase 2](../../Docs/TESTS/PROTECTION-PRODUCTION-PHASE2.md)

**Configuration détaillée :**
- [Guide Configuration Compte Test](../../Docs/TESTS/GUIDE-CONFIGURATION-COMPTE-TEST.md)

**Résumé implémentation :**
- [Résumé Phase 2](../../RESUME-PHASE2-IMPLEMENTATION.md)

---

## 🔧 Commandes Utiles

```bash
# Lancer tous les tests
npx playwright test tests/integration/real-supabase.spec.ts --project=chromium

# Lancer un test spécifique
npx playwright test tests/integration/real-supabase.spec.ts --project=chromium -g "AUTH-01"

# Mode UI (pour débugger)
npx playwright test tests/integration/real-supabase.spec.ts --project=chromium --ui

# Mode debug (breakpoints)
npx playwright test tests/integration/real-supabase.spec.ts --project=chromium --debug

# Voir le rapport HTML
npx playwright show-report

# Mode verbose
npx playwright test tests/integration/real-supabase.spec.ts --project=chromium --reporter=line

# Avec trace
npx playwright test tests/integration/real-supabase.spec.ts --project=chromium --trace on
```

---

## 🚀 CI/CD

Ces tests s'exécutent automatiquement dans le workflow :

```yaml
# .github/workflows/6-integration-tests.yml
PR créée
    ↓
Tests d'intégration (26 tests)
    ↓
    ├─ ✅ Succès → Merge autorisé
    └─ ❌ Échec → Merge BLOQUÉ + Issue créée
```

**Durée :** ~3-4 minutes  
**Fréquence :** Chaque PR + Push sur main

---

## 📊 Métriques

| Métrique | Valeur |
|----------|--------|
| **Nombre de tests** | 26 |
| **Durée moyenne** | 3-4 minutes |
| **Taux de succès attendu** | 100% |
| **Mocks utilisés** | 0 (tests réels) |
| **Lignes de code** | 650 |
| **Couverture** | Auth, DB, RLS, RPC, Perf |

---

## 🎯 Quand Ajouter un Test

Ajoutez un test d'intégration quand :

1. ✅ Nouvelle fonctionnalité Supabase (table, RPC, policy)
2. ✅ Bug lié à Supabase détecté en production
3. ✅ Changement de permissions RLS
4. ✅ Nouvelle fonction RPC
5. ✅ Modification de structure de données

**Template :**

```typescript
test.describe('Nouvelle Fonctionnalité', () => {
  test('TEST-XX: Description', async () => {
    // 1. Préparer
    const testData = await createTestData();
    
    // 2. Exécuter
    const { data, error } = await supabaseClient
      .from('table')
      .select('*');
    
    // 3. Vérifier
    expect(error).toBeNull();
    expect(data).toBeTruthy();
    
    // 4. Nettoyage automatique
  });
});
```

---

## 🛡️ Protection Garantie

Avec ces tests, vous êtes protégé contre :

- ❌ Problèmes d'authentification
- ❌ Bugs CRUD database
- ❌ Violations RLS
- ❌ Permissions cassées
- ❌ RPC functions non fonctionnelles
- ❌ Problèmes de performance
- ❌ Régressions Supabase

**Plus jamais de déploiement cassé non détecté ! 🎉**

---

**Dernière mise à jour :** 7 novembre 2025  
**Maintenu par :** Julien Fritsch  
**Version :** 1.0.0

