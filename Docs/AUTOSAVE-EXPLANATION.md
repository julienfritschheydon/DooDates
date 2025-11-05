# 💾 Système de Sauvegardes Automatiques

## 📋 Vue d'Ensemble

Le système de sauvegardes automatiques de DooDates sauvegarde automatiquement vos modifications de sondages et formulaires sans intervention manuelle.

## ⚙️ Comment ça fonctionne ?

### Principe du Debounce

Le système utilise un **debounce** (délai d'attente) pour éviter de sauvegarder à chaque frappe :

1. **Vous modifiez** le titre ou les questions d'un sondage
2. **Timer démarre** : Le système attend 500-800ms après votre dernière modification
3. **Si vous continuez à taper** : Le timer se réinitialise
4. **Si vous arrêtez de taper** : Après le délai, la sauvegarde s'exécute automatiquement

### Exemple concret

```
Vous tapez : "Réunion d'équipe"
│
├─ T : Timer démarre (800ms)
├─ E : Timer réinitialisé (800ms)
├─ A : Timer réinitialisé (800ms)
├─ M : Timer réinitialisé (800ms)
├─ ... (pause de 1 seconde)
│
└─ ✅ Sauvegarde automatique après 800ms d'inactivité
```

## 🔧 Implémentation Technique

### 1. FormPollCreator (Formulaires)

**Fichier :** `src/components/polls/FormPollCreator.tsx`

**Débounce :** 800ms

**Déclencheurs :**
- Modification du titre
- Ajout/suppression/modification de questions
- Changement du mode d'affichage (all-at-once / multi-step)

**Code :**
```typescript
useEffect(() => {
  if (!currentDraft.title.trim()) return; // Ne pas sauvegarder si vide
  if (autosaveTimer.current) window.clearTimeout(autosaveTimer.current);
  
  autosaveTimer.current = window.setTimeout(() => {
    upsertFormPoll(currentDraft, "draft");
  }, 800);
  
  return () => {
    if (autosaveTimer.current) window.clearTimeout(autosaveTimer.current);
  };
}, [currentDraft.title, currentDraft.questions, displayMode]);
```

### 2. ConversationProvider (Sondages de dates)

**Fichier :** `src/components/prototype/ConversationProvider.tsx`

**Débounce :** 500ms

**Déclencheurs :**
- Toute modification du poll courant (créé via IA)

**Code :**
```typescript
useEffect(() => {
  if (!currentPoll) return;
  
  if (persistenceTimerRef.current) {
    clearTimeout(persistenceTimerRef.current);
  }
  
  persistenceTimerRef.current = setTimeout(() => {
    addPoll(currentPoll as StoragePoll);
  }, 500);
  
  return () => {
    if (persistenceTimerRef.current) {
      clearTimeout(persistenceTimerRef.current);
    }
  };
}, [currentPoll]);
```

### 3. EditorStateProvider (Sauvegarde immédiate)

**Fichier :** `src/components/prototype/EditorStateProvider.tsx`

**Type :** Sauvegarde immédiate (sans débounce)

**Déclencheurs :**
- Changement du poll courant dans l'éditeur

**Code :**
```typescript
useEffect(() => {
  if (currentPoll) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(currentPoll));
    addPoll(currentPoll as any);
  }
}, [currentPoll]);
```

## 📦 Où sont stockées les données ?

### LocalStorage

Toutes les sauvegardes sont stockées dans le **localStorage** du navigateur :

- **Clé :** `doodates_polls` (sondages de dates)
- **Clé :** `doodates_form_polls` (formulaires)
- **Clé :** `doodates_conversations` (conversations)

### Avantages

✅ **Pas de perte de données** : Vos modifications sont sauvegardées même si vous fermez le navigateur
✅ **Rapide** : Pas de requête réseau, sauvegarde instantanée
✅ **Fonctionne hors ligne** : Pas besoin de connexion internet

### Limitations actuelles

⚠️ **Pas d'historique de versions** : Seule la dernière version est conservée
⚠️ **Pas de restauration** : Impossible de revenir à une version précédente
⚠️ **Local uniquement** : Les données restent sur votre machine (sauf si vous avez un compte)

## 🚀 Améliorations prévues

### Historique des versions (Future)

- Sauvegarde de 10 dernières versions
- Restauration en 1 clic
- Comparaison entre versions
- Accès via menu "Historique des versions"

### Synchronisation cloud (Future)

- Sauvegarde automatique dans le cloud si compte connecté
- Synchronisation multi-appareils
- Backup automatique

## 💡 Bonnes Pratiques

1. **Laissez le système faire** : Ne cherchez pas à sauvegarder manuellement, c'est automatique
2. **Attendez le délai** : Si vous fermez immédiatement après modification, attendez 1 seconde pour être sûr
3. **Vérifiez localStorage** : En cas de doute, vérifiez dans les DevTools (Application > Local Storage)

## 🔍 Debug

Pour vérifier que l'autosave fonctionne :

1. Ouvrir DevTools (F12)
2. Aller dans Console
3. Modifier un sondage
4. Attendre 500-800ms
5. Vérifier dans Application > Local Storage que les données sont mises à jour

---

**Note :** Ce système est conçu pour être transparent et ne nécessite aucune action de votre part. Vos modifications sont automatiquement préservées.

