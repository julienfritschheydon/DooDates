# 🔍 Guide de Débogage - Système de Votes

## Problème Identifié

**Symptôme :** Les votes affichent tous 0 dans la page Results  
**Cause :** Incohérence entre les structures de données utilisées par `Results.tsx` et `useVoting.ts`

### Structure des données dans localStorage

```json
{
  "id": "vote-123",
  "poll_id": "poll-abc",
  "voter_name": "Alice",
  "voter_email": "alice@example.com",
  "vote_data": {
    "option-0": "yes",
    "option-1": "maybe",
    "option-2": "no"
  },
  "created_at": "2025-10-23T16:00:00Z"
}
```

### Problème d'incohérence

**Dans `useVoting.ts` (ligne 127-134) :**

```typescript
const mappedVotes = pollVotes.map((v: any) => ({
  ...
  selections: v.vote_data || {},  // ← Renommé en "selections"
  ...
}));
```

**Dans `Results.tsx` (AVANT correction) :**

```typescript
const dateVotes = votes
  .map((vote) => vote.vote_data[optionId]) // ← Cherche "vote_data" qui n'existe pas
  .filter(Boolean);
```

## Solution Appliquée

### Correction dans `Results.tsx`

La fonction `getVoteStats` supporte maintenant **les deux structures** :

```typescript
const voteValue = vote.vote_data?.[optionId] || (vote as any).selections?.[optionId];
```

Cela permet de lire :

- `vote_data` : structure brute du localStorage
- `selections` : structure mappée par useVoting

### Logs de debug ajoutés

```typescript
console.log("🔍 getVoteStats Debug:", {
  date,
  dateIndex,
  optionId,
  votesCount: votes.length,
  firstVote: votes[0],
});

console.log("  Vote:", vote.voter_name, "pour", optionId, "=", voteValue);
console.log("  Résultat:", { yes, no, maybe, total: dateVotes.length });
```

## Tests à Effectuer

### 1. Ouvrir le fichier de debug

```bash
# Ouvrir dans le navigateur
file:///c:/Users/Julien%20Fritsch/Documents/GitHub/DooDates/debug-votes.html
```

Ce fichier affiche :

- ✅ Statistiques localStorage (nombre de votes, sondages)
- ✅ Votes bruts avec structure complète
- ✅ Sondages avec leurs dates
- ✅ Test de comptage simulé

### 2. Créer des données de test

Cliquer sur **"Créer données de test"** dans le fichier HTML :

- Crée 1 sondage avec 3 dates
- Ajoute 3 votes (Alice, Bob, Charlie)
- Structure correcte avec `vote_data`

### 3. Vérifier dans l'application

1. **Aller sur la page de vote** : `/poll/[slug]/vote`
2. **Voter** : Sélectionner des options et soumettre
3. **Vérifier localStorage** :
   ```javascript
   JSON.parse(localStorage.getItem("dev-votes"));
   ```
4. **Aller sur Results** : `/poll/[slug]/results`
5. **Ouvrir la console** : Vérifier les logs de debug

### 4. Logs attendus dans la console

```
🔍 getVoteStats Debug: {
  date: "2025-10-25",
  dateIndex: 0,
  optionId: "option-0",
  votesCount: 3,
  firstVote: { id: "vote-test-1", ... }
}
  Vote: Alice pour option-0 = yes
  Vote: Bob pour option-0 = yes
  Vote: Charlie pour option-0 = no
  Résultat: { yes: 2, no: 1, maybe: 0, total: 3 }
```

## Vérifications Clés

### ✅ Structure des votes dans localStorage

```javascript
// Dans la console du navigateur
const votes = JSON.parse(localStorage.getItem("dev-votes") || "[]");
console.table(votes);

// Vérifier qu'ils ont bien la structure :
// - id
// - poll_id
// - voter_name
// - voter_email
// - vote_data (objet avec option-0, option-1, etc.)
// - created_at
```

### ✅ Structure des sondages

```javascript
const polls = JSON.parse(localStorage.getItem("doodates_polls") || "[]");
console.table(polls);

// Vérifier :
// - settings.selectedDates existe et contient des dates
// - Les dates sont au format YYYY-MM-DD
```

### ✅ Mapping option ID → date

```javascript
const poll = polls[0];
const dates = poll.settings.selectedDates;

dates.forEach((date, index) => {
  console.log(`option-${index} → ${date}`);
});

// Exemple attendu :
// option-0 → 2025-10-25
// option-1 → 2025-10-26
// option-2 → 2025-10-27
```

## Problèmes Potentiels

### 1. Votes affichent toujours 0

**Cause possible :** Les votes n'ont pas la bonne structure  
**Solution :** Vérifier que `vote_data` existe et contient les bonnes clés

```javascript
const votes = JSON.parse(localStorage.getItem("dev-votes") || "[]");
votes.forEach((vote) => {
  console.log("Vote de", vote.voter_name);
  console.log("  vote_data:", vote.vote_data);
  console.log("  Clés:", Object.keys(vote.vote_data || {}));
});
```

### 2. Option IDs ne correspondent pas

**Cause possible :** Décalage entre l'index de la date et l'option ID  
**Solution :** Vérifier que `option-${index}` correspond bien à `selectedDates[index]`

```javascript
const poll = polls.find((p) => p.slug === "votre-slug");
const dates = poll.settings.selectedDates;

console.log("Mapping dates → options:");
dates.forEach((date, i) => {
  console.log(`  ${date} → option-${i}`);
});
```

### 3. Poll ID ne correspond pas

**Cause possible :** Les votes sont associés à un mauvais poll_id  
**Solution :** Vérifier que `vote.poll_id === poll.id`

```javascript
const poll = polls.find((p) => p.slug === "votre-slug");
const votes = JSON.parse(localStorage.getItem("dev-votes") || "[]");
const pollVotes = votes.filter((v) => v.poll_id === poll.id);

console.log("Poll ID:", poll.id);
console.log("Votes pour ce sondage:", pollVotes.length);
```

## Nettoyage

### Effacer tous les votes

```javascript
localStorage.setItem("dev-votes", "[]");
location.reload();
```

### Effacer tous les sondages

```javascript
localStorage.setItem("doodates_polls", "[]");
location.reload();
```

### Reset complet

```javascript
localStorage.clear();
location.reload();
```

## Prochaines Étapes

1. ✅ Tester avec le fichier `debug-votes.html`
2. ✅ Créer des données de test
3. ✅ Vérifier les logs dans la console
4. ✅ Voter sur un vrai sondage
5. ✅ Vérifier que les résultats s'affichent correctement
6. 🔄 Si problème persiste : Partager les logs de la console

## Fichiers Modifiés

- ✅ `src/pages/Results.tsx` : Fonction `getVoteStats` corrigée
- ✅ `debug-votes.html` : Outil de debug créé
- ✅ `Docs/Vote-System-Debug-Guide.md` : Ce guide

## Temps Estimé

- **Correction du code** : ✅ 15 minutes (FAIT)
- **Tests manuels** : ⏱️ 15-20 minutes
- **Total** : ~30-35 minutes
