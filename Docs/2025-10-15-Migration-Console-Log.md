# Migration console.log → Logger

## 🎯 Objectif
Remplacer les **82 console.log** par notre système de logging professionnel.

---

## 📊 État Actuel

```
Total: 82 console.log dans 32 fichiers

Top fichiers à migrer:
  ✅ useVoting.ts (9)          → Priorité HAUTE
  ✅ App.tsx (6)               → Priorité HAUTE
  ⚠️  PollCreator.tsx (5)      → Priorité MOYENNE
  ⚠️  calendar-data.ts (5)     → Priorité BASSE (catégorie silencieuse)
  📦 28 autres fichiers (1-4 chacun)
```

---

## 🚀 Quick Start

### 1. Patterns de Remplacement

#### Simple log informatif
```typescript
// Avant ❌
console.log('User authenticated');

// Après ✅
import { logger } from '@/lib/logger';
logger.info('User authenticated', 'auth');
```

#### Log avec données
```typescript
// Avant ❌
console.log('Poll created:', pollId, poll);

// Après ✅
logger.info('Poll created', 'poll', { pollId, poll });
```

#### Log de debug
```typescript
// Avant ❌
console.log('[DEBUG] Calendar generated:', calendar);

// Après ✅
logger.debug('Calendar generated', 'calendar', { calendar });
```

#### Log d'erreur
```typescript
// Avant ❌
console.error('Failed to save vote:', error);

// Après ✅
logger.error('Failed to save vote', 'vote', error);
```

#### Log de warning
```typescript
// Avant ❌
console.warn('Invalid date format:', date);

// Après ✅
logger.warn('Invalid date format', 'general', { date });
```

---

## 📁 Plan de Migration par Fichier

### Phase 1 : Critiques (Priorité HAUTE)

#### 1. `src/hooks/useVoting.ts` (9 logs)
**Catégorie :** `vote`
```typescript
import { logger } from '@/lib/logger';

// Ligne ~45: Vote saved
- console.log('💾 Vote saved:', voteId);
+ logger.info('Vote saved', 'vote', { voteId });

// Ligne ~67: Vote deleted
- console.log('🗑️ Vote deleted:', voteId);
+ logger.info('Vote deleted', 'vote', { voteId });

// Ligne ~89: Error saving
- console.error('❌ Error saving vote:', error);
+ logger.error('Error saving vote', 'vote', error);
```

#### 2. `src/App.tsx` (6 logs)
**Catégorie :** `general`, `auth`
```typescript
import { logger } from '@/lib/logger';

// Navigation logs
- console.log('Navigation to:', path);
+ logger.debug('Navigation', 'general', { path });

// Auth logs
- console.log('User session:', user);
+ logger.info('User session initialized', 'auth', { userId: user?.id });
```

---

### Phase 2 : Importants (Priorité MOYENNE)

#### 3. `src/components/PollCreator.tsx` (5 logs)
**Catégorie :** `poll`
```typescript
import { logger } from '@/lib/logger';

- console.log('Poll data:', pollData);
+ logger.debug('Poll data prepared', 'poll', { pollData });

- console.log('Creating poll:', title);
+ logger.info('Creating poll', 'poll', { title });
```

#### 4. `src/components/PollCreatorCalendrierVertical.tsx` (5 logs)
**Catégorie :** `poll`, `calendar`

#### 5. `src/components/voting/ex-VotingSwipe.tsx` (5 logs)
**Catégorie :** `vote`

#### 6. `src/main.tsx` (4 logs)
**Catégorie :** `general`

---

### Phase 3 : Maintenance (Priorité BASSE)

#### 7. `src/lib/calendar-data.ts` (5 logs)
**Catégorie :** `calendar` (déjà silencieuse par défaut)
```typescript
import { logger } from '@/lib/logger';

// Ces logs ne s'afficheront qu'en mode debug explicite
- console.log('Calendar generated');
+ logger.debug('Calendar generated', 'calendar');
```

---

## 🎨 Guide des Catégories

| Fichier | Catégorie recommandée |
|---------|----------------------|
| **Authentication** | |
| `Auth.tsx` | `auth` |
| `AuthContext.tsx` | `auth` |
| `UserMenu.tsx` | `auth` |
| **Sondages** | |
| `PollCreator.tsx` | `poll` |
| `usePolls.ts` | `poll` |
| `FormPollCreator.tsx` | `poll` |
| **Votes** | |
| `useVoting.ts` | `vote` |
| `VotingInterface.tsx` | `vote` |
| `VotingSwipe.tsx` | `vote` |
| `VoteOption.tsx` | `vote` |
| **Conversations** | |
| `ConversationHistory.tsx` | `conversation` |
| `useConversations.ts` | `conversation` |
| `ConversationService.ts` | `conversation` |
| **API/Network** | |
| `enhanced-gemini.ts` | `api` |
| Tous les services API | `api` |
| **Calendrier** | |
| `calendar-data.ts` | `calendar` |
| `progressive-calendar.ts` | `calendar` |
| `calendar-generator.ts` | `calendar` |
| **Général** | |
| `App.tsx` | `general` |
| Autres composants | `general` |

---

## 🤖 Script de Migration Automatique (Optionnel)

```bash
# Créer un script Node.js pour migration automatique
node scripts/migrate-console-logs.js
```

### Script `scripts/migrate-console-logs.js`
```javascript
const fs = require('fs');
const path = require('path');

const filesToMigrate = [
  'src/hooks/useVoting.ts',
  'src/App.tsx',
  // Ajouter les autres fichiers...
];

const categoryMap = {
  'useVoting': 'vote',
  'Auth': 'auth',
  'Poll': 'poll',
  'Conversation': 'conversation',
  'calendar': 'calendar',
};

function migrateFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const fileName = path.basename(filePath, path.extname(filePath));
  
  // Déterminer la catégorie
  const category = Object.keys(categoryMap).find(key => 
    fileName.includes(key)
  ) || 'general';
  
  let newContent = content;
  
  // Ajouter l'import si pas présent
  if (!newContent.includes("import { logger }")) {
    const importLine = "import { logger } from '@/lib/logger';\n";
    newContent = importLine + newContent;
  }
  
  // Remplacer console.log
  newContent = newContent.replace(
    /console\.log\((.*?)\);/g,
    (match, args) => `logger.info(${args}, '${categoryMap[category] || 'general'}');`
  );
  
  // Remplacer console.error
  newContent = newContent.replace(
    /console\.error\((.*?)\);/g,
    (match, args) => `logger.error(${args}, '${categoryMap[category] || 'general'}');`
  );
  
  // Remplacer console.warn
  newContent = newContent.replace(
    /console\.warn\((.*?)\);/g,
    (match, args) => `logger.warn(${args}, '${categoryMap[category] || 'general'}');`
  );
  
  fs.writeFileSync(filePath, newContent);
  console.log(`✅ Migrated: ${filePath}`);
}

filesToMigrate.forEach(migrateFile);
```

---

## ✅ Validation

### Après migration d'un fichier, vérifier :

1. **Aucune erreur TypeScript**
```bash
npm run typecheck
```

2. **Tests passent**
```bash
npm test
```

3. **Application fonctionne**
```bash
npm run dev
```

4. **Logs apparaissent en dev**
- Ouvrir la console navigateur
- Vérifier les logs avec émojis : 🐛 ℹ️ ⚠️ ❌

5. **Logs silencieux en production**
```bash
npm run build && npm run preview
```
- Ouvrir la console navigateur
- Vérifier qu'AUCUN log n'apparaît (sauf errors si configuré)

---

## 🎯 Stratégie Recommandée

### Option A : Migration Progressive (Recommandé)
```
Semaine 1: useVoting.ts + App.tsx (15 logs)
Semaine 2: PollCreator + voting/ (15 logs)  
Semaine 3: Conversations + auth (20 logs)
Semaine 4: Calendrier + divers (32 logs)
```

### Option B : Migration Rapide
```
Jour 1: Script automatique sur TOUS les fichiers
Jour 2: Review manuelle + corrections
Jour 3: Tests + validation
```

---

## 🔍 Exemples Complets

### Exemple 1 : `useVoting.ts`

#### Avant
```typescript
export const useVoting = () => {
  const saveVote = async (vote: Vote) => {
    console.log('Saving vote:', vote);
    try {
      const result = await saveVoteToDb(vote);
      console.log('Vote saved successfully:', result);
      return result;
    } catch (error) {
      console.error('Failed to save vote:', error);
      throw error;
    }
  };
};
```

#### Après
```typescript
import { logger } from '@/lib/logger';

export const useVoting = () => {
  const saveVote = async (vote: Vote) => {
    logger.debug('Saving vote', 'vote', { vote });
    try {
      const result = await saveVoteToDb(vote);
      logger.info('Vote saved successfully', 'vote', { voteId: result.id });
      return result;
    } catch (error) {
      logger.error('Failed to save vote', 'vote', error);
      throw error;
    }
  };
};
```

---

## 📊 Tracking Progress

Créer un fichier `MIGRATION_PROGRESS.md` :

```markdown
# Migration console.log Progress

## Phase 1 : Critiques ✅ 15/15
- [x] useVoting.ts (9)
- [x] App.tsx (6)

## Phase 2 : Importants ⏳ 7/25
- [x] PollCreator.tsx (5)
- [ ] PollCreatorCalendrierVertical.tsx (5)
- [ ] ex-VotingSwipe.tsx (5)
- [ ] main.tsx (4)
- [ ] UserMenu.tsx (3)
- [ ] VotingSwipe.tsx (3)

## Phase 3 : Maintenance ⬜ 0/42
- [ ] calendar-data.ts (5)
- [ ] ...32 autres fichiers

**Total : 22/82 (27%)**
```

---

## 🎓 Best Practices

### ✅ DO
- Utiliser les catégories appropriées
- Ajouter des données contextuelles utiles
- Logger les erreurs avec le contexte complet
- Garder les messages concis et clairs

### ❌ DON'T
- Logger des données sensibles (mots de passe, tokens)
- Logger dans des boucles intensives (> 100 itérations)
- Logger des objets énormes (> 1MB)
- Garder les logs de debug en production

---

## 🚀 Next Steps

1. ✅ **Lire ce guide**
2. ⬜ Migrer `useVoting.ts` (fichier le plus impacté)
3. ⬜ Tester en dev
4. ⬜ Migrer `App.tsx`
5. ⬜ Continuer avec le plan par phase
6. ⬜ Setup Sentry pour production
7. ⬜ Documenter dans Planning.md

---

**Questions ?** Voir `Monitoring-Production.md` pour plus de détails sur le monitoring.
