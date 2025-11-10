# Plan d'Implémentation - Architecture Centrée Conversations

## Vue d'Ensemble

**Objectif :** Transformer l'architecture pour que les conversations soient l'unité centrale, avec les sondages/formulaires comme attributs optionnels.

**Durée estimée :** 12-14h réparties sur 6 sessions

## Statut Global

- ✅ **Session 1** - Modèle de données & Storage (3h)
- ✅ **Session 2** - Dashboard & Création automatique conversations (2h30)
- ⏳ **Session 3** - Sidebar & Navigation (1-2h)
- ⏳ **Session 4** - Liaison automatique Poll ↔ Conversation (1-2h)
- ⏳ **Session 5** - Split-Screen Chat + Preview (2-3h)
- ⏳ **Session 6** - Polish & Tests finaux (2-3h)

## Changements Majeurs Session 2

**Décision stratégique :** Création automatique de conversations vides pour les polls créés manuellement.

**Avant :**
- Polls créés via IA → Ont une conversation
- Polls créés manuellement → Orphelins (pas de conversation)
- Dashboard avec 2 onglets : "Mes Sondages" + "Mes Conversations"

**Après :**
- **TOUS les polls** (IA ou manuels) → Ont une conversation
- Polls manuels → Conversation vide créée automatiquement
- Dashboard simplifié : Uniquement "Mes Conversations"
- Possibilité de modifier n'importe quel poll avec l'IA après création

**Avantages :**
- 🎯 Architecture cohérente (pas de cas spéciaux)
- 🎯 Dashboard unifié (une seule liste)
- 🎯 Modification IA possible pour tous les polls
- 🎯 Simplification du code (moins de conditions)

---

## Session 1 : Modèle de Données & Storage (2-3h) ✅ TERMINÉE

### Tâches

**1.1 Extension des types TypeScript (30min) ✅**
- Fichier : `src/lib/storage/ConversationStorageSimple.ts`
- Ajouter champs à `Conversation` :
  ```typescript
  pollId?: string;
  pollType?: "date" | "form" | null;
  pollStatus?: "draft" | "active" | "closed" | "archived";
  ```

**1.2 Extension pollStorage (30min) ✅**
- Fichier : `src/lib/pollStorage.ts`
- ✅ Ajout champ `conversationId?: string` à `Poll`
- ✅ Fonction `getPollByConversationId(conversationId: string)` créée
- ✅ Fonction `updatePollConversationLink(pollId: string, conversationId: string)` créée

**1.3 Service de liaison (1h) ✅**
- Fichier : `src/lib/ConversationPollLink.ts` (enrichi)
- ✅ Fonction `linkPollToConversationBidirectional(conversationId, pollId, pollType)` créée
- ✅ Fonction `unlinkPollFromConversation(conversationId)` créée
- ✅ Fonction `getConversationWithPoll(conversationId)` créée

**1.4 Helpers de filtrage (30min) ✅**
- Fichier : `src/lib/conversationFilters.ts` (CRÉÉ)
- ✅ Fonction `filterConversations(conversations, filter)` avec 6 filtres
- ✅ Fonction `enrichConversationWithStats(conversation)` créée
- ✅ Fonction `filterAndEnrichConversations()` créée

### Tests Session 1

**Tests unitaires (conversationFilters.test.ts) :**
```typescript
describe('filterConversations', () => {
  test('filtre "all" retourne toutes les conversations', () => {
    const convs = [conv1, conv2, conv3];
    expect(filterConversations(convs, 'all')).toHaveLength(3);
  });

  test('filtre "with-poll" retourne uniquement conversations avec sondage date', () => {
    const convs = [
      { id: '1', pollType: 'date' },
      { id: '2', pollType: 'form' },
      { id: '3', pollType: null }
    ];
    expect(filterConversations(convs, 'with-poll')).toHaveLength(1);
  });

  test('filtre "draft" retourne uniquement brouillons', () => {
    const convs = [
      { id: '1', pollStatus: 'draft' },
      { id: '2', pollStatus: 'active' }
    ];
    expect(filterConversations(convs, 'draft')).toHaveLength(1);
  });
});
```

**Tests manuels :**
1. Créer conversation via chat
2. Générer un sondage dans cette conversation
3. Vérifier dans localStorage que :
   - `conversation.pollId` est défini
   - `poll.conversationId` est défini
   - Les deux IDs correspondent

---

## Session 2 : Dashboard - Liste Conversations (2-3h) ✅ TERMINÉE

### Tâches

**2.1 Mise à jour ConversationCard.tsx (45min) ✅**
- ✅ Support des nouveaux champs `pollId`, `pollType`, `pollStatus`
- ✅ Affichage intelligent du status selon le poll lié
- ✅ Affichage des stats enrichies (participants, top dates)
- ✅ Callback `onViewResults` ajouté
- ✅ Icônes différentes selon le type de poll

**2.2 Refonte Dashboard.tsx (1h) ✅**
- ✅ Suppression de l'onglet "Mes Sondages"
- ✅ Garde uniquement "Mes Conversations"
- ✅ Header simplifié avec icône MessageSquare
- ✅ Section Conversations toujours affichée (plus de condition)
- ✅ Enrichissement des conversations avec `enrichConversationsWithStats()`

**2.3 Création automatique de conversations pour polls manuels (1h) ✅**
- ✅ Nouvelle fonction `createConversationForPoll()` dans `ConversationPollLink.ts`
- ✅ Intégration dans `PollCreator.tsx` (sondages de dates)
- ✅ Intégration dans `FormPollCreator.tsx` (formulaires)
- ✅ Logique : Si pas de `conversationId` dans l'URL → Créer conversation vide automatiquement
- ✅ Résultat : **TOUS les polls** (IA ou manuels) ont maintenant une conversation associée

**Changement stratégique :**
Au lieu d'avoir des polls orphelins, on crée automatiquement une conversation vide quand un poll est créé manuellement. Cela permet :
- Dashboard unifié (une seule liste)
- Possibilité de modifier avec l'IA après création manuelle
- Architecture cohérente (pas de cas spéciaux)

### Tests Session 2

**Tests unitaires (ConversationCard.test.tsx) :**
```typescript
describe('ConversationCard', () => {
  test('affiche badge "Sondage" si pollType=date', () => {
    const conv = { pollType: 'date', pollStatus: 'active' };
    render(<ConversationCard conversation={conv} />);
    expect(screen.getByText(/Sondage/i)).toBeInTheDocument();
  });

  test('affiche top dates si sondage avec votes', () => {
    const conv = { 
      pollType: 'date',
      topDates: [{ date: '15/11', score: 12 }]
    };
    render(<ConversationCard conversation={conv} />);
    expect(screen.getByText(/15\/11/)).toBeInTheDocument();
  });

  test('affiche "Discussion sans sondage" si pas de poll', () => {
    const conv = { pollType: null };
    render(<ConversationCard conversation={conv} />);
    expect(screen.getByText(/Discussion sans sondage/i)).toBeInTheDocument();
  });
});
```

**Tests manuels :**
1. **Test création poll manuel (sondage de dates) :**
   - Créer un sondage via le bouton "Créer un sondage" (sans IA)
   - Finaliser le sondage
   - Aller sur `/dashboard`
   - ✅ Vérifier qu'une conversation apparaît avec le sondage lié
   - ✅ Vérifier le badge "📅 Sondage actif"
   - ✅ Vérifier le nombre de participants (0 au départ)

2. **Test création poll manuel (formulaire) :**
   - Créer un formulaire via `/form/create` (sans IA)
   - Finaliser le formulaire
   - Aller sur `/dashboard`
   - ✅ Vérifier qu'une conversation apparaît avec le formulaire lié
   - ✅ Vérifier le badge "📋 Formulaire actif"

3. **Test création via IA :**
   - Créer un sondage via le chat IA
   - Aller sur `/dashboard`
   - ✅ Vérifier que la conversation apparaît avec le sondage lié
   - ✅ Vérifier que le bouton "Reprendre" fonctionne

4. **Test enrichissement stats :**
   - Voter sur un sondage existant
   - Retourner sur `/dashboard`
   - ✅ Vérifier que le nombre de participants est mis à jour
   - ✅ Vérifier que les top dates s'affichent (si sondage de dates)

---

## Session 3 : Sidebar & Navigation (1-2h)

### Tâches

**3.1 Mise à jour SidebarContent.tsx (30min)**
- Remplacer "Mes sondages" par "Mes Conversations"
- Icône : `MessageSquare` au lieu de `LayoutDashboard`
- Lien vers `/dashboard`
- Supprimer "Résultats" de la navigation principale

**3.2 Mise à jour routes (30min)**
- Vérifier que `/dashboard` affiche bien le nouveau Dashboard
- S'assurer que la navigation fonctionne depuis tous les points d'entrée

### Tests Session 3

**Tests E2E (sidebar-navigation.spec.ts) :**
```typescript
test('sidebar affiche "Mes Conversations"', async ({ page }) => {
  await page.goto('/');
  await page.click('[data-testid="sidebar-toggle"]'); // Si mobile
  await expect(page.getByText('Mes Conversations')).toBeVisible();
});

test('clic sur "Mes Conversations" navigue vers dashboard', async ({ page }) => {
  await page.goto('/');
  await page.click('text=Mes Conversations');
  await expect(page).toHaveURL('/dashboard');
});
```

**Tests manuels :**
1. Ouvrir sidebar (desktop et mobile)
2. Vérifier texte "Mes Conversations" visible
3. Cliquer → Vérifier navigation vers `/dashboard`
4. Vérifier que "Résultats" n'est plus dans la sidebar

---

## Session 4 : Liaison Automatique Poll ↔ Conversation (2h)

### Tâches

**4.1 Modification GeminiChatInterface.tsx (1h)**
- Lors de la création d'un poll via IA :
  ```typescript
  const newPoll = await createPoll(pollData);
  await linkPollToConversation(currentConversationId, newPoll.id, newPoll.type);
  ```
- Mettre à jour le state local de la conversation

**4.2 Modification PollCreator.tsx (30min)**
- Lors de la publication d'un sondage :
  - Vérifier si `conversationId` existe dans les params/context
  - Si oui, lier automatiquement
  - Sinon, créer une conversation "orpheline" (pour rétrocompatibilité)

**4.3 Modification FormPollCreator.tsx (30min)**
- Même logique que PollCreator
- Lier formulaire à conversation lors de la finalisation

### Tests Session 4

**Tests unitaires (ConversationPollLink.test.ts) :**
```typescript
describe('linkPollToConversation', () => {
  test('met à jour conversation avec pollId', async () => {
    const convId = 'conv-1';
    const pollId = 'poll-1';
    
    await linkPollToConversation(convId, pollId, 'date');
    
    const conv = await getConversation(convId);
    expect(conv.pollId).toBe(pollId);
    expect(conv.pollType).toBe('date');
  });

  test('met à jour poll avec conversationId', async () => {
    const convId = 'conv-1';
    const pollId = 'poll-1';
    
    await linkPollToConversation(convId, pollId, 'date');
    
    const poll = await getPoll(pollId);
    expect(poll.conversationId).toBe(convId);
  });
});
```

**Tests manuels :**
1. **Scénario IA :**
   - Ouvrir chat
   - Demander "Crée un sondage pour mardi ou mercredi"
   - Vérifier que le sondage est créé
   - Aller au Dashboard
   - Vérifier que la conversation affiche le sondage lié
   
2. **Scénario manuel :**
   - Créer un sondage via `/create`
   - Publier
   - Vérifier qu'une conversation est créée (ou liée si existante)
   - Dashboard doit afficher la conversation avec le sondage

---

## Session 5 : Split-Screen Chat + Preview (3-4h)

### Tâches

**5.1 Nouveau composant ChatWithPreview.tsx (2h)**
- Fichier : `src/pages/ChatWithPreview.tsx` (NOUVEAU)
- Layout split-screen :
  - Gauche (50%) : `GeminiChatInterface`
  - Droite (50%) : `PollPreview` ou `FormPreview` (conditionnel)
- Responsive : Stack vertical sur mobile
- Gestion du state partagé (conversation + poll)

**5.2 Modification navigation Dashboard (30min)**
- Bouton "Ouvrir" → `navigate(/chat?resume=${conversationId})`
- Charger conversation + poll lié
- Afficher split-screen si poll existe, sinon chat plein écran

**5.3 Synchronisation édition (1h)**
- Modifications IA → Mise à jour preview en temps réel
- Modifications manuelles preview → Mise à jour conversation
- Bouton "Publier" dans preview → Mise à jour status

### Tests Session 5

**Tests E2E (split-screen.spec.ts) :**
```typescript
test('ouvrir conversation avec sondage affiche split-screen', async ({ page }) => {
  // Créer conversation + sondage
  await createConversationWithPoll();
  
  await page.goto('/dashboard');
  await page.click('[data-testid="open-conversation"]');
  
  // Vérifier split-screen
  await expect(page.locator('[data-testid="chat-panel"]')).toBeVisible();
  await expect(page.locator('[data-testid="poll-preview"]')).toBeVisible();
});

test('modification via IA met à jour le preview', async ({ page }) => {
  await page.goto('/chat?resume=conv-with-poll');
  
  await page.fill('[data-testid="chat-input"]', 'Ajoute vendredi');
  await page.click('[data-testid="send-button"]');
  
  // Attendre réponse IA
  await page.waitForSelector('[data-testid="ai-response"]');
  
  // Vérifier preview mis à jour
  await expect(page.locator('[data-testid="poll-preview"]')).toContainText('Vendredi');
});
```

**Tests manuels :**
1. Créer conversation avec sondage
2. Cliquer "Ouvrir" depuis Dashboard
3. Vérifier split-screen affiché
4. Modifier via IA ("Ajoute vendredi")
5. Vérifier preview mis à jour instantanément
6. Modifier manuellement dans preview
7. Vérifier conversation mise à jour
8. Tester sur mobile (stack vertical)

---

## Session 6 : Polish & Tests Finaux (2h)

### Tâches

**6.1 Gestion des cas limites (1h)**
- Conversation sans poll → Chat plein écran
- Poll orphelin (sans conversation) → Créer conversation automatiquement
- Suppression conversation → Gérer le poll lié (archiver ou supprimer)
- Suppression poll → Mettre à jour conversation

**6.2 Amélioration UX (30min)**
- Loading states pendant chargement conversation + poll
- Animations transitions split-screen
- Toasts de confirmation actions
- Messages d'erreur explicites

**6.3 Documentation (30min)**
- Mettre à jour `README.md` avec nouvelle architecture
- Documenter `ConversationPollLink.ts`
- Ajouter exemples d'usage dans les commentaires

### Tests Session 6

**Tests d'intégration complets :**

**Scénario 1 : Création complète**
1. Ouvrir `/` (chat vide)
2. Demander "Organise une réunion mardi ou mercredi"
3. Vérifier sondage créé et lié
4. Publier le sondage
5. Aller au Dashboard
6. Vérifier conversation affichée avec sondage actif
7. Cliquer "Ouvrir"
8. Vérifier split-screen
9. Modifier via IA
10. Publier modifications
11. Vérifier résultats accessibles

**Scénario 2 : Reprise conversation**
1. Aller au Dashboard
2. Filtrer "Brouillons"
3. Cliquer "Ouvrir" sur un brouillon
4. Vérifier chat + preview chargés
5. Continuer édition
6. Publier
7. Vérifier status mis à jour dans Dashboard

**Scénario 3 : Conversation sans sondage**
1. Créer conversation sans générer de sondage
2. Vérifier affichage dans Dashboard (filtre "Sans sondage")
3. Ouvrir conversation
4. Vérifier chat plein écran (pas de preview)
5. Générer un sondage via IA
6. Vérifier preview apparaît
7. Retour Dashboard → Vérifier filtre "Avec sondage" fonctionne

**Scénario 4 : Suppression**
1. Supprimer une conversation avec sondage
2. Vérifier le sondage est archivé (pas supprimé)
3. Supprimer un sondage depuis la conversation
4. Vérifier conversation mise à jour (pollId = null)

---

## Checklist Finale

### Fonctionnalités

- [ ] Conversations affichées dans Dashboard
- [ ] Filtres fonctionnent (all, with-poll, with-form, no-poll, draft, published)
- [ ] Liaison automatique poll ↔ conversation
- [ ] Split-screen chat + preview
- [ ] Modification via IA met à jour preview
- [ ] Publication depuis preview fonctionne
- [ ] Sidebar affiche "Mes Conversations"
- [ ] Navigation fluide entre Dashboard et Chat
- [ ] Gestion cas limites (sans poll, orphelins, suppressions)

### Tests

- [ ] 15+ tests unitaires (filtres, liaison, cards)
- [ ] 10+ tests E2E (navigation, split-screen, modifications)
- [ ] Tests manuels complets (3 scénarios principaux)
- [ ] Tests mobile (responsive)
- [ ] Tests performance (chargement conversations)

### Documentation

- [ ] README.md mis à jour
- [ ] Commentaires JSDoc sur nouvelles fonctions
- [ ] Guide utilisateur (si nécessaire)

---

## Estimation Temps Total

| Session | Tâches | Tests | Total |
|---------|--------|-------|-------|
| 1 | 2h30 | 30min | 3h |
| 2 | 2h | 1h | 3h |
| 3 | 1h | 1h | 2h |
| 4 | 2h | 30min | 2h30 |
| 5 | 3h | 1h | 4h |
| 6 | 1h30 | 30min | 2h |
| **TOTAL** | **12h** | **4h30** | **16h30** |

**Note :** Estimation conservatrice. Peut être réduit à 12-14h si pas de blocages majeurs.

---

## Architecture Visuelle

### Avant (Architecture actuelle)
```
Dashboard
├── Onglet "Mes Sondages" (liste de polls)
└── Onglet "Mes Conversations" (liste de conversations)

Sidebar
├── Mes sondages
├── Récents
├── Résultats
└── Paramètres
```

### Après (Architecture centrée conversations)
```
Dashboard
└── "Mes Conversations" (liste de conversations avec polls liés)
    ├── Filtres: all, with-poll, with-form, no-poll, draft, published
    └── ConversationCard
        ├── Titre conversation
        ├── Badge type (Sondage / Formulaire / Discussion)
        ├── Stats (participants, votes, réponses)
        ├── Top dates (si sondage avec votes)
        └── Actions (Ouvrir, Résultats, Menu)

Sidebar
├── Mes Conversations (💬)
├── Récents (🕐)
└── Paramètres (⚙️)

Chat (split-screen si poll existe)
├── Gauche: GeminiChatInterface
└── Droite: PollPreview / FormPreview
```

### Modèle de données

```typescript
// Conversation (enrichie)
interface Conversation {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
  messages: Message[];
  
  // NOUVEAUX CHAMPS
  pollId?: string;
  pollType?: "date" | "form" | null;
  pollStatus?: "draft" | "active" | "closed" | "archived";
  
  metadata: {
    pollGenerated: boolean;
    pollTitle?: string;
    lastModified: string;
  };
}

// Poll (enrichi)
interface Poll {
  id: string;
  title: string;
  type: "date" | "form";
  status: "draft" | "active" | "closed" | "archived";
  
  // NOUVEAU CHAMP
  conversationId?: string;
  
  // ... autres champs existants
}
```

---

## Prêt à démarrer par la Session 1 ?
