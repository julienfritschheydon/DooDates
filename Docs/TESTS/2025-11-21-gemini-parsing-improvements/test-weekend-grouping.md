# 🧪 Test Manuel - Weekend Grouping

## Objectif

Valider que les groupes de dates (week-ends) sont correctement affichés dans le sondage créé.

## Pré-requis

- Application démarrée (`npm run dev`)
- Console navigateur ouverte (F12)
- Filtre console : `[WEEKEND_GROUPING]`

## Procédure de Test

### 1. Préparer l'environnement

**Option A : Test avec Supabase (mode normal)**

```javascript
// Rien à faire, mode par défaut
```

**Option B : Test en mode localStorage pur**

```javascript
// Dans la console navigateur
localStorage.setItem("dev-local-mode", "1");
// Puis recharger la page (F5)
```

### 2. Envoyer le prompt de test

**Prompt recommandé :**

```
Crée un sondage pour un week-end jeux. L'évènement aura lieu le samedi et le dimanche.
Sélectionner les dates correspondantes de mars et avril 2026
```

**Variantes possibles :**

```
Sondage pour tous les week-ends de mars 2026
```

```
Créer un sondage avec les samedis et dimanches de février et mars 2026
```

### 3. Vérifier les logs console

**Chercher le log :** `[WEEKEND_GROUPING] 🎯 AICreationWorkspace`

**Résultat ATTENDU (✅ CORRECT) :**

```javascript
[WEEKEND_GROUPING] 🎯 AICreationWorkspace - Passage à PollCreator: {
  hasDates: true,
  datesCount: 17,              // Nombre total de dates
  hasDateGroups: true,          // ✅ DOIT ÊTRE TRUE
  dateGroupsCount: 8,           // ✅ DOIT ÊTRE > 0
  dateGroups: [                 // ✅ DOIT CONTENIR LES GROUPES
    {
      dates: ['2026-03-07', '2026-03-08'],
      label: 'Week-end du 7-8 mars',
      type: 'weekend'
    },
    // ... autres week-ends
  ]
}
```

**Résultat INCORRECT (❌ BUG) :**

```javascript
[WEEKEND_GROUPING] 🎯 AICreationWorkspace - Passage à PollCreator: {
  hasDates: true,
  datesCount: 17,
  hasDateGroups: false,         // ❌ FALSE = BUG
  dateGroupsCount: undefined,   // ❌ UNDEFINED = BUG
  dateGroups: undefined         // ❌ UNDEFINED = BUG
}
```

### 4. Vérifier l'interface utilisateur

#### A. Message informatif

**Chercher :** Bandeau bleu avec icône ℹ️

**Texte attendu :**

```
Dates groupées détectées
Les créneaux horaires ne sont pas disponibles pour les groupes de dates.
```

**Statut :**

- ✅ Message affiché = CORRECT
- ❌ Message absent = BUG

#### B. Section horaires

**Chercher :** Section "Horaires par date"

**Comportement attendu :**

- ✅ Section masquée (non visible) = CORRECT
- ❌ Section visible avec sélecteurs d'horaires = BUG

#### C. Calendrier

**Chercher :** Dates dans le calendrier

**Affichage attendu :**

- ✅ Dates groupées visuellement (ex: "7-8 mars") = CORRECT
- ❌ Dates individuelles (ex: "7 mars", "8 mars") = BUG

### 5. Vérifier la persistance

**Recharger la page** (F5)

**Vérifier que :**

- ✅ Le sondage est toujours là
- ✅ Les groupes de dates sont toujours affichés
- ✅ Le message informatif est toujours présent
- ✅ Les horaires sont toujours masqués

### 6. Tester la création d'un nouveau sondage

**Créer un nouveau sondage** (bouton "Nouveau sondage")

**Envoyer un prompt SANS week-ends :**

```
Créer un sondage pour le 15 mars 2026
```

**Vérifier que :**

- ✅ `hasDateGroups: false` (normal, pas de groupes)
- ✅ Section horaires VISIBLE (normal, pas de groupes)
- ✅ Message informatif ABSENT (normal, pas de groupes)

## Résultats Attendus

### Scénario 1 : Prompt avec week-ends

| Élément            | Attendu            | Statut |
| ------------------ | ------------------ | ------ |
| `hasDateGroups`    | `true`             | ⬜     |
| `dateGroupsCount`  | `> 0`              | ⬜     |
| `dateGroups`       | `Array[...]`       | ⬜     |
| Message informatif | Affiché            | ⬜     |
| Section horaires   | Masquée            | ⬜     |
| Calendrier         | Groupes visibles   | ⬜     |
| Persistance        | Données conservées | ⬜     |

### Scénario 2 : Prompt sans week-ends

| Élément            | Attendu     | Statut |
| ------------------ | ----------- | ------ |
| `hasDateGroups`    | `false`     | ⬜     |
| `dateGroupsCount`  | `undefined` | ⬜     |
| `dateGroups`       | `undefined` | ⬜     |
| Message informatif | Absent      | ⬜     |
| Section horaires   | Visible     | ⬜     |

## Debugging

### Si `dateGroups` est `undefined`

**1. Vérifier que le code est à jour**

```bash
git status
# Doit montrer les modifications dans usePolls.ts et EditorStateProvider.tsx
```

**2. Vérifier les logs Gemini**

```javascript
// Chercher dans la console :
"Date Poll successfully generated";
// Puis vérifier la réponse Gemini
```

**3. Vérifier le localStorage**

```javascript
// Dans la console navigateur
const polls = JSON.parse(localStorage.getItem("doodates_polls") || "[]");
console.log(polls[0]?.dateGroups);
// Doit afficher les groupes de dates
```

**4. Vérifier Supabase (si mode normal)**

```javascript
// Dans la console navigateur
const response = await fetch(
  `${import.meta.env.VITE_SUPABASE_URL}/rest/v1/conversations?select=poll_data`,
  {
    headers: {
      apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
      Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
    },
  },
);
const data = await response.json();
console.log(data[0]?.poll_data?.dateGroups);
// Doit afficher les groupes de dates
```

### Si les horaires sont visibles

**Vérifier le calcul de `hasGroupedDates`**

```javascript
// Dans la console navigateur, sur la page du sondage
// Ouvrir React DevTools
// Chercher le composant PollCreator
// Vérifier la prop initialData.dateGroups
```

## Rapport de Test

### Environnement

- [ ] Mode Supabase
- [ ] Mode localStorage pur
- Navigateur : \***\*\_\_\_\*\***
- Date du test : \***\*\_\_\_\*\***

### Résultats

- [ ] ✅ Tous les tests passent
- [ ] ⚠️ Certains tests échouent (préciser lesquels)
- [ ] ❌ Tous les tests échouent

### Notes

```
[Vos observations ici]
```

### Captures d'écran

- [ ] Console avec log `[WEEKEND_GROUPING]`
- [ ] UI avec message informatif
- [ ] Calendrier avec groupes de dates

---

## 🎯 Validation Finale

**Le bug est considéré comme corrigé si :**

- ✅ `hasDateGroups: true` dans les logs
- ✅ `dateGroups` contient les groupes
- ✅ Message informatif affiché
- ✅ Horaires masqués
- ✅ Persistance fonctionne
- ✅ Tests automatisés passent (18/18)

**Si un seul élément échoue, le bug n'est PAS corrigé.**
