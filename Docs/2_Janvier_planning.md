# 📅 DOODATES - PLANNING JANVIER 2025

**🎯 Objectif du mois :** Lancement des 4 produits (Date Polls, Form Polls, Availability Polls, Quizz)  
**⏱️ Rythme :** 3h/jour (2h critiques + 1h travail de fond)  
**📅 Jours travaillés :** Lundi → Vendredi

---

## 🔥 PRIORITÉS DU MOIS (rappel)

1. **Quotas & Pricing** - Finaliser modèle économique + intégration paiements
2. **Crédibilité & Confiance** - Pages légales, transparence, témoignages
3. **Go/No-Go Lancement** - Checklist finale avant mise en production
4. **Marketing & Traffic** - SEO, social, stratégie de lancement

---


Soucis à noter, vérifier et fixer:

Quizz:

- S'assurer que les réponses textes sont vérifier car mon test semble montrer que non
- Quand on démarrer les réponses à un quizz le bouton copié le lien n'est pas utile et illisible
- Du dashboard, il n'est pas possible de voir le détails des questions et réponses
- si option durée illimité alors pas de compteur sur les réponses ça marche pas pour de vrai ?
- statistiques sont restreintes alors que c'est nous le propriétaire, ca marche pas ?
- la plupart des textes sur le quizz ne sont pas lisible, "

Disponibilités
- Revoir les options pour les disponibilités et ôter celles qui ne sont pas adaptées
- Du point de vue du client, revoir l'expérience et surtout à la fin qu'est-ce qui se passe ? Le bouton retour non. Mais l'expérience du client nécessite plus de réfection. A noter pour Janvier après étude.
- En mobile, l'UI dépasse en largeur
- Masquer démasquer les horaires de disponibilité montre les heures du soir mais pas celle du matin


AI

- dans les experiénce mobile, il faut démarrer sur l'agent, pas sur le sondage, ou le formulaire

Landing

- quand on arrive du main landing on mobile, il semble qu'on arrive en mileu de la page de landing produit, et pas en haut

Tous les produits
- Afficher / Masquer le logo : afficher le logo Doodates et noter de mettre le vrai logo dans le futur sur le plannign de janvier, d'ailleurs il faut noter de les créer

CI

- faire un personnage spécial testeur qui regarde bien le code
- Dois-je séparer totalement les repositoris et les tests par produit



### 📌 MERCREDI 8 JANVIER

**Thème : 🧪 Tests Edge Cases**

| Bloc        | Durée | Tâche                                              |
| ----------- | ----- | -------------------------------------------------- |
| 2h Critique | 2h    | **Tests intégration**                                                      |
|             |       | - [X] **Finaliser test E2E Quiz complet** (décommenter et corriger la fin) |
|             |       | - [ ] Tests flux complets (création → vote → résultats) ✅ EN COURS                    |
|             |       | - [X] ultra-simple-poll.spec.ts: Flow complet création → dashboard → vote (✅ FIXÉ) |
|             |       | - [ ] ultra-simple-dispo.spec.ts: Création → vote (disponibilités) → dashboard |
|             |       | - [ ] ultra-simple-form.spec.ts: Création → vote (réponses formulaire) → résultats |
|             |       | - [ ] ultra-simple-quizz.spec.ts: Création → vote (questions/réponses) → résultats |
|             |       | 
|             |       | **PARCOURS CLIENT END-TO-END SPÉCIFIQUES :**
|             |       | 
|             |       | **📅 Date Polls :** Création IA → Page vote (/vote/{slug}) → Swipe dates → Résultats (/poll/{slug}/results) → Dashboard |
|             |       | **📝 Form Polls :** Création IA → Page vote (/vote/{slug}) → Formulaire multi-étapes → Confirmation → Résultats (/poll/{slug}/results) → Dashboard  
|             |       | **📅 Availability Polls :** Création manuelle → Page vote (/vote/{slug}) → Sélection disponibilités → Parsing IA → Export ICS → Dashboard |
|             |       | **🎯 Quizz :** Création manuelle → Page vote (/vote/{slug}) → Questions chronométrées → Score/badges → Résultats (/poll/{slug}/results) → Dashboard |
|             |       | 
|             |       | **DATA-TESTID ET SÉLECTEURS NÉCESSAIRES :**
|             |       | 
|             |       | **📅 Date Polls :** `[data-testid="send-message-button"]` → `[data-testid="vote-option"]` → `[data-testid="vote-results"]` → `[data-testid="dashboard-ready"]` |
|             |       | **📝 Form Polls :** `[data-testid="send-message-button"]` → `[data-testid="form-submit"]` → `[data-testid="form-poll-results"]` → `[data-testid="form-dashboard"]` |
|             |       | **📅 Availability Polls :** `[data-testid="availability-title"]` → `[data-testid="availability-vote-submit"]` → `[data-testid="availability-results"]` → `[data-testid="availability-dashboard"]` |
|             |       | **🎯 Quizz :** `[data-testid="quiz-title-input"]` → `[data-testid="quizzvote-button"]` → `[data-testid="quizz-results"]` → `[data-testid="quizz-dashboard"]` |
| 2h Critique | 2h    | **Tests cas limites**                              |
|             |       | - [ ] Tests volumétrie (grands sondages)           |
|             |       | - [ ] Tests concurrence (utilisateurs simultanés)  |
|             |       | - [ ] Tests erreurs réseau                         |
| 1h Fond     | 1h    | **Tests intégration**                                                      |
|             |       | - [ ] Tests exports (CSV, PDF, JSON, Markdown)                             |
|             |       | - [ ] Tests authentification                                               |
|             |       | - [ ] Installation Sentry + tests alertes                                  |

---

### 📌 JEUDI 9 JANVIER

**Thème : 🧪 Tests UX**

| Bloc        | Durée | Tâche                                            |
| ----------- | ----- | ------------------------------------------------ |
| 2h Critique | 2h    | **Tests UX manuels**                             |
|             |       | - [ ] Tests parcours utilisateur complets        |
|             |       | - [ ] Tests accessibilité                        |
|             |       | - [ ] Tests erreurs utilisateur                  |
|             |       | - [ ] Préparation email réseau personnel         |
|             |       | - [ ] Configuration réponses automatiques                        |
| 1h Fond     | 1h    | **Robustesse Selecteurs (Plan Sécurisé)**                                  |
|             |       | - [ ] Évolution `auditor.cjs` : Support Inputs & Titres (Audit Only)       |
|             |       | - [ ] Validation manuelle regex sur échantillon                            |
|             |       | - [ ] Application par lots (Inputs d'abord)                                |
Pour étendre la couverture aux Inputs et Titres sans risque de régression :

1.  **Mode Audit Strict** : Le script ne modifiera rien par défaut. Il listera seulement les candidats.
2.  **Scope Granulaire** : L'extension se fera par type (d'abord `Inputs`, puis `Titres`) et non globalement.
3.  **Validation Regex** : Les regex seront testées sur un jeu de composants complexes (props multilignes, self-closing) avant déploiement.
4.  **Batching & Review** :
    *   Application par lots de 10 fichiers max.
    *   Revue diff obligatoire (`git diff`).
    *   Test compilation (`tsc`) immédiat après chaque lot.
---

### 📌 VENDREDI 10 JANVIER

**Thème : 🧪 

| Bloc        | Durée | Tâche                                                           |
| ----------- | ----- | --------------------------------------------------------------- |

---

## SEMAINE 3 : Quotas & Paiements (13-17 Janvier) - DÉCALÉ

### 📌 LUNDI 13 JANVIER

**Thème : 💰 Quotas & Pricing - Décisions**

| Bloc        | Durée | Tâche                                                          |
| ----------- | ----- | -------------------------------------------------------------- |
| 2h Critique | 2h    | **Décision Modèle Économique & Tarifaire**                     |
|             |       | - [ ] Relire `INTERNATIONAL-Pricing-Architecture.md`           |
|             |       | - [ ] Trancher : Lemon Squeezy vs autres MoR                   |
|             |       | - [ ] Valider plans : Free / Starter / Premium / Pro           |
|             |       | - [ ] **Valider stratégie tarifaire** (Premium 6.95€, Pro 29€) |
| 1h Fond     | 1h    | **Documentation décision**                                     |
|             |       | - [ ] Créer compte Lemon Squeezy (si choisi)                   |
|             |       | - [ ] Documenter le modèle économique final                    |

---

### 📌 MARDI 14 JANVIER

**Thème : 💳 Configuration MoR**

| Bloc        | Durée | Tâche                                                  |
| ----------- | ----- | ------------------------------------------------------ |
| 2h Critique | 2h    | **Setup Lemon Squeezy**                                |
|             |       | - [ ] Créer les produits (Free, Starter, Premium, Pro) |
|             |       | - [ ] Configurer les prix (mensuel/annuel)             |
|             |       | - [ ] Récupérer les `variant_id`                       |
| 1h Fond     | 1h    | **Mapping plans ↔ quotas**                            |
|             |       | - [ ] Mettre à jour `src/constants/quotas.ts`          |
|             |       | - [ ] Aligner avec `POLL_TYPE_QUOTAS`                  |

---

### 📌 MERCREDI 15 JANVIER

**Thème : 💳 Intégration Checkout**

| Bloc        | Durée | Tâche                                               |
| ----------- | ----- | --------------------------------------------------- |
| 2h Critique | 2h    | **Implémenter checkout**                            |
|             |       | - [ ] Créer `lib/payments/lemonsqueezy.ts`          |
|             |       | - [ ] Brancher `handleUpgrade()` dans `Pricing.tsx` |
|             |       | - [ ] Gérer retour paiement (succès/échec)          |
| 1h Fond     | 1h    | **Tests manuels**                                   |

**Thème : 🔗 Webhook Paiements**

| Bloc        | Durée | Tâche                                                    |
| ----------- | ----- | -------------------------------------------------------- |
| 2h Critique | 2h    | **Créer Edge Function webhook**                          |
|             |       | - [ ] `supabase/functions/lemonsqueezy-webhook/index.ts` |
|             |       | - [ ] Mapper `variant_id` → `plan_type`                  |
|             |       | - [ ] Mettre à jour utilisateur en DB                    |
| 1h Fond     | 1h    | **Logging & sécurité**                                   |
|             |       | - [ ] Logger transactions dans table `transactions`      |
|             |       | - [ ] Valider signature webhook                          |
|             |       | - [ ] Tester le flow complet en sandbox             |

**Thème : 🔒 Finalisation Paiements**

| Bloc        | Durée | Tâche                                               |
| ----------- | ----- | --------------------------------------------------- |
| 2h Critique | 2h    | **Feature flag & garde-fous**                       |
|             |       | - [ ] Ajouter feature flag pour désactiver checkout |
|             |       | - [ ] Modal upgrade in-app (trigger à 100% quota)   |
|             |       | - [ ] Tests edge cases                              |
| 1h Fond     | 1h    | **Documentation**                                   |
|             |       | - [ ] Documenter le flux paiement                   |
|             |       | - [ ] Mettre à jour README si nécessaire            |

---

### 📌 JEUDI 16 JANVIER

---

### 📌 VENDREDI 17 JANVIER


---

## SEMAINE 4 : Crédibilité & Confiance (20-24 Janvier) - DÉCALÉ

### 📌 LUNDI 20 JANVIER

**Thème : 📄 Pages Légales & Timezone**

| Bloc        | Durée | Tâche                                                                   |
| ----------- | ----- | ----------------------------------------------------------------------- |
| 2h Critique | 2h    | **Pages Légales Produits (Part 1)**                                     |
|             |       | - [ ] Audit : Quelles pages rediriger par produit ?                     |
|             |       | - [ ] Créer `/availability-polls/security`, `/support-policy`, `/about` |
|             |       | - [ ] Créer `/quizz/security`, `/support-policy`, `/about`              |
| 1h Fond     | 1h    | **Gestion Timezone (Part 1)**                                           |
|             |       | - [ ] Étude : Comment stocker/afficher au mieux ?                       |
|             |       | - [ ] Ajouter choix timezone lors de la création                        |

**Thème : 🛡️ Transparence, Legal & Timezone**

| Bloc        | Durée | Tâche                                                          |
| ----------- | ----- | -------------------------------------------------------------- |
| 2h Critique | 2h    | **Pages Légales & Transparence**                               |
|             |       | - [ ] Créer page Transparence (`Docs/WEBSITE/TRANSPARENCY.md`) |
|             |       | - [ ] Créer pages mentions légales globales                    |
| 1h Fond     | 1h    | **Timezone (Part 2)**                                          |
|             |       | - [ ] Utiliser `date-fns-tz` pour conversions                  |
|             |       | - [ ] Afficher indication "Horaires en heure de [Local]"       |

---

### 📌 MARDI 21 JANVIER

---

### 📌 MERCREDI 22 JANVIER

**Thème : 💬 Témoignages & Crédibilité**

| Bloc        | Durée | Tâche                                                               |
| ----------- | ----- | ------------------------------------------------------------------- |
| 2h Critique | 2h    | **Témoignages & Études de cas**                                     |
|             |       | - [ ] Collecter 3-5 témoignages utilisateurs beta                   |
|             |       | - [ ] Créer 2-3 mini-études de cas (`Docs/WEBSITE/TESTIMONIALS.md`) |
|             |       | - [ ] Intégrer section témoignages sur landing page                 |
|             |       | - [ ] Rédaction posts Reddit/Social pour lancement |
| 1h Fond     | 1h    | **Crédibilité Avancée**                                             |
|             |       | - [ ] **Audit de Sécurité & Confidentialité** (bug bounty interne)  |
|             |       | - [ ] Ébauche **Documentation Technique Publique**                  |

---

### 📌 JEUDI 23 JANVIER

**Thème : 📧 Configuration Emails**

| Bloc        | Durée | Tâche                                                          |
| ----------- | ----- | -------------------------------------------------------------- |
| 2h Critique | 2h    | **Setup emails professionnels**                                |
|             |       | - [ ] Créer page Transparence (`Docs/WEBSITE/TRANSPARENCY.md`) |
|             |       | - [ ] Créer pages mentions légales globales                    |
| 1h Fond     | 1h    | **Tests emails**                                               |
|             |       | - [ ] Audit de Sécurité & Confidentialité (bug bounty interne) |
|             |       | - [ ] Ébauche Documentation Technique Publique                 |

---

### 📌 VENDREDI 24 JANVIER

**Thème : ✅ Go/No-Go Check (Part 1)**

| Bloc        | Durée | Tâche                                                     |
| ----------- | ----- | --------------------------------------------------------- |
| 2h Critique | 2h    | **Checklist Produit**                                     |
|             |       | - [ ] 4 workflows : création → partage → vote → résultats |
|             |       | - [ ] Tests manuels desktop + mobile                      |
|             |       | - [ ] Vérifier exports (CSV, PDF)                         |
| 1h Fond     | 1h    | **Documentation utilisateur**                             |
|             |       | - [ ] Relire documentation avancée                        |
|             |       | - [ ] Corriger incohérences                               |

---

## SEMAINE 5 : Pré-Lancement (27-31 Janvier) - DÉCALÉ

### 📌 LUNDI 27 JANVIER

**Thème : 🔐 Sécurité & Support IA (Part 1)**

| Bloc        | Durée | Tâche                                                                      |
| ----------- | ----- | -------------------------------------------------------------------------- |
| 2h Critique | 2h    | **Supabase & Support IA**                                                  |
|             |       | - [ ] Activer "Enable email confirmations" (Supabase Dashboard)            |
|             |       | - [ ] **Support IA** : Schéma Supabase - Tables `support_tickets/messages` |
| 1h Fond     | 1h    | **Tests & Certifications**                                                 |
|             |       | - [ ] Flow login/signup/reset avec confirmation email                      |
|             |       | - [ ] Recherche **Certifications** (RGPD, Mozilla Observatory)             |

---

### 📌 MARDI 28 JANVIER

**Thème : 📊 Monitoring, Vercel & Support IA (Part 2)**

| Bloc        | Durée | Tâche                                                                      |
| ----------- | ----- | -------------------------------------------------------------------------- |
| 2h Critique | 2h    | **Monitoring & Support IA**                                                |
|             |       | - [ ] **Support IA** : Edge Function `support-email-ingest`                |
|             |       | - [ ] **RGPD** : Edge Function alertes email (Lien `DataRetentionService`) |
| 1h Fond     | 1h    | **Déploiement Vercel & Audit RGPD**                                        |
|             |       | - [ ] Migration GitHub Pages → Vercel                                      |
|             |       | - [ ] Configuration **doodates.com**                                       |
|             |       | - [ ] **Rapports RGPD** : Dashboard admin (volumes supprimés)              |
|             |       | - [ ] **Audit RGPD** : Vérification conformité finale                      |

---

### 📌 MERCREDI 29 JANVIER

**Thème : ✅ Go/No-Go & Support IA (Part 3)**

| Bloc        | Durée | Tâche                                                             |
| ----------- | ----- | ----------------------------------------------------------------- |
| 2h Critique | 2h    | **Checklist finale & Support IA**                                 |
|             |       | - [ ] **Support IA** : Service `SupportAssistantService` (Gemini) |
|             |       | - [ ] **Idée Support** : Analyse demandes via script/Gemini       |
|             |       | - [ ] Vérifier absence d'erreurs console critiques                |
| 1h Fond     | 1h    | **Bilan Carbone & Bug Bounty**                                    |
|             |       | - [ ] Calcul empreinte carbone simplifiée                         |
|             |       | - [ ] Lancer **Programme Bug Bounty public**                      |

---

### 📌 JEUDI 30 JANVIER

**Thème : 📢 Acquisition & Marketing**

| Bloc        | Durée | Tâche                                                      |
| ----------- | ----- | ---------------------------------------------------------- |
| 2h Critique | 2h    | **Marketing & SEO**                                        |
|             |       | - [ ] **Idées Marketing** : Tester AdCopy, Predis AI, etc. |
| 1h Fond     | 1h    | **Distribution**                                           |
|             |       | - [ ] Vérifier sitemap.xml & metadata final                |

---

### 📌 VENDREDI 31 JANVIER

**Thème : 🚀 Soft Launch (ou dernier check)**

| Bloc        | Durée | Tâche                                       |
| ----------- | ----- | ------------------------------------------- |
| 2h Critique | 2h    | **Déploiement ou dernières corrections**    |
|             |       | - [ ] Si prêt : Soft launch (réseau proche) |
|             |       | - [ ] Sinon : Corrections dernières issues  |
| 1h Fond     | 1h    | **Monitoring initial**                      |
|             |       | - [ ] Surveiller Sentry                     |
|             |       | - [ ] Surveiller logs Supabase              |

---

## SEMAINE 6 : Lancement Public (3-7 Février) - DÉCALÉ

### 📌 LUNDI 3 FÉVRIER

**Thème : 🚀 JOUR DE LANCEMENT**

| Bloc        | Durée | Tâche                                    |
| ----------- | ----- | ---------------------------------------- |
| 2h Critique | 2h    | **Publication**                          |
|             |       | - [ ] Poster sur Reddit                  |
|             |       | - [ ] Poster sur LinkedIn/Twitter        |
|             |       | - [ ] Envoyer emails réseau personnel    |
| 1h Fond     | 1h    | **Monitoring actif**                     |
|             |       | - [ ] Surveiller feedback                |
|             |       | - [ ] Répondre aux premiers commentaires |

---

### 📌 MARDI 4 FÉVRIER

**Thème : 📬 Post-Launch & Feedback**

| Bloc        | Durée | Tâche                                            |
| ----------- | ----- | ------------------------------------------------ |
| 2h Critique | 2h    | **Gestion utilisateur**                          |
|             |       | - [ ] Traiter feedback (<24h) via **Support IA** |
|             |       | - [ ] Itérations rapides (bugs critiques)        |
| 1h Fond     | 1h    | **Analytics & monitoring**                       |
|             |       | - [ ] Analyser trafic (Sentry + Posthog)         |
|             |       | - [ ] Surveiller logs Supabase                   |

---

### 📌 MERCREDI 5 FÉVRIER

**Thème : 🔧 Itérations Rapides**

| Bloc        | Durée | Tâche                                          |
| ----------- | ----- | ---------------------------------------------- |
| 2h Critique | 2h    | **Améliorations UX**                           |
|             |       | - [ ] Corriger frictions identifiées           |
|             |       | - [ ] Améliorer messages d'erreur              |
| 1h Fond     | 1h    | **Documentation**                              |
|             |       | - [ ] Mettre à jour FAQ si nouvelles questions |

---

### 📌 JEUDI 6 FÉVRIER

**Thème : 📊 Bilan Semaine 1**

| Bloc        | Durée | Tâche                                          |
| ----------- | ----- | ---------------------------------------------- |
| 2h Critique | 2h    | **Analyse métriques**                          |
|             |       | - [ ] Combien de sondages créés ?              |
|             |       | - [ ] Combien de votes reçus ?                 |
|             |       | - [ ] Taux de conversion Free → Paid ?         |
| 1h Fond     | 1h    | **Planification Février**                      |
|             |       | - [ ] Identifier top 3 améliorations demandées |
|             |       | - [ ] Prioriser roadmap Février                |

---

### 📌 VENDREDI 7 FÉVRIER

**Thème : 🎉 Clôture Janvier**

| Bloc        | Durée | Tâche                                |
| ----------- | ----- | ------------------------------------ |
| 2h Critique | 2h    | **Stabilisation**                    |
|             |       | - [ ] Derniers fixes critiques       |
|             |       | - [ ] Préparer communication Février |
| 1h Fond     | 1h    | **Rétrospective**                    |
|             |       | - [ ] Ce qui a bien fonctionné       |
|             |       | - [ ] Ce qui peut être amélioré      |
|             |       | - [ ] Documenter les learnings       |

---

## 📈 MÉTRIQUES DE SUCCÈS JANVIER

| Métrique               | Objectif |
| ---------------------- | -------- |
| Sondages créés         | 50+      |
| Votes reçus            | 200+     |
| Visiteurs landing page | 500+     |
| Bugs critiques         | < 3      |
| Temps de réponse moyen | < 2s     |
| Feedback positif       | > 70%    |

---

## 📋 RÉCAPITULATIF DES LIVRABLES

- [x] ✅ **Semaine 1** : Revue complète & planification décalée
- [x] ✅ **Semaine 2** : Tests E2E complets
- [ ] ✅ **Semaine 3** : Modèle économique validé et documenté
- [ ] ✅ **Semaine 3** : Intégration paiements fonctionnelle (Lemon Squeezy)
- [ ] ✅ **Semaine 4** : Pages légales créées (/about, /contact, /terms)
- [ ] ✅ **Semaine 4** : Page Transparence & Impact
- [ ] ✅ **Semaine 4** : Emails professionnels configurés
- [ ] ✅ **Semaine 5** : Monitoring production (Sentry, UptimeRobot)
- [ ] ✅ **Semaine 6** : Lancement public effectué
- [ ] ✅ **Semaine 6** : Premiers retours utilisateurs collectés

---

## 📝 NOTES DE DÉCALAGE

**Décision du 2 janvier 2025 :**

- Semaine 1 (2-3 jan) : Terminée avec revue complète
- Semaine 2 (6-10 jan) : Focus Tests E2E 
- Semaines 3-6 : **DÉCALÉES** d'une semaine (13 jan → 3 fév)

---



