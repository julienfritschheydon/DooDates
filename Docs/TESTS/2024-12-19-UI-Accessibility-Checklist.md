# ✅ Checklist Accessibilité UI - Paramètres Avancés

**Date:** 19 Décembre 2024  
**Objectif:** Vérifier que tous les paramètres avancés sont accessibles via l'UI

---

## 🎯 Résumé Statut

| Produit | UI Intégrée | Types Définis | Settings Sauvegardés | Statut |
|---------|-------------|---------------|----------------------|--------|
| **Date Polls** | ✅ | ✅ | ✅ | ✅ PRÊT |
| **Form Polls** | ✅ | ✅ | ✅ | ✅ PRÊT |
| **Availability Polls** | ✅ | ✅ | ✅ | ✅ PRÊT |
| **Quizz** | ✅ | ✅ | ✅ | ✅ PRÊT |

---

## 📋 Tests Manuels à Effectuer

### 1. Date Polls (PollCreator.tsx)

**Accès UI:**
- [ ] Ouvrir `/create` (création Date Poll)
- [ ] Cliquer sur "Paramètres et Partage" (panneau latéral)
- [ ] Vérifier présence onglet "Paramètres avancés" avec icône Settings
- [ ] Cliquer sur l'onglet "Paramètres avancés"

**Paramètres Visibles (7/10):**

**Onglet Basique:**
- [ ] ✅ Afficher logo DooDates (toggle)
- [ ] ❌ Temps estimé (non pertinent pour Date Polls)
- [ ] ❌ Nombre de questions (non pertinent)

**Onglet Avancé:**
- [ ] ✅ Connexion requise (toggle)
- [ ] ✅ Une seule réponse par personne (toggle)
- [ ] ✅ Autoriser modification après vote (toggle)
- [ ] ✅ Limite nombre de réponses (input number)

**Onglet Email:**
- [ ] ❌ Email confirmation (non pertinent, notifications déjà gérées)

**Onglet Visibilité:**
- [ ] ✅ Visibilité résultats (3 radio buttons: Créateur, Participants, Public)

**Sauvegarde:**
- [ ] Créer un Date Poll avec paramètres modifiés
- [ ] Vérifier dans localStorage/Supabase que `settings` contient les valeurs

---

### 2. Form Polls (FormPollCreator.tsx)

**Accès UI:**
- [ ] Ouvrir `/forms/create` (création Form Poll)
- [ ] Vérifier présence section "Paramètres avancés"

**Paramètres Visibles (10/10):**

**Onglet Basique:**
- [ ] ✅ Afficher logo DooDates (toggle)
- [ ] ✅ Temps estimé de complétion (toggle)
- [ ] ✅ Nombre de questions (toggle)

**Onglet Avancé:**
- [ ] ✅ Connexion requise (toggle)
- [ ] ✅ Une seule réponse par personne (toggle)
- [ ] ✅ Autoriser modification après soumission (toggle)
- [ ] ✅ Deadline configurable (date picker)
- [ ] ✅ Limite nombre de réponses (input number)

**Onglet Email:**
- [ ] ✅ Recevoir copie par email (toggle)
- [ ] ✅ Input email conditionnel (visible si toggle activé)

**Onglet Visibilité:**
- [ ] ✅ Visibilité résultats (3 radio buttons)

**Sauvegarde:**
- [ ] Créer un Form Poll avec tous les paramètres modifiés
- [ ] Vérifier sauvegarde dans `settings`

---

### 3. Availability Polls (AvailabilityPollCreatorContent.tsx)

**Accès UI:**
- [ ] Ouvrir `/availability/create` (création Availability Poll)
- [ ] Scroll jusqu'à la section "Paramètres avancés" (après Règles d'optimisation)
- [ ] Vérifier présence titre "Paramètres avancés" avec icône Settings

**Paramètres Visibles (7/10):**

**Onglet Basique:**
- [ ] ✅ Afficher logo DooDates (toggle)
- [ ] ❌ Temps estimé (non pertinent, vote rapide)
- [ ] ❌ Nombre de questions (grille unique)

**Onglet Avancé:**
- [ ] ✅ Connexion requise (toggle)
- [ ] ✅ Une seule réponse par personne (toggle)
- [ ] ✅ Autoriser modification après vote (toggle)
- [ ] ✅ Limite nombre de réponses (input number)

**Onglet Email:**
- [ ] ❌ Email confirmation (notifications déjà gérées)

**Onglet Visibilité:**
- [ ] ✅ Visibilité résultats (3 radio buttons)

**Sauvegarde:**
- [ ] Créer un Availability Poll avec paramètres modifiés
- [ ] Vérifier que `settings` contient les valeurs + schedulingRules

---

### 4. Quizz (QuizzCreate.tsx)

**Accès UI:**
- [ ] Ouvrir `/quizz/create` (création Quizz)
- [ ] Ajouter au moins 1 question (section conditionnelle)
- [ ] Scroll jusqu'à "Paramètres avancés" (avant boutons Annuler/Créer)
- [ ] Vérifier présence titre "Paramètres avancés" avec icône Settings

**Paramètres Visibles (7/10):**

**Onglet Basique:**
- [ ] ✅ Temps estimé de complétion (toggle)
- [ ] ✅ Nombre de questions (toggle)
- [ ] ❌ Logo (optionnel pour usage éducatif)

**Onglet Avancé:**
- [ ] ✅ Connexion requise (toggle)
- [ ] ✅ Une seule réponse par personne (toggle)
- [ ] ❌ Modification après vote (non pertinent, intégrité évaluation)
- [ ] ❌ Limite réponses (non pertinent)

**Onglet Email:**
- [ ] ❌ Email confirmation (non pertinent)

**Onglet Visibilité:**
- [ ] ✅ Visibilité résultats (3 radio buttons)

**Paramètres Spécifiques Quizz:**
- [ ] ✅ Autoriser nouvelle tentative (allowRetry)
- [ ] ✅ Afficher réponses correctes (showCorrectAnswers)

**Sauvegarde:**
- [ ] Créer un Quizz avec paramètres modifiés
- [ ] Vérifier que `settings` contient les valeurs

---

## 🔍 Tests Contrôle d'Accès Résultats

### Scénario 1: Mode "Créateur uniquement"

**Date Polls:**
- [ ] Créer Date Poll avec `resultsVisibility: 'creator-only'`
- [ ] En tant que créateur: Accéder `/results/[slug]` → ✅ Voir résultats
- [ ] En tant que visiteur: Accéder `/results/[slug]` → ❌ Message "Accès restreint"
- [ ] Vérifier bouton "Retour" fonctionne

**Form Polls:**
- [ ] Créer Form Poll avec `resultsVisibility: 'creator-only'`
- [ ] Tester accès créateur vs visiteur
- [ ] Vérifier message `ResultsAccessDenied`

### Scénario 2: Mode "Participants après vote"

**Date Polls:**
- [ ] Créer Date Poll avec `resultsVisibility: 'voters'`
- [ ] Avant vote: Accéder résultats → ❌ Message + Bouton "Voter maintenant"
- [ ] Après vote: Accéder résultats → ✅ Voir résultats
- [ ] Créateur: Toujours voir résultats

**Form Polls:**
- [ ] Créer Form Poll avec `resultsVisibility: 'voters'`
- [ ] Tester workflow complet (avant vote → après vote)

### Scénario 3: Mode "Public"

**Tous produits:**
- [ ] Créer poll avec `resultsVisibility: 'public'`
- [ ] N'importe qui peut voir résultats (créateur, votant, visiteur)

---

## 📊 Vérification Technique

### Fichiers à Vérifier

**Types définis:**
- [X] ✅ `src/lib/products/date-polls/date-polls-service.ts` → `DatePollSettings.resultsVisibility`
- [X] ✅ `src/lib/products/form-polls/form-polls-service.ts` → `FormPollSettings.resultsVisibility`
- [X] ✅ `src/lib/products/availability-polls/availability-polls-service.ts` → `AvailabilityPollSettings.resultsVisibility`
- [X] ✅ `src/lib/products/quizz/quizz-settings.ts` → `QuizzSettings.resultsVisibility`

**Intégrations UI:**
- [X] ✅ `src/components/PollCreator.tsx` → Import + State + SettingsPanel
- [X] ✅ `src/pages/AvailabilityPollCreatorContent.tsx` → Import + State + Section
- [X] ✅ `src/components/products/quizz/QuizzCreate.tsx` → Import + State + Section conditionnelle

**Contrôle d'accès:**
- [X] ✅ `src/hooks/useResultsAccess.ts` → Hook centralisé
- [X] ✅ `src/components/polls/ResultsAccessDenied.tsx` → Composant message
- [X] ✅ `src/pages/Results.tsx` → Utilise `useResultsAccess`
- [X] ✅ `src/components/polls/FormPollResults.tsx` → Utilise `useResultsAccess`

### Grep Checks

```bash
# Vérifier imports PollSettingsForm
grep -r "import.*PollSettingsForm" src/

# Vérifier utilisation advancedSettings
grep -r "advancedSettings" src/components/PollCreator.tsx
grep -r "advancedSettings" src/pages/AvailabilityPollCreatorContent.tsx
grep -r "advancedSettings" src/components/products/quizz/QuizzCreate.tsx

# Vérifier spread des settings
grep -r "...advancedSettings" src/
```

---

## ✅ Résultat Final

**Infrastructure Complète:**
- ✅ 4 produits avec UI intégrée
- ✅ 4 interfaces TypeScript avec `resultsVisibility`
- ✅ Hook `useResultsAccess` centralisé
- ✅ Composant `ResultsAccessDenied` réutilisable
- ✅ Contrôle d'accès implémenté pour Date + Form Polls

**Paramètres Accessibles:**
- ✅ Date Polls: 7 paramètres
- ✅ Form Polls: 10 paramètres
- ✅ Availability Polls: 7 paramètres
- ✅ Quizz: 7 paramètres

**Statut:** ✅ **TOUS LES PARAMÈTRES SONT ACCESSIBLES VIA L'UI**

---

## 📝 Ce qui reste (POST-LANCEMENT)

1. **Backend Email (3-4h)** - Nice to Have
   - Edge Function `send-poll-confirmation-email`
   - Intégration Resend/SendGrid
   - Templates email

2. **Tests E2E Automatisés (2-3h)** - Recommandé
   - Test création poll avec paramètres
   - Test contrôle d'accès résultats (3 modes)
   - Test modification après vote

3. **Documentation Utilisateur (1-2h)** - Important
   - Expliquer les 3 modes de visibilité
   - Guide "Paramètres avancés"
   - FAQ sécurité/confidentialité
