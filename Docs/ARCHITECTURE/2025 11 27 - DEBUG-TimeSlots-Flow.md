# 🔍 DEBUG: Flux des Time Slots - Analyse complète

## ✅ RÉSOLU

### Cause racine identifiée
Dans `usePolls.ts`, lors de la création du poll via Supabase :
- Les `timeSlotsByDate` sont sauvegardés dans `poll_data.timeSlots` (ligne 275)
- Mais lors de la reconstruction du poll (lignes 478-481), on ne récupérait PAS `timeSlotsByDate` depuis `poll_data.timeSlots`

### Fix appliqué
**Fichier:** `src/hooks/usePolls.ts` (ligne 481)
```typescript
settings: {
  ...conversation.poll_data?.settings,
  selectedDates: conversation.poll_data?.dates || [],
  timeSlotsByDate: conversation.poll_data?.timeSlots || {}, // 🔧 FIX AJOUTÉ
},
```

---

## Problème (historique)
Les créneaux horaires générés par Gemini ne s'affichaient pas dans le PollCreator après un refresh de la page.

## Flux de données identifié

### 1. Génération par Gemini
**Fichier:** `GeminiChatInterface.tsx` (lignes 1019-1037)

```
Gemini génère → suggestion.timeSlots = [{ start: "09:00", end: "10:00", dates: ["2025-12-02"] }]
                ↓
initialData = { timeSlots: suggestion.timeSlots, dates: suggestion.dates, ... }
                ↓
<PollCreator initialData={initialData} />
```

### 2. PollCreator reçoit initialData
**Fichier:** `PollCreator.tsx` (lignes 47-78)

```
PollCreator reçoit:
- initialData (avec timeSlots de Gemini)
- currentPoll (depuis useEditorState)
                ↓
usePollCreatorState({ initialData, currentPoll })
useTimeSlots({ state, initialData, currentPoll })
```

### 3. Création du poll via EditorStateProvider
**Fichier:** `EditorStateProvider.tsx` (lignes 284-340, 449-493)

```
createPollFromChat(pollData) appelé
                ↓
Conversion timeSlots → timeSlotsByDate (lignes 284-340):
  pollData.timeSlots = [{ start: "09:00", end: "10:00", dates: ["2025-12-02"] }]
                ↓
  timeSlotsByDate = { "2025-12-02": [{ hour: 9, minute: 0, duration: 60, enabled: true }] }
                ↓
datePollData = { ..., timeSlotsByDate: timeSlotsByDate }
                ↓
createPoll(datePollData) → pollResult.poll
                ↓
setCurrentPoll(poll) → sauvegarde dans localStorage
```

### 4. Sauvegarde dans usePolls
**Fichier:** `usePolls.ts` (lignes 175-184)

```
createPoll(pollData) reçoit:
  pollData.timeSlotsByDate = { "2025-12-02": [...] }
                ↓
mergedSettings = {
  ...pollData.settings,
  selectedDates: pollData.selectedDates,
  timeSlotsByDate: pollData.timeSlotsByDate,  // ✅ Devrait être sauvegardé ici
}
                ↓
Poll créé avec settings.timeSlotsByDate
```

### 5. Restauration après refresh
**Fichier:** `EditorStateProvider.tsx` (lignes 96-103)

```
Au chargement de la page:
  localStorage.getItem(STORAGE_KEY) → poll JSON
                ↓
  dispatchPoll({ type: "REPLACE_POLL", payload: poll })
                ↓
  currentPoll = poll (avec settings.timeSlotsByDate ?)
```

### 6. useTimeSlots tente de charger les timeSlots
**Fichier:** `useTimeSlots.ts` (lignes 94-114)

```
useEffect déclenché avec:
  - currentPoll (depuis EditorState)
  - initialData (depuis props)
                ↓
if (currentPoll?.settings?.timeSlotsByDate) {
  // ✅ Devrait utiliser currentPoll.settings.timeSlotsByDate
  setTimeSlotsByDate(currentPoll.settings.timeSlotsByDate)
} else {
  // ❌ Fallback sur initialData.timeSlots (qui est vide après refresh)
}
```

## 🔴 Point de rupture identifié

Le problème est probablement dans l'une de ces étapes:

### Hypothèse 1: Poll retourné par createPoll n'a pas settings.timeSlotsByDate
Le poll retourné par `createPoll` pourrait ne pas inclure `settings.timeSlotsByDate` dans sa structure.

**Vérification:** Log ajouté dans `EditorStateProvider.tsx` ligne 484-491

### Hypothèse 2: localStorage ne sauvegarde pas settings.timeSlotsByDate
Le poll sauvegardé dans localStorage pourrait avoir une structure différente.

**Vérification:** Log ajouté dans `useTimeSlots.ts` ligne 97-104

### Hypothèse 3: currentPoll n'est pas passé à useTimeSlots
Le `currentPoll` pourrait être `null` ou `undefined` quand `useTimeSlots` est appelé.

**Vérification:** Log ajouté dans `useTimeSlots.ts` ligne 97-104

## Logs de debug ajoutés

1. `[EditorStateProvider] 🔍 Conversion timeSlots` - Vérifie les timeSlots reçus
2. `[EditorStateProvider] 🔍 Poll créé via IA` - Vérifie le poll retourné par createPoll
3. `[useTimeSlots] 🔍 currentPoll debug` - Vérifie currentPoll et ses settings

## Actions à effectuer

1. Créer un nouveau sondage avec timeSlots via Gemini
2. Observer les logs dans la console
3. Faire un refresh
4. Observer les logs après refresh
5. Comparer les deux pour identifier où les timeSlotsByDate sont perdus

## Résultat attendu des logs

### Avant refresh (création):
```
[EditorStateProvider] 🔍 Conversion timeSlots { hasTimeSlots: true, timeSlots: [...] }
[EditorStateProvider] 🔍 Poll créé via IA { hasTimeSlotsByDate: true, timeSlotsByDate: {...} }
[useTimeSlots] 🔍 currentPoll debug { hasTimeSlotsByDate: true, timeSlotsByDate: {...} }
```

### Après refresh:
```
[useTimeSlots] 🔍 currentPoll debug { hasTimeSlotsByDate: ??? }
```

Si `hasTimeSlotsByDate: false` après refresh, le problème est dans la sauvegarde/restauration.
Si `hasTimeSlotsByDate: true` après refresh, le problème est dans l'affichage UI.
