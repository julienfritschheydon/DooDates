# DooDates Spec-Driven Development Workflow

## Current Project Status
- **Phase 1**: AI Interface Foundation ✅ COMPLETED
- **Phase 2**: MVP Core 🔄 IN PROGRESS
- **Tech Stack**: React 18 + Vite + TypeScript + TailwindCSS + Supabase + OpenAI

## /specify - Next Phase Requirements


### Smart Authentication & User Management
```
/specify
Implement a frictionless authentication system that balances security with user experience. The system should:

1. Support multiple authentication methods (email/password, Google, Microsoft, Apple)
2. Provide passwordless login options via magic links
3. Remember user preferences and poll history across devices
4. Handle guest participation without requiring full registration
5. Implement progressive registration (start anonymous, upgrade to account)
6. Support team/organization accounts with role-based permissions
7. Provide secure poll sharing with customizable privacy levels
8. Handle GDPR compliance with clear data management controls
9. Support single sign-on (SSO) for enterprise customers
10. Implement secure poll access with optional password protection

The authentication flow should be invisible when possible, allowing users to focus on scheduling rather than account management. Guest users should have a smooth path to creating accounts when they see value, without losing their poll history or preferences.

Security requirements:
- End-to-end encryption for sensitive poll data
- Secure token management with automatic refresh
- Rate limiting and abuse prevention
- Audit logging for enterprise accounts
- Data export and deletion capabilities for GDPR compliance
```

## /specify - Historique des Conversations IA

### Dashboard avec Historique des Conversations
```
/specify
Créer un système d'historique des conversations IA intégré au dashboard DooDates qui permet aux utilisateurs de consulter, reprendre et gérer leurs interactions passées avec l'assistant IA. Le système doit :

1. **Organisation du Dashboard** : 
   - Section "Mes Sondages" : liste des sondages actifs/terminés avec badge "Créé par IA" si applicable
   - Section "Mes Conversations" : historique IA séparé avec statuts visuels
   - Relations visuelles claires entre conversations et sondages créés
   - Éviter la duplication : chaque élément a sa section dédiée

2. **Affichage des Conversations** :
   - Liste chronologique des conversations avec aperçu du premier message
   - Indicateurs visuels de statut :
     * 🟡 En cours (conversation active, pas de sondage)
     * 🟢 Terminée → Sondage créé (avec lien direct)
     * 🔗 Lien bidirectionnel vers le sondage associé
   - Recherche et filtrage par date, mots-clés, ou statut

3. **Gestion des Conversations** :
   - Possibilité de reprendre une conversation interrompue
   - Renommer les conversations pour une meilleure organisation
   - Supprimer les conversations non désirées
   - Marquer des conversations comme favorites/importantes

4. **Persistance et Synchronisation** :
   - Sauvegarde automatique de chaque échange IA
   - Synchronisation entre appareils pour les utilisateurs connectés
   - Conservation des conversations pour les utilisateurs invités (localStorage)
   - Migration automatique vers compte utilisateur lors de l'inscription

5. **Interface Utilisateur** :
   - Design cohérent avec l'interface existante DooDates
   - Prévisualisation rapide du contenu sans quitter le dashboard
   - Actions rapides : reprendre, renommer, supprimer, partager
   - Responsive design pour mobile et desktop

6. **Intégration avec le Chat** :
   - Bouton "Reprendre" qui ouvre directement la conversation dans l'interface chat
   - Contexte préservé : l'IA se souvient de l'état de la conversation
   - Possibilité de créer un nouveau sondage à partir d'une conversation archivée
   - Liens vers les sondages créés depuis chaque conversation

Le système doit être intuitif et encourager les utilisateurs à revenir sur DooDates en leur montrant l'historique de leurs interactions et en facilitant la reprise de projets de sondages inachevés.

Cas d'usage principaux :
- Utilisateur qui revient après quelques jours pour finaliser un sondage commencé
- Utilisateur qui veut créer un sondage similaire à un précédent
- Utilisateur qui cherche une conversation spécifique par mot-clé
- Utilisateur qui veut nettoyer son historique en supprimant les conversations inutiles

**Architecture du Dashboard :**
- Section "Mes Sondages" et "Mes Conversations" séparées pour éviter confusion
- Relations visuelles claires : conversation → sondage avec badges et liens
- Respect des modèles mentaux utilisateur (conversation ≠ sondage final)
- Actions spécifiques à chaque type de contenu

**Edge Cases & Gestion d'Erreurs :**
- Conversation interrompue brutalement (fermeture navigateur, perte réseau)
- Conversation qui génère plusieurs sondages (itérations, modifications)
- Sondage supprimé → suppression automatique de la conversation associée
- Limite de stockage localStorage atteinte (utilisateurs invités)
- Conflit de synchronisation entre appareils (même conversation modifiée)
- Conversation très longue (performance d'affichage et de recherche)
- Migration échouée localStorage → compte utilisateur
- Données corrompues dans l'historique (parsing JSON)

**Limites & Contraintes :**
- Nombre maximum de conversations stockées (1 pour invités, illimité pour comptes authentifiés)
- Stratégie freemium : inciter à l'authentification pour plus de conversations
- Durée de rétention des conversations (ex: 30 jours pour invités, 1 an pour comptes)
- Taille maximale d'une conversation (éviter les conversations infinies)
- Fréquence de sauvegarde automatique (éviter la surcharge)
- Gestion de la mémoire pour les longues listes de conversations

**Gestion des Suppressions :**
- Suppression sondage → suppression automatique conversation associée (cascade)
- Notification utilisateur avant suppression automatique
- Possibilité de conserver conversation sans lien (optionnel)
- Nettoyage automatique des références orphelines

**États d'Erreur à Gérer :**
- Conversation non trouvée (ID invalide)
- Échec de reprise de conversation (contexte perdu)
- Erreur de synchronisation (affichage état "sync en cours")
- Sondage associé inaccessible (permissions, suppression)
- Recherche sans résultats (message explicatif)
- Actions impossibles (renommer conversation système, supprimer conversation active)



## /plan - Implémentation Technique Historique Conversations

### Architecture & Stack Technique
```
/plan
Implémenter l'historique des conversations IA dans DooDates en utilisant le stack existant React 18 + Vite + TypeScript + TailwindCSS avec les spécifications techniques suivantes :

**Structure des Données :**
```typescript
interface Conversation {
  id: string;                    // UUID unique
  title: string;                 // Nom personnalisable
  status: 'active' | 'completed' | 'archived';
  createdAt: Date;
  updatedAt: Date;
  firstMessage: string;          // Aperçu (premiers 100 chars)
  messageCount: number;
  relatedPollId?: string;        // Lien vers sondage créé
  relatedPollSlug?: string;      // Slug pour navigation
  isFavorite: boolean;
  tags: string[];               // Pour recherche/filtrage
}

interface ConversationMessage {
  id: string;
  conversationId: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  metadata?: {
    pollGenerated?: boolean;
    errorOccurred?: boolean;
  };
}
```

**Stockage & Persistance :**
- **localStorage** : conversations utilisateurs invités (1 max)
- **Supabase** : conversations utilisateurs authentifiés (illimité)
- **Migration automatique** : localStorage → Supabase lors de l'inscription
- **Compression** : JSON.stringify avec compression pour gros volumes
- **Indexation** : index sur conversationId, userId, createdAt pour performance

**Composants React à Créer :**
```
src/components/conversations/
├── ConversationHistory.tsx        # Section dashboard principale
├── ConversationList.tsx           # Liste avec recherche/filtres
├── ConversationCard.tsx           # Card individuelle avec actions
├── ConversationPreview.tsx        # Modal aperçu rapide
├── ConversationActions.tsx        # Menu actions (renommer, supprimer, etc.)
└── ConversationSearch.tsx         # Barre recherche avec filtres
```

**Hooks Personnalisés :**
```typescript
// Gestion état conversations
useConversations() // Liste, CRUD, sync
useConversationStorage() // localStorage/Supabase
useConversationSync() // Sync entre appareils
useConversationSearch() // Recherche/filtrage
useConversationQuota() // Gestion limites invités
```

**Intégration Dashboard Existant :**
- Modifier `src/components/Dashboard.tsx` pour ajouter section "Mes Conversations"
- Utiliser composants Shadcn/ui existants : Card, Badge, Button, Input, Dialog
- Respecter design system actuel avec TailwindCSS
- Navigation via React Router vers `/chat?resume=conversationId`

**Gestion d'État :**
- **React Context** pour état global conversations (si nécessaire)
- **Optimistic Updates** pour actions rapides (renommer, favoris)
- **Error Boundaries** pour gestion erreurs robuste
```

### Stratégie de Stockage
```
/plan
Implémentation hybride localStorage/Supabase avec migration transparente :

**Utilisateurs Invités (localStorage) :**
- Clé : `doodates_conversations` 
- Structure : `{ conversations: Conversation[], messages: ConversationMessage[] }`
- Limite : 1 conversation max
- Compression : LZ-string pour optimiser espace
- Expiration : 30 jours avec nettoyage automatique

**Utilisateurs Authentifiés (Supabase) :**
```sql
-- Table conversations
CREATE TABLE conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  status TEXT CHECK (status IN ('active', 'completed', 'archived')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  first_message TEXT,
  message_count INTEGER DEFAULT 0,
  related_poll_id UUID,
  related_poll_slug TEXT,
  is_favorite BOOLEAN DEFAULT FALSE,
  tags TEXT[] DEFAULT '{}'
);

-- Table messages
CREATE TABLE conversation_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
  role TEXT CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  metadata JSONB
);

-- Index pour performance
CREATE INDEX idx_conversations_user_created ON conversations(user_id, created_at DESC);
CREATE INDEX idx_messages_conversation ON conversation_messages(conversation_id, timestamp);
```

**Migration localStorage → Supabase :**
- Déclenchement : lors de l'authentification utilisateur
- Process : lecture localStorage → validation → insertion Supabase → nettoyage local
- Gestion erreurs : rollback si échec, retry automatique
- Feedback utilisateur : progress bar pendant migration

**Synchronisation Multi-Appareils :**
- Real-time subscriptions Supabase pour conversations actives
- Conflict resolution : last-write-wins avec timestamp
- Offline support : queue des actions en attente de sync
```

### Gestion des Quotas & Freemium
```
/plan
Stratégie freemium agressive pour inciter à l'authentification :

**Limites Utilisateurs Invités :**
- 1 conversation maximum stockée
- Nouvelle conversation → suppression automatique de l'ancienne
- Modal d'incitation : "Créez un compte pour sauvegarder toutes vos conversations"
- Prévisualisation des fonctionnalités premium dans l'UI

**Gestion Dépassement Quota :**
```typescript
const handleNewConversation = (guestMode: boolean) => {
  if (guestMode && conversationCount >= 1) {
    showUpgradeModal({
      title: "Sauvegardez vos conversations",
      message: "Créez un compte gratuit pour conserver toutes vos conversations IA",
      action: "Créer un compte",
      onConfirm: () => router.push('/auth/signup')
    });
    // Supprimer ancienne conversation après confirmation
    deleteOldestConversation();
  }
  createNewConversation();
};
```

**Incitations à l'Authentification :**
- Badge "Premium" sur fonctionnalités limitées
- Compteur conversations : "1/1 (Créez un compte pour plus)"
- Call-to-action dans interface : "Débloquez l'historique illimité"
- Onboarding guidé vers création compte
```

### Intégration Chat Existant
```
/plan
Connexion transparente avec l'interface chat actuelle :

**Reprise de Conversation :**
- URL : `/chat?resume=conversationId`
- Chargement contexte complet dans ChatInterface.tsx
- Restauration état IA avec historique messages
- Indication visuelle "Conversation reprise" dans chat

**Sauvegarde Automatique :**
- Hook `useAutoSave` dans ChatInterface
- Sauvegarde après chaque échange user/assistant
- Debounce 2 secondes pour éviter spam
- Gestion erreurs avec retry automatique

**Liens Bidirectionnels :**
- Conversation → Sondage : bouton "Voir le sondage créé"
- Sondage → Conversation : badge "Créé par IA" avec lien retour
- Navigation fluide sans perte de contexte

**États de Conversation :**
- 'active' : conversation en cours dans chat
- 'completed' : sondage créé avec succès
- 'archived' : conversation ancienne ou abandonnée
```

### Stratégie de Tests
```
/plan
Tests complets pour garantir la fiabilité de l'historique des conversations :

**Tests Unitaires (Vitest) :**
```typescript
// src/lib/__tests__/conversation-storage.test.ts
describe('ConversationStorage', () => {
  test('localStorage: limite 1 conversation pour invités')
  test('localStorage: suppression automatique ancienne conversation')
  test('localStorage: compression/décompression LZ-string')
  test('localStorage: expiration 30 jours')
  test('Supabase: CRUD conversations authentifiées')
  test('Migration localStorage → Supabase')
  test('Gestion erreurs corruption JSON')
})

// src/hooks/__tests__/useConversations.test.ts
describe('useConversations', () => {
  test('Chargement liste conversations')
  test('Création nouvelle conversation')
  test('Reprise conversation existante')
  test('Gestion quota invités')
  test('Synchronisation temps réel')
  test('Recherche et filtrage')
})
```

**Tests d'Intégration (Vitest) :**
```typescript
// src/components/__tests__/conversation-integration.test.ts
describe('ConversationIntegration', () => {
  test('Dashboard → Chat : reprise conversation')
  test('Chat → Dashboard : sauvegarde automatique')
  test('Conversation → Sondage : liens bidirectionnels')
  test('Suppression sondage → suppression conversation')
  test('Migration invité → utilisateur authentifié')
})
```

**Tests E2E (Playwright) ✅ COMPLETED**
```typescript
// tests/e2e/conversation-history.spec.ts
test('Workflow complet utilisateur invité', async ({ page }) => {
  // Créer conversation → atteindre limite → modal upgrade
  // Créer compte → migration automatique → historique préservé
})

test('Workflow utilisateur authentifié', async ({ page }) => {
  // Créer multiples conversations → recherche → reprise
  // Tester synchronisation entre onglets/appareils
  // Workflow complet : conversation → sondage → liens bidirectionnels
})

test('Tests edge cases et erreurs', async ({ page }) => {
  // Perte réseau pendant sauvegarde
  // Corruption localStorage
  // Sondage supprimé → conversation nettoyée
})

test('Tests performance gros volumes', async ({ page }) => {
  // Chargement rapide avec 100+ conversations
  // Recherche temps réel fluide
  // Pas de lag lors du scroll
})

test('Tests sécurité et isolation', async ({ page }) => {
  // Isolation conversations entre utilisateurs (RLS Supabase)
  // Validation input utilisateur (XSS, injection)
  // Gestion tokens expirés
  // Rate limiting API calls
}
```

**Tests de Performance :**
- Chargement rapide avec 100+ conversations
- Recherche temps réel fluide
- Pas de lag lors du scroll

**Tests Accessibilité :**
- Navigation clavier complète
- Lecteurs d'écran compatibles
- Contraste couleurs suffisant

**Tests Cross-Browser :**
- Chrome, Firefox, Safari, Edge
- Versions mobiles iOS/Android
- Fonctionnalités localStorage/IndexedDB

## Plan de Développement Détaillé

# Phase 1: Infrastructure & Stockage 
## Task 1.1 : Structure des Données ✅ Créer les interfaces TypeScript et schémas de validation
## Task 1.2 : Stockage localStorage ✅ Implémenter le stockage local avec compression et gestion des quotas
## Task 1.3: Base de Données Supabase ✅ 
## Task 1.4: Migration localStorage → Supabase ✅ 

# Phase 2: Hooks & Services
## Task 2.1: Hook useConversationStorage ✅
## Task 2.2: Hook useConversations ✅
## Task 2.3: Hook useConversationQuota ✅
## Task 2.4: Hook useConversationSearch ✅

# Phase 3: Composants UI

## Task 3.1: ConversationCard Component ✅
- [x] Design card avec Shadcn/ui
- [x] Aperçu premier message (100 chars)
- [x] Indicateurs statut visuels (🟡🟢🔗)
- [x] Actions rapides (reprendre, renommer, supprimer)
- [x] Responsive design mobile/desktop

## Task 3.2: ConversationList Component ✅ COMPLETED
- [x] Liste virtualisée pour performance
- [x] Tri chronologique par défaut
- [x] États vides avec call-to-action
- [x] Loading skeletons
- [x] Tests rendering et interactions

## Task 3.3: ConversationSearch Component ✅ COMPLETED
- [x] Barre recherche avec icône
- [x] Filtres dropdown (statut, date)
- [x] Clear filters button
- [x] Résultats highlighting
- [x] Tests recherche UI

## Task 3.4: ConversationActions Component ✅ COMPLETED
- [x] Menu dropdown avec actions
- [x] Modals confirmation suppression
- [x] Renommage inline avec validation
- [x] Toggle favoris avec feedback
- [x] Tests actions utilisateur

## Task 3.5: ConversationPreview Component ✅ COMPLETED
- [x] Modal aperçu rapide conversation
- [x] Navigation messages avec scroll
- [x] Bouton "Reprendre" vers chat
- [x] Lien vers sondage associé si existe
- [x] Tests modal et navigation

## Task 3.6: ConversationHistory Component ✅ COMPLETED
- [x] Container principal pour dashboard
- [x] Intégration tous sous-composants
- [x] Gestion états globaux
- [x] Error boundaries
- [x] Tests intégration complète

# Phase 4: Intégration Dashboard & Chat

## Task 4.1: Modification Dashboard.tsx ✅ COMPLETED
- [x] Ajouter section "Mes Conversations"
- [x] Intégration ConversationHistory component
- [x] Gestion responsive layout
- [x] Navigation entre sections
- [x] Tests intégration dashboard

## Task 4.2: Intégration ChatInterface.tsx ✅
- [x] Hook useAutoSave pour sauvegarde auto
- [x] Hook useConversationResume pour reprise conversation
- [x] Restauration contexte IA complet
- [x] Indication visuelle "Conversation reprise"
- [x] Intégration complète dans GeminiChatInterface

## Task 4.3: Liens Bidirectionnels ✅
- [x] Badge "Créé par IA" sur sondages
- [x] Hook usePollConversationLink pour liaison bidirectionnelle
- [x] Liens conversation → sondage automatiques
- [x] Navigation fluide avec métadonnées conversation
- [x] Intégration PollCreator et GeminiChatInterface
- [x] Hook usePollDeletionCascade pour gestion suppression
- [x] Gestion sondages supprimés (cascade)
- [x] Tests navigation bidirectionnelle complets

## Task 4.4: Gestion Quotas Freemium ✅
- [x] Hook useFreemiumQuota pour gestion quotas
- [x] Modals incitation authentification (AuthIncentiveModal)
- [x] Compteurs visuels "1/10 conversations" (QuotaIndicator)
- [x] Badges "Premium" sur fonctionnalités (PremiumBadge)
- [x] Intégration GeminiChatInterface avec enforcement quotas
- [x] Système complet freemium avec modals et indicateurs
- [x] Tests workflow freemium complet

# Phase 5: Tests & Optimisation

## Task 5.1: Tests Unitaires Complets ✅ COMPLETED
- [x] Tests hooks avec React Testing Library
- [x] Tests composants avec mocks
- [x] Tests services localStorage/Supabase
- [x] Coverage 90%+ sur code critique
- [x] CI/CD intégration tests

## Task 5.2: Tests E2E Playwright ✅ COMPLETED
- [x] Workflow utilisateur invité complet
- [x] Workflow utilisateur authentifié
- [x] Tests edge cases et erreurs
- [x] Tests performance gros volumes
- [x] Tests sécurité et isolation

## Recommandations d'architecture simplifiée ✅ COMPLETED

### Priorité 1 - Critique : ✅ COMPLETED
- [x] Nettoyer useAutoSave.ts - Supprimer le code mort (debouncedSave, forceSave)
- [x] Nettoyer les logs dans l'application (300+ console.log en production)
- [x] Gestion d'erreurs inconsistante

### Priorité 2 - Important : ✅ COMPLETED
- [x] Refactoriser useConversationSearch.ts - Service externe + cache
- [x] Consolider les hooks de quota - Un seul hook unifié

### Priorité 3 - Amélioration : ✅ COMPLETED
- [x] Standardiser les patterns useEffect - Guidelines cohérentes
- [x] Créer des services métier - Sortir la logique complexe des hooks

### Priorité 4 - Nouvelles découvertes (Session 10/09/2025) : ✅ COMPLETED
- [x] **Logs de debug excessifs** : 300+ console.log encore présents (GeminiChatInterface: 22, usePolls: 21, email-service: 20)
- [x] **Cohérence des systèmes de stockage** : Unifier localStorage keys (dev-polls vs doodates_polls)
- [x] **Duplication de logique localStorage** : usePolls.ts fait du localStorage direct au lieu d'utiliser pollStorage.ts
- [x] **Types incohérents** : Poll interface différente entre usePolls.ts et pollStorage.ts
- [x] **Gestion d'erreurs inconsistante** : Mélange de console.error et throw Error
- [x] **useEffect sans cleanup** : Plusieurs composants avec des event listeners non nettoyés
- [x] **The centralized error** handling system exists but needs broader adoption. 
- [x] **Type safety faible** : Usage de `any` dans pollStorage.ts et FormPoll components
- [x] **Code mort dans usePolls.ts** : getPollBySlug utilise encore localStorage direct
- [x] **Logique métier dans les composants** : PollCreator.tsx contient trop de logique de création
- [x] **Inconsistance des URLs** : Liens d'admin pointaient vers /admin au lieu de /poll/results

## Task 5.3: Tests Manuels & Acceptance Utilisateur
- [ ] **Scénarios Utilisateur Invité** :
  - Créer compte → vérifier migration automatique
  - Tester persistance localStorage après fermeture navigateur
- [ ] **Scénarios Utilisateur Authentifié** :
  - Créer multiples conversations → recherche → reprise
  - Tester synchronisation entre onglets/appareils
  - Workflow complet : conversation → sondage → liens bidirectionnels
- [ ] **Tests Interface Mobile** :
  - Navigation tactile sur ConversationCard
  - Actions rapides accessibles au doigt
  - Responsive design sur différentes tailles écran
- [ ] **Tests Performance Utilisateur** :
  - Chargement rapide avec 100+ conversations
  - Recherche temps réel fluide
  - Pas de lag lors du scroll
- [ ] **Tests Accessibilité** :
  - Navigation clavier complète
  - Lecteurs d'écran compatibles
  - Contraste couleurs suffisant
- [ ] **Tests Cross-Browser** :
  - Chrome, Firefox, Safari, Edge
  - Versions mobiles iOS/Android
  - Fonctionnalités localStorage/IndexedDB

## Task 5.4: Optimisation Performance
- [ ] Lazy loading composants
- [ ] Virtualisation listes longues
- [ ] Optimisation requêtes Supabase
- [ ] Compression localStorage optimale
- [ ] Monitoring performance

## Task 5.5: Documentation & Déploiement
- [ ] Documentation technique composants
- [x] **Guide de test manuel** avec checklist


-------------------------------------------------------------------------------------------------------------------

