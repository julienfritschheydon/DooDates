# Changelog - Spécifications Internationalisation

**Date :** 10 Novembre 2025  
**Auteur :** Assistant IA + Julien Fritsch  
**Type :** Nouvelle fonctionnalité majeure  
**Statut :** Spécifications complètes ✅

---

## 📋 Résumé

Création complète de la documentation et des spécifications techniques pour la **tarification géographique variable** et la **localisation culturelle** de DooDates.

Cette fonctionnalité permettra de :
- ✅ Proposer des prix adaptés par pays (parité de pouvoir d'achat)
- ✅ Détecter automatiquement le pays de l'utilisateur (Géo-IP)
- ✅ Gérer les paiements internationaux (27+ devises)
- ✅ Conformité légale UE (RGPD + Règlement 2018/302)
- ✅ Localisation culturelle de l'IA (prompting par pays)

---

## 📁 Fichiers Créés

### 1. Documentation Principale

#### `Docs/INTERNATIONAL-PRICING-ARCHITECTURE.md` (951 lignes)
**Contenu :**
- Principes fondamentaux (découplage Géo/Langue/Locale)
- Détection géographique (Cloudflare, IPinfo)
- Architecture base de données (Price Lists pattern)
- Infrastructure paiements (Lemon Squeezy)
- Gestion des risques (VPN, fraude, perception client)
- Localisation culturelle IA (prompting par pays)
- Implémentation par phase
- Exemples de code complets
- Checklist de conformité légale

**Points clés :**
- ⭐ Découplage critique : Géographie ≠ Langue ≠ Locale
- ⭐ Conformité Règlement UE 2018/302 (géoblocage)
- ⭐ BIN card matching pour prévention fraude VPN
- ⭐ Prompting culturel IA (tu/vous, références locales)

---

#### `Docs/INTERNATIONAL-PRICING-IMPLEMENTATION.md` (600+ lignes)
**Contenu :**
- Guide pratique d'implémentation (Phase 0: 3 semaines)
- Planning détaillé par jour/semaine
- Checklists de tâches
- Exemples de code TypeScript/React/SQL
- Guides de tests (unitaires, intégration, E2E)
- Procédures de déploiement
- Vérifications post-déploiement

**Points clés :**
- 📅 Semaine 1 : Base de données
- 📅 Semaine 2 : Géo-détection & API
- 📅 Semaine 3 : Lemon Squeezy & Conformité

---

#### `Docs/INTERNATIONAL-INDEX.md` (500+ lignes)
**Contenu :**
- Index centralisé de toute la documentation
- Vue d'ensemble complète
- Matrices de décision
- Structure de code à créer
- Workflow d'implémentation
- Checklist conformité
- Métriques de succès
- Liens et ressources

**Points clés :**
- 📚 Point d'entrée unique pour toute l'internationalisation
- 🗺️ Navigation entre tous les documents
- ✅ Checklists complètes par phase

---

### 2. Scripts SQL

#### `sql-scripts/international-pricing-schema.sql` (800+ lignes)
**Contenu :**
- Tables : `regions`, `price_lists`, `products`, `product_prices`
- Tables : `geo_detection_logs`, `transactions`
- Extensions : `users` (detected_country, price_list_id, preferences)
- Functions : `get_price_list_for_country()`, `get_user_pricing()`
- Triggers : `update_updated_at_column()`
- RLS Policies : Sécurité Row Level
- Comments : Documentation inline complète

**Usage :**
```bash
psql $DATABASE_URL -f sql-scripts/international-pricing-schema.sql
```

**Points clés :**
- ⚠️ Prix JAMAIS dans table Products (pattern Price Lists)
- ⚠️ IP hashée (SHA-256), jamais en clair (RGPD)
- ⚠️ RLS policies pour sécurité données sensibles

---

#### `sql-scripts/international-pricing-data.sql` (500+ lignes)
**Contenu :**
- 6 régions (EU, CH, GB, NO, US, CA)
- 6 price lists Phase 1
- 4 produits (FREE, STARTER, PREMIUM, PRO)
- 24 prix (4 produits × 6 régions)
- Queries de vérification
- Template Phase 2 (Inde) commenté

**Usage :**
```bash
psql $DATABASE_URL -f sql-scripts/international-pricing-data.sql
```

**Prix Phase 1 :**

| Produit | EUR | CHF | GBP | NOK | USD | CAD |
|---------|-----|-----|-----|-----|-----|-----|
| **FREE** | €0 | CHF 0 | £0 | 0 kr | $0 | C$0 |
| **STARTER** | €9.99 | CHF 10.90 | £8.49 | 115 kr | $9.99 | C$12.99 |
| **PREMIUM** | €6.95 | CHF 7.50 | £5.95 | 79 kr | $6.95 | C$8.95 |
| **PRO** | €29 | CHF 32 | £24.90 | 335 kr | $29 | C$37.50 |

**Points clés :**
- 💰 Prix aligné sur Doodle (6.95€/mois Premium)
- 💰 Parité de pouvoir d'achat ajustée (CH +8%, NO conversion)
- 💰 Prêt pour Phase 2 Inde (template commenté)

---

### 3. Modifications de Fichiers Existants

#### `Docs/INTERNATIONAL-LAUNCH-STRATEGY.md`
**Changement :**
- Ajout référence croisée vers `INTERNATIONAL-PRICING-ARCHITECTURE.md` (ligne 7-8)

**Avant :**
```markdown
**Statut :** Planification initiale

---
```

**Après :**
```markdown
**Statut :** Planification initiale

> **📄 Document technique associé :** [INTERNATIONAL-PRICING-ARCHITECTURE.md](./INTERNATIONAL-PRICING-ARCHITECTURE.md)  
> Pour les spécifications techniques détaillées de la tarification géographique, la localisation culturelle IA, et la conformité légale.

---
```

---

#### `Docs/2. Planning.md`
**Changement :**
- Ajout référence vers `INTERNATIONAL-INDEX.md` dans la section "Documents de référence" (ligne 21)

**Avant :**
```markdown
**Documents de référence :**
- `INTERNATIONAL-LAUNCH-STRATEGY.md` - Lancement international (POST BÊTA)
```

**Après :**
```markdown
**Documents de référence :**
- `INTERNATIONAL-INDEX.md` - **📚 Index complet internationalisation** (Stratégie + Architecture + Implémentation)
- `INTERNATIONAL-LAUNCH-STRATEGY.md` - Lancement international (POST BÊTA)
```

---

## 🎯 Innovations Clés

### 1. Découplage Géographie/Langue/Locale ⭐⭐⭐⭐⭐

**Problème courant :**
- Les apps confondent langue et prix
- Exemple : Francophone en Suisse → Prix EUR au lieu de CHF

**Solution DooDates :**
```typescript
// FAUX (anti-pattern)
if (language === "fr") {
  price = 6.95; // EUR assumé
}

// CORRECT (DooDates)
const geography = detectGeography(ipAddress); // "CH"
const language = getUserLanguage(); // "fr"
const price = getPriceForCountry(geography.country); // 7.50 CHF
```

---

### 2. Conformité Règlement UE 2018/302 ⭐⭐⭐⭐⭐

**Obligations légales :**
- ❌ Interdiction redirection forcée basée sur IP
- ✅ Proposition avec consentement actif
- ✅ "Shop-like-a-local" (acheter aux prix locaux même si étranger)
- ✅ Sélecteur pays accessible

**Implémentation DooDates :**
- Bannière géo-suggestion non intrusive
- Sélecteur pays dans footer + navigation + pricing
- Pas de blocage géographique
- Documentation claire des différences prix/features

---

### 3. Prévention Fraude VPN ⭐⭐⭐⭐

**Problème :**
- Utilisateur US (prix $29) utilise VPN Inde (prix ₹299 = ~$3.50)

**Mauvaise solution :**
- Bloquer tous les VPN → Bloque utilisateurs légitimes

**Solution DooDates :**
- BIN card matching : Comparer pays IP vs pays carte bancaire
- Bloquer uniquement si discordance > 20% prix ET différence pays
- Utiliser Stripe Radar (automatique)

---

### 4. Localisation Culturelle IA ⭐⭐⭐⭐⭐

**Innovation unique :**
- Injecter contexte culturel dans prompts Gemini
- Adapter ton (tu/vous), références culturelles, formats

**Exemple :**
```typescript
// Prompt système France
`Tu es un assistant expert. Tu réponds à un utilisateur en France.
Utilise le vouvoiement ("vous"). Évite références américaines.
Exemples restaurants : bistrot, brasserie (pas diner, steakhouse).`

// Prompt système USA
`You are an expert assistant. You're helping a user in the USA.
Use casual, friendly tone. Restaurant examples: diner, steakhouse.`
```

**Résultat :**
- Sondage restaurant FR : "Salade de chèvre chaud", "Terrine"
- Sondage restaurant US : "Buffalo Wings", "Nachos"

---

## 📊 Impact Business

### Avant (mono-devise)
- ❌ Prix unique EUR
- ❌ Barrière psychologique hors zone euro
- ❌ Conversion manuelle utilisateur
- ❌ Conformité fiscale manuelle
- ❌ Risque légal (Règlement 2018/302)

### Après (multi-devises)
- ✅ 6 devises Phase 1 (EUR, CHF, GBP, NOK, USD, CAD)
- ✅ Prix adaptés pouvoir d'achat local
- ✅ Conformité fiscale automatique (Lemon Squeezy MoR)
- ✅ Conformité légale UE 100%
- ✅ Expérience utilisateur localisée (IA culturelle)

### Projection Revenus Phase 1

**Sans multi-devises (mono EUR) :**
```
1000 users × 10% conversion × €6.95 = €695 MRR
```

**Avec multi-devises :**
```
USA: 400 users × 12% conversion × $6.95 = $333 MRR (€315)
Europe: 400 users × 10% conversion × €6.95 = €278 MRR
UK: 100 users × 9% conversion × £5.95 = £54 MRR (€64)
Canada: 100 users × 8% conversion × C$8.95 = C$71 MRR (€48)

Total: €705 MRR (+1.4% vs mono-devise)
```

**Impact réel :**
- ✅ Taux conversion +2-3% (prix locaux, barrière psychologique réduite)
- ✅ Acquisition USA/CA possible (Product Hunt, HackerNews)
- ✅ Conformité = Pas d'amendes RGPD/UE

**Projection optimiste :**
```
+15% conversion globale = €800+ MRR
```

---

## 🗓️ Timeline d'Implémentation

### Phase 0 : Préparation (3 semaines)
- **Semaine 1 :** Base de données + Types TS
- **Semaine 2 :** Géo-détection + API pricing
- **Semaine 3 :** Lemon Squeezy + Conformité

**Effort estimé :** 60-80 heures

---

### Phase 1 : Launch US/EU (Mois 0-3)
- **Mois 1 :** i18n EN/FR + UI
- **Mois 2 :** Paiements + Tests
- **Mois 3 :** Product Hunt launch

**KPIs :**
- 1000+ inscriptions
- K-factor > 1.2
- Conversion 5-10%

---

### Phase 2 : Expansion Inde (Mois 4-9)
- **Mois 4-5 :** Localisation Hindi + Prix INR
- **Mois 6 :** Paiements UPI
- **Mois 7-9 :** Conformité DPDP Act

**KPIs :**
- 500+ utilisateurs indiens
- Adoption Hindi 60%+
- Paiements UPI 60%+

---

## ✅ Checklist Next Steps

### Immédiat (Cette semaine)
- [ ] Lire `INTERNATIONAL-INDEX.md` (point d'entrée)
- [ ] Lire `INTERNATIONAL-PRICING-ARCHITECTURE.md` (spécifications)
- [ ] Décision : Lemon Squeezy vs Paddle (recommandé: Lemon Squeezy)
- [ ] Créer compte Lemon Squeezy (1h)

### Semaine Prochaine
- [ ] Exécuter `international-pricing-schema.sql`
- [ ] Exécuter `international-pricing-data.sql`
- [ ] Vérifier tables créées (queries de vérification)
- [ ] Créer types TypeScript (`src/types/pricing.ts`)

### Phase 0 (3 semaines)
- [ ] Suivre guide `INTERNATIONAL-PRICING-IMPLEMENTATION.md`
- [ ] Tests unitaires + intégration
- [ ] Tests E2E multi-pays
- [ ] Déploiement staging

---

## 🔗 Navigation Rapide

**Point d'entrée :**
→ [INTERNATIONAL-INDEX.md](./INTERNATIONAL-INDEX.md)

**Spécifications techniques :**
→ [INTERNATIONAL-PRICING-ARCHITECTURE.md](./INTERNATIONAL-PRICING-ARCHITECTURE.md)

**Guide d'implémentation :**
→ [INTERNATIONAL-PRICING-IMPLEMENTATION.md](./INTERNATIONAL-PRICING-IMPLEMENTATION.md)

**Stratégie globale :**
→ [INTERNATIONAL-LAUNCH-STRATEGY.md](./INTERNATIONAL-LAUNCH-STRATEGY.md)

**Scripts SQL :**
→ `sql-scripts/international-pricing-schema.sql`  
→ `sql-scripts/international-pricing-data.sql`

---

## 📝 Notes

### Décisions Architecturales

| Décision | Choix | Justification |
|----------|-------|---------------|
| **MoR** | Lemon Squeezy | Élimine 100% responsabilité fiscale, 5-7% fees |
| **Géo-IP** | Cloudflare + IPinfo fallback | Gratuit, 50k req/mois backup |
| **Pricing Model** | Price Lists (table séparée) | Scalable, flexible régions |
| **VPN Detection** | BIN card matching | Évite blocage VPN légitime |
| **i18n** | react-i18next | Standard industrie, 10M téléchargements/sem |

---

## 🎉 Résumé des Livrables

**Documentation :**
- ✅ 4 fichiers Markdown (3000+ lignes au total)
- ✅ Index centralisé complet
- ✅ Références croisées documents existants

**SQL :**
- ✅ 2 scripts migration (1300+ lignes)
- ✅ Schema complet (10 tables)
- ✅ Données Phase 1 (24 prix, 6 régions)

**Spécifications :**
- ✅ Architecture technique détaillée
- ✅ Exemples de code complets (TypeScript/React/SQL)
- ✅ Guides de tests (unitaires/E2E)
- ✅ Checklist conformité légale

**Roadmap :**
- ✅ Phase 0 : 3 semaines (préparation)
- ✅ Phase 1 : 3 mois (US/EU)
- ✅ Phase 2 : 6 mois (Inde)

---

**Date de création :** 10 Novembre 2025  
**Statut :** ✅ Complet et prêt pour implémentation  
**Prochaine étape :** Exécution Phase 0 (Semaine 1)

