# 🐛 Bug Report - 3 novembre 2025 21h51

## Bugs critiques identifiés en production

### 1. 🗓️ **Calendrier - Navigation flèches** (EN COURS)
**Status**: Partiellement résolu dans le code mais pas testé
**Problème**: Les flèches ne changent pas de mois, elles scrollent horizontalement
**Fichier**: `src/components/Calendar.tsx`
**Solution appliquée**: 
- Lignes 308-315 utilisent déjà `onMonthChange("prev")` et `onMonthChange("next")`
- À tester si le problème persiste

---

### 2. 👤 **Icône compte - Badge DEV + Toast**
**Status**: NON RÉSOLU
**Problème**: 
- Badge "DEV" présent alors que non voulu
- Sous-menu "Se connecter" présent alors que non voulu
- Devrait afficher un toast au lieu d'un sous-menu
**Fichiers concernés**:
- `src/components/layout/TopBar.tsx` (ligne avec User icon + badge DEV)
- `src/components/prototype/WorkspaceLayoutPrototype.tsx` (sidebar account button)
**Solution requise**:
```typescript
// Au lieu du menu déroulant
onClick={() => toast({
  title: "Compte",
  description: "Page en cours de développement"
})}
// Retirer le badge DEV
// Retirer le menu avec "Se connecter"
```

---

### 3. 📊 **Quotas - Documentation manquante**
**Status**: NON RÉSOLU
**Problème**: Utilisateur ne comprend pas le système de quotas
**Documentation nécessaire**:
```markdown
## Système de Quotas DooDates

### Conversations avec l'IA
- **Anonyme (non connecté)**: 5 conversations maximum
- **Authentifié (connecté)**: 1000 conversations maximum
- Le quota se réinitialise après connexion
- Affiché dans le Dashboard avec barre de progression

### Implémentation
- Hook: `useFreemiumQuota`
- Contexte: `useAuth`
- Storage: localStorage pour anonyme, Supabase pour authentifié
- Limite appliquée lors de la création de conversation
```

---

### 4. 🎨 **MultiStepFormVote - Couleurs texte**
**Status**: PARTIELLEMENT RÉSOLU
**Problème**: Texte noir sur fond blanc illisible
**Fichiers**: `src/components/polls/MultiStepFormVote.tsx`
**Déjà fixé**:
- ✅ Rating buttons (ligne ~175): `text-gray-900` ajouté
- ✅ NPS buttons (ligne ~215): `text-gray-900` ajouté
**Manque encore**:
- ❌ Questions type "text" (input libre): vérifier couleur texte
- ❌ Questions type "matrix": texte des cellules en noir

**Lignes à corriger** (approximatif):
```typescript
// Question TEXT (ligne ~140)
<input
  className="... text-gray-900 ..." // S'assurer que le texte est noir
/>

// Question MATRIX (ligne ~260)
<td className="... text-gray-900 ..."> // Texte des cellules
  {rowLabel}
</td>
```

---

### 5. 💥 **Page Résultats - Crash** ⚠️ CRITIQUE
**Status**: NON RÉSOLU
**Erreur**:
```
Uncaught TypeError: Cannot read properties of undefined (reading 'ayd4g3cw')
at Results-CNKaWs2O.js:2:35617
at Array.map (<anonymous>)
```
**404**: `/results` (page non trouvée)

**Analyse**:
- Fichier: `src/components/polls/FormPollResults.tsx`
- Ligne probable: 313 - `(q.options || []).map(...)`
- Cause potentielle: `q.options` est `undefined` pour certains types de questions
- Autre cause: Accès à une propriété d'un objet de réponse qui n'existe pas

**Solution requise**:
1. Ajouter des guards pour tous les `.map()` sur des propriétés optionnelles
2. Vérifier que `q.matrixRows`, `q.matrixColumns`, `q.options` existent avant d'itérer
3. Vérifier les réponses dans `getFormResults` (ligne 745+ pollStorage.ts)

**Code à protéger**:
```typescript
// Ligne 313
{(q.options || []).map((opt: FormQuestionOption) => {
  // ✅ Bon guard

// Ligne 345
{(q.matrixColumns || []).map((col: FormQuestionOption) => {
  // ✅ Bon guard

// Ligne 356  
{(q.matrixRows || []).map((row: FormQuestionOption) => {
  // ✅ Bon guard

// MAIS: vérifier aussi dans les réponses
const count = stats?.counts?.[opt.id] || 0; // ❌ Si stats.counts est undefined?
```

---

### 6. 📝 **MultiStepFormVote - UX Vote manquante**
**Status**: NON RÉSOLU
**Problème**: 
- Pas de champ nom/email avant soumission
- Page bleue vide après soumission
- Expérience désalignée avec les sondages de dates

**Fichier**: `src/components/polls/MultiStepFormVote.tsx` ou `FormPollVote.tsx`

**Solution requise**:
1. Ajouter une dernière étape avant soumission:
```typescript
{step === questions.length && (
  <div className="space-y-4">
    <h2>Vos coordonnées (optionnel)</h2>
    <input placeholder="Nom" />
    <input type="email" placeholder="Email" />
    <button>Soumettre mes réponses</button>
  </div>
)}
```

2. Page de confirmation après soumission:
```typescript
if (submitted) {
  return (
    <div className="text-center py-12">
      <Check className="w-16 h-16 text-green-500 mx-auto mb-4" />
      <h2 className="text-2xl font-bold mb-2">Merci pour vos réponses !</h2>
      <p className="text-gray-600 mb-4">
        Vos réponses ont été enregistrées avec succès.
      </p>
      <button onClick={() => navigate("/")}>
        Retour à l'accueil
      </button>
    </div>
  );
}
```

---

## 📋 Priorités

1. **CRITIQUE** (#5): Fix crash page résultats - Bloque l'accès aux résultats
2. **HIGH** (#6): UX vote formulaire - Expérience cassée
3. **MEDIUM** (#4): Couleurs texte - Problème accessibilité
4. **MEDIUM** (#2): Icône compte - UX confuse
5. **LOW** (#1): Navigation calendrier - À vérifier si réellement cassé
6. **DOC** (#3): Documentation quotas

---

## Tests requis après fix

```bash
# Tests unitaires
npm run test:unit -- src/components/__tests__/PollActions.test.tsx
npm run test:unit -- src/components/polls/__tests__/MultiStepFormVote.test.tsx

# Tests E2E
npm run test:e2e -- tests/e2e/form-poll-regression.spec.ts

# Build production
npm run build

# Test manuel
# 1. Créer un formulaire avec questions text, matrix, rating, NPS
# 2. Voter sur le formulaire
# 3. Consulter les résultats
# 4. Vérifier que tout s'affiche correctement
```

---

## Commit History (pour référence)

- `77b203b`: fix: sauvegarder poll dupliqué avant création conversation
- `aae375f`: refactor: déplacer error handling en local + fix TypeScript
- `dcd148b`: fix: corriger tests et error handling

---

**Rapport généré le**: 2025-11-03 21:51:00
**Analysé par**: AI Assistant
**Context**: Session de debugging production après déploiement

