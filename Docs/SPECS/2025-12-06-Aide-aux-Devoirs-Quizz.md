# 📚 Spécifications - Aide aux Devoirs (Quizz)

**Date :** 06/12/2024  
**Mise à jour :** 06/12/2024 - Proto fonctionnel !  
**Principe :** Réutilisation maximale du code existant  
**Statut :** 🟢 Prototype FONCTIONNEL (création texte + image) !

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

### ✅ Fait (Proto 06/12/2024)

- [x] Types Quizz complets (QuizzQuestion, QuizzResponse, etc.)
- [x] Service CRUD (quizz-service.ts - 476 lignes)
- [x] **Stockage séparé** : `doodates_quizz` (indépendant des polls)
- [x] Logique de scoring (checkAnswer, addQuizzResponse)
- [x] Composants liste/create/detail
- [x] Route `/quizz/*` dans App.tsx → QuizzApp
- [x] QuizzApp.tsx (routeur principal, simplifié sans ProductContext)
- [x] **QuizzVisionService.ts** créé !
  - `extractFromImage()` : Gemini Vision → questions
  - `generateFromText()` : Gemini texte → questions
  - Prompt optimisé : transforme exercices en VRAIES questions
- [x] **QuizzCreate.tsx** amélioré (411 lignes)
  - Upload image + génération texte
  - Toast feedback + logs debug
- [x] **QuizzList.tsx** amélioré (utilise quizz-service directement)
- [x] Lien depuis MainLanding.tsx (4ème carte icône Brain)
- [x] Route `/quizz/:slug/vote` → QuizzVote

### ✅ Phase 1 : Interface de Vote (FAIT 06/12/2024)

1. [x] **QuizzVote.tsx** amélioré (531 lignes)
   - Multi-step : une question par écran ✅
   - Feedback ✅/❌ après chaque réponse ✅
   - Score final avec emoji + message encourageant ✅
   - Bouton "Recommencer" ✅
   - "Retour aux quiz" → `/quizz` ✅
2. [x] Type `text-ai` ajouté
   - Validation par Gemini (synonymes acceptés)
   - Textarea + indication "🧠 Vérifié par IA"
   - Loader "Vérification IA..."
3. [x] Bug fix : champ nom ne passe plus automatiquement
4. [x] Bug fix : Toast ne bloque plus les clics

### ✅ Phase 2 : UX améliorée (FAIT 06/12/2024)

1. [x] **Animation confettis** sur bon score (>75%) 🎉
2. [x] **Bouton "Partager ce quiz"** (copie le lien)
3. [x] Bouton "Copier le lien" sur l'écran d'accueil
4. [x] Bug fix : texte invisible sur questions à choix unique/multiples
5. [x] **Dictée vocale** 🎤 sur les réponses texte (comme le chat Gemini)
6. [x] **Couleurs cohérentes** : thème jaune/amber (comme la carte MainLanding)

### Phase 3 : Prochaines étapes (À FAIRE)

1. [ ] **Tester le flux complet** (création → vote → score)
2. [ ] Route `/quizz/:slug/results` → Stats pour le créateur
3. [ ] Améliorer UX mobile (boutons plus gros)

### Phase 3 (Optionnel) : Pages Landing/Dashboard

1. [ ] Landing page dédiée Quizz
2. [ ] Dashboard parent avec historique des scores

---

## ✅ Implémenté (Proto 06/12/2024)

### Services & Backend
- ✅ **QuizzVisionService.ts** (312 lignes)
  - `extractFromImage()` : Gemini Vision → questions/réponses
  - `generateFromText()` : Gemini texte → questions
  - Support image base64 (JPEG, PNG)
  - Prompt intelligent : transforme exercices en VRAIES questions
- ✅ **quizz-service.ts** (476 lignes) - Stockage séparé `doodates_quizz`
  - CRUD complet + scoring + stats
  - Gestion erreurs localStorage robuste

### Frontend
- ✅ **QuizzApp.tsx** - Routeur simplifié (sans ProductContext API)
- ✅ **QuizzCreate.tsx** (411 lignes) - Création texte + image
- ✅ **QuizzList.tsx** (140 lignes) - Liste des quiz
- ✅ **MainLanding.tsx** - Lien vers /quizz (4ème carte)
- ✅ Routes dans App.tsx : `/quizz/*`, `/quizz/:slug/vote`

### ❌ Non implémenté (Phase 3+)
- ❌ Historique des scores par enfant
- ❌ Système de badges/récompenses
- ❌ Timer par question
- ❌ Tableau de bord parent avec statistiques
- ❌ QR code pour partage

---

## 🧪 Critères de Succès Phase 1

1. Parent peut créer un quizz de 5 questions via texte
2. Enfant peut répondre et voir son score
3. Feedback ✅/❌ après chaque question
4. Fonctionne sur mobile

---

## 📊 Métriques de Réutilisation (Mise à jour 06/12/2024)

| Catégorie | Lignes | Status | Notes |
|-----------|--------|--------|-------|
| quizz-service.ts | 476 | ✅ Modifié | Stockage séparé, logs corrigés |
| QuizzVisionService.ts | 312 | ✅ **Nouveau** | Gemini Vision + texte |
| QuizzCreate.tsx | 411 | ✅ Amélioré | Upload image + génération |
| QuizzList.tsx | 140 | ✅ Amélioré | Sans ProductContext |
| QuizzApp.tsx | 44 | ✅ Créé | Routeur simplifié |
| App.tsx routes | +5 | ✅ Modifié | /quizz/*, /quizz/:slug/vote |
| MainLanding.tsx | +1 | ✅ Modifié | Lien vers /quizz |
| **Total nouveau** | **~800** | | |

### Ce qui fonctionne maintenant (Proto complet !)
1. ✅ Accès depuis landing `/` → carte "Aide aux Devoirs"
2. ✅ Liste des quiz existants `/quizz`
3. ✅ Création quiz par texte (Gemini via Supabase)
4. ✅ Création quiz par image (Gemini Vision direct)
5. ✅ Sauvegarde dans localStorage séparé `doodates_quizz`
6. ✅ **Vote multi-step** avec feedback ✅/❌
7. ✅ **Score final** avec emoji + message encourageant
8. ✅ **Type text-ai** : validation Gemini pour réponses longues
9. ✅ Comparaison souple (accents, casse, espaces ignorés)
10. ✅ **Confettis** sur bon score (>75%) 🎉
11. ✅ **Bouton partage** (copier le lien du quiz)
12. ✅ **Dictée vocale** 🎤 sur les réponses texte
13. ✅ **Couleurs unifiées** (thème jaune/amber cohérent)

### Prochaine étape
**Tester le flux complet** avec un vrai exercice scolaire

---

## 🔄 Refactorisation Dashboard (06/12/2024)

### Fonctionnalités spécifiques perdues lors de la refactorisation vers ProductDashboard

Le dashboard quizz a été refactorisé pour utiliser `ProductDashboard` comme les autres produits. Les fonctionnalités spécifiques suivantes ont été retirées et doivent être réimplémentées dans des sous-pages ou composants dédiés :

#### 1. **Stats Globales (3 cartes en haut)**
- **Carte 1** : Nombre total de quiz créés
  - Icône : Brain (amber)
  - Valeur : `globalStats.totalQuizz`
- **Carte 2** : Nombre total de réponses
  - Icône : Users (blue)
  - Valeur : `globalStats.totalResponses`
- **Carte 3** : Score moyen global
  - Icône : Trophy (green)
  - Valeur : `globalStats.averageScore` (en %)

**À refaire dans :** `/quizz/stats` ou composant `QuizzStatsCards.tsx`

#### 2. **Tri personnalisé**
- Tri par "Plus récents" (par défaut)
- Tri par "Plus populaires" (nombre de réponses)
- Tri par "Meilleur score" (score moyen décroissant)

**À refaire dans :** Extension de `DashboardFilters` ou composant `QuizzSortSelector.tsx`

#### 3. **Affichage des quiz avec métadonnées spécifiques**
- Badge vert : Nombre de réponses (`responses.length`)
- Badge amber : Nombre de questions (`quiz.questions?.length || 0`)
- Stats par quiz :
  - Nombre de réponses (icône Users)
  - Score moyen (icône TrendingUp) - si > 0
  - Date de création (icône Clock)

**À refaire dans :** Composant `QuizzCard.tsx` personnalisé ou extension de `ConversationCard`

#### 4. **Actions spécifiques sur chaque quiz**
- **Tester** : Navigation vers `/quizz/:slug/vote`
- **Résultats** : Navigation vers `/quizz/:slug/results`
- **Copier le lien** : Copie du lien de vote dans le presse-papier
- **Supprimer** : Suppression avec confirmation

**À refaire dans :** Composant `QuizzCardActions.tsx` ou extension de `ConversationCard`

#### 5. **Vue liste avec colonnes spécifiques**
- Colonne "Questions" (nombre de questions)
- Colonne "Réponses" (nombre de réponses)
- Colonne "Score moy." (avec code couleur : vert ≥75%, amber ≥50%, rouge >0%, gris 0%)
- Colonne "Créé le" (date formatée)

**À refaire dans :** Extension de `DashboardTableView` ou composant `QuizzTableView.tsx`

#### 6. **Bouton Refresh manuel**
- Bouton avec icône RefreshCw
- Rafraîchit la liste des quiz

**À refaire dans :** Ajout dans `DashboardFilters` ou composant séparé

#### 7. **Pas de quota indicator**
- Le dashboard quizz n'affiche pas l'indicateur de crédits/quota
- À décider si on l'ajoute ou non

**À refaire dans :** Optionnel - décision à prendre

#### 8. **Pas de filtres avancés**
- Pas de filtres par tags
- Pas de filtres par folders
- Seulement recherche textuelle et tri

**À refaire dans :** Optionnel - décision à prendre

### Plan de réimplémentation

1. **Créer `/quizz/stats`** : Page dédiée aux statistiques globales
2. **Créer `QuizzCard.tsx`** : Carte personnalisée avec métadonnées spécifiques
3. **Créer `QuizzCardActions.tsx`** : Actions spécifiques (Tester, Résultats, Copier, Supprimer)
4. **Créer `QuizzTableView.tsx`** : Vue liste avec colonnes spécifiques
5. **Étendre `DashboardFilters`** : Ajouter tri personnalisé pour quizz
6. **Optionnel** : Ajouter quota indicator et filtres avancés

