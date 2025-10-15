# Monitoring Production - DooDates

## 🎯 Objectif
Remplacer les `console.log` par un système professionnel de logging et monitoring pour détecter et résoudre les problèmes en production.

---

## 📊 Outils de Monitoring Recommandés

### 1. **Sentry** ⭐ (Recommandé pour MVP)
**Prix :** Gratuit jusqu'à 5000 événements/mois  
**Idéal pour :** Tracking d'erreurs et exceptions

#### Avantages
- ✅ **Installation ultra-simple** (2 lignes de code)
- ✅ **Stack traces complètes** avec contexte utilisateur
- ✅ **Source maps** : voir le code TypeScript original dans les erreurs
- ✅ **Release tracking** : corréler erreurs avec versions
- ✅ **User feedback** : formulaire automatique après crash
- ✅ **Performance monitoring** : transactions lentes

#### Installation
```bash
npm install @sentry/react
```

```typescript
// src/main.tsx
import * as Sentry from "@sentry/react";

Sentry.init({
  dsn: "VOTRE_DSN_SENTRY",
  environment: import.meta.env.MODE,
  integrations: [
    new Sentry.BrowserTracing(),
    new Sentry.Replay({
      maskAllText: false,
      blockAllMedia: false,
    }),
  ],
  tracesSampleRate: 0.1, // 10% des transactions
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0, // 100% quand il y a une erreur
});
```

#### Intégration avec notre logger
```typescript
// src/lib/logger.ts
import * as Sentry from "@sentry/react";

private sendToMonitoring(level: LogLevel, message: string, category: string, data?: any): void {
  if (level === 'error') {
    Sentry.captureException(new Error(message), {
      level: 'error',
      tags: { category },
      extra: { data },
    });
  } else if (level === 'warn') {
    Sentry.captureMessage(message, {
      level: 'warning',
      tags: { category },
      extra: { data },
    });
  }
}
```

---

### 2. **LogRocket** 🎥
**Prix :** Gratuit jusqu'à 1000 sessions/mois  
**Idéal pour :** Reproduire les bugs utilisateurs

#### Avantages
- ✅ **Session replay vidéo** : voir exactement ce que l'utilisateur a fait
- ✅ **Console logs** : capture tous les logs navigateur
- ✅ **Network requests** : voir toutes les requêtes API
- ✅ **Redux/State tracking** : état complet de l'application
- ✅ **Erreurs frontend + backend** corrélées

#### Installation
```bash
npm install logrocket
```

```typescript
// src/main.tsx
import LogRocket from 'logrocket';

if (import.meta.env.PROD) {
  LogRocket.init('votre-app-id/doodates');
  
  // Identifier l'utilisateur
  LogRocket.identify(user?.id, {
    email: user?.email,
    name: user?.display_name,
  });
}
```

#### Intégration Sentry + LogRocket
```typescript
import LogRocket from 'logrocket';
import * as Sentry from '@sentry/react';

LogRocket.getSessionURL(sessionURL => {
  Sentry.setContext('LogRocket', { sessionURL });
});
```
**Résultat :** Chaque erreur Sentry a un lien vers la vidéo LogRocket ! 🎯

---

### 3. **Vercel Analytics** 📈 (Si hébergé sur Vercel)
**Prix :** Gratuit jusqu'à 100k requêtes/mois  
**Idéal pour :** Métriques web vitals et performance

#### Avantages
- ✅ **Web Vitals** automatiques (LCP, FID, CLS)
- ✅ **Real User Monitoring** (RUM)
- ✅ **Zero configuration** si hébergé sur Vercel
- ✅ **Page views** et analytics de base

#### Installation
```bash
npm install @vercel/analytics
```

```typescript
// src/main.tsx
import { Analytics } from '@vercel/analytics/react';

<Analytics />
```

---

### 4. **Posthog** 🦔 (Alternative open-source)
**Prix :** Gratuit jusqu'à 1M événements/mois  
**Idéal pour :** Analytics + Session replay + Feature flags

#### Avantages
- ✅ **Open-source** et self-hostable
- ✅ **Session replays** gratuits
- ✅ **Feature flags** intégrés
- ✅ **Analytics complets** (alternative à Google Analytics)
- ✅ **Heatmaps** et funnels

---

## 🚀 Stack Recommandée pour DooDates

### Phase 1 : MVP (Budget 0€)
```
✅ Sentry Free (5000 erreurs/mois)
✅ Notre logger custom (dev only)
✅ Vercel Analytics (si Vercel)
```

### Phase 2 : Croissance (Budget ~10€/mois)
```
✅ Sentry Team (~26€/mois pour 50k erreurs)
✅ LogRocket Essential (~99€/mois pour 10k sessions) OU
✅ Posthog Free (1M événements/mois)
```

### Phase 3 : Scale (Budget ~100€/mois)
```
✅ Sentry Business
✅ LogRocket Pro
✅ Datadog RUM (monitoring complet)
```

---

## 🔧 Migration des console.log

### Étape 1 : Importer le logger
```typescript
import { logger } from '@/lib/logger';
```

### Étape 2 : Remplacer les console.log

#### Avant ❌
```typescript
console.log('User logged in:', user);
console.log('Poll created:', pollId);
console.error('API failed:', error);
```

#### Après ✅
```typescript
logger.info('User logged in', 'auth', { user });
logger.info('Poll created', 'poll', { pollId });
logger.error('API failed', 'api', error);
```

### Étape 3 : Utiliser les catégories appropriées

| Catégorie | Usage |
|-----------|-------|
| `auth` | Authentification, login, logout |
| `api` | Requêtes API, fetch, mutations |
| `poll` | Création, modification de sondages |
| `vote` | Votes, réponses utilisateurs |
| `conversation` | Messages IA, historique |
| `performance` | Métriques de performance |
| `calendar` | Génération calendrier (silencieux par défaut) |
| `general` | Logs généraux |

---

## 📈 Métriques Clés à Surveiller

### 1. Erreurs critiques
- ❌ Erreurs API (taux d'échec > 5%)
- ❌ Crashes d'application
- ❌ Erreurs d'authentification
- ❌ Échecs de sauvegarde de votes

### 2. Performance
- ⚡ **LCP** (Largest Contentful Paint) < 2.5s
- ⚡ **FID** (First Input Delay) < 100ms
- ⚡ **CLS** (Cumulative Layout Shift) < 0.1
- ⚡ Temps de chargement API < 500ms

### 3. Engagement utilisateur
- 👥 Taux de complétion des sondages
- 👥 Taux d'abandon (où les users quittent)
- 👥 Taux de conversion (création → votes)

### 4. Problèmes récurrents
- 🔄 Erreurs répétées même URL
- 🔄 Utilisateurs impactés multiples
- 🔄 Navigateurs/OS spécifiques

---

## 🎯 Alertes Recommandées

### Configuration Sentry
```typescript
// Alertes par email/Slack
- Erreur > 10 occurrences/heure
- Nouveau type d'erreur jamais vu
- Taux d'erreur > 5% (spike)
- Erreur affectant > 50 utilisateurs
```

### Configuration LogRocket
```typescript
// Alertes sessions
- Rage clicks (utilisateur clique frénétiquement)
- Erreurs JavaScript dans session
- API calls > 5s de latence
```

---

## 🔐 Sécurité & Privacy

### ⚠️ NE JAMAIS logger
```typescript
❌ Mots de passe
❌ Tokens d'authentification
❌ Données de carte bancaire
❌ Informations médicales
❌ Données personnelles sensibles (email si pas nécessaire)
```

### ✅ Sanitization
```typescript
// Avant d'envoyer à Sentry/LogRocket
Sentry.init({
  beforeSend(event) {
    // Supprimer les données sensibles
    if (event.request?.cookies) {
      delete event.request.cookies;
    }
    if (event.user?.email) {
      event.user.email = event.user.email.replace(/(.{2}).*@/, '$1***@');
    }
    return event;
  },
});
```

---

## 📊 Dashboard de Monitoring

### Console navigateur (dev)
```javascript
// Voir tous les logs stockés
window.dooLogger.getStoredLogs()

// Configuration du logger
window.dooLogger.configure({
  minLevel: 'warn', // Ne montrer que warn et error
  silentCategories: ['calendar', 'performance'],
})

// Réactiver une catégorie
window.dooLogger.silenceCategory('calendar', false)

// Nettoyer les logs
window.dooLogger.clearStoredLogs()
```

### Exemples de dashboards

#### Sentry Dashboard
```
📊 Vue d'ensemble
├── Erreurs/heure (graphique)
├── Utilisateurs impactés
├── Top 10 erreurs
└── Releases comparison

🔍 Détails d'erreur
├── Stack trace TypeScript
├── Breadcrumbs (actions utilisateur avant erreur)
├── User context (browser, OS, custom data)
├── Lien LogRocket session replay
└── Similar issues
```

#### LogRocket Dashboard
```
🎥 Sessions
├── Vidéo du bug en action
├── Console logs complets
├── Network waterfall
├── Redux DevTools timeline
└── User frustration score
```

---

## 🚀 Quick Start

### 1. Activer Sentry (5 minutes)
```bash
# Installation
npm install @sentry/react

# Configuration dans .env
VITE_SENTRY_DSN=https://xxx@sentry.io/xxx

# Ajout dans main.tsx
import * as Sentry from "@sentry/react";
Sentry.init({ dsn: import.meta.env.VITE_SENTRY_DSN });
```

### 2. Migrer 1 fichier (test)
```typescript
// useVoting.ts (9 console.log)
- console.log('Vote saved:', voteId);
+ logger.info('Vote saved', 'vote', { voteId });
```

### 3. Vérifier dans Sentry dashboard
- Aller sur sentry.io
- Créer une erreur de test : `throw new Error('Test Sentry')`
- Vérifier qu'elle apparaît dans le dashboard

### 4. Migrer progressivement
```
Phase 1: Fichiers critiques (App.tsx, useVoting.ts)
Phase 2: Composants UI (PollCreator, Dashboard)
Phase 3: Utilities (calendar-data.ts, etc.)
```

---

## 📚 Ressources

- [Sentry Documentation](https://docs.sentry.io/platforms/javascript/guides/react/)
- [LogRocket React Setup](https://docs.logrocket.com/docs/react)
- [Web Vitals Guide](https://web.dev/vitals/)
- [Posthog React Guide](https://posthog.com/docs/libraries/react)

---

## ✅ Checklist de Migration

- [ ] Logger amélioré et configuré
- [ ] Sentry installé et configuré (DSN dans .env)
- [ ] Source maps activées pour production
- [ ] Erreur de test validée dans Sentry
- [ ] 10 premiers console.log migrés vers logger
- [ ] Tous les fichiers critiques migrés (App, hooks auth/vote)
- [ ] Configuration alertes Sentry (email/Slack)
- [ ] Documentation équipe sur utilisation logger
- [ ] LogRocket configuré (optionnel, phase 2)
- [ ] Dashboard monitoring configuré et partagé équipe
