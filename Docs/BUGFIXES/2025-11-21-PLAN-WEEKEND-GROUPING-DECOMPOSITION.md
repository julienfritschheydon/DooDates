# 🎯 PLAN DE DÉCOMPOSITION - Weekend Grouping Bug

## 📊 État Actuel

**Symptôme** : `dateGroups: undefined` dans `PollCreator` malgré les corrections effectuées.

**Corrections déjà faites** :
- ✅ Interface `DatePollData` inclut `dateGroups`
- ✅ Interface `SupabaseConversation.poll_data` inclut `dateGroups`
- ✅ `EditorStateProvider` passe `dateGroups` à `createPoll`
- ✅ `usePolls.createPoll` sauvegarde `dateGroups` dans `poll_data`
- ✅ Conversion `poll_data → Poll` récupère `dateGroups` (lignes 486, 647)
- ✅ Tests d'intégration créés (18 tests)

**Problème persistant** : Les modifications ne semblent pas être chargées par le navigateur.

---

## 🔍 Hypothèses à Vérifier

### Hypothèse 1 : Cache navigateur/Vite
**Probabilité** : 🟢 HAUTE

Le navigateur ou Vite cache l'ancien code compilé.

**Actions à tester** :
1. Hard refresh du navigateur (Ctrl+Shift+R)
2. Vider le cache navigateur
3. Supprimer `.vite` et `node_modules/.vite`
4. Redémarrer complètement Vite

**Commandes** :
```bash
# Nettoyer complètement
rm -rf node_modules/.vite
rm -rf .vite
npm run dev
```

### Hypothèse 2 : Code non compilé
**Probabilité** : 🟡 MOYENNE

Les modifications TypeScript ne sont pas compilées.

**Actions à tester** :
1. Vérifier que les fichiers modifiés sont bien sauvegardés
2. Vérifier les erreurs de compilation TypeScript
3. Forcer une recompilation complète

**Commandes** :
```bash
# Vérifier les erreurs TS
npx tsc --noEmit

# Rebuild complet
npm run build
npm run dev
```

### Hypothèse 3 : Mauvais fichier chargé
**Probabilité** : 🟡 MOYENNE

Le navigateur charge une ancienne version du fichier.

**Actions à tester** :
1. Ajouter un `console.log` unique dans `usePolls.ts` ligne 254
2. Vérifier que ce log apparaît dans la console
3. Si le log n'apparaît pas → le fichier n'est pas chargé

**Code de test** :
```typescript
// Dans usePolls.ts ligne 254
const mockPoll: StoragePoll = {
  ...basePoll,
  ...(pollData.type === "date"
    ? { 
        dates: pollData.selectedDates, 
        dateGroups: pollData.dateGroups,
        // 🔍 TEST: Ce log doit apparaître
        ...(console.log('🔍 [TEST] mockPoll dateGroups:', pollData.dateGroups) || {})
      }
    : {}),
  ...(pollData.type === "form" ? { questions: pollData.questions } : {}),
} as StoragePoll;
```

### Hypothèse 4 : Bug dans le reducer pollReducer
**Probabilité** : 🟠 FAIBLE

Le `pollReducer` dans `EditorStateProvider` ne préserve pas `dateGroups`.

**Actions à tester** :
1. Chercher la définition de `pollReducer`
2. Vérifier que l'action `REPLACE_POLL` préserve tous les champs
3. Ajouter un log dans `setCurrentPoll`

**Code à vérifier** :
```typescript
// Dans EditorStateProvider.tsx
const setCurrentPoll = useCallback((poll: Poll | null) => {
  console.log('🔍 [TEST] setCurrentPoll appelé:', poll?.dateGroups);
  dispatchPoll({ type: "REPLACE_POLL", payload: poll });
}, []);
```

### Hypothèse 5 : Gemini ne génère pas dateGroups
**Probabilité** : 🔴 TRÈS FAIBLE (déjà vérifié)

Gemini ne génère pas les `dateGroups`.

**Actions à tester** :
1. Ajouter un log dans `gemini.ts` après génération
2. Vérifier la réponse brute de Gemini

---

## 📝 Plan d'Action Méthodique

### Phase 1 : Isolation du problème (30 min)

#### Étape 1.1 : Vérifier que le code est chargé
```bash
# 1. Nettoyer complètement
rm -rf node_modules/.vite .vite

# 2. Redémarrer
npm run dev

# 3. Hard refresh navigateur (Ctrl+Shift+R)
```

**Critère de succès** : Le log `[WEEKEND_GROUPING]` affiche `hasDateGroups: true`

#### Étape 1.2 : Ajouter des logs de debugging
Ajouter des logs à chaque étape de la chaîne :

1. **Dans `gemini.ts`** (après génération) :
```typescript
console.log('🔍 [DEBUG 1] Gemini dateGroups:', pollData.dateGroups);
```

2. **Dans `EditorStateProvider.tsx`** (ligne 450) :
```typescript
console.log('🔍 [DEBUG 2] EditorState dateGroups:', datePollData.dateGroups);
```

3. **Dans `usePolls.ts`** (ligne 254) :
```typescript
console.log('🔍 [DEBUG 3] mockPoll dateGroups:', pollData.dateGroups);
```

4. **Dans `usePolls.ts`** (ligne 269, avant return) :
```typescript
console.log('🔍 [DEBUG 4] Retour mockPoll dateGroups:', mockPoll.dateGroups);
```

5. **Dans `EditorStateProvider.tsx`** (ligne 472, après setCurrentPoll) :
```typescript
console.log('🔍 [DEBUG 5] currentPoll dateGroups:', poll?.dateGroups);
```

6. **Dans `AICreationWorkspace.tsx`** (ligne 984) :
```typescript
console.log('🔍 [DEBUG 6] initialData dateGroups:', currentPoll?.dateGroups);
```

**Critère de succès** : Identifier à quelle étape `dateGroups` devient `undefined`

### Phase 2 : Correction ciblée (15 min)

Selon l'étape où `dateGroups` est perdu :

- **DEBUG 1 undefined** → Problème Gemini (vérifier prompt)
- **DEBUG 2 undefined** → Problème `EditorStateProvider` (ligne 450)
- **DEBUG 3 undefined** → Problème `usePolls.createPoll` (ligne 254)
- **DEBUG 4 undefined** → Problème construction `mockPoll`
- **DEBUG 5 undefined** → Problème `setCurrentPoll` ou `pollReducer`
- **DEBUG 6 undefined** → Problème `AICreationWorkspace` (ligne 984)

### Phase 3 : Validation (10 min)

1. Supprimer tous les logs de debug
2. Tester avec le prompt de test
3. Vérifier que `hasDateGroups: true`
4. Vérifier l'UI (message + horaires masqués)

---

## 🚫 Ce qu'il NE FAUT PAS faire

1. ❌ **Ne pas** modifier plusieurs fichiers en même temps
2. ❌ **Ne pas** tester sans logs de debug
3. ❌ **Ne pas** assumer que le code est chargé
4. ❌ **Ne pas** ignorer les erreurs de compilation
5. ❌ **Ne pas** tester en production avant validation locale

---

## ✅ Checklist de Validation Finale

Avant de considérer le bug comme corrigé :

- [ ] Hard refresh effectué (Ctrl+Shift+R)
- [ ] Cache Vite nettoyé
- [ ] Aucune erreur TypeScript
- [ ] Logs de debug montrent `dateGroups` à chaque étape
- [ ] Console affiche `hasDateGroups: true`
- [ ] UI affiche le message "Dates groupées détectées"
- [ ] Horaires sont masqués
- [ ] Tests automatisés passent (18/18)
- [ ] Test manuel réussi avec le prompt de test

---

## 📦 Fichiers à Vérifier en Priorité

1. **`src/hooks/usePolls.ts`** (lignes 254, 269, 486, 647)
2. **`src/components/prototype/EditorStateProvider.tsx`** (lignes 450, 472)
3. **`src/components/prototype/AICreationWorkspace.tsx`** (ligne 984)
4. **`src/lib/gemini.ts`** (génération `dateGroups`)

---

## 🎯 Objectif Final

**Résultat attendu dans la console** :
```javascript
[WEEKEND_GROUPING] 🎯 AICreationWorkspace - Passage à PollCreator: {
  hasDates: true,
  datesCount: 17,
  hasDateGroups: true,      // ✅ DOIT ÊTRE TRUE
  dateGroupsCount: 8,        // ✅ DOIT ÊTRE > 0
  dateGroups: [...]          // ✅ DOIT CONTENIR LES GROUPES
}
```

**Résultat attendu dans l'UI** :
- ✅ Message "Dates groupées détectées" affiché
- ✅ Section horaires masquée
- ✅ Week-ends affichés groupés dans le calendrier

---

## ⏱️ Estimation Temps Total

- **Phase 1** : 30 minutes (isolation)
- **Phase 2** : 15 minutes (correction)
- **Phase 3** : 10 minutes (validation)

**Total** : ~1 heure de debugging méthodique

---

## 📌 Notes Importantes

1. **Ne pas publier** tant que ce bug n'est pas résolu
2. **Documenter** chaque étape de debugging
3. **Garder** les logs de debug jusqu'à validation finale
4. **Tester** en mode localStorage ET Supabase
5. **Valider** avec les tests automatisés

---

## 🔄 Prochaines Étapes

1. Nettoyer le cache Vite
2. Redémarrer le serveur de développement
3. Ajouter les logs de debug
4. Suivre le plan méthodiquement
5. Documenter les résultats

**Date de création** : 21/11/2025
**Statut** : 🟡 EN ATTENTE
**Priorité** : 🔴 BLOQUANT POUR PUBLICATION
