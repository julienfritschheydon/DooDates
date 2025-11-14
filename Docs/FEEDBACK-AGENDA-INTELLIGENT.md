# 📅 Agenda Intelligent (Sondage Inversé) - Documentation

*Document de référence pour la fonctionnalité "Agenda Intelligent"*  
*Dernière mise à jour : Décembre 2025*  
*Statut : ✅ MVP v1.0 + Phase 3 TERMINÉ*

---

## 🎯 Contexte et Problème

### Résumé de la Demande

**Feedback Utilisateur (Thérapeute)** :
> "Je souhaite que mes clients puissent indiquer leurs disponibilités, et que le système interroge automatiquement mon agenda pour proposer les créneaux optimaux."

### Problématique : "Agenda Mitraillé"

Les professionnels libéraux font face à un problème récurrent : leurs agendas sont fragmentés avec de nombreux petits créneaux libres entre les rendez-vous.

**Problèmes** :
- Gaps de 15-30 minutes = temps non productif
- Échanges email multiples avec chaque client (5-10 échanges en moyenne)
- Consultation manuelle de l'agenda pour chaque demande
- **Temps moyen par rendez-vous** : ~10 minutes de gestion administrative

### Solution : Sondage Inversé

**Flux Actuel (Sondage Classique)** :
```
Professionnel → Propose créneaux → Clients votent → Sélection manuelle
```

**Nouveau Flux (Sondage Inversé)** :
```
Client → Indique disponibilités → Système analyse agenda → Propose créneaux optimaux → Validation automatique
```

**Avantages** :
- Client indique ses contraintes (plus flexible)
- Système trouve automatiquement les meilleurs créneaux
- Optimisation intelligente (minimise gaps, priorise proche)
- Création automatique événement après validation
- **Gain de temps : ~85% (10 min → 1.5 min)**

---

## ✅ Fonctionnalités Implémentées

### MVP v1.0 + Phase 3 (✅ TERMINÉ)

**Fonctionnalités principales** :
- ✅ Parsing IA conversationnel : Client écrit naturellement ("Mardi et jeudi après-midi")
- ✅ Intégration Google Calendar : Lecture créneaux libres/occupés, création automatique événements
- ✅ Optimisation automatique : Minimise gaps, priorise créneaux proches
- ✅ Règles configurables : Durée standard, temps entre séances, heures préférées
- ✅ Groupement demi-journées : Détection automatique demi-journées complètes
- ✅ Réservation temporaire : Gestion conflits multi-clients (15 min)
- ✅ Tests E2E complets : 6 tests validés

**Fichiers principaux** :
- `src/services/schedulingOptimizer.ts` : Optimisation créneaux
- `src/services/temporaryReservation.ts` : Réservation temporaire
- `src/lib/availability-parser.ts` : Parsing IA disponibilités
- `src/lib/google-calendar.ts` : Intégration calendrier
- `src/pages/AvailabilityPollVote.tsx` : Interface client
- `src/pages/AvailabilityPollResults.tsx` : Interface professionnel
- `tests/e2e/availability-poll-workflow.spec.ts` : Tests E2E

**Documentation utilisateur** :
- 📄 `Docs/USER-DOCUMENTATION/Utilisateurs-Praticien.md` : Guide pour professionnels

---

## ⏭️ Prochaines Étapes

### Phase 4 : Version 2.0 - Waitlist Intelligente (⏳ À FAIRE)

**Objectif** : Automatiser le remplissage des créneaux libérés

**Fonctionnalités prévues** :
1. **Waitlist automatique** :
   - Client peut s'inscrire en waitlist si aucun créneau disponible
   - Notification automatique quand un créneau se libère
   
2. **Remplissage automatique** :
   - Détection automatique des créneaux libérés (annulation, modification)
   - Proposition automatique aux clients en waitlist
   - Priorisation intelligente selon urgence/ancienneté

3. **Priorisation intelligente** :
   - Critères de priorisation configurables
   - Gestion des urgences
   - Respect des préférences clients

**Estimation** : 2-3 semaines (50h avec synergies)

**Fichiers à créer/modifier** :
- `src/services/waitlist.ts` : Service waitlist intelligente
- `src/pages/WaitlistManagement.tsx` : Interface gestion waitlist
- Extension `schedulingOptimizer.ts` : Priorisation intelligente

---

## 🧪 Tests E2E

**Fichier** : `tests/e2e/availability-poll-workflow.spec.ts`

**6 tests validés** :
1. ✅ Workflow complet de bout en bout
2. ✅ Validation client + création événement
3. ✅ Affichage scores et raisons d'optimisation
4. ✅ Gestion erreur calendrier non connecté
5. ✅ Gestion erreur créneau occupé
6. ✅ Affichage dans dashboard

**Exécution** : `npx playwright test tests/e2e/availability-poll-workflow.spec.ts --reporter=list`

---

## 📚 Références

- **Documentation utilisateur** : `Docs/USER-DOCUMENTATION/Utilisateurs-Praticien.md`
- **Document technique calendrier** : `Docs/TECHNICAL-DECISIONS/2025-08-28-Calendar-Integration-Decision.md`
- **Tests E2E** : `tests/e2e/availability-poll-workflow.spec.ts`
- **Scénario test MVP v0.5** : `Docs/TESTS-SCENARIO-MVP-V05.md`
- **Planning général** : `Docs/2. Planning.md`

---

## 📈 Métriques de Succès

### Validation Technique
- ✅ Prototype calendrier fonctionnel
- ✅ Parsing IA disponibilités fonctionnel
- ✅ Optimisation automatique implémentée
- ✅ Tests E2E complets (6 tests)

### Validation Utilisateur (⏳ À FAIRE)
- [ ] 10+ professionnels testent MVP
- [ ] 70%+ satisfaction UX
- [ ] 50%+ utilisent création automatique événements

### Validation Business (⏳ À FAIRE)
- [ ] 30%+ conversion Free → Premium
- [ ] Réduction 50%+ temps gestion rendez-vous
- [ ] 3+ témoignages utilisateurs

---

*Document créé : Novembre 2025*  
*Dernière mise à jour : Décembre 2025*
