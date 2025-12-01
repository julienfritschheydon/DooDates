# Stratégie de Branching DooDates

## 📋 Vue d'Ensemble

Ce document définit la stratégie de branching et de déploiement pour DooDates, utilisant Git Worktrees pour une gestion efficace des environnements.

## 🌳 Architecture des Branches

```
main (Production)
├── pre-prod (Pré-production)
│   └── staging (Staging)
│       └── testing (Testing/Integration)
│           ├── feature/* (Nouvelles fonctionnalités)
│           └── bug/* (Corrections de bugs)
└── develop (Actuel → sera renommé en staging)
```

## 🔄 Périodicité des Promotions

**Approche :** "Quand c'est prêt et quand ça marche"
- **Pas de délais fixes** : Promotions manuelles basées sur la validation
- **Critère principal** : Tous les tests de l'étape actuelle doivent passer
- **Flexibilité totale** : Chaque promotion peut prendre le temps nécessaire

**Processus de décision :**
1. **Développeur** : "Je pense que c'est prêt pour testing"
2. **Tests automatiques** : Validation technique
3. **Validation manuelle** : Tests fonctionnels rapides
4. **Promotion** : Si tout passe → étape suivante

## 🌐 Environnements de Déploiement GitHub

### Architecture GitHub Pages (Locale)
Chaque branche = environnement distinct avec déploiement local uniquement :

```
testing   → Local (npm run dev)
staging   → Local (npm run preview)
main      → Local (npm run preview) puis production si validé
```

**Note :** Tous les environnements testés en local, pas de déploiement GitHub Pages

### Configuration GitHub Actions (Locale)
```yaml
# .github/workflows/test-testing.yml
on:
  push:
    branches: [testing]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: 🧪 Tests Unitaires + Build
        run: npm run test:unit:fast && npm run build
      # Pas de déploiement - tests locaux uniquement
```

### Workflows par Environnement
- **testing** : `.github/workflows/test-testing.yml` (tests uniquement)
- **staging** : `.github/workflows/test-staging.yml` (tests complets)
- **main** : `.github/workflows/deploy-production.yml` (déploiement production)
- **pre-prod** : Tests locaux uniquement (pas de workflow)

## 🏗️ Migration des Worktrees

### État Actuel
```
C:/Users/Julien Fritsch/Documents/GitHub/DooDates          [main]
C:/Users/Julien Fritsch/Documents/GitHub/DooDates-develop  [develop]
```

### État Ciblé (après renommage)
```
C:/Users/Julien Fritsch/Documents/GitHub/DooDates-main      [main]
C:/Users/Julien Fritsch/Documents/GitHub/DooDates-develop  [staging]
C:/Users/Julien Fritsch/Documents/GitHub/DooDates-testing   [testing]
C:/Users/Julien Fritsch/Documents/GitHub/DooDates-pre-prod  [pre-prod]  # Local uniquement
```

### Plan de Migration
1. **Renommer le worktree develop**
   ```bash
   # Depuis le worktree develop actuel
   cd ../DooDates-develop
   git checkout -b staging
   cd ..
   mv DooDates-develop DooDates-staging
   ```

2. **Créer les nouveaux worktrees**
   ```bash
   # Depuis le répertoire principal
   git worktree add ../DooDates-testing testing
   git worktree add ../DooDates-pre-prod pre-prod  # Local uniquement
   git worktree add ../DooDates-main main  # Remplace l'actuel
   ```

3. **Mettre à jour les références**
   - Mettre à jour les scripts et documentation
   - Vérifier les chemins relatifs

## 🧪 Stratégie de Tests par Branche

### Testing (testing)
**Objectif :** Validation de l'intégration technique
**Durée estimée :** 5-15 minutes par validation

#### Tests Automatisés (GitHub Actions)
```yaml
jobs:
  testing-validation:
    runs-on: ubuntu-latest
    steps:
      - name: 🧪 Tests Unitaires Rapides
        run: npm run test:unit:fast
        timeout: 2m
        
      - name: 📝 TypeScript Check
        run: npm run type-check
        timeout: 1m
        
      - name: 🧹 Linting & Formatage
        run: npm run lint && npm run format:check
        timeout: 1m
        
      - name: 🏗️ Build Validation
        run: npm run build
        timeout: 2m
```

#### Tests Unitaires Existants (66 tests)
**Scripts concernés :** `npm run test:unit:fast`
- **Hooks** : useAutoSave, useConversationSearch, useConversationStorage, useConversations
- **Lib** : conditionalEvaluator, conditionalValidator, date-utils, exports, temporalParser
- **Components** : Calendar, Dashboard, PollActions, QuotaIndicator
- **Services** : deleteCascade, titleGeneration, SimulationService

#### Tests Manuels Rapides
- **Navigation** : Pages principales accessibles
- **Fonctionnalités critiques** : Chat, création sondage, vote
- **Pas de régression évidente** : UX de base fonctionnelle

#### Critères de Succès
- ✅ Tous les tests unitaires passent (66+ tests)
- ✅ Build production réussi
- ✅ Aucune erreur TypeScript
- ✅ Navigation fonctionnelle
- ✅ Features principales utilisables

---

### Staging (staging)
**Objectif :** Validation complète et performance
**Durée estimée :** 20-45 minutes par validation

#### Tests Automatisés (GitHub Actions)
```yaml
jobs:
  staging-validation:
    runs-on: ubuntu-latest
    steps:
      # Tous les tests de testing
      - name: 🧪 Tests Testing Complets
        run: npm run test:unit:fast && npm run lint && npm run build
        
      - name: 🎭 Tests E2E Smoke
        run: npm run test:e2e:smoke
        timeout: 5m
        
      - name: 🎭 Tests E2E Functional
        run: npm run test:e2e:functional
        timeout: 10m
        
      - name: ⚡ Tests Performance
        run: npm run test:integration
        timeout: 5m
        
      - name: ♿ Tests Accessibilité
        run: npm run test:accessibility
        timeout: 3m
```

#### Tests E2E Existants (15+ tests)
**Scripts concernés :** `npm run test:e2e:smoke` + `npm run test:e2e:functional`

**Smoke Tests (@smoke) :**
- `ultra-simple-poll.spec.ts` - Workflow création vote
- `dashboard-complete.spec.ts` - Navigation dashboard
- `authenticated-workflow.spec.ts` - Login complet
- `production-smoke.spec.ts` - Smoke production

**Functional Tests (@functional) :**
- `availability-poll-workflow.spec.ts` - Sondages disponibilités
- `form-poll-results-access.spec.ts` - Accès résultats formulaires
- `guest-quota.spec.ts` - Quotas utilisateurs invités
- `quota-tracking-complete.spec.ts` - Suivi quotas complet

#### Tests Manuels Approfondis
- **Workflow complet utilisateur** : Création → Vote → Résultats
- **Responsive design** : Mobile, tablette, desktop
- **Accessibilité** : Navigation clavier, lecteur écran
- **Performance** : Temps de chargement, fluidité
- **Cross-browser** : Chrome, Firefox, Safari, Edge

#### Critères de Succès
- ✅ Tous les tests E2E smoke passent
- ✅ Tests fonctionnels critiques passent
- ✅ Performance acceptable (< 3s)
- ✅ Accessibilité WCAG 2.1 AA
- ✅ UX fluide sur tous devices

---

### Pré-production (pre-prod)
**Objectif :** Validation métier et acceptation utilisateur (LOCAL UNIQUEMENT)
**Durée estimée :** 30-45 minutes par validation

#### Tests Automatisés (Local)
```bash
# Scripts de tests locaux complets
npm run test:unit:coverage          # Tous les tests unitaires avec coverage
npm run test:e2e:regression       # Tests E2E régression complets
npm run test:integration          # Tests API + performance
npm run test:accessibility:all    # Tests accessibilité tous navigateurs
```

#### Tests E2E Complets Existants (30+ tests)
**Scripts concernés :** `npm run test:e2e:regression`

**Tests Régression :**
- `end-to-end-with-backend.spec.ts` - Backend complet
- `form-poll-regression.spec.ts` - Régression formulaires
- `security-isolation.spec.ts` - Sécurité
- `console-errors.spec.ts` - Erreurs console
- `mobile-voting.spec.ts` - Mobile voting
- `mobile-drag-drop.spec.ts` - Mobile interactions

**Tests Spécifiques :**
- `supabase-integration.spec.ts` - Intégration Supabase
- `analytics-ai-optimized.spec.ts` - Analytics IA
- `beta-key-activation.spec.ts` - Activation bêta
- `tags-folders.spec.ts` - Gestion tags/dossiers

#### Tests Manuels Métier (Local)
- **Scénarios réels utilisateurs** : Cas d'usage complets
- **Données réelles** : Tests avec volumes significatifs
- **Intégrations externes** : Supabase, Gemini, Analytics
- **Expérience utilisateur** : Satisfaction, compréhension
- **Support multi-langues** : Français, anglais
- **PWA** : Installation, offline, notifications

#### Critères de Succès
- ✅ Tous les tests E2E passent (30+ tests)
- ✅ Couverture tests > 90%
- ✅ APIs externes stables et performantes
- ✅ Expérience mobile native-like
- ✅ Feedback utilisateurs positif

#### Processus de Promotion
```bash
# Depuis staging vers pre-prod (local)
git checkout pre-prod
git merge staging
# Tests locaux complets
# Si OK → promotion vers main
git checkout main
git merge pre-prod
git push origin main
```

---

### Production (main)
**Objectif :** Monitoring et surveillance continue
**Durée estimée :** Surveillance 24/7

#### Tests Automatisés (GitHub Actions)
```yaml
jobs:
  production-monitoring:
    runs-on: ubuntu-latest
    schedule: "*/5 * * * *"  # Toutes les 5 minutes
    steps:
      - name: ❤️ Health Checks
        run: npm run health:check
        timeout: 2m
        endpoints: [app, api, database]
        
      - name: 📊 Monitoring Performance
        run: npm run monitor:performance
        metrics: [uptime, response_time, error_rate]
        
      - name: 🚨 Alertes
        run: npm run alerts:check
        conditions: [downtime, high_error_rate, slow_performance]
```

#### Surveillance Continue
- **Uptime** : Disponibilité 99.9%
- **Performance** : Temps de réponse < 2s
- **Erreurs** : Taux d'erreur < 1%
- **Utilisateurs** : Nombre actif, sessions
- **Ressources** : CPU, mémoire, bande passante

#### Critères de Succès
- ✅ Disponibilité 99.9%
- ✅ Performance optimale
- ✅ Erreurs minimales
- ✅ Utilisateurs satisfaits
- ✅ Scalabilité maintenue

## 📊 Matrice de Tests (Basée sur Tests Existants)

| Type de Test | Testing | Staging | Pre-prod (Local) | Production |
|-------------|---------|---------|------------------|------------|
| Unitaires (66 tests) | ✅ | ✅ | ✅ | ⏸️ |
| E2E Smoke (4 tests) | ❌ | ✅ | ✅ | ❌ |
| E2E Functional (8 tests) | ❌ | ✅ | ✅ | ❌ |
| E2E Régression (15+ tests) | ❌ | ❌ | ✅ | ❌ |
| Integration API | ❌ | ✅ | ✅ | ✅ |
| Accessibilité | ❌ | ✅ | ✅ | ⏸️ |
| Performance | ❌ | ✅ | ❌ | ✅ |
| Coverage | ❌ | ❌ | ✅ | ⏸️ |

**Légende :**
- ✅ Exécuté
- ❌ Non exécuté
- ⏸️ Monitoring uniquement

**Détail des tests existants :**

### 🧪 **Unitaires (66 tests) - npm run test:unit:fast**
**Testing + Staging + Pre-prod**
- **Hooks (25 tests)** : useAutoSave, useConversationSearch, useConversationStorage, useConversations, usePolls
- **Lib (30 tests)** : conditionalEvaluator, conditionalValidator, date-utils, exports, temporalParser, pollStorage, gemini-*
- **Components (8 tests)** : Calendar, Dashboard, PollActions, QuotaIndicator, CascadeDeleteModal
- **Services (3 tests)** : deleteCascade, titleGeneration, SimulationService

### 🎭 **E2E Smoke (4 tests) - npm run test:e2e:smoke**
**Staging + Pre-prod**
- `ultra-simple-poll.spec.ts` - Workflow création vote (@smoke)
- `dashboard-complete.spec.ts` - Navigation dashboard (@smoke)
- `authenticated-workflow.spec.ts` - Login complet (@smoke)
- `production-smoke.spec.ts` - Smoke production (@smoke)

### 🎭 **E2E Functional (8 tests) - npm run test:e2e:functional**
**Staging + Pre-prod**
- `availability-poll-workflow.spec.ts` - Sondages disponibilités (@functional)
- `form-poll-results-access.spec.ts` - Accès résultats formulaires (@functional)
- `guest-quota.spec.ts` - Quotas utilisateurs invités (@functional)
- `quota-tracking-complete.spec.ts` - Suivi quotas complet (@functional)
- `form-poll-date-question.spec.ts` - Questions dates formulaires (@functional)
- `beta-key-activation.spec.ts` - Activation bêta (@functional)
- `tags-folders.spec.ts` - Gestion tags/dossiers (@functional)
- `analytics-ai-optimized.spec.ts` - Analytics IA (@functional)

### 🎭 **E2E Régression (15+ tests) - npm run test:e2e:regression**
**Pre-prod uniquement**
- `end-to-end-with-backend.spec.ts` - Backend complet
- `form-poll-regression.spec.ts` - Régression formulaires
- `security-isolation.spec.ts` - Sécurité
- `console-errors.spec.ts` - Erreurs console
- `mobile-voting.spec.ts` - Mobile voting
- `mobile-drag-drop.spec.ts` - Mobile interactions
- `supabase-integration.spec.ts` - Intégration Supabase
- `docs.spec.ts` - Documentation
- `smart-navigation.spec.ts` - Navigation intelligente
- Plusieurs autres tests spécifiques...

### ⚡ **Integration & Performance - npm run test:integration**
**Staging + Pre-prod + Production**
- `api-security-performance.spec.ts` - API + sécurité + performance
- Tests de charge légers (k6)
- Monitoring production

### ♿ **Accessibilité - npm run test:accessibility**
**Staging + Pre-prod**
- Tests WCAG 2.1 AA
- Navigation clavier
- Lecteur écran
- axe-core integration

## 🔄 Processus de Merge

### Feature → Testing
```bash
# Depuis la branche feature
git checkout testing
git merge feature/nouvelle-fonctionnalite
git push origin testing
```

### Bug → Testing (Automatisé)
```bash
# Push sur une branche bug/*
# Si tests OK → Merge automatique vers testing
```

### Testing → Staging (Automatisé)
```bash
# Push sur testing (ou merge depuis bug/*)
# Si validation OK → Merge automatique vers staging
```

### Staging → Pre-prod
```bash
# Après validation complète en staging
git checkout pre-prod
git merge staging
git push origin pre-prod
```

### Pre-prod → Main
```bash
# Depuis pre-prod (local) vers main
git checkout main
git merge pre-prod
git push origin main
```

## 🚀 Workflows GitHub Actions (Simplifiés)

### Testing Workflow (Automatisé)
```yaml
# .github/workflows/test-testing.yml
on:
  push:
    branches: [testing]
jobs:
  testing-validation:
    # Tests unitaires, lint, build
  auto-merge-to-staging:
    needs: testing-validation
    # Merge testing → staging si succès
```

### Bug Workflow (Automatisé)
```yaml
# .github/workflows/auto-merge-bug-to-testing.yml
on:
  push:
    branches: [bug/*]
jobs:
  validate:
    # Tests unitaires rapides
  merge-to-testing:
    needs: validate
    # Merge bug/* → testing si succès
```

### Staging Workflow  
```yaml
# .github/workflows/deploy-staging.yml
on:
  push:
    branches: [staging]
jobs:
  test-and-deploy:
    runs-on: ubuntu-latest
    steps:
      - name: 🧪 Tests Complets
        run: npm run test:staging:all
      - name: 🚀 Deploy to Staging
        run: npm run deploy:staging
```

### Production Workflow
```yaml
# .github/workflows/deploy-production.yml
on:
  push:
    branches: [main]
jobs:
  deploy-and-monitor:
    runs-on: ubuntu-latest
    steps:
      - name: 🏗️ Build Production
        run: npm run build
      - name: 🚀 Deploy to Production
        run: npm run deploy:production
      - name: ❤️ Health Check
        run: npm run health:check
```

## 🚀 Workflows GitHub Actions

### Workflow par Branche

#### testing
- **Trigger** : Push sur testing
- **Jobs** : Tests unitaires, intégration, build
- **Environnement** : Testing

#### staging
- **Trigger** : Push sur staging
- **Jobs** : Tests complets, E2E, performance
- **Environnement** : Staging

#### pre-prod
- **Trigger** : Push sur pre-prod
- **Jobs** : Tests UAT, charge, sécurité
- **Environnement** : Pre-prod

#### main
- **Trigger** : Push sur main
- **Jobs** : Déploiement production, monitoring
- **Environnement** : Production

## 📝 Conventions de Nomination

### Branches de Features
```
feature/nom-de-la-feature
feature/ui-redesign-dashboard
feature/api-gemini-integration
feature/export-form-polls
```

### Branches de Bugs
```
bug/description-du-bug
bug/fix-chat-reset-issue
bug/correct-date-timezone
bug/resolve-ci-timeout
```

### Branches de Hotfixes (urgence)
```
hotfix/critique-securite
hotfix/production-down
```

## 🛡️ Règles de Protection

### Branches Protégées
- **main** : Require PR, require status checks, require approvals
- **pre-prod** : Require PR, require status checks
- **staging** : Require status checks
- **testing** : Require status checks

### Status Checks Obligatoires

#### testing
- Unit Tests
- Integration Tests
- TypeScript Check
- Linting
- Build Validation

#### staging
- Tous les checks testing +
- E2E Tests
- Performance Tests
- Security Scan
- Accessibility Tests

#### pre-prod
- Tous les checks staging +
- UAT Tests
- Load Tests
- External API Tests

#### main
- Tous les checks pre-prod +
- Health Checks
- Monitoring Validation

## 🔄 Migration Actuelle

### État Actuel
- `develop` → sera renommé en `staging`
- `main` → reste `main`
- Worktrees existants à réorganiser

### Plan de Migration
1. **Créer les nouvelles branches** (testing, staging, pre-prod)
2. **Renommer develop en staging**
3. **Mettre à jour les worktrees**
4. **Configurer les workflows GitHub Actions**
5. **Mettre à jour les règles de protection**

## 📊 Métriques et Monitoring

### KPIs par Branche
- **Temps de merge** : feature → testing
- **Temps de promotion** : testing → staging → pre-prod → main
- **Taux de succès des tests** par environnement
- **Nombre de rollback** par environnement

### Dashboard de Monitoring
- Statut des branches
- Workflows en cours
- Déploiements récents
- Alertes et incidents

## 🎯 Bonnes Pratiques

### Développement
- Travailler sur des branches feature/* ou bug/*
- Commits fréquents et descriptifs
- Tests unitaires locaux avant push

### Integration
- Résoudre les conflits rapidement
- Valider les résultats des tests
- Documentation des changements

### Déploiement
- Suivre l'ordre des promotions
- Valider chaque étape
- Monitorer après déploiement

### Rollback
- Capacité de rollback rapide
- Communication claire des incidents
- Post-mortem systématique

## 🔧 Outils et Configuration

### Git Worktrees
```bash
# Créer un worktree pour testing
git worktree add ../DooDates-testing testing

# Créer un worktree pour staging
git worktree add ../DooDates-staging staging

# Créer un worktree pour pre-prod
git worktree add ../DooDates-pre-prod pre-prod
```

### Scripts d'Aide
```bash
# Script de promotion testing → staging
./scripts/promote-to-staging.sh

# Script de promotion staging → pre-prod
./scripts/promote-to-pre-prod.sh

# Script de promotion pre-prod → main
./scripts/promote-to-main.sh
```

## 📚 Références

- [Git Worktrees Documentation](https://git-scm.com/docs/git-worktree)
- [GitHub Actions Workflows](https://docs.github.com/en/actions)
- [Branching Strategies](https://martinfowler.com/articles/branching-patterns.html)

## ⏱️ Estimation de Temps d'Implémentation (Simplifiée)

### Phase 1 : Préparation et Migration (2-3 heures)
```bash
# Tâches estimées
- Renommer develop → staging : 15 min
- Créer branches testing + pre-prod : 15 min  
- Réorganiser worktrees : 30 min
- Mettre à jour documentation : 30 min
- Tester navigation worktrees : 30 min
- Nettoyage branches obsolètes : 30 min
```

### Phase 2 : Workflows GitHub Actions (2-3 heures)
```yaml
# Workflows simplifiés à créer
- deploy-testing.yml : 45 min
- deploy-staging.yml : 1h (tests complets)
- deploy-production.yml : 45 min (monitoring)
- Mise en place protections branches : 30 min
```

### Phase 3 : Configuration Tests (1-2 heures)
```bash
# Scripts de tests essentiels
- test:testing:all : 20 min
- test:staging:all : 30 min (incluant E2E)
- test:uat:local : 20 min
- test:integration : 20 min
- Scripts SEO et mobile : 30 min
```

### Phase 4 : Déploiement GitHub Pages (1-2 heures)
```bash
# Configuration multi-environnements simplifiée
- Configuration base path Vite : 30 min
- Setup GitHub Pages 3 branches : 1h
- Tests déploiement : 30 min
```

### Phase 5 : Scripts d'Aide (1 heure)
```bash
# Scripts utilitaires essentiels
- promote-to-staging.sh : 15 min
- promote-to-main.sh : 15 min  
- health-checks.sh : 20 min
- Documentation scripts : 10 min
```

### Phase 6 : Validation et Documentation (1-2 heures)
```bash
- Test chaîne promotion complète : 45 min
- Rédaction guide utilisation : 45 min
- Checklist promotion : 15 min
- Formation rapide : 15 min
```

---

## 📊 Résumé des Temps (Simplifié)

| Phase | Temps Estimé | Complexité | Risques |
|-------|--------------|------------|---------|
| Migration Worktrees | 2-3h | Faible | Faible |
| Workflows GitHub Actions | 2-3h | Faible | Faible |
| Configuration Tests | 1-2h | Faible | Faible |
| Déploiement GitHub Pages | 1-2h | Moyenne | Moyen |
| Scripts d'Aide | 1h | Faible | Faible |
| Validation & Documentation | 1-2h | Faible | Faible |
| **TOTAL** | **8-13 heures** | **Faible** | **Faible** |

### 🎯 **Planning Réaliste (Simplifié)**

#### **Option 1 : Week-end Optimisé**
- **Samedi** : Phase 1 + 2 (4-6h)
- **Dimanche** : Phase 3 + 4 (2-4h) 
- **Lundi soir** : Phase 5 + 6 (2-3h)
- **Total** : 8-13h répartis sur 3 jours

#### **Option 2 : Progressif Soir**
- **Semaine 1** : 1h par soir (5h) - Phase 1 + 2
- **Semaine 2** : 1h par soir (3h) - Phase 3 + 4
- **Week-end** : 2h - Phase 5 + 6
- **Total** : 10h répartis sur 2 semaines

#### **Option 3 : Bloc Continu**
- **2 jours** : 4-6h/jour
- **Focus total** : Pas d'interruptions
- **Résultat rapide** : Système opérationnel en 48h
- **Total** : 8-12h concentrés

---

## ⚡ Facteurs d'Accélération (Simplifiés)

### ✅ **Ce qui va plus vite maintenant**
- **Pas de pre-prod GitHub Pages** : -2h de configuration
- **Pas de tests de charge** : -1h de setup
- **Intégrations simplifiées** : -1h de configuration
- **Workflows plus simples** : -2h total

### ⚠️ **Points restants**
- **Configuration multi-environnements** : Base path Vite (1-2h)
- **Tests E2E staging** : Configuration navigateurs (1h)

### 🚀 **Conseils pour Optimiser**
1. **Commencer simple** : Testing → Staging → Main
2. **Pre-prod local** : Tests manuels dans worktree
3. **Réutiliser l'existant** : 80% du CI/CD adapté
4. **Itérer rapidement** : 3 environnements seulement

---

## 🎯 **Recommandation (Simplifiée)**

**Approche suggérée :** **Option 2 (Progressif Soir)**
- **Très faible risque** : Configuration simple
- **Excellent équilibre** : 1h/jour facile
- **Qualité maintenue** : Tests essentiels conservés
- **Flexibilité maximale** : Adaptation instantanée

**Timeline réaliste :** **2 semaines pour un système fonctionnel**

---

**Dernière mise à jour :** 30/11/2025
**Auteur :** Julien Fritsch + Assistant IA
**Version :** 1.2 (simplifiée - 8-13h)
