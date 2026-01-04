# Stratégie de Lancement International - DooDates

**Date de création :** 10 Novembre 2025  
**Objectif :** Atteindre une notoriété de masse via un lancement "Global-by-Design"  
**Statut :** Planification initiale

> **📄 Document technique associé :** [INTERNATIONAL-PRICING-ARCHITECTURE.md](./INTERNATIONAL-PRICING-ARCHITECTURE.md)  
> Pour les spécifications techniques détaillées de la tarification géographique, la localisation culturelle IA, et la conformité légale.

---

## 📋 Table des Matières

1. [Vision Stratégique](#vision-stratégique)
2. [Analyse de Marché](#analyse-de-marché)
3. [Positionnement Produit](#positionnement-produit)
4. [Écart Produit Actuel vs Vision](#écart-produit-actuel-vs-vision)
5. [Architecture Technique](#architecture-technique)
6. [Roadmap d'Implémentation](#roadmap-dimplémentation)
7. [Conformité Juridique](#conformité-juridique)
8. [Stratégie Go-to-Market](#stratégie-go-to-market)
9. [Risques & Mitigations](#risques--mitigations)
10. [Métriques de Succès](#métriques-de-succès)

---

## 1. Vision Stratégique

### Objectif Principal

Atteindre une **notoriété de masse** ("le faire connaître le plus possible") via une approche **Global-by-Design**.

### Approche de Marché : Lancement Séquencé

#### Phase 1 : Marchés à Faible Friction (Mois 0-3)

- **Cibles :** États-Unis + Europe
- **Langues :** Anglais (P0), Français (P1)
- **Conformité :** RGPD (UE)

#### Phase 2 : Marché à Friction Moyenne (Mois 4-9)

- **Cible :** Inde
- **Langue :** Hindi (P2)
- **Conformité :** DPDP Act 2023
- **Paiements :** UPI via Merchant of Record

### Justification Stratégique

**Pourquoi pas "France-first" ?**

- ✅ Simplifie la fiscalité initiale
- ❌ Coupe le produit des principaux canaux d'acquisition virale (Product Hunt, Reddit, HackerNews)
- ❌ Ces canaux sont **mondiaux et anglophones**
- ❌ Limite la croissance organique

**Conclusion :** La stratégie "Global-by-Design" est une **nécessité**, pas un choix.

---

## 2. Analyse de Marché

### Points de Parité (POP)

Le plan gratuit doit **égaler la générosité fonctionnelle de Google Forms** pour être une alternative crédible :

- ✅ Questions illimitées ou quasi-illimitées
- ✅ Sondages illimités
- ✅ Réponses illimitées (ou très généreuses)
- ✅ Export gratuit (4 formats : CSV, PDF, JSON, Markdown)

**État actuel DooDates :** ✅ Parité atteinte

### Points de Différence (POD)

#### 1. Génération de Sondages par IA ⭐⭐⭐⭐⭐

**Fonction :** Création en langage naturel via prompt  
**Exemple :** "Crée un sondage NPS pour un SaaS B2B"  
**État actuel :** ✅ Implémenté (Date Polls + Form Polls)  
**Priorité :** P0 - ACQUISITION

#### 2. Analyse Sémantique IA des Réponses ⭐⭐⭐⭐

**Fonction :** Identification de thèmes, sentiments, synthèses automatiques  
**Valeur :** Transformation données brutes → insights actionnables  
**État actuel :** ✅ Implémenté  
**Priorité :** P1 - VALEUR

#### 3. Boucle Virale "Created with DooDates" ⭐⭐⭐⭐⭐

**Fonction :** Branding subtil sur pages de vote publiques  
**Valeur :** Acquisition organique via répondants → nouveaux créateurs  
**État actuel :** ❌ Non implémenté  
**Priorité :** P0 - CRITIQUE POUR NOTORIÉTÉ

---

## 3. Positionnement Produit

### Tagline

**"DooDates - The AI Survey Builder"**

### Message Marketing Unifié

> "Enfin un outil de sondage sans publicité, avec IA conversationnelle, et export gratuit. Créez en parlant naturellement, analysez intelligemment, partagez sans limite."

### Modèle Économique : Freemium

**Justification :**

- ✅ Aligné sur objectif de "notoriété maximale"
- ✅ Supprime la friction de paiement
- ✅ Maximise le bouche-à-oreille
- ✅ Meilleur pour croissance organique virale

**Erreur à éviter :** Prix très bas pour pénétrer le marché

- ❌ Prix bas = barrière (demande CB) qui tue la viralité
- ❌ Ancre la valeur perçue à un niveau "cheap"
- ❌ Rend la monétisation future difficile
- ✅ "Gratuit" > "Pas cher" psychologiquement

### Plans Proposés

| Plan        | Prix        | Type         | Crédits IA/mois | Justification                                    |
| ----------- | ----------- | ------------ | --------------- | ------------------------------------------------ |
| **Gratuit** | 0€          | Permanent    | 20              | Acquisition massive, parité Google Forms         |
| **Starter** | 9.99€       | Achat unique | 200 (lifetime)  | Conversion facile, faible barrière psychologique |
| **Premium** | 7.99€/mois  | Abonnement   | 100             | Compétitif vs concurrents (Poll For All 7.49€)   |
| **Pro**     | 19.99€/mois | Abonnement   | 1000            | Aligné Evalandgo, cible B2B                      |

---

## 4. Écart Produit Actuel vs Vision

### ✅ Points Forts Existants

**Produit :**

- ✅ Génération IA par prompt fonctionnelle (Gemini)
- ✅ Date Polls + Form Polls (6+ types de questions)
- ✅ Analyse IA des résultats
- ✅ Export gratuit (4 formats)
- ✅ Freemium généreux planifié
- ✅ Logique conditionnelle (différenciation vs Google Forms)

**Infrastructure :**

- ✅ Stack technique solide (React + Vite + Supabase + Gemini)
- ✅ Tests automatisés (507+ tests)
- ✅ CI/CD configuré

### ❌ Écarts Critiques pour le Lancement International

#### 1. Internationalisation (i18n) - PRIORITÉ P0 🔴

**État actuel :**

- 🔴 Aucun système i18n formalisé
- 🟡 Quelques traductions hardcodées FR/EN dans certains composants
- 🔴 Pas de gestion des locales/devises/formats de dates

**Besoin :**

- Bibliothèque : `react-i18next`
- Langues Phase 1 : EN (P0), FR (P1)
- Langues Phase 2 : HI (Hindi) pour l'Inde
- Gestion : Pluralization, variables, fallbacks

**Estimation :** 2-3 semaines

#### 2. Paiements Internationaux - PRIORITÉ P0 🔴

**État actuel :**

- 🔴 Aucune intégration de paiement
- 🔴 Pas de Merchant of Record (MoR)

**Problème critique :**
Vendre à l'international = responsabilité fiscale dans CHAQUE juridiction :

- TVA UE : 27 pays, enregistrement obligatoire (0€ de seuil)
- Sales Tax US : 50 états, règles différentes
- GST Inde : Conformité locale complexe

**Solution recommandée : Merchant of Record (MoR)**

**Comparaison des options MoR disponibles :**

| Critère               | Lemon Squeezy   | Paddle         | Nexway                  |
| --------------------- | --------------- | -------------- | ----------------------- |
| **MoR complet**       | ✅ Oui          | ✅ Oui         | ✅ Oui                  |
| **Pays supportés**    | 135+            | 200+           | Worldwide               |
| **TVA UE**            | ✅ Automatique  | ✅ Automatique | ✅ Automatique          |
| **Sales Tax US**      | ✅ Automatique  | ✅ Automatique | ✅ Automatique          |
| **GST Inde**          | ✅ Automatique  | ✅ Automatique | ✅ Automatique          |
| **Paiements in-app**  | ✅ Oui          | ✅ Oui         | ✅ Oui (spécialisé)     |
| **Fees**              | ~5-7% + Stripe  | ~5-7% + Stripe | À vérifier              |
| **Maturité**          | Récent, moderne | Plus mature    | Très mature (ex: Avast) |
| **Origine**           | US              | UK             | 🇫🇷 France               |
| **Support français**  | Anglais         | Anglais        | ✅ Français natif       |
| **Documentation**     | Excellente      | Excellente     | À vérifier              |
| **Setup développeur** | Rapide          | Rapide         | À vérifier              |

**Recommandation initiale : Lemon Squeezy ✅**

**Pourquoi Lemon Squeezy ?**

- ✅ MoR = Ils assument 100% responsabilité fiscale mondiale
- ✅ Vendent en leur nom dans 135+ pays
- ✅ Gèrent TVA UE, Sales Tax US, GST Inde automatiquement
- ✅ Fees : ~5-7% (vs 2.9% Stripe + coûts légaux/comptables énormes)
- ✅ Paiements locaux : UPI (Inde), iDEAL (EU), etc.
- ✅ Setup rapide pour développeur solo
- ✅ Documentation moderne et complète
- ✅ SDK officiel bien maintenu

**Alternative 1 : Paddle**

- ✅ Même avantages que Lemon Squeezy
- ✅ Plus mature (plus d'années sur le marché)
- ✅ Fees légèrement plus élevés
- ✅ Support excellent

**Alternative 2 : Nexway 🇫🇷**

- ✅ **Avantage majeur :** Entreprise française (support natif français)
- ✅ **Spécialisé in-app :** Expérience confirmée avec clients majeurs (ex: Avast)
- ✅ **Worldwide :** Support mondial
- ✅ **MoR complet :** Gestion fiscale internationale
- ⚠️ **À investiguer :**
  - Structure de fees exacte
  - Documentation technique
  - Intégration développeur (API/SDK)
  - Exemples de clients similaires à DooDates
  - Support technique réactif

**Action immédiate :**

- [ ] Contacter Nexway pour obtenir :
  - Documentation technique complète
  - Structure de pricing détaillée
  - Exemples d'intégration in-app
  - Références clients similaires
  - Délai de setup estimé
- [ ] Comparer avec Lemon Squeezy sur :
  - Coût total (fees + setup)
  - Facilité d'intégration
  - Support technique
  - Roadmap produit
- [ ] Décision finale basée sur :
  - Critères techniques (API, webhooks, documentation)
  - Critères business (fees, support, maturité)
  - Critères stratégiques (support français vs international)

**Estimation :** 1 semaine (incluant investigation Nexway)

#### 3. Boucle Virale - PRIORITÉ P0 🔴

**État actuel :**

- 🔴 Pas de branding "Created with DooDates" sur les sondages partagés
- 🔴 Pas de métriques de partage/conversion

**À implémenter :**

```tsx
// Sur la page de vote publique
<Footer>
  <Logo size="sm" />
  <Text>
    Créé avec <Link href="/">DooDates</Link>
  </Text>
  <Button variant="ghost">Créer mon sondage gratuitement</Button>
</Footer>
```

**Tracking analytics :**

- Vues de sondage (par source: direct, viral, social)
- Clics sur branding
- Conversion: Visiteur → Inscription
- Calcul du K-factor (viralité)

**Estimation :** 2-3 jours

#### 4. Conformité RGPD/DPDP - PRIORITÉ P0 🔴

**État actuel :**

- 🟡 Mentions "GDPR Ready" dans README mais pas d'implémentation visible
- 🔴 Pas de bannière de consentement cookies
- 🔴 Pas de politique de confidentialité visible
- 🔴 Pas de DPO (Délégué à la Protection des Données)

**Estimation :** 1 semaine

---

## 5. Architecture Technique

### Stack Phase 1 (US/EU)

```yaml
Frontend:
  i18n: react-i18next
  Timezone: date-fns + date-fns-tz

Paiements:
  Provider: MoR (Lemon Squeezy / Paddle / Nexway - décision en cours)
  Plans: Gratuit / Starter 9.99€ / Premium 7.99€/mois

Conformité:
  Cookies: react-cookie-consent
  Privacy: iubenda (templates)
  HTTPS: Netlify (déjà en place)

Analytics:
  Provider: Plausible Analytics (GDPR-friendly)
  Tracking: K-factor, conversion, activation
```

### Configuration i18n

#### Installation

```bash
npm install react-i18next i18next i18next-browser-languagedetector
```

#### Structure fichiers

```
src/
  i18n/
    index.ts              # Configuration
    locales/
      en/
        common.json       # Commun
        polls.json        # Sondages
        auth.json         # Auth
      fr/
        common.json
        polls.json
        auth.json
      hi/                 # Phase 2
        common.json
        polls.json
        auth.json
```

#### Configuration

```typescript
// src/i18n/index.ts
import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";

import enCommon from "./locales/en/common.json";
import enPolls from "./locales/en/polls.json";
import frCommon from "./locales/fr/common.json";
import frPolls from "./locales/fr/polls.json";

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: { common: enCommon, polls: enPolls },
      fr: { common: frCommon, polls: frPolls },
    },
    fallbackLng: "en",
    defaultNS: "common",
    interpolation: { escapeValue: false },
  });

export default i18n;
```

#### Migration composants

```typescript
// Avant
<Button>Créer un sondage</Button>

// Après
import { useTranslation } from 'react-i18next';

const { t } = useTranslation('polls');
<Button>{t('create_poll')}</Button>
```

### Intégration Merchant of Record

**Note :** L'exemple ci-dessous utilise Lemon Squeezy, mais l'architecture sera similaire pour Paddle ou Nexway. La solution finale sera déterminée après investigation complète (voir section "Paiements Internationaux").

#### Exemple avec Lemon Squeezy

**Installation**

```bash
npm install @lemonsqueezy/lemonsqueezy.js
```

**Service paiement**

```typescript
// lib/payments/lemonsqueezy.ts
import { lemonSqueezySetup } from "@lemonsqueezy/lemonsqueezy.js";

lemonSqueezySetup({ apiKey: process.env.LEMONSQUEEZY_API_KEY });

export async function createCheckout(variantId: string, userId: string) {
  const checkout = await lemonSqueezy.createCheckout({
    storeId: process.env.LEMONSQUEEZY_STORE_ID,
    variantId,
    checkoutData: {
      custom: { user_id: userId },
    },
  });

  return checkout.data.attributes.url;
}
```

**Webhook handler (Supabase Edge Function)**

```typescript
export async function handleWebhook(payload: LemonSqueezyWebhook) {
  if (payload.meta.event_name === "order_created") {
    // Activer le plan premium dans Supabase
    await supabase
      .from("users")
      .update({
        plan: "premium",
        credits: 100,
      })
      .eq("id", payload.meta.custom_data.user_id);
  }
}
```

**Note pour Nexway/Paddle :** L'architecture sera similaire (SDK, webhooks, activation plans), mais les détails d'implémentation varieront selon la solution choisie.

### Gestion Timezones

**Problème actuel :**

- Pas de gestion explicite des fuseaux horaires
- Dates stockées sans contexte timezone

**Solution :**

```typescript
import { format } from "date-fns";
import { formatInTimeZone } from "date-fns-tz";

// Détection automatique timezone navigateur
const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

// Stockage dans poll
interface Poll {
  // ...
  timezone: string; // "Europe/Paris", "America/New_York", etc.
}

// Affichage
const displayDate = formatInTimeZone(pollDate, userTimezone, "PPP 'à' HH:mm");

// Warning si timezone différente
if (poll.timezone !== userTimezone) {
  showWarning(`Horaires en ${poll.timezone}`);
}
```

---

## 6. Roadmap d'Implémentation

### Phase 0 : Pré-Lancement (2-3 semaines)

#### Semaine 1-2 : Infrastructure i18n

**Actions :**

1. Installation `react-i18next` + configuration
2. Création structure `src/i18n/locales/`
3. Extraction strings hardcodés → JSON (EN/FR)
4. Migration 10 composants prioritaires
5. Tests E2E multi-locales

**Composants prioritaires :**

- `GeminiChatInterface.tsx`
- `PollCreator.tsx`
- `FormPollCreator.tsx`
- `Dashboard.tsx`
- `Pricing.tsx`
- `Vote.tsx`
- `Results.tsx`

**Livrable :** Application 100% bilingue EN/FR

#### Semaine 2-3 : Intégration Merchant of Record

**Actions :**

1. Création compte MoR (Lemon Squeezy / Paddle / Nexway selon décision)
2. Configuration produits/plans
3. Intégration SDK frontend
4. Création Edge Function webhook
5. Tests paiement (sandbox)
6. Tests webhooks (activation plans)

**Livrable :** Paiements internationaux fonctionnels

**Note :** La solution MoR finale sera déterminée après investigation Nexway (Semaine 1).

#### Semaine 3 : Conformité & Boucle Virale

**Actions :**

1. Cookie consent banner (`react-cookie-consent`)
2. Privacy Policy + Terms of Service (via iubenda)
3. Branding viral sur pages de vote
4. Tracking analytics (Plausible)
5. Tests conformité RGPD

**Livrable :** Application conforme RGPD + boucle virale active

---

### Phase 1 : Lancement Global-Tech (Mois 0-3) - US/EU

**Objectifs :**

- ✅ Site 100% bilingue EN/FR
- ✅ Paiements internationaux fonctionnels
- ✅ Conformité RGPD complète
- ✅ Boucle virale implémentée

**Checklist de lancement :**

- [ ] i18n EN/FR à 100%
- [ ] MoR intégré + testé (Lemon Squeezy / Paddle / Nexway)
- [ ] Cookie banner + Privacy Policy
- [ ] Branding viral sur pages de vote
- [ ] Product Hunt submission préparée
- [ ] Landing page optimisée SEO (EN)
- [ ] Tests E2E multi-locales
- [ ] Analytics configurés (Plausible)
- [ ] Documentation utilisateur traduite

**Tactiques GTM :**

**Product Hunt Launch :**

```markdown
Préparation (2 semaines avant):

- [ ] Teaser video (30s) montrant création par IA
- [ ] Landing page avec CTA "Get Early Access"
- [ ] Build email list (100+ early supporters)
- [ ] Contacter 5-10 "hunters" influents

Jour J:

- [ ] Lancer à 00:01 PST (maximiser temps de vote)
- [ ] Répondre à TOUS les commentaires < 2h
- [ ] Cross-post Reddit (r/SideProject, r/EntrepreneurRideAlong)
- [ ] Tweet storm avec demo GIFs

Métrique de succès:

- Top 5 Product of the Day = Success
- Top 10 = Good
- 500+ upvotes = Excellent
```

**Marketing Communautaire :**

- Reddit : r/SideProject, r/productivity, r/SaaS
- HackerNews : Show HN post
- IndieHackers : Launch post + milestone updates
- Dev.to : Article technique sur l'IA conversationnelle

**Métriques Phase 1 :**

- 1000+ inscriptions (Mois 1-3)
- K-factor > 1.2 (viralité auto-entretenue)
- Conversion Freemium→Payant : 5-10%
- NPS > 50

---

### Phase 2 : Expansion Inde (Mois 4-9)

**Objectifs :**

- ✅ Localisation Hindi
- ✅ Paiements UPI (via MoR - Lemon Squeezy / Paddle / Nexway supportent tous UPI)
- ✅ Conformité DPDP Act

**Actions spécifiques :**

#### 1. Localisation Hindi

```typescript
// src/i18n/locales/hi/common.json
{
  "create_poll": "सर्वेक्षण बनाएं",
  "welcome": "स्वागत है",
  // ...
}
```

#### 2. Formats de dates Indiens

```typescript
import { format } from "date-fns";
import { hi } from "date-fns/locale";

format(new Date(), "PPP", { locale: hi });
// Output: "१० नवंबर २०२५"
```

#### 3. Support monétaire INR

```typescript
const priceINR = new Intl.NumberFormat("hi-IN", {
  style: "currency",
  currency: "INR",
}).format(499); // ₹499.00
```

#### 4. UPI payments

Le MoR (Lemon Squeezy / Paddle / Nexway) détecte automatiquement l'IP indienne et propose UPI comme méthode de paiement.

#### 5. Conformité DPDP Act 2023

**Ajout DPO email :**

```tsx
<Footer>
  <Link href="mailto:privacy@doodates.com">Data Protection Officer</Link>
</Footer>
```

**Logs de consentement :**

```typescript
await supabase.from("consent_logs").insert({
  user_id,
  consent_type: "marketing",
  granted: true,
  ip_address: req.headers["x-forwarded-for"],
  timestamp: new Date(),
});
```

**Métriques Phase 2 :**

- 500+ utilisateurs indiens
- Adoption paiements UPI > 60%
- Conformité DPDP validée par audit

---

## 7. Conformité Juridique

### Europe (RGPD)

#### Mise en œuvre obligatoire

**1. Privacy by Design**

- Minimisation des données collectées
- Chiffrement at rest (Supabase natif)
- Chiffrement in transit (HTTPS only)
- Pseudonymisation des données analytiques

**2. Gestion du consentement**

- Cookie banner (essentiels / analytics / marketing)
- Granularité des consentements
- Révocation facile
- Logs de consentement horodatés

**3. Droits des utilisateurs**

- Export de données (déjà implémenté via export JSON)
- Suppression de compte (à implémenter)
- Portabilité des données
- Rectification des données
- Opposition au traitement

**4. Documentation**

- Privacy Policy détaillée
- Terms of Service
- Cookie Policy
- Data Processing Agreement (DPA) pour B2B

**5. Sécurité**

- Authentification sécurisée (Supabase Auth)
- Rate limiting
- Logs d'accès
- Audit trails

### Inde (DPDP Act 2023)

#### Exigences clés

**1. Consentement vérifiable**

- Traçabilité des consentements (timestamp + IP)
- Langue claire et accessible
- Opt-in explicite (pas de pré-cochage)

**2. Pratiques de sécurité raisonnables**

- Mêmes mesures que RGPD
- Notification de breach < 72h

**3. Nomination DPO**

- Email de contact requis
- Réponse < 7 jours aux demandes

**4. Data Localization (si > certain seuil)**

- Potentiel : Supabase region Singapour/Mumbai
- Décision selon volume d'utilisateurs indiens

**5. Portée extraterritoriale**

- S'applique dès qu'on offre des services aux résidents indiens
- Peu importe où l'entreprise est basée

---

## 8. Stratégie Go-to-Market

### Méthodologie : Product-Led Growth (PLG)

**Principe :** Le produit lui-même est le moteur d'acquisition, de conversion et d'expansion.

### Moteur d'Acquisition : Growth Loop Virale

```
┌─────────────────────────────────────────────┐
│ HÔTE (Créateur)                              │
│ 1. Crée un sondage via IA                   │
│ 2. Partage à 100 répondants                 │
└─────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────┐
│ RÉPONDANTS (100 personnes)                   │
│ 3. Vivent une UX premium (design + IA)      │
│ 4. Voient "Créé avec DooDates"              │
└─────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────┐
│ CONVERSION                                   │
│ 5. X% des répondants → nouveaux hôtes       │
│ 6. Cycle se répète (viral exponential)      │
└─────────────────────────────────────────────┘
```

**Calcul K-factor :**

```
K = (Nombre d'invitations par utilisateur) × (Taux de conversion)

Exemple :
- 1 hôte invite 50 répondants en moyenne
- 3% des répondants deviennent hôtes
- K = 50 × 0.03 = 1.5 (croissance virale !)

Si K > 1 → Croissance auto-entretenue
Si K < 1 → Besoin d'acquisition payante
```

### Canaux d'Acquisition

**1. Product Hunt (Primaire)**

- Audience : Early adopters, tech-savvy
- Timing : Mardi-Jeudi (meilleur engagement)
- Objectif : Top 5 Product of the Day
- ROI : 500-2000 signups si succès

**2. Reddit (Secondaire)**

- Subreddits ciblés : r/SideProject, r/productivity, r/SaaS, r/Entrepreneur
- Approche : Apporter de la valeur AVANT de présenter l'outil
- Fréquence : 1 post par subreddit, espacés de 2-3 jours
- Objectif : 100-300 signups par campagne

**3. HackerNews (Tertiaire)**

- Approche : "Show HN" avec angle technique (ex: "Comment j'ai construit un survey builder IA conversationnel")
- Timing : Mardi-Jeudi matin US (9-11am PST)
- Objectif : Front page = 1000+ signups

**4. SEO Organique (Long-terme)**

- Mots-clés cibles : "AI survey builder", "conversational form", "survey tool", "poll creator"
- Content marketing : Blog posts comparatifs, guides, tutorials
- Backlinks : Guest posts, partnerships

**5. Bouche-à-oreille (Organique)**

- Amplificateur principal = Boucle virale
- Incentives : Programme de parrainage (Phase 2)
- Social proof : Testimonials, case studies

---

## 9. Risques & Mitigations

| Risque                              | Impact   | Probabilité | Mitigation                                                         |
| ----------------------------------- | -------- | ----------- | ------------------------------------------------------------------ |
| **Concurrents copient l'IA**        | Élevé    | Haute       | Exécution rapide + boucle virale agressive + amélioration continue |
| **Conformité fiscale mal gérée**    | Critique | Moyenne     | MoR (Lemon Squeezy / Paddle / Nexway) = élimine 100% du risque     |
| **Coûts IA explosent**              | Élevé    | Moyenne     | Quotas stricts (déjà implémentés) + rate limiting serveur          |
| **Product Hunt flop**               | Moyen    | Moyenne     | Préparation 2 semaines + communauté engagée + backup Reddit        |
| **i18n incomplet au lancement**     | Moyen    | Haute       | Checklist stricte + tests E2E multi-locales + review natif         |
| **Boucle virale inefficace (K<1)**  | Élevé    | Moyenne     | A/B tests branding + CTA optimization + incentives parrainage      |
| **RGPD non-conformité = amendes**   | Critique | Faible      | Audit par expert + iubenda + Plausible (GDPR-friendly)             |
| **Timezone confusion utilisateurs** | Moyen    | Haute       | Warnings clairs + sélecteur timezone + tests internationaux        |

---

## 10. Métriques de Succès

### KPIs Phase 1 (US/EU - Mois 0-3)

**Acquisition :**

- Inscriptions : 1000+ utilisateurs
- Sources : Product Hunt 40% / Reddit 25% / Viral 20% / Autre 15%
- Coût acquisition (CAC) : < 5€ (objectif PLG)

**Activation :**

- Utilisateurs créant 1er sondage : 70%+
- Temps jusqu'au 1er sondage : < 5 min
- Sondages partagés : 60%+

**Viral :**

- K-factor : > 1.2
- Clics sur branding "Created with DooDates" : 5%+
- Conversion répondant → créateur : 3%+

**Monétisation :**

- Conversion Freemium → Payant : 5-10%
- ARPU (Average Revenue Per User) : 1-2€
- LTV/CAC ratio : > 3

**Engagement :**

- WAU (Weekly Active Users) : 40%+
- Rétention J7 : 60%+
- Rétention J30 : 40%+

**Satisfaction :**

- NPS (Net Promoter Score) : > 50
- Bugs critiques : < 5 par mois
- Temps réponse support : < 24h

### KPIs Phase 2 (Inde - Mois 4-9)

**Acquisition :**

- Utilisateurs indiens : 500+
- Croissance MoM : 20%+

**Localisation :**

- Adoption langue Hindi : 60%+
- Paiements UPI : 60%+ des transactions indiennes

**Conformité :**

- Audit DPDP Act : Conformité 100%
- Incidents de sécurité : 0

### KPIs Globaux (Mois 9-12)

**Scale :**

- Utilisateurs totaux : 5000+
- Pays actifs : 10+
- Langues supportées : 3+ (EN, FR, HI)

**Business :**

- MRR (Monthly Recurring Revenue) : 2000€+
- Burn rate : < 500€/mois
- Runway : > 12 mois

---

## 11. Prochaines Actions Immédiates

### Cette Semaine (10-16 Nov 2025)

#### Priorité 1 : Décision MoR

- [ ] **Investigation Nexway (2h)**
  - [ ] Contacter Nexway (via contact Guillaume Hulin si possible)
  - [ ] Obtenir documentation technique complète
  - [ ] Obtenir structure de pricing détaillée
  - [ ] Vérifier support in-app et exemples d'intégration
  - [ ] Évaluer support français vs international
- [ ] **Comparaison approfondie (2h)**
  - [ ] Créer compte Lemon Squeezy (1h)
  - [ ] Explorer dashboard et configuration Lemon Squeezy
  - [ ] Lire documentation API Lemon Squeezy
  - [ ] Comparer avec Nexway sur critères techniques/business
- [ ] **Décision finale (1h)**
  - [ ] Décision finale : Lemon Squeezy vs Paddle vs Nexway
  - [ ] Justification basée sur critères objectifs

#### Priorité 2 : Setup i18n

- [ ] Installer react-i18next (30 min)
- [ ] Créer structure fichiers locales/ (1h)
- [ ] Migrer 5 composants prioritaires (4h)
- [ ] Tests basiques (1h)

#### Priorité 3 : Boucle Virale MVP

- [ ] Ajouter footer branding sur Vote.tsx (1h)
- [ ] Ajouter CTA "Créer mon sondage" (30 min)
- [ ] Tests visuels desktop + mobile (30 min)

**Temps total estimé :** 11-12h (ajout investigation Nexway)

### Semaine Prochaine (17-23 Nov 2025)

- [ ] Compléter migration i18n (tous composants)
- [ ] Intégrer MoR backend (Lemon Squeezy / Paddle / Nexway selon décision)
- [ ] Cookie consent banner
- [ ] Privacy Policy (via iubenda)
- [ ] Tests E2E multi-locales

**Temps total estimé :** 20-25h (selon solution MoR choisie)

---

## 12. Conclusion

### Forces de la Stratégie

✅ Approche méthodique et séquencée  
✅ Priorités claires (i18n, MoR, boucle virale)  
✅ Risques identifiés et mitigés  
✅ Métriques mesurables  
✅ Stack technique adaptée

### Points de Vigilance

⚠️ Dépendance critique à la boucle virale (K-factor)  
⚠️ Exécution rapide nécessaire (concurrents peuvent copier l'IA)  
⚠️ Conformité juridique multijuridictionnelle  
⚠️ Gestion timezones complexe

### Recommandation Finale

**Lancer Phase 0 immédiatement** (3 semaines de préparation intensive) puis **Phase 1 début décembre 2025** avec :

1. Application 100% EN/FR
2. Paiements MoR fonctionnels (Lemon Squeezy / Paddle / Nexway selon décision)
3. Boucle virale active
4. Conformité RGPD complète

**Ne PAS attendre** la perfection. Lancer avec Phase 1 (US/EU) et itérer rapidement basé sur feedback.

---

**Document maintenu par :** Équipe DooDates  
**Dernière mise à jour :** 10 Novembre 2025  
**Prochaine revue :** 17 Novembre 2025
