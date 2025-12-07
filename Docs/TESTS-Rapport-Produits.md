# Rapport d’audit des tests après séparation en 4 produits

## 1. État CI / Workflows

- **Rapport `workflow-failures-report.md` (29/11/2025)**  
  - Commit analysé `c3e56ab` : **tous les workflows monitorés OK** pour ce commit.  
  - Il reste un **échec critique historisé** sur `Main Post-Merge E2E` marqué "unknown (high)", qui bloque potentiellement le déploiement mais n’est pas forcément lié au dernier refactor produits.
- Conclusion : **pas de casse systémique visible** dans le CI sur le dernier commit, mais au moins un E2E post-merge à analyser au cas par cas.

---

## 2. Cartographie rapide des suites de tests

- **Unitaires / src/**
  - `src/__tests__/error-handling-enforcement.test.ts`  
  - `tests/unit/markdown-parser/*`  
  → Ces tests sont **très peu couplés** aux produits. Ils testent des briques techniques (erreurs, parsing) et survivent bien au refactor produit.

- **Intégration**
  - `tests/integration/api-security-performance.spec.ts`
  - `tests/integration/unified-flow.test.ts.skip`
  - `tests/integration/shared/*`  
  → Tests plutôt centrés "API / sécurité / flux unifié". La séparation produits n’est pas vraiment reflétée ici (on reste sur une vision "app globale").

- **E2E (Playwright)**
  - Fichiers globaux : `production-smoke.spec.ts`, `dashboard-complete.spec.ts`, `main-landing.spec.ts`, `mobile-voting.spec.ts`, `availability-poll-workflow.spec.ts`, `form-poll-results-access.spec.ts`, etc.
  - Dossier structuré par produit :  
    - `tests/e2e/products/date-polls/*`
    - `tests/e2e/products/form-polls/*`
    - `tests/e2e/products/availability-polls/*`
    - `tests/e2e/products/quizz/*`
    - `tests/e2e/products/cross-product/product-isolation.spec.ts`
  - Dossier `tests/e2e/OLD/` avec d’anciens tests encore présents (dont `form-poll-regression.spec.ts`, `poll-actions.spec.ts`) qui reflètent l’ancienne architecture.

- **Load / quota**
  - `tests/load/quota-tracking-load-test.js`
  - `tests/e2e/quota-tracking-complete.spec.ts`  
  → Très couplé à la logique de quotas et à la **distinction par type de poll** (datePollsCreated, formPollsCreated, availabilityPollsCreated, quizzCreated).

---

## 3. Où la séparation en 4 produits est déjà bien reflétée

### 3.1. Entrée produit & navigation

- `tests/e2e/main-landing.spec.ts`
  - Vérifie que `/` affiche bien **3 cartes produits** (Date Polls, Form Polls, Availability Polls) avec les bons `href` (`/date-polls`, `/form-polls`, `/availability-polls`) + navigation.
  - C’est **aligné avec la nouvelle architecture multi-produits** (au moins pour 3 des 4).

- `tests/e2e/products/cross-product/product-isolation.spec.ts`
  - Seed 1 poll de chaque type en localStorage (`type: 'date' | 'form' | 'availability'`) et vérifie :
    - Dashboard DatePoll ne montre **que** les DatePolls.
    - Dashboard FormPoll ne montre **que** les FormPolls.
    - Dashboard AvailabilityPoll ne montre **que** les AvailabilityPolls.
  - Utilise `PRODUCT_ROUTES.datePoll.dashboard`, `PRODUCT_ROUTES.formPoll.dashboard`, `PRODUCT_ROUTES.availabilityPoll.dashboard`.  
  → **Très bon test d’isolation produit** : il valide explicitement la séparation des dashboards.

### 3.2. Workflows ultra simples par produit

- `tests/e2e/ultra-simple-poll.spec.ts`
  - Workflow complet **Date Poll** via IA :
    - Navigation via `PRODUCT_ROUTES.datePoll.landing`.
    - Création d’un date poll (helpers `createDatePollWithTimeSlots`).
    - Vote + vérification présence dans le dashboard via helpers.
  - Ce test est **bien ancré dans le produit "Date Polls"**.

- `tests/e2e/ultra-simple-form.spec.ts`
  - Workflow complet **Form Poll** :
    - Setup avec navigation initiale sur `PRODUCT_ROUTES.formPoll.landing`.
    - Création via IA: `createFormPollViaAI`.
    - Modifications IA (ajout/suppression question), reload, persistance.
    - Passage à la page `/DooDates/poll/{slug}` (vote) + vérification minimaliste du **dashboard global** `/DooDates/dashboard`.
  - Il teste bien le produit "Form Polls" au niveau créateur / votant, mais **pas encore un dashboard form-polls dédié** (voir plus bas).

### 3.3. Quota tracking

- `tests/e2e/quota-tracking-complete.spec.ts`
  - Gère une structure de quota avec **compteurs par type** :
    - `datePollsCreated`, `formPollsCreated`, `availabilityPollsCreated`, `quizzCreated`, en plus de `pollsCreated` global.
  - Le helper `resetGuestQuota` prépare bien les 4 produits.  
  - Des tests E2E vérifient maintenant **le comportement par produit** pour :
    - **Form Polls** (création via IA) : seul `formPollsCreated` est incrémenté, les autres restent à `0`.
    - **Availability Polls** (création via workspace Availability) : seul `availabilityPollsCreated` est incrémenté, les autres restent à `0`.
  - → La **donnée** côté quota est prête pour la séparation produit et une partie du **comportement** est déjà couverte. Il reste à ajouter des scénarios équivalents pour **Date Polls** et **Quizz**.

---

## 4. Là où les tests restent "monolithiques" ou ambigus

### 4.1. Dashboards & vues agrégées

- Beaucoup d’E2E historiques (ex. `form-poll-results-access.spec.ts`, `dashboard-complete.spec.ts`, `production-smoke.spec.ts`) semblent toujours raisonner en termes de :
  - `/DooDates/dashboard` unique.
  - Cartes de sondages agnostiques du type, ou au mieux vérifiant qu’"un sondage est présent".
- Ultra-simple Form :
  - finit sur `/DooDates/dashboard` avec un simple `waitForElementReady('[data-testid="poll-item"]')`.  
  - → **Ce test ne distingue pas encore le dashboard général vs dashboards par produit** (form-polls dashboard vs global).

### 4.2. Tests d’intégration et "flux unifié"

- `tests/integration/unified-flow.test.ts.skip` :  
  - Par nature ce test pense "un flux global" plutôt qu’une expérience par produit.
  - Il est en skip, mais si on le réactive plus tard, il faudra probablement :
    - soit le specialise par produit,
    - soit le redéfinir comme un vrai **cross-product flow** explicite.

### 4.3. Dossier `OLD`

- `tests/e2e/OLD/form-poll-regression.spec.ts`, `poll-actions.spec.ts`, etc.
  - Ces tests reflètent **l’ancienne architecture** (sondage unique, routes anciennes, actions regroupées).
  - Ils risquent d’être soit cassés, soit non pertinents pour le nouveau découpage.
  - Vu ton objectif, il faut les considérer comme **legacy à archiver / supprimer / réécrire par produit**.

---

## 5. Couverture par produit (vue synthétique)

Je résume en 4 lignes, par produit.

### Date Polls

- **Présent dans :**
  - `products/date-polls/*` (navigation, workflows spécifiques – non tous inspectés en détail ici, mais ils existent).
  - `ultra-simple-poll.spec.ts` (workflow IA complet).
  - `main-landing.spec.ts` (carte + navigation).
  - `product-isolation.spec.ts` (dashboard date isolé).
  - `quota-tracking-complete.spec.ts` (compteur `datePollsCreated` présent).
- **Gaps probables :**
  - Vérification explicite du **dashboard date dédié** dans les workflows globaux (smoke, production, etc.) plutôt que seulement dans `product-isolation`.
  - Tests d’intégration "flux complet Date Poll" pas encore distincts des autres produits.

### Form Polls

- **Présent dans :**
  - `products/form-polls/*` (navigation spécifique).
  - `ultra-simple-form.spec.ts` (workflow complet IA + vote).
  - `form-poll-results-access.spec.ts` (accès résultats).
  - `main-landing.spec.ts` + `product-isolation.spec.ts`.
  - `quota-tracking-complete.spec.ts` (compteur `formPollsCreated`).
- **Gaps probables :**
  - Beaucoup de tests continuent à utiliser le **dashboard global `/DooDates/dashboard`** comme point d’ancrage, sans vérifier que le produit Form a **son propre espace dédié** (liste, filtres, quotas).
  - Peu / pas de tests qui valident la séparation stricte Form Polls vs Date Polls dans toutes les vues agrégées (ex. analytics, quotas UI, etc.).

### Availability Polls

- **Présent dans :**
  - `availability-poll-workflow.spec.ts`
  - `products/availability-polls/navigation.spec.ts`
  - `main-landing.spec.ts` + `product-isolation.spec.ts`.
  - `quota-tracking-complete.spec.ts` (`availabilityPollsCreated`).
- **Gaps probables :**
  - Couverture "end-to-end" moins riche que Date/Form (moins de scénarios avancés : IA, édition, export, etc.).
  - Il faudra vérifier que **toutes les pages availability** (création, vote, résultats, dashboard availability) sont couvertes par **des tests dédiés** et non seulement par 1 spec de navigation.

### Quizz

- **Structure :**
  - Dossier `tests/e2e/products/quizz/` existe, avec notamment un scénario **ultra-simple** dédié (`ultra-simple-quizz.spec.ts`) calqué sur les patterns Date/Form (création minimale → dashboard Quizz).
  - `quota-tracking-complete` a déjà un compteur `quizzCreated`.
- **Gaps probables (gros point faible) :**
  - Au vu des autres produits, cela reste le **moins couvert** :  
    - peu de scénarios d’IA,  
    - pas encore de test de quotas E2E qui vérifie explicitement l’incrément de `quizzCreated` seul,  
    - couverture partielle de l’expérience complète quizz (création → vote → quotas → dashboard quizz).

---

## 6. Recommandations concrètes de refactor / complétion

Sans modifier les fichiers pour l’instant, voici ce que je recommande de faire en priorité.

### 6.1. Clarifier les dashboards dans les tests

- **Objectif** : chaque test E2E doit être explicite sur **quel dashboard** il vérifie :
  - `/date-polls/dashboard` (ou route équivalente produit),
  - `/form-polls/dashboard`,
  - `/availability-polls/dashboard`,
  - `/quizz/dashboard`,
  - ou `/DooDates/dashboard` si c’est vraiment un **dashboard global cross-produits assumé**.
- Actions à prévoir :
  - [x] Mettre à jour les tests comme `ultra-simple-form.spec.ts` pour qu’ils vérifient un **dashboard form-polls spécifique**, ou, si tu veux garder un dashboard global, ajouter des assertions qui confirment la présence d’éléments filtrés par type.
  - [ ] Aligner `dashboard-complete.spec.ts` sur la nouvelle réalité (global vs par produit).

### 6.2. Nettoyer / recatégoriser les tests `OLD`

- Dossier `tests/e2e/OLD` :
  - Décider pour chaque test :
    - **Supprimé** (scénario obsolète),
    - **Migré** vers `tests/e2e/products/<product>` avec routes + expectations alignées sur la nouvelle UX,
    - Ou **conservé** mais avec label très clair ("legacy-monolith").
- Bénéfice : réduire le bruit et les faux signaux quand tu cherches "est-ce que ce cas est couvert ?".

### 6.3. Quota tracking par produit

  - `quota-tracking-complete.spec.ts` :
  - [x] Les champs par produit existent **et** certaines assertions sont maintenant spécifiques :
    - [x] Form Polls : création via IA → seul `formPollsCreated` augmente, les autres restent à `0`.
    - [x] Availability Polls : création via workspace Availability → seul `availabilityPollsCreated` augmente, les autres restent à `0`.
  - Actions à prévoir :
    - [x] Ajouter des tests équivalents pour :
      - [x] **Date Polls** (incrément dédié de `datePollsCreated`),
      - [ ] **Quizz** (incrément dédié de `quizzCreated`).
    - [ ] Optionnellement : vérifier aussi l’impact UI (barre, badges, etc.) si une UI par produit pour les quotas existe.

### 6.4. Couverture spécifique pour Quizz

- Vérifier le contenu de `tests/e2e/products/quizz/*` et probablement :
  - [x] Ajouter un **`ultra-simple-quizz.spec.ts`** calqué sur les patterns ultra-simple Date / Form.
  - [ ] Vérifier la navigation depuis la landing principale (`/`) vers la page quizz (si elle existe dans l’UI).
  - [ ] Lier quizz aux compteurs de quotas dans un test dédié.

### 6.5. Intégration / flux unifiés

- Pour `tests/integration/unified-flow.test.ts.skip` :
  - Soit :
    - tu le reprends en mode **"cross-product happy path"** explicitement (ex : créer un date-poll + un form-poll, switcher entre dashboards);
  - soit :
    - tu le gardes skip en le marquant clairement comme "ancien flux monolithique, à redéfinir plus tard".

---

## 7. Statut global

- **Séparation logique** : déjà bien amorcée dans les tests E2E (routes produit, `PRODUCT_ROUTES`, `product-isolation`, landing multi-produits).
- **Points solides** :
  - Navigation par produit.
  - Ultra-simple Date et Form bien ancrés dans leurs routes.
  - Quota tracking déjà prêt pour distinguer les 4 produits côté données.
- **Points faibles / à reprendre** :
  - Tests qui parlent encore du **dashboard global** sans expliciter le périmètre produit.
  - Dossier `OLD` qui reflète l’ancien modèle.
  - Couverture spécifique du produit **Quizz**.
  - Intégration / flux unifiés encore centrés "app unique".
