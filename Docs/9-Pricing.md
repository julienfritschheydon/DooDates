# DooDates - Quotas & Pricing - Spécification Finale
**Date:** 3 novembre 2025  
**Version:** 1.1  
**Statut:** ALIGNÉ AVEC IMPLÉMENTATION

> ⚠️ **Note importante** : Cette spécification décrit le système de **crédits IA** prévu pour la version future.  
> **Implémentation actuelle (v0.1 Beta)** : Système simplifié basé sur **conversations IA** (voir section "État actuel" ci-dessous)

---

## 🎯 ÉTAT ACTUEL (Implémentation v0.1 Beta)

### Quotas Simplifiés

| Tier | Prix | Conversations IA | Messages IA | Analytics IA | Support |
|------|------|------------------|-------------|--------------|---------|
| **Invité** | 0€ | 5 (lifetime) | 10/conv | 5/jour | ❌ |
| **Gratuit** | 0€ | 1000 | 100/mois | 50/jour | Non garanti |
| **Beta Tester** | 0€ (clé) | 1000 | 100/mois | 50/jour | Prioritaire ✅ |

**Source de vérité** : `src/constants/quotas.ts`

### Définitions (v0.1)

**Conversation IA** : Une session de création de sondage avec l'IA  
- ✅ Compte : Créer un nouveau sondage via chat IA
- ❌ Ne compte PAS : Modifications, création manuelle

**Message IA** : Chaque message envoyé à l'IA (création ou modification)  
**Analytics IA** : Questions posées à l'IA sur vos résultats  

---

## 🚀 SYSTÈME CIBLE (Version future avec paiements)

### Vue d'ensemble

| Tier | Prix | Crédits IA | Sondages max | Support | Rollover |
|------|------|------------|--------------|---------|----------|
| **Invité** | 0€ | 5 (lifetime) | 0 (preview) | ❌ | ❌ |
| **Gratuit** | 0€ | 20/mois | 20 total | Non garanti | ❌ |
| **Premium** | 9€/mois | 100/mois | 100 total | 7 jours | Annuel |
| **Pro** | 29€/mois | 1000/mois | Illimité | 2 jours | Annuel |
| **Beta Tester** | 0€ (clé) | 1000/mois | Illimité | Prioritaire | ✅ |

---

## 💳 SYSTÈME DE CRÉDITS IA

### Principe

**1 crédit IA = 1 action IA**, quelle que soit l'action:

| Action | Coût |
|--------|------|
| 1 message chat création | 1 crédit |
| 1 query analytics IA | 1 crédit |
| 1 insight auto-généré | 1 crédit |
| 1 simulation complète | 5 crédits |

**Rationale:** Simplicité maximale pour l'utilisateur. Il n'a pas à comprendre la différence entre types d'actions.

### Coûts API réels (Version future avec crédits)

| Tier | Prix | Crédits | Coût API estimé | Marge |
|------|------|---------|-----------------|-------|
| **Invité** | 0€ | 5 | ~$0.0025 | N/A (gratuit) |
| **Gratuit** | 0€ | 20/mois | ~$0.01 | N/A (gratuit) |
| **Premium** | 9€/mois | 100/mois | ~$0.05 | **99.4%** (8.95€) |
| **Pro** | 29€/mois | 1000/mois | ~$0.50 | **98.3%** (28.50€) |
| **Beta Tester** | 0€ | 1000/mois | ~$0.50 | Investment |

**Calcul :**
- 1 crédit moyen ≈ $0.0005 (500 tokens input + 150 tokens output)
- Premium : 100 crédits × $0.0005 = $0.05 → Marge : (9€ - $0.05) / 9€ = **99.4%**
- Pro : 1000 crédits × $0.0005 = $0.50 → Marge : (29€ - $0.50) / 29€ = **98.3%**

**Conclusion :** Marges excellentes (>98%), coût API négligeable. Beta testeurs = investissement acquisition validé.

---

## 🎯 TIERS DÉTAILLÉS

### 1. INVITÉ (0€)

**Objectif:** Teaser produit, conversion compte gratuit

```
Limites:
├─ 5 crédits IA (lifetime, non-persistent)
├─ Preview sondage uniquement
├─ Pas de sauvegarde (mémoire React state)
└─ Pas de dashboard

Workflow:
1. Utilisateur arrive → Chat IA disponible
2. Peut envoyer 5 messages max
3. IA génère sondage (preview)
4. Blocage sauvegarde → CTA signup
```

**Protection anti-abus:**
- Pas de localStorage → Refresh = reset
- Limite stricte 5 messages
- Rate limiting IP: 10 essais/jour max

**Coût réel:** 5 × $0.0005 = $0.0025/visiteur (négligeable)

---

### 2. GRATUIT (0€)

**Objectif:** Acquisition massive, découverte produit

```
Quotas:
├─ 20 crédits IA/mois (reset 1er du mois)
├─ 20 sondages max total (suppressibles pour libérer)
├─ Export 4 formats (CSV, PDF, JSON, Markdown)
├─ Dashboard complet
├─ Partage illimité
└─ Support communauté (non garanti)

Limitations:
├─ Pas de customisation
├─ Pas d'intégrations
├─ Pas de rollover crédits
└─ Branding DooDates présent
```

**Usage type:**
```
20 crédits = 
  • 2 sondages IA (10 msg) = 10 crédits
  • 5 analytics queries = 5 crédits
  • 1 simulation = 5 crédits
  
OU
  • 4 sondages IA (20 msg) = 20 crédits
  • Pas d'analytics/simulation
```

**Coût réel:** ~$0.01/mois/utilisateur

---

### 3. PREMIUM (9€/mois OU 99€/an)

**Objectif:** Utilisateurs réguliers, professionnels indépendants

```
Quotas:
├─ 100 crédits IA/mois
├─ 100 sondages max total (suppressibles)
├─ Export 6 formats (+Excel, +Google Sheets)
├─ Customisation basique (couleurs, logo)
├─ Support email sous 7 jours
└─ Rollover annuel: 1200 crédits/an

Avantages annuel (99€):
├─ Économie: 10% (9€×12 = 108€)
├─ Rollover: 1200 crédits accumulables
└─ Facturation unique annuelle
```

**Usage type:**
```
100 crédits = 
  • 10 sondages IA (50 msg) = 50 crédits
  • 30 analytics queries = 30 crédits
  • 4 simulations = 20 crédits
  
→ ~10 sondages/mois, usage confortable
```

**Coût réel:** ~$0.05/mois → **Marge 99.4%**

---

### 4. PRO (29€/mois OU 299€/an)

**Objectif:** Agences, power users, entreprises

```
Quotas:
├─ 1000 crédits IA/mois
├─ Sondages ILLIMITÉS
├─ Export tous formats
├─ Customisation complète + domaine perso
├─ Intégrations (Slack, Zapier, API, Webhooks)
├─ White-label disponible
├─ Support email sous 2 jours
└─ Rollover annuel: 12000 crédits/an

Avantages annuel (299€):
├─ Économie: 15% (29€×12 = 348€)
├─ Rollover: 12000 crédits accumulables
└─ Facturation unique annuelle
```

**Usage type:**
```
1000 crédits = 
  • 80 sondages IA (400 msg) = 400 crédits
  • 400 analytics queries = 400 crédits
  • 40 simulations = 200 crédits
  
→ ~80 sondages/mois, usage intensif
```

**Coût réel:** ~$0.50/mois → **Marge 98.3%**

---

### 5. 🎁 BETA TESTER (Clé d'accès)

**Objectif:** Early adopters, feedback qualité, testimonials

```
Quotas (équivalent Pro):
├─ 1000 crédits IA/mois
├─ Sondages ILLIMITÉS
├─ Toutes les features Pro
├─ Support prioritaire (Discord dédié)
└─ Rollover 3 mois (3000 crédits)

Spécificités:
├─ Badge "Beta Tester" dans l'app
├─ Accès features expérimentales en avant-première
├─ Canal feedback direct développeurs
├─ Durée: 3 mois puis conversion automatique Gratuit
└─ Option upgrade payant avec réduction 50% (4.50€/mois)

Contreparties:
├─ Feedback régulier (questionnaire mensuel)
├─ Report bugs détaillés
├─ Participation tests A/B
└─ Témoignage optionnel (site/réseaux sociaux)
```

**Activation:**
```
1. Créer compte DooDates
2. Aller dans Paramètres → Clé Beta
3. Entrer code: BETA-XXXX-XXXX-XXXX
4. Activation immédiate
```

**Coût réel pour 20 beta testeurs:**
- 20 × 1000 crédits × $0.0005 = $10/mois
- **ROI attendu:** 
  - 10+ testimonials (valeur: 500€+ en marketing)
  - 50+ bugs identifiés (économie: 2000€+ en QA)
  - 5+ conversions payantes post-bêta (45€+)

---

## 🔑 SYSTÈME CLÉS BETA TESTEURS

### Architecture technique

```typescript
// Database schema
CREATE TABLE beta_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL, -- Format: BETA-XXXX-XXXX-XXXX
  
  -- Statut
  status TEXT NOT NULL CHECK (status IN ('active', 'used', 'expired', 'revoked')),
  
  -- Quotas accordés
  credits_monthly INT DEFAULT 1000,
  max_polls INT DEFAULT 999999, -- Illimité
  duration_months INT DEFAULT 3,
  
  -- Attribution
  assigned_to UUID REFERENCES auth.users(id),
  redeemed_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  
  -- Metadata
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  notes TEXT, -- Ex: "Testeur recommandé par Pierre"
  
  -- Tracking
  last_feedback_at TIMESTAMPTZ,
  bugs_reported INT DEFAULT 0,
  feedback_score INT -- 1-5
);

-- Index
CREATE INDEX idx_beta_keys_code ON beta_keys(code);
CREATE INDEX idx_beta_keys_status ON beta_keys(status);
CREATE INDEX idx_beta_keys_assigned_to ON beta_keys(assigned_to);
```

### Génération de clés

```typescript
// src/lib/admin/BetaKeyGenerator.ts
import { nanoid } from 'nanoid';

export function generateBetaKey(): string {
  // Format: BETA-XXXX-XXXX-XXXX (alphanumérique, pas de confusion)
  const alphabet = '0123456789ABCDEFGHJKLMNPQRSTUVWXYZ'; // Sans I, O pour éviter confusion
  const segment1 = nanoid(4, alphabet);
  const segment2 = nanoid(4, alphabet);
  const segment3 = nanoid(4, alphabet);
  
  return `BETA-${segment1}-${segment2}-${segment3}`;
}

export async function createBetaKeys(count: number, notes?: string): Promise<string[]> {
  const keys: string[] = [];
  
  for (let i = 0; i < count; i++) {
    const code = generateBetaKey();
    
    await supabase.from('beta_keys').insert({
      code,
      status: 'active',
      credits_monthly: 1000,
      max_polls: 999999,
      duration_months: 3,
      expires_at: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 3 mois
      notes,
    });
    
    keys.push(code);
  }
  
  return keys;
}
```

### Redemption (utilisation clé)

```typescript
// src/services/BetaKeyService.ts
export class BetaKeyService {
  async redeemKey(userId: string, code: string): Promise<Result<void>> {
    // 1. Vérifier que la clé existe et est active
    const { data: key, error } = await supabase
      .from('beta_keys')
      .select('*')
      .eq('code', code)
      .eq('status', 'active')
      .single();
    
    if (error || !key) {
      return { success: false, error: 'Clé invalide ou déjà utilisée' };
    }
    
    // 2. Vérifier que l'utilisateur n'a pas déjà une clé
    const { data: existingKey } = await supabase
      .from('beta_keys')
      .select('id')
      .eq('assigned_to', userId)
      .single();
    
    if (existingKey) {
      return { success: false, error: 'Vous avez déjà activé une clé beta' };
    }
    
    // 3. Activer la clé
    await supabase
      .from('beta_keys')
      .update({
        status: 'used',
        assigned_to: userId,
        redeemed_at: new Date(),
      })
      .eq('id', key.id);
    
    // 4. Upgrader l'utilisateur vers tier beta
    await supabase
      .from('user_quotas')
      .update({
        tier: 'beta',
        credits_total: 1000,
        credits_remaining: 1000,
        max_polls: 999999,
        period_end: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
      })
      .eq('user_id', userId);
    
    // 5. Log événement
    await logEvent('beta_key_redeemed', { userId, code });
    
    return { success: true };
  }
}
```

### UI Activation clé

```typescript
// src/components/settings/BetaKeyRedemption.tsx
export function BetaKeyRedemption() {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const handleRedeem = async () => {
    setLoading(true);
    setError('');
    
    const result = await betaKeyService.redeemKey(user.id, code);
    
    if (result.success) {
      toast.success('🎉 Clé Beta activée ! Vous avez maintenant 1000 crédits/mois.');
      router.push('/dashboard');
    } else {
      setError(result.error);
    }
    
    setLoading(false);
  };
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>🎁 Clé Beta Testeur</CardTitle>
        <CardDescription>
          Vous avez reçu une clé d'accès beta ? Activez-la ici.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex gap-2">
          <Input
            placeholder="BETA-XXXX-XXXX-XXXX"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            maxLength={19}
          />
          <Button onClick={handleRedeem} disabled={loading || code.length < 19}>
            {loading ? 'Activation...' : 'Activer'}
          </Button>
        </div>
        {error && <p className="text-red-600 mt-2">{error}</p>}
      </CardContent>
    </Card>
  );
}
```

### Dashboard Admin - Génération clés

```typescript
// src/pages/admin/BetaKeys.tsx
export function AdminBetaKeys() {
  const [keys, setKeys] = useState<BetaKey[]>([]);
  const [generating, setGenerating] = useState(false);
  
  const generateKeys = async (count: number, notes: string) => {
    setGenerating(true);
    const newKeys = await createBetaKeys(count, notes);
    setKeys([...keys, ...newKeys]);
    
    // Télécharger CSV
    downloadCSV(newKeys, 'beta-keys.csv');
    
    setGenerating(false);
  };
  
  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-8">Gestion Clés Beta</h1>
      
      {/* Formulaire génération */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Générer nouvelles clés</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Input type="number" placeholder="Nombre de clés" />
            <Input placeholder="Notes (optionnel)" />
            <Button onClick={() => generateKeys(10, 'Batch Nov 2025')}>
              Générer 10 clés
            </Button>
          </div>
        </CardContent>
      </Card>
      
      {/* Liste clés existantes */}
      <Card>
        <CardHeader>
          <CardTitle>Clés générées ({keys.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Code</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>Utilisateur</TableHead>
                <TableHead>Activée le</TableHead>
                <TableHead>Expire le</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {keys.map(key => (
                <BetaKeyRow key={key.id} betaKey={key} />
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
```

---

## 🛒 PACKS CRÉDITS ADDITIONNELS

**Disponibles pour tous les tiers (sauf Beta):**

| Pack | Prix | Prix/crédit | Validité |
|------|------|-------------|----------|
| 50 crédits | 3€ | 0.06€ | 6 mois |
| 100 crédits | 5€ | 0.05€ | 6 mois |
| 500 crédits | 20€ | 0.04€ | 6 mois |

**Cas d'usage:**
```
Utilisateur Premium (100 crédits/mois):
├─ Pic activité: Besoin 150 crédits
├─ Achète pack 50 → 3€
└─ Total mois: 12€ (vs upgrade Pro 29€)
```

**Marges:** 98-99% (coût API: $0.025-0.25)

**Note:** Beta testeurs n'ont pas besoin de packs (quotas déjà élevés)

---

## 🔄 SYSTÈME ROLLOVER ANNUEL

### Principe

**Uniquement abonnements annuels** (Premium 99€, Pro 299€):

```
Premium Annuel (99€):
├─ Budget: 1200 crédits/an (100×12)
├─ Usage flexible sur 12 mois
└─ Crédits non utilisés = perdus fin année

Exemple:
├─ Janvier: 80 crédits → Reste 1120
├─ Février: 120 crédits → Reste 1000
├─ Mars: 50 crédits → Reste 950
└─ Avril (pic): 300 crédits → Reste 650
```

**Beta testeurs:** Rollover 3 mois (3000 crédits sur période beta)

---

## 📊 BREAK-EVEN & PROJECTIONS

### Coûts mensuels

```
Infrastructure:
├─ Vercel Pro: 20€
├─ Supabase Pro: 25€
├─ Gemini API: 10-30€ (variable)
├─ Resend Email: 20€
├─ Monitoring: 10€
└─ Analytics: 5€
    TOTAL: ~91€/mois

+ 50 utilisateurs gratuits actifs: 7.50€ API
+ 20 beta testeurs: 10€ API
= TOTAL: ~108€/mois
```

### Break-even

```
Besoin de:
├─ 12 Premium (12×9 = 108€) → break-even
├─ OU 4 Pro (4×29 = 116€) → rentable
└─ OU mix: 7 Premium + 2 Pro = 121€
```

**Avec beta testeurs (objectif mois 3-6):**
- 5 conversions beta → Premium = 45€
- 10 Premium autres sources = 90€
- **Total: 135€ → Rentable**

---

## 📋 PLAN BETA TESTEURS

### Objectifs

**Quantitatifs:**
- 20 beta testeurs recrutés (mois 1)
- 100+ sondages créés (collectif)
- 50+ bugs identifiés et résolus
- 10+ testimonials collectés
- 25% conversion payante post-bêta (5 utilisateurs)

**Qualitatifs:**
- Validation product-market fit
- Identification features critiques manquantes
- Optimisation onboarding
- Calibration quotas freemium

---

### Sélection beta testeurs

**Profils recherchés:**
1. **Power users** (5 personnes)
   - Créent 5+ sondages/semaine
   - Usage intensif analytics
   - Feedback technique détaillé

2. **Professionnels** (8 personnes)
   - RH, Event managers, Product managers
   - Cas d'usage B2B
   - Potentiel conversion Pro

3. **Early tech adopters** (7 personnes)
   - Actifs réseaux sociaux
   - Partagent découvertes
   - Testimonials authentiques

**Critères exclusion:**
- Inactifs > 1 semaine
- Pas de feedback malgré relances
- Abus quotas (spam, tests inutiles)

---

### Recrutement

**Canaux:**
```
1. Réseau personnel (10 clés)
   ├─ Amis utilisateurs Doodle/Typeform
   ├─ Collègues organisateurs événements
   └─ Famille (test grand public)

2. Reddit (5 clés)
   ├─ r/SideProject (post "Looking for beta testers")
   ├─ r/productivity
   └─ r/SaaS

3. LinkedIn (3 clés)
   ├─ Post avec formulaire candidature
   └─ Sélection profils pertinents

4. Twitter/X (2 clés)
   └─ Thread + lien formulaire
```

**Formulaire candidature:**
- Nom, email, profil (perso/pro)
- Fréquence création sondages estimée
- Outils actuels utilisés (Doodle, Typeform, etc.)
- Motivation (pourquoi tester DooDates?)
- Engagement feedback (oui/non)

---

### Onboarding beta testeurs

**Email bienvenue:**
```
Sujet: 🎉 Bienvenue dans la bêta DooDates !

Bonjour [Prénom],

Merci d'avoir accepté de tester DooDates en avant-première !

🎁 Votre clé beta: BETA-XXXX-XXXX-XXXX

Ce que vous obtenez:
✓ 1000 crédits IA/mois (3 mois)
✓ Toutes les fonctionnalités Pro
✓ Support prioritaire Discord
✓ Accès features expérimentales

Ce qu'on attend de vous:
• Créer 5+ sondages durant la bêta
• Reporter bugs via le formulaire in-app
• Répondre au questionnaire mensuel (5 min)
• (Optionnel) Témoignage si vous aimez le produit

Comment activer:
1. Créez votre compte: https://doodates.com/signup
2. Paramètres → Clé Beta → Entrez votre code
3. Commencez à créer !

Questions ? Rejoignez notre Discord: [lien]

Julien, fondateur DooDates
```

**Discord privé beta:**
- Canal #annonces (updates produit)
- Canal #bugs (reports)
- Canal #feedback (discussions)
- Canal #showcase (partage créations)

---

### Suivi & engagement

**Semaine 1:**
- Email rappel: "Avez-vous activé votre clé?"
- Message Discord: "Présentez-vous!"
- Premier questionnaire: Première impression

**Semaine 2:**
- Check activité (ont-ils créé un sondage?)
- Relance inactifs
- Highlight feature: Analytics IA

**Semaine 4:**
- Questionnaire mi-parcours
- Interview 1-on-1 avec 5 power users
- Identification bugs critiques

**Semaine 8:**
- Questionnaire final
- Demande testimonials
- Annonce conversion (réduction 50% si upgrade)

**Semaine 12 (fin bêta):**
- Conversion automatique vers Gratuit
- Email offre exclusive: Premium 4.50€/mois (6 mois)
- Remerciements + badge "Early Supporter"

---

## 🚀 IMPLÉMENTATION

### Phase 1: Système clés beta (1 jour)

**Backend:**
- [ ] Migration SQL: Table `beta_keys`
- [ ] Function `generate_beta_key()`
- [ ] Function `redeem_beta_key(user_id, code)`
- [ ] RLS policies

**Frontend:**
- [ ] Service `BetaKeyService.ts`
- [ ] Composant `BetaKeyRedemption.tsx` (Settings)
- [ ] Badge "Beta Tester" dans TopBar
- [ ] Page admin `/admin/beta-keys`

**Tests:**
- [ ] Génération 100 clés (performance)
- [ ] Redemption valide
- [ ] Erreurs (clé invalide, déjà utilisée)

---

### Phase 2: Mode invité limité (2 jours)

**Objectif:** Permettre essai IA sans compte, mais bloquer sauvegarde

- [ ] Hook `useGuestTrial` (5 crédits max, mémoire React)
- [ ] Modifier `GeminiChatInterface.tsx` pour intégrer limite
- [ ] Bloquer sauvegarde dans `PollEditor.tsx` si !user
- [ ] Modal `AuthIncentiveModal` avec bénéfices signup
- [ ] Tests E2E: Workflow invité complet

---

### Phase 3: Système crédits unifiés (3 jours)

**Backend (Supabase):**
- [ ] Migration SQL: Table `user_quotas`
- [ ] Function `consume_credits(user_id, amount)`
- [ ] Function `reset_monthly_quotas()` + cron job
- [ ] Support tier `beta` dans quotas
- [ ] RLS policies

**Frontend:**
- [ ] Service `QuotaService.ts`
- [ ] Hook `useCredits()` unifié
- [ ] Modifier tous les appels IA pour consommer crédits
- [ ] Indicateur crédits dans TopBar: "42/100 crédits"
- [ ] Modal upgrade quand quota atteint

---

### Phase 4: UI Pricing page (2 jours)

- [ ] Route `/pricing` dans routing
- [ ] Composant `PricingPage.tsx`
- [ ] Composants cards, FAQ, etc.
- [ ] Responsive mobile
- [ ] Lien "Pricing" dans TopBar

---

## ✅ CHECKLIST LANCEMENT BETA

### Technique
- [ ] Tables DB créées (quotas, beta_keys)
- [ ] Système clés fonctionnel
- [ ] 20 clés générées et testées
- [ ] Mode invité (5 crédits)
- [ ] Système crédits unifiés
- [ ] Badge "Beta Tester" visible
- [ ] Discord serveur créé

### Communication
- [ ] Email template bienvenue
- [ ] Formulaire candidature beta
- [ ] Posts recrutement (Reddit, LinkedIn, Twitter)
- [ ] Page `/beta` expliquant le programme
- [ ] FAQ beta testeurs

### Suivi
- [ ] Analytics tracking (activation clés, usage)
- [ ] Questionnaires préparés (Semaine 1, 4, 8, 12)
- [ ] Calendrier relances
- [ ] Scripts support (réponses questions fréquentes)

---

## 📞 SUPPORT & FAQ

### Questions fréquentes

**Q: Qu'est-ce qu'un crédit IA ?**
- 1 crédit = 1 action IA (message chat, query analytics, ou 1/5 de simulation). Utilisez-les comme vous voulez !

**Q: Les crédits expirent ?**
- Oui, chaque mois pour les plans mensuels. Mais avec un abonnement annuel, vos crédits s'accumulent sur 12 mois !
- Beta testeurs: Rollover sur 3 mois

**Q: Puis-je changer de plan ?**
- Oui, à tout moment ! Upgrade immédiat, downgrade effectif à la fin de la période en cours.

**Q: Que se passe-t-il si je dépasse ?**
- Pas de surcharge surprise ! Vous pouvez acheter des packs de crédits additionnels ou upgrader votre plan.

**Q: Comment devenir beta testeur ?**
- Le programme est actuellement complet. Inscrivez-vous à la waitlist: [lien]

**Q: Que se passe-t-il après les 3 mois de bêta ?**
- Vous repassez automatiquement en plan Gratuit (20 crédits/mois)
- Offre exclusive: Premium à 4.50€/mois pendant 6 mois (50% off)
- Badge "Early Supporter" permanent

---

**Dernière mise à jour:** 3 novembre 2025  
**Prochaine révision:** Janvier 2026 (après 2 mois bêta)

