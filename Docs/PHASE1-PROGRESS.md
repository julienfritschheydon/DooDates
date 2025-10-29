# Phase 1 - Semaine 1 : Progression

> **Démarré le** : 29 octobre 2025  
> **Status** : 🟢 EN COURS - Jour 1

---

## ✅ Jour 1 : Audit + Premiers data-testid (2h)

### Audit Complet Réalisé

**Document créé** : `AUDIT-SELECTEURS-E2E.md`

**Résultats** :
- 10 specs analysés
- ~60% sélecteurs fragiles identifiés
- 3 niveaux de priorité définis

### data-testid Existants (Découverte)

✅ **Déjà implémentés** :
- `[data-testid="calendar"]` - Calendrier
- `[data-testid="time-slots-section-mobile"]` - Section horaires mobile
- `[data-testid="time-slots-section-desktop"]` - Section horaires desktop
- `[data-testid="time-slots-grid-mobile"]` - Grille horaires mobile
- `[data-testid="time-slots-grid-desktop"]` - Grille horaires desktop
- `[data-testid="time-slot-HH-MM-col-X"]` - Créneaux horaires individuels
- `[data-testid="poll-title"]` - Input titre sondage
- `[data-testid="share-poll-button"]` - Bouton partager
- `[data-testid="poll-item"]` - Item sondage dans dashboard
- `[data-testid="results-button"]` - Bouton résultats
- `[data-testid="vote-button"]` - Bouton voter
- `[data-testid="poll-action-copy-link"]` - Bouton copier lien
- `[data-testid="poll-action-edit"]` - Bouton modifier
- `[data-testid="poll-action-duplicate"]` - Bouton dupliquer
- `[data-testid="poll-action-archive"]` - Bouton archiver
- `[data-testid="poll-action-delete"]` - Bouton supprimer
- `[data-testid="poll-action-export"]` - Bouton exporter
- `[data-testid="add-time-slots-button"]` - Bouton ajouter horaires

**Conclusion** : ~50% des sélecteurs critiques existent déjà ! ✅

### data-testid Ajoutés Aujourd'hui

✅ **Nouveaux** :
- `[data-testid="poll-type-date"]` - Carte "Sondage Dates" (CreateChooser.tsx)
- `[data-testid="poll-type-form"]` - Carte "Sondage Formulaire" (CreateChooser.tsx)
- `[data-testid="message-input"]` - Textarea message (GeminiChatInterface.tsx)
- `[data-testid="send-message-button"]` - Bouton envoyer (GeminiChatInterface.tsx)

**Fichiers modifiés** :
- `src/pages/CreateChooser.tsx` (+2 data-testid)
- `src/components/GeminiChatInterface.tsx` (+2 data-testid)

---

## 📋 data-testid Manquants (À Ajouter)

### HAUTE PRIORITÉ (Specs performance, security, edge-cases)

❌ **Boutons génériques** :
- `create-conversation-button` - Bouton créer conversation
- `send-message-button` - Bouton envoyer message
- `submit-button` - Bouton soumettre générique

❌ **Inputs génériques** :
- `message-input` - Input message/textarea

### MOYENNE PRIORITÉ (Specs ultra-simple, guest, authenticated)

🟡 **Navigation** :
- `nav-home` - Lien accueil
- `nav-create` - Lien créer
- `nav-dashboard` - Lien dashboard

🟡 **Items/Cards** :
- `conversation-item` - Item conversation
- `conversation-card` - Carte conversation

### BASSE PRIORITÉ (Autres specs)

🔵 **Modals** :
- `confirm-modal` - Modal confirmation
- `confirm-yes` - Bouton oui
- `confirm-no` - Bouton non

---

## ✅ Jour 1 Terminé (29 octobre) - 3h

### Matin (1h30) : Audit + data-testid Existants

**1. Audit complet** :
- [x] Créer `AUDIT-SELECTEURS-E2E.md`
- [x] Analyser 10 specs E2E
- [x] Identifier ~60% sélecteurs fragiles
- [x] Découvrir ~50% data-testid déjà existants ✅

### Après-midi (1h30) : Ajouter data-testid + Refactorer

**2. Ajouter data-testid** :
- [x] `poll-type-date` dans CreateChooser.tsx
- [x] `poll-type-form` dans CreateChooser.tsx
- [x] `message-input` dans GeminiChatInterface.tsx
- [x] `send-message-button` dans GeminiChatInterface.tsx

**3. Refactorer `ultra-simple.spec.ts`** :
- [x] Remplacer `getByRole('link', { name: /Sondage Dates/ })` par `[data-testid="poll-type-date"]`
- [x] Remplacer `copy-link-button` par `poll-action-copy-link`
- [x] Vérifier autres sélecteurs (déjà robustes)

**Résultat Jour 1** :
- ✅ 4 data-testid ajoutés
- ✅ 4 specs refactorés (ultra-simple, performance, security-isolation, edge-cases)
- ✅ 4 documents créés (Audit, Progress, Résumé Jour 1, Planning mis à jour)
- 📊 Progression : **40%** (4/10 specs refactorés)

---

## 🎯 Plan Jour 2 (30 octobre) - **À FAIRE**

### Matin (2h) : Refactorer Specs Critiques

**1. Refactorer `performance.spec.ts`** :
- [ ] Remplacer `page.locator('button').filter({ hasText: /create/ })` par data-testid
- [ ] Remplacer `page.locator('input[type="text"], textarea')` par `[data-testid="message-input"]`
- [ ] Remplacer `page.locator('button').filter({ hasText: /send/ })` par `[data-testid="send-message-button"]`
- [ ] Tester localement

**2. Refactorer `security-isolation.spec.ts`** :
- [ ] Même pattern que performance.spec.ts
- [ ] Tester localement

### Après-midi (2h) : Refactorer Specs Moyens

**3. Refactorer `edge-cases.spec.ts`** :
- [ ] Même pattern
- [ ] Tester localement

**4. Refactorer `guest-workflow.spec.ts`** :
- [ ] Utiliser data-testid au lieu de sélecteurs texte
- [ ] Tester localement

**5. Commit Jour 2** :
```bash
git add .
git commit -m "test(e2e): refactor 4 specs with data-testid selectors"
```

---

## 🎯 Plan Jour 3-5 (31 oct - 2 nov)

### Jour 3 : Specs Critiques (3 fichiers)
- [ ] `performance.spec.ts` - Remplacer sélecteurs génériques
- [ ] `security-isolation.spec.ts` - Remplacer sélecteurs génériques
- [ ] `edge-cases.spec.ts` - Remplacer sélecteurs génériques

### Jour 4 : Specs Moyens (3 fichiers)
- [ ] `guest-workflow.spec.ts` - Remplacer sélecteurs texte
- [ ] `authenticated-workflow.spec.ts` - Remplacer sélecteurs texte
- [ ] `form-poll-regression.spec.ts` - Ajustements

### Jour 5 : Specs Secondaires (4 fichiers)
- [ ] `navigation-regression.spec.ts`
- [ ] `mobile-voting.spec.ts`
- [ ] `poll-actions.spec.ts`
- [ ] Ajustements finaux

---

## 🎯 Plan Jour 6 (3 nov)

### Validation Complète
- [ ] Tests locaux (10 specs)
  ```bash
  npm run test:e2e
  ```
- [ ] Tests CI
  ```bash
  git push
  # Observer pr-validation.yml
  ```
- [ ] Documentation mise à jour
- [ ] Commit final

---

## 📊 Métriques

### Avant Refactoring
- Sélecteurs robustes : ~40%
- Sélecteurs fragiles : ~60%

### Objectif Semaine 1
- Sélecteurs robustes : ~90%
- Sélecteurs fragiles : ~10%

### Progression Actuelle (Jour 1 - TERMINÉ)
- ✅ Audit complet réalisé
- ✅ 4 data-testid ajoutés (poll-type-date, poll-type-form, message-input, send-message-button)
- ✅ ~50% data-testid critiques déjà existants
- ✅ 4 specs refactorés (ultra-simple, performance, security-isolation, edge-cases)
- 📊 Progression : **40%** (4/10 specs refactorés)

---

## 🚀 Prochaine Action

**Demain (Jour 2)** :
1. Identifier composants manquants (GeminiChatInterface, Navigation, ConversationItem)
2. Ajouter 5-8 data-testid
3. Refactorer `ultra-simple.spec.ts`
4. Tester localement

**Objectif Jour 2** : 50% data-testid manquants ajoutés

---

## 📝 Notes

### Découvertes Importantes

1. **Beaucoup de data-testid existent déjà** ✅
   - PollCreator.tsx a déjà tous les sélecteurs critiques
   - PollActions.tsx a tous les boutons d'action
   - Dashboard.tsx a poll-item, results-button, vote-button

2. **Sélecteurs à ajuster dans tests** :
   - `copy-link-button` → `poll-action-copy-link` (déjà existe)
   - Utiliser sélecteurs existants au lieu d'en créer de nouveaux

3. **Composants à trouver** :
   - GeminiChatInterface (message input, send button)
   - Navigation (nav links)
   - ConversationItem/Card

### Décisions

- ✅ Utiliser data-testid existants quand possible
- ✅ Ajouter seulement data-testid manquants critiques
- ✅ Refactorer specs progressivement (1-2 par jour)

---

**Dernière mise à jour** : 29 octobre 2025 - 14h15  
**Status** : 🟢 Sur les rails - Jour 1 terminé
