# 🔒 Sécurisation des quotas IA & protection anti-abus

**Date d'analyse :** 03 novembre 2025  
**Contexte :** Le système initial reposait sur des quotas côté client (localStorage) et une clé API Gemini exposée dans le bundle, rendant les protections triviales à contourner et ouvrant la porte à des abus massifs.

---

## ⚠️ Failles identifiées dans l'implémentation initiale

### 1. Quotas localStorage (côté client uniquement)

- ❌ Stockage dans `localStorage.getItem('doodates_ai_quota')`
- ❌ Bypass trivial : `localStorage.setItem('doodates_ai_quota', JSON.stringify({ aiMessagesUsed: 0 }))`
- ❌ Mode navigation privée = nouveau quota à chaque session
- ❌ Aucune vérification côté serveur avant l'appel à l'API Gemini

### 2. Clé API Gemini exposée

- ❌ `VITE_GEMINI_API_KEY` présente dans le bundle client (visible par tous)
- ❌ Extraction possible via DevTools → onglet Sources → recherche "GEMINI_API_KEY"
- ❌ Utilisation directe de la clé pour des appels illimités
- ❌ Coût potentiellement illimité

### 3. Impact financier potentiel

- 1 utilisateur malveillant = 10 000+ appels API / mois
- Coût estimé : 50–100 €/mois par abus
- Risque : coûts incontrôlables si plusieurs abus simultanés

---

## 🛡️ Stratégie de défense en profondeur

### Couche 1 : Authentification

- JWT Supabase obligatoire (expiration courte, ex. 15 minutes)
- Impossible d'appeler l'Edge Function sans compte valide

### Couche 2 : Quotas en base de données (source de vérité)

- Utilisation d'une transaction atomique (`FOR UPDATE`) pour éviter les race conditions
- Vérification **et** consommation du quota dans une seule opération

### Couche 3 : Rate limiting

- Par `userId` :
  - 100 messages / heure (utilisateur authentifié)
  - 20 messages / heure (invité)
- Par IP :
  - 100 requêtes / heure (protection contre la création de multiples comptes)

### Couche 4 : Monitoring

- Journalisation de toutes les requêtes (userId, timestamp, crédits consommés)
- Alertes si usage suspect (> 50 crédits / heure)

### Couche 5 : Restrictions côté API externe (Gemini)

- Quotas configurés dans Google Cloud Console
- Alertes si dépassement de seuils définis

---

## 📊 Coûts maîtrisés grâce à la sécurisation

### Avec sécurisation en place

- 1 utilisateur **gratuit** = max 20 crédits / mois ≈ 0,01 €
- 1 utilisateur **Premium** = max 100 crédits / mois ≈ 0,05 €
- Protection anti-abus : contournement économiquement non rentable

### Sans sécurisation

- 1 utilisateur malveillant = appels illimités = 50–100 €/mois
- Risque sérieux pour la viabilité financière du projet

---

## ✅ Offre gratuite sécurisée

**Stratégie produit :** Maintenir une offre gratuite généreuse (20 crédits / mois) tout en verrouillant les risques d'abus.

- ✅ Quotas vérifiés côté serveur (impossible de les remettre à zéro via le client)
- ✅ Rate limiting pour limiter les abus massifs
- ✅ Coût maîtrisé même en présence de quelques abus isolés
- ✅ Meilleure conversion grâce à une offre freemium généreuse

### Protection des invités (sans compte)

- Rate limiting strict : 10 messages max par IP / jour
- Forcer la création de compte après ~5 messages
- Coût négligeable : 5 × 0,0005 € ≈ 0,0025 € / visiteur

### Risques résiduels acceptables

- Utilisateurs très techniques (reverse engineering) : risque limité par le rate limiting et la surveillance
- Attaques coordonnées : détectables via le monitoring
- Objectif : rendre l'abus **non rentable**, pas impossible (même logique que Netflix / GitHub)

---

## 📋 Checklist d'implémentation & statut

### Phase 1 : Migration Edge Function (1 jour) ✅ FAITE (avec renommage)

- [x] Créer l'Edge Function **`quota-tracking`** (remplace `/check-quota-and-chat`)
- [x] Déplacer la clé Gemini dans les secrets Supabase (serveur)
- [x] Implémenter la vérification et la consommation de quota en DB (RPC atomique)
- [x] Tester la consommation atomique

### Phase 2 : Migration frontend (4 h) ✅ FAITE

- [x] Modifier `GeminiService` pour utiliser `SecureGeminiService` (Edge Function)
- [x] Supprimer la dépendance directe à `VITE_GEMINI_API_KEY` côté client
- [x] Gérer les erreurs de quota / blocage IA (toasts / UI)

### Phase 3 : Rate limiting (2 h) ✅ FAITE (backend)

- [x] Limites globales de crédits + par action en DB (`quota_tracking`)
- [x] Ajouter rate limiting temporel par `userId` (X messages / heure via RPC SQL)
- [x] Ajouter rate limiting par IP (protection multi‑comptes via RPC SQL)

#### Mini‑planning rate limiting restant

- [x] Créer la fonction SQL `can_consume_rate_limit(p_user_id, p_ip, p_action, p_limit_per_hour)`
- [x] Intégrer l’appel à cette fonction dans l’Edge Function `quota-tracking` avant `consume_quota_credits`
- [x] Renvoyer `HTTP 429` + message explicite si limite horaire dépassée
- [x] Adapter `SecureGeminiService` pour afficher un message clair de limite horaire atteinte
- [x] Ajouter des tests **unitaires** pour le mapping RATE_LIMIT → message UI
- [ ] Ajouter des tests **E2E / load** (Playwright) pour vérifier le blocage après X requêtes / heure (Edge `quota-tracking`)

### Phase 4 : Monitoring (2 h) 🔄 PARTIELLEMENT FAITE

- [x] Logs d'audit complets dans l’Edge Function (requestId, timestamps, actions, erreurs)
- [x] Scripts SQL / Edge Function `send-quota-report` pour reporting
- [ ] Créer un mini dashboard interne (page admin) listant les usages / quotas les plus élevés
- [ ] Ajouter des alertes d'anomalies (email / webhook) si un seuil est dépassé (ex. > 50 crédits / heure)

### Tests réalisés

- [x] Tentative de bypass localStorage (doit échouer) → ✅ Vérifié côté serveur
- [x] Tentative d'extraction de la clé API (doit être impossible) → ✅ Clé uniquement côté serveur (Edge)
- [x] Tests unitaires rate limiting (`SecureGeminiService`, mapping `RATE_LIMIT` → `RATE_LIMIT_EXCEEDED`)
- [ ] Tests E2E rate limiting temporel (Playwright, blocage après limite horaire côté UI)
- [x] Test consommation atomique (pas de race condition) → ✅ `FOR UPDATE` / RPC en DB

### Déploiement

- [x] Edge Function `quota-tracking` créée et déployée
- [x] Scripts SQL de quotas créés et appliqués
- [x] Documentation technique initiale disponible

---

## 🔗 Références

- Edge Function : `supabase/functions/quota-tracking/`
- SQL quotas & rate limiting : `supabase/migrations/` (fonctions `consume_quota_credits`, `can_consume_rate_limit`, tables de tracking)
- Service frontend : `src/services/SecureGeminiService.ts`
- Tests : `src/lib/__tests__/SecureGeminiService.test.ts` (et futurs tests E2E Playwright à ajouter)
