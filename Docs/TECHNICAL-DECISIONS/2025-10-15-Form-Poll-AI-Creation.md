# Form Poll Creation par IA - Spécifications Techniques

**Document créé le 15/10/2025**

## Vue d'Ensemble

### Objectif
Permettre aux utilisateurs de créer des **questionnaires/sondages d'opinion** (Form Polls) via l'interface conversationnelle IA, en complément des sondages de dates (Date Polls) existants.

### Contexte
Actuellement, l'IA Gemini ne peut générer que des **Date Polls** (sondages de disponibilité). Cette fonctionnalité ajoute la capacité de créer des **Form Polls** (questionnaires avec questions à choix unique, multiple ou texte libre).

---

## Scope du Projet

### ✅ Ce qui est inclus
1. **Détection automatique du type de sondage** demandé par l'utilisateur
2. **Génération de questionnaires** avec 3 types de questions :
   - Single choice (choix unique - radio buttons)
   - Multiple choice (choix multiples - checkboxes)
   - Text (réponse libre)
3. **Modification de sondages existants** via conversation IA
4. **Interface chat enrichie** pour afficher et créer les Form Polls
5. **Intégration avec FormPollCreator** existant

### ❌ Ce qui n'est PAS inclus
- Modification de l'interface FormPollCreator (déjà fonctionnelle)
- Logique de vote/réponses (déjà implémentée)
- Système de résultats (déjà implémenté)
- Nouvelles questions conditionnelles ou scoring
- Support multi-langue des questionnaires

---

## Architecture Technique

### Composants Existants Réutilisés
```
✅ FormPollCreator.tsx       - Interface de création manuelle
✅ FormEditor.tsx            - Éditeur de questions
✅ FormPollVote.tsx          - Interface de vote
✅ FormPollResults.tsx       - Affichage des résultats
✅ pollStorage.ts            - Types FormPoll complets
✅ GeminiChatInterface.tsx   - Interface conversationnelle
```

### Nouveaux Composants à Créer
```
🆕 gemini.ts
   ├── detectPollType()           - Détection date vs form
   ├── buildFormPollPrompt()      - Prompt système Form
   ├── parseFormPollResponse()    - Parser réponse IA
   ├── modifyPoll()               - Modification sondages
   └── buildModificationPrompt()  - Prompt modification

🆕 Types TypeScript
   ├── FormPollSuggestion         - Suggestion Form Poll
   ├── DatePollSuggestion         - Refactor type existant
   └── PollSuggestion (union)     - Date | Form
```

---

## Spécifications Détaillées

### 1. Détection du Type de Sondage

**Méthode :** `detectPollType(userInput: string): "date" | "form"`

**Mots-clés Form Poll :**
- questionnaire, sondage d'opinion, enquête, formulaire
- questions, choix multiple, avis, feedback
- satisfaction, préférences, vote sur, classement

**Mots-clés Date Poll :**
- date, rendez-vous, réunion, disponibilité, planning
- horaire, créneau, semaine, jour, mois

**Logique :**
```typescript
// Score par comptage d'occurrences
formScore > dateScore → "form"
dateScore > formScore → "date"
égalité → "date" (défaut actuel)
```

---

### 2. Structure FormPollSuggestion

```typescript
export interface FormPollSuggestion {
  title: string;
  description?: string;
  questions: Array<{
    title: string;
    type: "single" | "multiple" | "text";
    required: boolean;
    options?: string[];        // Pour single/multiple
    maxChoices?: number;       // Pour multiple
    placeholder?: string;      // Pour text
    maxLength?: number;        // Pour text
  }>;
  type: "form";
}
```

---

### 3. Prompt Système Form Poll

**Contraintes :**
- 3 à 10 questions pertinentes
- 2 à 8 options par question (single/multiple)
- Cohérence et logique des questions
- Adaptation au contexte utilisateur

**Exemples de questions générées :**
```json
{
  "title": "Questionnaire de satisfaction client",
  "questions": [
    {
      "title": "Quel est votre niveau de satisfaction ?",
      "type": "single",
      "required": true,
      "options": ["Très satisfait", "Satisfait", "Neutre", "Insatisfait"]
    },
    {
      "title": "Quelles fonctionnalités utilisez-vous ?",
      "type": "multiple",
      "required": false,
      "options": ["Dashboard", "Notifications", "Export", "Analytics"],
      "maxChoices": 3
    },
    {
      "title": "Avez-vous des suggestions ?",
      "type": "text",
      "required": false,
      "placeholder": "Vos commentaires ici...",
      "maxLength": 500
    }
  ],
  "type": "form"
}
```

---

### 4. Parsing et Validation

**Validation stricte :**
- ✅ `title` présent et non vide
- ✅ `questions` array avec au moins 1 question
- ✅ `type === "form"`
- ✅ Chaque question a un `title` et un `type` valide
- ✅ Questions single/multiple ont au moins 2 options
- ✅ Questions text peuvent être sans options

**Filtrage :**
```typescript
// Filtrer les questions invalides
const validQuestions = parsed.questions.filter(q => {
  return (
    q.title &&
    ["single", "multiple", "text"].includes(q.type) &&
    (q.type === "text" || 
     (Array.isArray(q.options) && q.options.length >= 2))
  );
});
```

---

### 5. Interface Chat - Affichage Form Poll

**Composant de suggestion :**
```tsx
{message.pollSuggestion && message.pollSuggestion.type === "form" && (
  <div className="mt-4 space-y-4">
    {/* Header avec gradient purple/indigo */}
    <div className="bg-gradient-to-r from-purple-500/10 to-indigo-500/10 
                    rounded-xl p-4 border border-purple-500/20">
      <h4 className="font-medium text-gray-900 mb-3">
        {message.pollSuggestion.title}
      </h4>
      <div className="flex items-center gap-2 text-sm text-gray-600">
        <MessageCircle className="w-4 h-4" />
        <span>{message.pollSuggestion.questions.length} questions</span>
      </div>
    </div>

    {/* Bouton de création */}
    <button
      onClick={() => createFormPoll(message.pollSuggestion)}
      className="w-full flex items-center justify-center gap-2 
                 px-4 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 
                 text-white rounded-xl hover:shadow-xl"
    >
      <Plus className="w-5 h-5" />
      <span className="font-medium">Créer ce questionnaire</span>
    </button>
  </div>
)}
```

---

### 6. Modification de Sondages

**Nouvelle méthode :** `modifyPoll(pollData: Poll, modifications: string)`

**Cas d'usage :**
```
User: "Crée un questionnaire de satisfaction"
AI: [Génère questionnaire avec 4 questions]
User: "Ajoute une question sur l'âge et change la 2e en choix multiple"
AI: [Modifie le questionnaire]
```

**Prompt de modification :**
```
QUESTIONNAIRE ACTUEL:
{...poll actuel...}

MODIFICATIONS DEMANDÉES:
"Ajoute une question sur l'âge..."

INSTRUCTIONS:
1. Analyser les modifications
2. Appliquer les changements
3. Conserver ce qui n'est pas modifié
4. Retourner le questionnaire complet mis à jour
```

---

### 7. Intégration avec FormPollCreator

**Conversion FormPollSuggestion → FormPollDraft :**
```typescript
const convertToFormDraft = (suggestion: FormPollSuggestion): FormPollDraft => {
  return {
    id: `draft-${Date.now()}`,
    type: "form",
    title: suggestion.title,
    questions: suggestion.questions.map((q, i) => ({
      id: `q-${i}`,
      title: q.title,
      type: q.type,
      required: q.required,
      options: q.options?.map((opt, j) => ({
        id: `opt-${j}`,
        label: opt
      })),
      maxChoices: q.maxChoices,
      placeholder: q.placeholder,
      maxLength: q.maxLength,
    }))
  };
};
```

---

## Statut du Projet

**Date de complétion :** 15/10/2025  
**Statut :** ✅ **MVP COMPLET ET OPÉRATIONNEL**

Toutes les phases d'implémentation ont été complétées avec succès :
- ✅ Détection automatique Form vs Date Polls
- ✅ Génération de questionnaires par IA
- ✅ Interface chat avec affichage Form Polls
- ✅ Modification de sondages existants
- ✅ Tests et validation en production

Pour les prochaines améliorations et features avancées, voir le document `2. Planning.md`.

---
