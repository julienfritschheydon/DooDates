# Analyse Comparative : DooDates vs SurveyMonkey

**Date :** 31 octobre 2025  
**Objectif :** Identifier les gaps et opportunités de différenciation

---

## 📊 Résumé Exécutif

### Notre Positionnement Stratégique

**DooDates = IA conversationnelle + Générosité freemium + Export ouvert**

**Avantages compétitifs identifiés :**

1. ✅ **Pas de limite d'export** - Différenciateur majeur vs SurveyMonkey
2. ✅ **IA conversationnelle** - Création naturelle vs interface complexe
3. ✅ **Onboarding guidé** - Vs "syndrome de la page blanche" de SurveyMonkey
4. ⚠️ **Richesse fonctionnelle** - Gap important à combler

---

## 🎯 Analyse Gap par Domaine

### 1. Onboarding & Première Expérience

| Critère                      | SurveyMonkey    | DooDates (Actuel) | Action Requise  |
| ---------------------------- | --------------- | ----------------- | --------------- |
| **Inscription rapide**       | ✅ OAuth Google | ✅ OAuth Supabase | ✅ OK           |
| **Onboarding guidé**         | ❌ Aucun        | ⚠️ Minimal        | 🔴 **CRITIQUE** |
| **Personnalisation accueil** | ❌ Aucune       | ❌ Aucune         | 🟡 Nice-to-have |
| **Accès immédiat**           | ✅ Direct       | ✅ Direct         | ✅ OK           |

**Verdict :** Notre onboarding IA est déjà un avantage, mais il faut le rendre plus explicite.

---

### 2. Types de Questions & Richesse Fonctionnelle

| Catégorie       | SurveyMonkey                      | DooDates (Actuel)                              | Gap             |
| --------------- | --------------------------------- | ---------------------------------------------- | --------------- |
| **Sélection**   | 28 types                          | 5 types (single, multiple, text, matrix, date) | 🔴 **MAJEUR**   |
| **Évaluation**  | Étoiles, curseur, classement, NPS | ❌ Aucun                                       | 🔴 **CRITIQUE** |
| **Formulaires** | Nom, email, téléphone, adresse    | ⚠️ Texte libre uniquement                      | 🟡 Moyen        |
| **Avancé**      | NPS, carte de clics, A/B test     | ❌ Aucun                                       | 🟢 Post-bêta    |

**Verdict :** Gap fonctionnel important, mais notre IA peut compenser en partie.

#### 🎯 Types de Questions à Ajouter (Priorité HAUTE)

**Phase Bêta (Quick Wins - 4h) :**

1. **Échelle de notation (1-5, 1-10)** - 1h
   - Type : `rating`
   - UI : Boutons radio stylisés avec emojis optionnels
   - IA : Parser "note de 1 à 5", "échelle de satisfaction"

2. **Net Promoter Score (NPS)** - 1h
   - Type : `nps` (échelle 0-10 spéciale)
   - UI : Échelle 0-10 avec labels "Détracteur / Passif / Promoteur"
   - IA : Parser "NPS", "recommanderiez-vous"

3. **Champs structurés** - 2h
   - Types : `email`, `phone`, `url`
   - UI : Input avec validation HTML5
   - IA : Parser "adresse email", "numéro de téléphone"

**Post-Bêta (Nice-to-have) :**

- Curseur (slider)
- Classement (drag & drop)
- Carte de clics
- Upload de fichiers

---

### 3. Personnalisation Visuelle (Styling)

| Fonctionnalité         | SurveyMonkey Gratuit | DooDates          | Opportunité        |
| ---------------------- | -------------------- | ----------------- | ------------------ |
| **Thèmes prédéfinis**  | ✅ Basiques          | ❌ Aucun          | 🟡 Moyen           |
| **Logo personnalisé**  | ❌ Payant            | ❌ Pas implémenté | 🟢 Post-bêta       |
| **Génération IA**      | ✅ Payant            | ❌ Pas implémenté | 🟢 Différenciateur |
| **Branding retirable** | ❌ Payant            | ✅ **GRATUIT**    | ✅ **AVANTAGE**    |

**Verdict :** Notre approche minimaliste est OK pour la bêta. Ajouter 2-3 thèmes basiques serait un plus.

#### 🎯 Action Bêta (2h)

- Créer 3 thèmes de couleur prédéfinis (Bleu/Vert/Violet)
- Sélecteur simple dans FormPollCreator
- Pas de logo/branding DooDates sur les formulaires (différenciateur)

---

### 4. Distribution & Collecte

| Canal                       | SurveyMonkey Gratuit | DooDates                 | Action          |
| --------------------------- | -------------------- | ------------------------ | --------------- |
| **Lien web + QR code**      | ✅                   | ✅                       | ✅ OK           |
| **Partage réseaux sociaux** | ✅ Boutons intégrés  | ⚠️ Lien copié uniquement | 🟡 Nice-to-have |
| **Embed (iframe)**          | ✅ 4 modes           | ❌ Pas implémenté        | 🟢 Post-bêta    |
| **Email avec suivi**        | ❌ **PAYANT**        | ❌ Pas implémenté        | 🟡 Post-bêta    |

**Verdict :** Notre système de partage par lien est suffisant pour la bêta.

#### 🎯 Action Bêta (1h)

- Ajouter boutons de partage rapide (WhatsApp, LinkedIn, Twitter)
- Utiliser Web Share API sur mobile

---

### 5. Analyse & Reporting

| Fonctionnalité           | SurveyMonkey Gratuit | DooDates         | Opportunité            |
| ------------------------ | -------------------- | ---------------- | ---------------------- |
| **Filtres avancés**      | ✅ Puissant          | ⚠️ Basique       | 🟡 Post-bêta           |
| **Comparaison segments** | ✅                   | ❌               | 🟡 Post-bêta           |
| **Export données**       | ❌ **BLOQUÉ**        | ✅ **4 FORMATS** | ✅ **AVANTAGE MAJEUR** |
| **Analyse sentiment**    | ❌ Payant            | ❌               | 🟢 Différenciateur IA  |
| **Tableaux croisés**     | ❌ Payant            | ❌               | 🟢 Post-bêta           |

**Verdict :** Notre export ouvert est un **différenciateur stratégique majeur**.

#### 🎯 Action Bêta (3h)

1. **Filtres basiques** (2h)
   - Filtrer par date de réponse
   - Filtrer par répondant
   - Afficher/masquer questions

2. **Analyse IA** (1h)
   - Résumé automatique des réponses texte (Gemini)
   - Détection tendances principales

---

### 6. Modèle Freemium

| Limitation          | SurveyMonkey Gratuit | DooDates (Proposition)       | Différenciation |
| ------------------- | -------------------- | ---------------------------- | --------------- |
| **Réponses max**    | 25 par sondage       | ∞ illimité                   | ✅ **MAJEUR**   |
| **Export données**  | ❌ Bloqué            | ✅ Gratuit (CSV/JSON/MD/PDF) | ✅ **MAJEUR**   |
| **Branding**        | ❌ Obligatoire       | ✅ Retirable                 | ✅ **MAJEUR**   |
| **Types questions** | ⚠️ Limité            | ✅ Tous gratuits             | ✅ **MAJEUR**   |
| **Email suivi**     | ❌ Payant            | 🤔 À définir                 | 🟡              |
| **Logique avancée** | ⚠️ Limitée           | ✅ Conditionnelles gratuites | ✅ **MAJEUR**   |

**Verdict :** Notre modèle freemium est **beaucoup plus généreux** - c'est notre arme stratégique.

---

## 🚀 Plan d'Action Prioritaire

### 🔴 CRITIQUE - Avant Bêta (8h)

#### 1. Onboarding Guidé (2h)

**Problème :** Utilisateur perdu face à l'interface chat vide.

**Solution :**

```typescript
// Composant OnboardingTour.tsx
- Étape 1: "Bienvenue ! Décris ton sondage en langage naturel"
- Étape 2: "Exemple : 'Crée un questionnaire de satisfaction client'"
- Étape 3: "L'IA génère le formulaire, tu peux le modifier"
- Étape 4: "Publie et partage le lien"
```

**Fichiers à créer :**

- `src/components/OnboardingTour.tsx`
- `src/hooks/useOnboarding.ts` (localStorage pour ne montrer qu'une fois)

**Intégration :**

- Afficher au premier lancement de GeminiChatInterface
- Bouton "Passer" pour utilisateurs avancés
- Checkbox "Ne plus afficher"

---

#### 2. Types de Questions Essentiels (4h)

**2.1. Échelle de notation (1h)**

```typescript
// Ajout dans FormPollCreator.tsx
type QuestionType =
  | "single"
  | "multiple"
  | "text"
  | "matrix"
  | "rating" // NOUVEAU
  | "nps"; // NOUVEAU

interface RatingQuestion extends Question {
  type: "rating";
  ratingScale: 5 | 10; // 1-5 ou 1-10
  ratingLabels?: { min: string; max: string }; // "Pas du tout" / "Énormément"
}
```

**UI :**

- Boutons radio stylisés (1 2 3 4 5)
- Emojis optionnels (😞 😐 😊 😄 😍)

**2.2. Net Promoter Score (1h)**

```typescript
interface NPSQuestion extends Question {
  type: "nps";
  // Échelle fixe 0-10
  // Labels automatiques : 0-6 Détracteur, 7-8 Passif, 9-10 Promoteur
}
```

**UI :**

- Échelle 0-10 horizontale
- Couleurs : Rouge (0-6), Jaune (7-8), Vert (9-10)

**2.3. Champs structurés (2h)**

```typescript
type StructuredType = "email" | "phone" | "url";

interface StructuredQuestion extends Question {
  type: "text";
  structuredType?: StructuredType; // Validation HTML5
}
```

**Validation :**

- Email : pattern HTML5 + message erreur
- Phone : pattern international
- URL : protocol check

---

#### 3. Thèmes Visuels Basiques (2h)

**Créer 3 thèmes prédéfinis :**

```typescript
// src/lib/themes.ts
export const THEMES = {
  blue: {
    primary: "#3B82F6",
    secondary: "#60A5FA",
    accent: "#1E40AF",
  },
  green: {
    primary: "#10B981",
    secondary: "#34D399",
    accent: "#059669",
  },
  purple: {
    primary: "#8B5CF6",
    secondary: "#A78BFA",
    accent: "#6D28D9",
  },
};
```

**UI :**

- Sélecteur dans FormPollCreator (3 carrés de couleur)
- Application via CSS variables
- Persistance dans poll.theme

---

### 🟡 IMPORTANT - Semaine 1 Post-Bêta (5h)

#### 4. Partage Réseaux Sociaux (1h)

```typescript
// src/components/ShareButtons.tsx
- WhatsApp (mobile)
- LinkedIn
- Twitter
- Facebook
- Web Share API (mobile natif)
```

#### 5. Filtres Basiques Résultats (2h)

```typescript
// src/components/ResultsFilters.tsx
- Filtrer par date (aujourd'hui, cette semaine, ce mois)
- Filtrer par répondant (si identifié)
- Afficher/masquer questions
```

#### 6. Analyse IA Résumé (2h)

```typescript
// src/services/ResultsAnalysis.ts
- Résumé automatique des réponses texte (Gemini)
- Top 3 tendances
- Sentiment général (positif/neutre/négatif)
```

---

### 🟢 POST-BÊTA - Différenciateurs IA (10h+)

#### 7. Génération Thème par IA (3h)

- Upload logo → Gemini Vision extrait couleurs
- Génération palette complète
- Différenciateur vs SurveyMonkey (payant chez eux)

#### 8. Embed & Intégration Web (4h)

- Iframe embed
- Bouton déclencheur
- Pop-up invitation
- Widget flottant

#### 9. Analyse Avancée (3h)

- Tableaux croisés
- Comparaison segments
- Analyse temporelle

---

## 📈 Métriques de Différenciation

### Avantages Compétitifs à Mettre en Avant

**Landing Page - Section "Pourquoi DooDates ?" :**

1. **🎁 100% Gratuit, Vraiment**
   - ✅ Réponses illimitées (vs 25 chez SurveyMonkey)
   - ✅ Export gratuit CSV/JSON/PDF (vs payant)
   - ✅ Tous les types de questions (vs limité)
   - ✅ Pas de branding forcé (vs logo obligatoire)

2. **🤖 IA Conversationnelle**
   - ✅ "Crée un questionnaire de satisfaction" → Fait
   - ✅ Modification en langage naturel
   - ✅ Pas de formation nécessaire

3. **⚡ Rapide & Simple**
   - ✅ Créer un sondage en 30 secondes
   - ✅ Partager en 1 clic
   - ✅ Résultats en temps réel

---

## 🎯 Recommandations Stratégiques

### Ce qu'on DOIT faire (Bêta)

1. ✅ **Onboarding guidé** - Critique pour adoption
2. ✅ **Types questions essentiels** (rating, NPS, structured) - Crédibilité
3. ✅ **Thèmes basiques** - Polish UX
4. ✅ **Maintenir export gratuit** - Différenciateur #1

### Ce qu'on PEUT faire (Post-Bêta)

1. 🟡 Partage réseaux sociaux
2. 🟡 Filtres résultats
3. 🟡 Analyse IA résumé

### Ce qu'on NE DOIT PAS faire (Maintenant)

1. ❌ Embed avancé (iframe, popup) - Complexité vs valeur
2. ❌ Email avec suivi - Infrastructure lourde
3. ❌ Templates prédéfinis - L'IA suffit
4. ❌ Analyse avancée (crosstabs) - Overkill pour bêta

---

## 📊 Tableau de Bord Compétitif

| Critère             | SurveyMonkey Gratuit | DooDates Bêta           | Gagnant         |
| ------------------- | -------------------- | ----------------------- | --------------- |
| **Réponses max**    | 25                   | ∞                       | 🏆 DooDates     |
| **Export données**  | ❌                   | ✅ 4 formats            | 🏆 DooDates     |
| **Types questions** | 28 (limités)         | 8 (tous gratuits)       | ⚖️ Égalité      |
| **Branding**        | Forcé                | Retirable               | 🏆 DooDates     |
| **Onboarding**      | ❌ Aucun             | ✅ Guidé IA             | 🏆 DooDates     |
| **Création**        | Interface complexe   | ✅ IA conversationnelle | 🏆 DooDates     |
| **Analyse**         | Puissante (limitée)  | Basique + IA            | ⚖️ Égalité      |
| **Embed**           | ✅ 4 modes           | ❌                      | 🏆 SurveyMonkey |
| **Email suivi**     | ❌ Payant            | ❌                      | ⚖️ Égalité      |

**Score : DooDates 6 - SurveyMonkey 1 - Égalité 3**

---

## 🎬 Conclusion

### Notre Positionnement Unique

**DooDates n'est PAS un clone de SurveyMonkey.**

**Nous sommes :**

- **Plus généreux** (freemium sans frustration)
- **Plus simple** (IA conversationnelle)
- **Plus ouvert** (export gratuit)
- **Plus rapide** (création en 30s)

**Nous acceptons d'être :**

- **Moins riche fonctionnellement** (pour l'instant)
- **Moins puissant en analyse** (compensé par IA)
- **Moins "enterprise"** (pas notre cible)

### Message Marketing

> **"SurveyMonkey vous frustre avec ses limites ?**  
> DooDates est l'alternative gratuite et intelligente.  
> Créez des sondages en parlant naturellement, exportez vos données librement, et partagez sans limite.  
> Tout ça gratuitement. Pour de vrai."

---

## 📋 Checklist Bêta

### Avant Lancement (8h)

- [ ] Onboarding guidé (2h)
- [ ] Type question : Rating 1-5 (1h)
- [ ] Type question : NPS 0-10 (1h)
- [ ] Types structurés : email, phone, url (2h)
- [ ] 3 thèmes de couleur (2h)

### Semaine 1 Post-Bêta (5h)

- [ ] Boutons partage réseaux sociaux (1h)
- [ ] Filtres basiques résultats (2h)
- [ ] Analyse IA résumé (2h)

### Landing Page

- [ ] Section "Pourquoi DooDates ?"
- [ ] Tableau comparatif vs SurveyMonkey
- [ ] Témoignages (post-bêta)

---

**Dernière mise à jour :** 31 octobre 2025
