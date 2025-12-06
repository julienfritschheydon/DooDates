# 📚 Spécifications - Aide aux Devoirs (Quizz)

**Date :** 06/12/2024  
**Principe :** Réutilisation maximale du code existant  
**Statut :** Code Quizz déjà partiellement implémenté ! 🎉

---

## 🎯 Objectif

Permettre à un parent/tuteur de créer un quizz à partir d'une photo de devoir (ou texte) et à un enfant de le compléter avec feedback immédiat.

---

## 📋 Flux Utilisateur

### Parent/Tuteur (Création)

1. **Entrée** : Photo du devoir OU texte de la demande
2. **Gemini Vision** : Extrait les questions + réponses correctes
3. **Édition** : Parent vérifie/modifie (réutilise QuizzCreate existant)
4. **Partage** : Lien envoyé à l'enfant

### Enfant (Résolution)

1. **Réponse** : Interface gamifiée
2. **Feedback** : Correction immédiate (✅/❌) après chaque question
3. **Score** : Résultat final avec encouragements

---

## ✅ Code DÉJÀ Existant (découvert !)

### Structure Routes

```
src/app/quizz/
├── QuizzApp.tsx          ← CRÉÉ (routeur principal)
└── (à créer: Dashboard, Landing, etc.)

src/components/products/quizz/
├── QuizzList.tsx         ✅ Existe (44 lignes)
├── QuizzCreate.tsx       ✅ Existe (44 lignes)
├── QuizzDetail.tsx       ✅ Existe
└── index.ts              ✅ Existe

src/lib/products/quizz/
├── quizz-service.ts      ✅ Existe (500 lignes !)
└── index.ts              ✅ Existe
```

### quizz-service.ts - Déjà Implémenté ! (500 lignes)

| Fonctionnalité | Status |
|----------------|--------|
| Types `QuizzQuestion` avec `correctAnswer` | ✅ |
| Types `QuizzResponse` avec scoring | ✅ |
| Types `QuizzResults` avec stats | ✅ |
| CRUD complet (get, save, delete, duplicate) | ✅ |
| `checkAnswer()` - Vérification réponses | ✅ |
| `addQuizzResponse()` - Avec calcul score | ✅ |
| `getQuizzResults()` - Statistiques | ✅ |
| `questionStats` - Stats par question | ✅ |

### Route dans ProductRoutes.tsx

```tsx
<Route path="/quizz/*" element={<QuizzApp />} />  // ✅ Déjà configuré !
```

---

## 🔧 Ce qui RESTE à faire

### 1. Interface de Vote/Réponse (QuizzVotePage.tsx)

```
src/components/polls/QuizzVote.tsx  ← À CRÉER (~150 lignes)
```

- Affichage questions une par une
- Collecte réponses
- Appel `addQuizzResponse()` existant
- Affichage feedback ✅/❌ par question
- Score final avec message encourageant

### 2. Route de vote

Dans `App.tsx`, ajouter :
```tsx
<Route path="/quizz/:slug" element={<QuizzVote />} />
<Route path="/quizz/:slug/results" element={<QuizzResults />} />
```

### 3. Prompt Gemini pour création

Dans `FormPollService.ts` ou nouveau `QuizzPrompts.ts` :
```typescript
buildQuizzPrompt(userInput: string): string
```

### 4. Optionnel - Pages Landing/Dashboard

```
src/app/quizz/
├── LandingPage.tsx       ← À créer (copie de form-polls)
├── Dashboard.tsx         ← À créer (copie de form-polls)
└── Pricing.tsx           ← À créer (copie de form-polls)
```

---

## 📊 Bilan Réutilisation (mis à jour)

| Catégorie | Existant | À créer | % Réutilisation |
|-----------|----------|---------|-----------------|
| Service (quizz-service.ts) | 500 | 0 | **100%** |
| Composants Liste/Create | 100+ | 0 | **100%** |
| Vote Page | 0 | ~150 | 0% |
| Routes App.tsx | 5 lignes | 2 lignes | 70% |
| **Total** | **600+** | **~150** | **80%** |

---

## 🔧 Types Existants dans quizz-service.ts

### QuizzQuestion (déjà implémenté !)

```typescript
export interface QuizzQuestion {
  id: string;
  question: string;
  type: "single" | "multiple" | "text" | "true-false";
  options?: string[];
  correctAnswer: string | string[] | boolean;  // ✅ Existe !
  points?: number;                              // ✅ Existe !
  explanation?: string;                         // ✅ Existe !
}
```

### QuizzResponse (déjà implémenté !)

```typescript
export interface QuizzResponse {
  id: string;
  pollId: string;
  answers: Array<{
    questionId: string;
    answer: string | string[] | boolean;
    isCorrect: boolean;   // ✅ Calculé automatiquement !
    points: number;       // ✅ Calculé automatiquement !
  }>;
  totalPoints: number;    // ✅ Somme des points
  maxPoints: number;      // ✅ Maximum possible
  percentage: number;     // ✅ Score en %
}
```

### checkAnswer() - Logique de correction (déjà implémentée !)

```typescript
function checkAnswer(question: QuizzQuestion, userAnswer): boolean {
  // Gère single, multiple, text, true-false
  // Comparaison exacte ou par ensemble pour multiple
}
```

---

## 🎨 UI/UX Spécifique Quizz

### Mode Enfant (réponse)

- Couleurs vives (utiliser thème existant "Playful" ou en créer un)
- Émojis pour feedback (✅ ❌ 🌟)
- Animation de célébration au score élevé (confettis existants ?)
- Messages positifs même en cas d'erreur

### Feedback Immédiat

```
Question 1/5 : Combien font 7 × 8 ?
[56] ← Réponse soumise

✅ Correct ! 7 × 8 = 56
Explication : 7 × 8, c'est comme 7 × 10 - 7 × 2 = 70 - 14 = 56

[Question suivante →]
```

---

## 📱 Compatibilité Mobile

- Réutiliser `displayMode: "multi-step"` existant (style Typeform)
- Une question par écran = parfait pour enfant sur tablette
- Boutons larges, texte lisible

---

## ⚡ Plan d'Implémentation (Révisé)

### ✅ Déjà Fait

- [x] Types Quizz complets (QuizzQuestion, QuizzResponse, etc.)
- [x] Service CRUD (quizz-service.ts - 500 lignes)
- [x] Logique de scoring (checkAnswer, addQuizzResponse)
- [x] Composants liste/create/detail
- [x] Route `/quizz/*` dans ProductRoutes.tsx
- [x] QuizzApp.tsx (routeur principal)

### Phase 1 : Interface de Vote (1h)

1. [ ] Créer `src/components/polls/QuizzVote.tsx`
   - Réutiliser structure de FormPollVote
   - Afficher questions une par une (multi-step)
   - Appeler `addQuizzResponse()` existant
   - Afficher feedback ✅/❌ après chaque réponse
   - Écran de résultat final avec score + message

### Phase 2 : Routes dans App.tsx (15 min)

1. [x] Ajouter route `/quizz/:slug` → QuizzVote ✅
2. [ ] Ajouter route `/quizz/:slug/results` → QuizzResults (optionnel)
3. [x] Ajouter au landing '/' ✅ (4ème carte avec icône Brain)

### Phase 3 : Prompt Gemini (30 min)

1. [ ] Créer `buildQuizzPrompt()` dans FormPollService ou nouveau fichier
2. [ ] Intégrer dans le flux de création IA

### Phase 4 (Optionnel) : Pages Landing/Dashboard

1. [ ] Copier/adapter `LandingPage.tsx` de form-polls
2. [ ] Copier/adapter `Dashboard.tsx` de form-polls
3. [ ] Ajouter routes dans App.tsx

---

## ✅ Implémenté (Proto)

- ✅ **Gemini Vision** - `QuizzVisionService.ts` créé
  - `extractFromImage()` : Analyse photo → questions/réponses
  - `generateFromText()` : Génération à partir de texte
  - Support image base64 (JPEG, PNG)
  - Prompt optimisé pour devoirs scolaires
- ❌ Historique des scores par enfant
- ❌ Système de badges/récompenses
- ❌ Mode entraînement répété
- ❌ Timer par question
- ❌ Tableau de bord parent avec statistiques

→ Ces features peuvent venir en Phase 2 si le prototype fonctionne.

---

## 🧪 Critères de Succès Phase 1

1. Parent peut créer un quizz de 5 questions via texte
2. Enfant peut répondre et voir son score
3. Feedback ✅/❌ après chaque question
4. Fonctionne sur mobile

---

## 📊 Métriques de Réutilisation (Finale)

| Catégorie | Lignes existantes | Lignes nouvelles | % Réutilisation |
|-----------|------------------|------------------|-----------------|
| quizz-service.ts | 500 | 0 | **100%** |
| Composants Quizz | 100+ | 0 | **100%** |
| QuizzApp.tsx | 0 | 17 | 0% |
| QuizzVote.tsx | 0 | ~150 | 0% |
| Routes App.tsx | 500+ | ~5 | **99%** |
| **Total** | **1100+** | **~170** | **87%** |

**Conclusion :** Le service Quizz était déjà implémenté avec toute la logique métier !
Il ne reste qu'à créer l'interface de vote (~150 lignes).

