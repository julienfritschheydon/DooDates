# Plan d'amélioration des tests ultra-simples E2E - 4 produits

**Date**: 9 janvier 2026  
**Objectif**: Étendre les tests ultra-simples existants pour couvrir la partie publique (vote/participation) de chaque produit  
**Statut**: 📋 PLAN - Prêt pour implémentation

---

## 📋 Vue d'ensemble

Les 4 tests ultra-simples actuels couvrent uniquement la **création** des produits. Ce plan détaille les améliorations nécessaires pour ajouter la couverture de la **participation publique** (vote, réponse, jeu) pour chaque produit.

### Tests concernés

1. `@/tests/e2e/ultra-simple-poll.spec.ts` - **Date Polls**
2. `@/tests/e2e/ultra-simple-form.spec.ts` - **Form Polls**
3. `@/tests/e2e/ultra-simple-dispo.spec.ts` - **Availability Polls**
4. `@/tests/e2e/products/quizz/ultra-simple-quizz.spec.ts` - **Quizz**

---

## 🗳️ PRODUIT 1 : DATE POLLS (Sondages de dates)

### ✅ État actuel

**Fichier**: `@/tests/e2e/ultra-simple-poll.spec.ts`

**Couverture actuelle**:
- ✅ Création du poll via IA (`createDatePollWithTimeSlots`)
- ✅ Navigation vers page de vote (`navigateToPollVotingPage`)
- ✅ Vérification dashboard (`performDashboardActions`)

**Ce qui manque**: Le vote réel (sélection de dates et soumission)

---

### 📝 Plan d'amélioration

#### Composants analysés

**Fichiers clés**:
- `@/src/components/voting/VotingSwipe.tsx:517-525` - Composant principal
- `@/src/components/voting/VoteOption.tsx:91-99` - Options mobiles
- `@/src/components/voting/VoteOptionDesktop.tsx:88-96` - Options desktop
- `@/src/components/voting/VoterForm.tsx:193-202,266-275` - Formulaire votant
- `@/src/hooks/useVoting.ts:276-323` - Hook métier (`submitVote`)

#### Data-testid disponibles

| Élément | data-testid | Fichier | Ligne |
|---------|-------------|---------|-------|
| Bouton "Oui" | `vote-option-yes-{optionId}` | VoteOption.tsx | 98 |
| Bouton "Peut-être" | `vote-option-maybe-{optionId}` | VoteOptionDesktop.tsx | 138 |
| Bouton "Non" | `vote-option-no-{optionId}` | VoteOptionDesktop.tsx | 185 |
| Ouvrir formulaire | `open-voter-form` | VotingSwipe.tsx | 520 |
| Input nom | `voter-name` | VoterForm.tsx | 193 |
| Soumettre votes | `submit-votes` | VoterForm.tsx | 272 |
| Retour | `voter-form-back` | VoterForm.tsx | 158 |

#### Workflow à implémenter

```typescript
// APRÈS la création du poll avec createDatePollWithTimeSlots

// ========================================
// ÉTAPE 0 : Vérifier l'écran de succès
// ========================================
log("📋 ÉTAPE 0 : Vérification écran de succès");

// 0.1. Vérifier le titre "Sondage publié !"
await expect(page.getByRole('heading', { name: /sondage publié/i })).toBeVisible({ timeout: 10000 });
log("✅ Titre de succès affiché");

// 0.2. Vérifier que le lien de partage est visible
const shareLink = page.locator('code').filter({ hasText: /\/poll\// });
await expect(shareLink).toBeVisible();
const pollUrl = await shareLink.textContent();
log(`✅ Lien de partage visible: ${pollUrl}`);

// 0.3. Récupérer le slug du poll depuis le lien
const slugMatch = pollUrl?.match(/\/poll\/([^\s]+)/);
const pollSlug = slugMatch ? slugMatch[1] : null;
expect(pollSlug).toBeTruthy();
log(`📋 Slug du poll: ${pollSlug}`);

// 0.4. Cliquer sur "Voir le sondage" pour aller sur la page de vote
const viewPollButton = page.locator('[data-testid="view-poll-button"]');
await viewPollButton.click();
await waitForNetworkIdle(page, { browserName });
log("✅ Navigation vers page de vote");

// ========================================
// ÉTAPE 1 : Voter sur le sondage
// ========================================
log("🗳️ ÉTAPE 1 : Vote sur le sondage");

// 1.1. Attendre que les options de vote soient visibles
await page.waitForSelector('[data-testid^="vote-option-yes-"]', { timeout: 10000 });

// 1.2. Voter "Oui" sur la première date
const firstYesButton = page.locator('[data-testid^="vote-option-yes-"]').first();
await firstYesButton.click();
log("✅ Vote 'Oui' sur première date");

// 1.3. Voter "Peut-être" sur la deuxième date (si elle existe)
const secondMaybeButton = page.locator('[data-testid^="vote-option-maybe-"]').nth(1);
if (await secondMaybeButton.isVisible({ timeout: 2000 })) {
  await secondMaybeButton.click();
  await waitForReactStable(page, { browserName });
  log("✅ Vote 'Peut-être' sur deuxième date");
}

// 1.4. Ouvrir le formulaire votant
const openFormButton = page.locator('[data-testid="open-voter-form"]');
await openFormButton.click();
await waitForReactStable(page, { browserName });
log("✅ Formulaire votant ouvert");

// 1.5. Remplir le nom
const nameInput = page.locator('[data-testid="voter-name"]');
await nameInput.fill("Test E2E Votant");
log("✅ Nom rempli");

// 1.6. Soumettre les votes
const submitButton = page.locator('[data-testid="submit-votes"]');
await submitButton.click();
await waitForNetworkIdle(page, { browserName });
log("✅ Votes soumis");

// 1.7. Vérifier la confirmation (VoteCompletionScreen)
await expect(page.getByText(/merci.*vote/i)).toBeVisible({ timeout: 10000 });
log("✅ Confirmation de vote affichée");

// ========================================
// ÉTAPE 2 : Aller au dashboard et vérifier les résultats
// ========================================
log("📊 ÉTAPE 2 : Vérification dashboard et résultats");

// 2.1. Naviguer vers le dashboard
await page.goto('/date/dashboard', { waitUntil: 'domcontentloaded' });
await waitForNetworkIdle(page, { browserName });
log("✅ Navigation vers dashboard");

// 2.2. Vérifier que le sondage apparaît dans la liste
await expect(page.getByText(/test.*sondage/i)).toBeVisible({ timeout: 10000 });
log("✅ Sondage visible dans le dashboard");

// 2.3. Cliquer sur "Voir les résultats"
const viewResultsButton = page.getByRole('button', { name: /résultats/i }).first();
await viewResultsButton.click();
await waitForNetworkIdle(page, { browserName });
log("✅ Navigation vers page résultats");

// 2.4. Vérifier que le vote est comptabilisé
await expect(page.getByText(/test e2e votant/i)).toBeVisible({ timeout: 10000 });
log("✅ Vote de 'Test E2E Votant' visible dans les résultats");

// 2.5. Vérifier que les statistiques sont affichées
await expect(page.getByText(/1.*vote|vote.*1/i)).toBeVisible({ timeout: 5000 });
log("✅ Statistiques de vote affichées");
```

---

## 📝 PRODUIT 2 : FORM POLLS (Formulaires)

### ✅ État actuel

**Fichier**: `@/tests/e2e/ultra-simple-form.spec.ts`

**Couverture actuelle**:
- ✅ Création via IA
- ✅ Ajout/suppression de questions via IA
- ✅ Reprise après refresh
- ✅ Publication
- ⚠️ **Tentative de vote (lignes 172-202) mais incomplète**

**Ce qui manque**: 
1. Vérification de l'écran de succès après publication
2. Workflow de vote complet et robuste
3. Navigation vers le dashboard et vérification des résultats

---

### Plan d'amélioration

#### Composants analysés

**Fichiers clés**:
- `@/src/pages/PollCreator.tsx:142-273` - Écran de succès (même composant que Date Polls)
- `@/src/components/polls/FormPollVote.tsx:238` - Vote classique (`onSubmit`)
- `@/src/components/polls/MultiStepFormVote.tsx:176` - Vote multi-étapes
- `@/src/lib/pollStorage.ts:1021` - Fonction `addFormResponse`

#### Data-testid disponibles

| Élément | data-testid | Fichier | Ligne |
|---------|-------------|---------|-------|
| **Écran de succès** | | | |
| Bouton Dashboard | `go-to-dashboard-button` | PollCreator.tsx | 231 |
| Voir le formulaire | `view-poll-button` | PollCreator.tsx | 239 |
| Copier le lien | `copy-link-button` | PollCreator.tsx | 263 |
| **Vote multi-étapes** | | | |
| Boutons génériques | `multistepformvote-button` | MultiStepFormVote.tsx | 566, 631, 663 |

#### PROBLÈME: Manque de data-testid dans FormPollVote.tsx

**Action requise AVANT le test**: Ajouter des data-testid pour le mode classique.

#### Workflow à implémenter

```typescript
// APRÈS la publication du formulaire via IA

// ========================================
// ÉTAPE 0 : Vérifier l'écran de succès
// ========================================
log("ÉTAPE 0 : Vérification écran de succès");

// 0.1. Vérifier le titre "Formulaire publié !"
await expect(page.getByRole('heading', { name: /formulaire publié/i })).toBeVisible({ timeout: 10000 });
log("Titre de succès affiché");

// 0.2. Récupérer le slug depuis le lien de partage
const shareLink = page.locator('code').filter({ hasText: /\/poll\// });
await expect(shareLink).toBeVisible();
const pollUrl = await shareLink.textContent();
const slugMatch = pollUrl?.match(/\/poll\/([^\s]+)/);
const formSlug = slugMatch ? slugMatch[1] : null;
expect(formSlug).toBeTruthy();
log(`Slug du formulaire: ${formSlug}`);

// 0.3. Cliquer sur "Voir le formulaire"
const viewFormButton = page.locator('[data-testid="view-poll-button"]');
await viewFormButton.click();
await waitForNetworkIdle(page, { browserName });
log("Navigation vers page de vote");

// ========================================
// ÉTAPE 1 : Voter sur le formulaire
// ========================================
log("ÉTAPE 1 : Vote sur le formulaire");

// 1.1. Remplir le nom
const nameInput = page.getByPlaceholder(/nom|prénom/i).first();
await nameInput.fill("Test E2E Votant");
log("Nom rempli");

// 1.2. Répondre aux questions texte
const textInputs = page.locator('input[type="text"], textarea').filter({ hasNot: page.getByPlaceholder(/nom|prénom/i) });
const textCount = await textInputs.count();
for (let i = 0; i < textCount; i++) {
  await textInputs.nth(i).fill(`Réponse texte ${i + 1}`);
}
log(`${textCount} questions texte remplies`);

// 1.3. Répondre aux choix uniques (radio)
const firstRadio = page.locator('input[type="radio"]').first();
if (await firstRadio.isVisible({ timeout: 2000 })) {
  await firstRadio.click();
  log("Question choix unique répondue");
}

// 1.4. Soumettre
const submitButton = page.getByRole('button', { name: /envoyer|soumettre/i });
await submitButton.click();
await waitForNetworkIdle(page, { browserName });
log("Formulaire soumis");

// 1.5. Vérifier la confirmation
await expect(page.getByText(/merci|succès|enregistré/i)).toBeVisible({ timeout: 10000 });
log("Confirmation affichée");

// ========================================
// ÉTAPE 2 : Dashboard et résultats
// ========================================
log("ÉTAPE 2 : Vérification dashboard");

// 2.1. Naviguer vers le dashboard
await page.goto('/date/dashboard', { waitUntil: 'domcontentloaded' });
await waitForNetworkIdle(page, { browserName });
log("Navigation vers dashboard");

// 2.2. Vérifier que le formulaire apparaît
await expect(page.getByText(/test.*formulaire/i)).toBeVisible({ timeout: 10000 });
log("Formulaire visible dans le dashboard");

// 2.3. Voir les résultats
const viewResultsButton = page.getByRole('button', { name: /résultats/i }).first();
await viewResultsButton.click();
await waitForNetworkIdle(page, { browserName });
log("Navigation vers résultats");

// 2.4. Vérifier la réponse comptabilisée
await expect(page.getByText(/test e2e votant/i)).toBeVisible({ timeout: 10000 });
log("Réponse visible dans les résultats");
```

---

## PRODUIT 3 : AVAILABILITY POLLS (Disponibilités)

### État actuel

**Fichier**: `@/tests/e2e/ultra-simple-dispo.spec.ts`

**Couverture actuelle**:
- Création du poll (formulaire manuel)
- Publication
- Vérification dashboard

**Ce qui manque**: 
1. Écran de succès
2. Client donne disponibilités
3. Praticien propose créneaux
4. Client valide créneau
5. Dashboard final

---

### Plan d'amélioration

#### Workflow complet (5 phases)

```
PRATICIEN crée → CLIENT donne dispo → PRATICIEN propose créneaux → CLIENT valide → DASHBOARD
```

#### Data-testid disponibles

| Élément | data-testid | Fichier | Ligne |
|---------|-------------|---------|-------|
| Écran succès | `go-to-dashboard-button`, `view-poll-button` | PollCreator.tsx | 231, 239 |
| Vote client | `availability-vote-back-home` | AvailabilityPollVote.tsx | 159 |
| Praticien | `availability-add-slot`, `availability-save-slots` | AvailabilityPollResults.tsx | 560, 688 |

#### Workflow à implémenter

```typescript
// APRÈS la création du poll de disponibilités

// ========================================
// PHASE 0 : Écran de succès
// ========================================
log("PHASE 0 : Écran de succès");

await expect(page.getByRole('heading', { name: /sondage publié/i })).toBeVisible({ timeout: 10000 });
const shareLink = page.locator('code').filter({ hasText: /\/poll\// });
const pollUrl = await shareLink.textContent();
const pollSlug = pollUrl?.match(/\/poll\/([^\s]+)/)?.[1];
expect(pollSlug).toBeTruthy();
log(`Slug: ${pollSlug}`);

// ========================================
// PHASE A : Client donne disponibilités
// ========================================
log("PHASE A : Client donne disponibilités");

await page.goto(`/availability/${pollSlug}/vote`, { waitUntil: "domcontentloaded" });
await waitForNetworkIdle(page, { browserName });

const availabilityTextarea = page.locator('textarea').first();
await availabilityTextarea.fill("Lundi 10h-12h, Mardi 14h-17h");
log("Disponibilités saisies");

const submitButton = page.getByRole('button', { name: /envoyer|soumettre/i });
await submitButton.click();
await waitForNetworkIdle(page, { browserName });

await expect(page.getByText(/disponibilités.*envoyées/i)).toBeVisible({ timeout: 10000 });
log("Disponibilités envoyées");

// ========================================
// PHASE B : Praticien propose créneaux
// ========================================
log("PHASE B : Praticien propose créneaux");

await page.goto(`/availability/${pollSlug}/results`, { waitUntil: "domcontentloaded" });
await waitForNetworkIdle(page, { browserName });

await expect(page.getByText(/lundi.*10h/i)).toBeVisible({ timeout: 5000 });
log("Disponibilités client visibles");

const addSlotButton = page.locator('[data-testid="availability-add-slot"]');
await addSlotButton.click();
await waitForReactStable(page, { browserName });

const tomorrow = new Date();
tomorrow.setDate(tomorrow.getDate() + 1);
const dateStr = tomorrow.toISOString().split('T')[0];

await page.locator('input[type="date"]').last().fill(dateStr);
await page.locator('input[type="time"]').first().fill("10:00");
await page.locator('input[type="time"]').last().fill("11:00");
log("Créneau rempli");

const saveButton = page.locator('[data-testid="availability-save-slots"]');
await saveButton.click();
await waitForNetworkIdle(page, { browserName });

await expect(page.getByText(/créneaux.*sauvegardés/i)).toBeVisible({ timeout: 10000 });
log("Créneaux sauvegardés");

// ========================================
// PHASE C : Client valide créneau
// ========================================
log("PHASE C : Client valide créneau");

await page.goto(`/availability/${pollSlug}/vote`, { waitUntil: "domcontentloaded" });
await page.waitForTimeout(3000); // Polling
log("Attente polling...");

const slotButton = page.getByRole('button', { name: /valider|choisir/i }).first();
await expect(slotButton).toBeVisible({ timeout: 10000 });
await slotButton.click();
await waitForNetworkIdle(page, { browserName });

await expect(page.getByText(/créneau.*validé/i)).toBeVisible({ timeout: 10000 });
log("Créneau validé");

// ========================================
// PHASE D : Dashboard
// ========================================
log("PHASE D : Dashboard");

await page.goto('/date/dashboard', { waitUntil: 'domcontentloaded' });
await waitForNetworkIdle(page, { browserName });

await expect(page.getByText(/test.*disponibilités/i)).toBeVisible({ timeout: 10000 });
log("Poll visible dans dashboard");

const viewResultsButton = page.getByRole('button', { name: /résultats/i }).first();
await viewResultsButton.click();
await waitForNetworkIdle(page, { browserName });

await expect(page.getByText(/validé|confirmé/i)).toBeVisible({ timeout: 10000 });
log("Créneau validé visible");
```

---

## PRODUIT 4 : QUIZZ

### État actuel

**Fichier**: `@/tests/e2e/products/quizz/ultra-simple-quizz.spec.ts`

**Couverture actuelle**:
- Création manuelle
- Écran de succès (`quiz-success-screen`)
- **Vote COMPLET déjà implémenté** (lignes 85-139)
  - Nom, démarrage, réponse, validation, feedback, résultats

**Ce qui manque**: 
1. Navigation dashboard après quiz
2. Vérification résultats dans dashboard

---

### Plan d'amélioration

#### Workflow à ajouter (après le quiz)

```typescript
// APRÈS avoir joué au quiz et vu les résultats (déjà implémenté)

// ========================================
// ÉTAPE FINALE : Dashboard
// ========================================
log("ÉTAPE FINALE : Dashboard");

// 1. Cliquer sur "Voir les statistiques" (si disponible)
const statsButton = page.locator('[data-testid="quizzvote-navigate"]');
if (await statsButton.isVisible({ timeout: 2000 })) {
  await statsButton.click();
  await waitForNetworkIdle(page, { browserName });
  log("Navigation vers statistiques");
}

// 2. Naviguer vers le dashboard
await page.goto('/date/dashboard', { waitUntil: 'domcontentloaded' });
await waitForNetworkIdle(page, { browserName });
log("Navigation vers dashboard");

// 3. Vérifier que le quiz apparaît
await expect(page.getByText(/test.*quiz/i)).toBeVisible({ timeout: 10000 });
log("Quiz visible dans dashboard");

// 4. Voir les résultats
const viewResultsButton = page.getByRole('button', { name: /résultats/i }).first();
await viewResultsButton.click();
await waitForNetworkIdle(page, { browserName });
log("Navigation vers résultats");

// 5. Vérifier participation comptabilisée
await expect(page.getByText(/1.*participant/i)).toBeVisible({ timeout: 10000 });
log("Participation comptabilisée");
```

---

## RÉSUMÉ ET ORDRE D'EXÉCUTION

### Priorités

1. **QUIZZ** (15 min) - Ajouter dashboard uniquement
2. **DATE POLLS** (1h) - Workflow complet
3. **FORM POLLS** (2h) - Ajouter data-testid + workflow
4. **AVAILABILITY POLLS** (2h) - Workflow 5 phases

**Temps total**: 5h15

### Commandes de test

```bash
# Tous les tests ultra-simples
npx playwright test tests/e2e/ultra-simple-poll.spec.ts tests/e2e/ultra-simple-form.spec.ts tests/e2e/ultra-simple-dispo.spec.ts tests/e2e/products/quizz/ultra-simple-quizz.spec.ts --project=chromium

# Test individuel
npx playwright test tests/e2e/ultra-simple-poll.spec.ts --project=chromium
```

---

**Statut**: PLAN COMPLET  
**Prochaine étape**: Commencer par QUIZZ (15 min)