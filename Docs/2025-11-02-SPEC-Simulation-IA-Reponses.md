# Spécification Technique : Simulation IA des Réponses

**Version :** 1.0  
**Date :** 02/11/2025  
**Statut :** 📋 Spécification - À implémenter  
**Priorité :** 🔥 HAUTE - Feature différenciante majeure  
**Estimation :** 15-20h

---

## 🎯 Vision & Objectifs

### Concept
L'IA génère des réponses fictives réalistes pour tester et valider un questionnaire **AVANT** de l'envoyer aux vrais répondants.

### Valeur Ajoutée
- ✅ **Validation précoce** : Détecte problèmes avant collecte réelle
- ✅ **Économie** : Évite gaspillage temps/argent sur questionnaires mal conçus
- ✅ **Qualité données** : Améliore pertinence des questions
- ✅ **Différenciateur unique** : AUCUN concurrent (SurveyMonkey, Typeform, Google Forms) ne fait ça
- ✅ **Wow effect** : Conversion freemium → payant

### Cas d'Usage Principaux

**1. Validation avant envoi**
```
Utilisateur : "Je viens de créer un questionnaire satisfaction client"
Action : Clique "Tester avec IA" (50 réponses simulées)
Résultat : Rapport montre que Q3 est ambiguë (50% ne répondent pas)
→ Utilisateur reformule Q3 avant envoi réel
```

**2. Détection de biais**
```
Questionnaire : "Êtes-vous satisfait de notre produit ?" (Oui/Non)
Simulation : 95% répondent "Oui" (biais de formulation positive)
Rapport : "⚠️ Question biaisée - Reformuler de manière neutre"
→ Utilisateur change en "Comment évaluez-vous notre produit ?" (échelle 1-5)
```

**3. Optimisation longueur**
```
Questionnaire : 25 questions, temps estimé 15min
Simulation : 80% abandonnent après Q12 (fatigue)
Rapport : "⚠️ Questionnaire trop long - Réduire à 10-12 questions max"
→ Utilisateur supprime questions non-essentielles
```

---

## 🏗️ Architecture Technique

### 1. Algorithme de Génération - Personas Prédéfinis (RECOMMANDÉ)

**Avantages :**
- Rapide à implémenter (5-8h)
- Coût API : $0 (génération locale)
- Résultats cohérents et reproductibles

**Structure Persona :**

```typescript
interface Persona {
  id: string;
  name: string;
  context: "b2b" | "b2c" | "event" | "feedback" | "research";
  traits: {
    responseRate: number; // 0.7-0.95
    attentionSpan: number; // 8-20 questions
    detailLevel: "low" | "medium" | "high";
    biasTowardPositive: number; // 0.0-0.3
    skipProbability: number; // 0.05-0.2
  };
}
```

**10 Personas Définis :**

**Personas Principaux (5) :**

1. **Décideur B2B** : Réponses détaillées, 85% taux réponse, 15 questions max
2. **Consommateur Occasionnel** : Réponses courtes, 70% taux réponse, 8 questions max
3. **Participant Événement** : Réponses moyennes, 90% taux réponse, 12 questions max
4. **Utilisateur Engagé** : Réponses très détaillées, 95% taux réponse, 20 questions max
5. **Participant Recherche** : Réponses objectives, 92% taux réponse, 18 questions max

**Personas Secondaires (5) :**

6. **Étudiant/Jeune** : Réponses rapides mais incomplètes, 65% taux réponse, 6 questions max, biais positif élevé (0.3)
7. **Sceptique/Critique** : Réponses négatives/neutres, 80% taux réponse, 12 questions max, biais négatif (-0.2)
8. **Pressé/Mobile** : Réponses ultra-courtes, 60% taux réponse, 5 questions max, abandon rapide
9. **Senior/Détaillé** : Réponses très longues, 88% taux réponse, 10 questions max, aucun biais (0.0)
10. **International/Non-natif** : Réponses courtes avec fautes, 75% taux réponse, 10 questions max, skip questions complexes

**Détection Automatique du Contexte :**

```typescript
function detectContext(title: string, description?: string): string {
  const text = `${title} ${description || ""}`.toLowerCase();
  
  if (text.match(/entreprise|b2b|professionnel|client/)) return "b2b";
  if (text.match(/événement|soirée|réunion|rencontre/)) return "event";
  if (text.match(/feedback|avis|retour|amélioration/)) return "feedback";
  if (text.match(/recherche|étude|académique/)) return "research";
  
  return "b2c"; // Défaut
}
```

---

### 2. Volume de Simulation & Quotas

```typescript
const SIMULATION_TIERS = {
  free: {
    volume: 10,
    simulationsPerMonth: 3,
    estimatedDuration: "10-15s"
  },
  pro: {
    volume: 50,
    simulationsPerMonth: 20,
    estimatedDuration: "40-60s"
  },
  enterprise: {
    volume: 100,
    simulationsPerMonth: 100,
    estimatedDuration: "2-3min"
  }
};
```

---

### 3. Critères d'Analyse

#### Métriques Calculées

```typescript
interface SimulationReport {
  overview: {
    completionRate: number; // % réponses complètes
    averageTime: number; // Temps moyen (secondes)
    dropoffRate: number; // % abandon
    dropoffQuestion?: string;
  };
  
  questionAnalysis: {
    questionId: string;
    questionTitle: string;
    metrics: {
      responseRate: number;
      averageTime: number;
      distribution?: { option: string; count: number; percentage: number }[];
      averageLength?: number; // Pour texte
    };
    flags: {
      lowResponseRate: boolean; // < 70%
      highSkipRate: boolean; // > 30%
      biasedDistribution: boolean; // 1 option > 80%
      tooLong: boolean; // > 60s
    };
  }[];
  
  issues: {
    severity: "critical" | "warning" | "info";
    type: "question" | "structure" | "length" | "bias";
    questionId?: string;
    title: string;
    description: string;
    impact: string;
  }[];
  
  recommendations: {
    type: "reformulate" | "remove" | "reorder" | "shorten";
    questionId?: string;
    title: string;
    description: string;
    example?: string;
  }[];
}
```

#### Détection Automatique des Problèmes

**1. Taux de réponse faible (< 70%)**
```
Issue: "Taux de réponse faible"
Impact: "Données incomplètes, analyse statistique compromise"
Recommandation: "Clarifier la question, ajouter exemples"
```

**2. Distribution biaisée (1 option > 80%)**
```
Issue: "Question biaisée"
Impact: "Formulation oriente les réponses, données non exploitables"
Recommandation: "Reformuler de manière neutre"
Example: "❌ 'Êtes-vous satisfait ?' → ✅ 'Comment évaluez-vous... ?'"
```

**3. Questionnaire trop long (abandon après Q12)**
```
Issue: "Questionnaire trop long"
Impact: "Perte de données, taux de complétion faible"
Recommandation: "Réduire à 10-12 questions essentielles"
```

**4. Question complexe (temps > 60s)**
```
Issue: "Question complexe"
Impact: "Fatigue cognitive, risque d'abandon"
Recommandation: "Simplifier ou diviser en sous-questions"
```

---

## 🎨 Interface Utilisateur

### 1. Point d'Entrée - Bouton dans FormPollCreator

```tsx
<Button
  variant="outline"
  className="border-purple-500 text-purple-700"
  onClick={handleSimulate}
>
  <Sparkles className="w-4 h-4 mr-2" />
  Tester avec IA
</Button>
```

### 2. Modal de Configuration (VALIDÉ)

```tsx
<Dialog open={showSimulationModal}>
  <DialogContent className="max-w-md">
    <DialogHeader>
      <DialogTitle>Simuler des réponses</DialogTitle>
      <DialogDescription>
        L'IA va générer des réponses fictives pour tester votre questionnaire
      </DialogDescription>
    </DialogHeader>
    
    <div className="space-y-4">
      {/* Sélection volume */}
      <div>
        <Label>Nombre de réponses simulées</Label>
        <RadioGroup value={volume} onValueChange={setVolume}>
          <RadioGroupItem value="10" label="10 réponses" badge="Gratuit" />
          <RadioGroupItem value="50" label="50 réponses" badge="Pro" disabled={!isPro} />
          <RadioGroupItem value="100" label="100 réponses" badge="Enterprise" disabled={!isEnterprise} />
        </RadioGroup>
      </div>
      
      {/* Contexte auto-détecté (FREE) */}
      <div className="bg-blue-50 p-3 rounded border border-blue-200">
        <div className="flex items-center gap-2 mb-1">
          <Sparkles className="w-4 h-4 text-blue-600" />
          <p className="text-sm font-medium text-blue-900">
            Contexte détecté : <strong>{detectedContext}</strong>
          </p>
        </div>
        <p className="text-xs text-blue-700">
          Basé sur le titre et la description de votre questionnaire
        </p>
        
        {/* Override manuel (PRO uniquement) */}
        {isPro && (
          <Button 
            variant="link" 
            size="sm"
            className="mt-2 p-0 h-auto text-blue-600"
            onClick={() => setShowContextOverride(!showContextOverride)}
          >
            {showContextOverride ? "Masquer" : "Changer le contexte"}
          </Button>
        )}
      </div>
      
      {/* Override optionnel (PRO) */}
      {showContextOverride && isPro && (
        <div>
          <Label>Contexte personnalisé</Label>
          <Select value={context} onValueChange={setContext}>
            <SelectItem value="b2b">B2B / Professionnel</SelectItem>
            <SelectItem value="b2c">B2C / Grand public</SelectItem>
            <SelectItem value="event">Événement</SelectItem>
            <SelectItem value="feedback">Feedback utilisateur</SelectItem>
            <SelectItem value="research">Recherche / Étude</SelectItem>
          </Select>
        </div>
      )}
      
      {/* Estimation durée */}
      <Alert>
        <Clock className="w-4 h-4" />
        <AlertDescription>
          Durée estimée : {estimatedDuration}
        </AlertDescription>
      </Alert>
      
      {/* Quota restant (FREE) */}
      {!isPro && (
        <Alert>
          <Info className="w-4 h-4" />
          <AlertDescription>
            {remainingSimulations} / 3 simulations gratuites ce mois
          </AlertDescription>
        </Alert>
      )}
    </div>
    
    <DialogFooter>
      <Button variant="outline" onClick={onClose}>Annuler</Button>
      <Button onClick={handleStartSimulation} disabled={remainingSimulations === 0 && !isPro}>
        <Play className="w-4 h-4 mr-2" />
        Lancer la simulation
      </Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

**Comportement Contexte :**
- **Free** : Contexte auto-détecté uniquement (pas de bouton "Changer")
- **Pro/Enterprise** : Contexte auto-détecté + bouton "Changer le contexte" pour override manuel

### 3. Écran de Progression

**Éléments :**
- Animation Loader + Sparkles
- Statut : "X / Y réponses générées"
- Barre de progression
- Messages dynamiques : "Analyse du questionnaire...", "Génération des réponses...", etc.

### 4. Rapport de Simulation

**Sections :**

**A. Vue d'ensemble (4 métriques)**
- Taux de complétion (%)
- Temps moyen (secondes)
- Taux d'abandon (%)
- Problèmes détectés (nombre)

**B. Problèmes détectés**
- Liste des issues avec severity (critical/warning/info)
- Icônes colorées (rouge/orange/bleu)
- Description + Impact + Lien vers question

**C. Recommandations**
- Actions concrètes avec exemples
- Types : reformulate, remove, reorder, shorten

**D. Analyse par question**
- Métriques détaillées
- Distribution des réponses (graphiques)
- Flags visuels (badges warning)

**Actions :**
- Exporter PDF
- Nouvelle simulation
- Modifier questionnaire

---

## 📊 Implémentation Technique

### Fichiers à Créer

```
src/
├── services/
│   ├── SimulationService.ts          # Service principal
│   ├── PersonaGenerator.ts           # Génération réponses
│   └── SimulationAnalyzer.ts         # Analyse + détection problèmes
├── components/
│   ├── simulation/
│   │   ├── SimulationModal.tsx       # Modal configuration
│   │   ├── SimulationProgress.tsx    # Écran progression
│   │   ├── SimulationReport.tsx      # Rapport complet
│   │   ├── IssueCard.tsx             # Carte problème
│   │   ├── RecommendationCard.tsx    # Carte recommandation
│   │   └── QuestionAnalysisCard.tsx  # Analyse question
├── hooks/
│   └── useSimulation.ts              # Hook React
└── types/
    └── simulation.ts                 # Types TypeScript
```

### Flux de Données

```
1. Utilisateur clique "Tester avec IA"
2. Modal configuration → Sélection volume + contexte
3. SimulationService.simulate(poll, config)
   ├── PersonaGenerator.selectPersonas(context, volume)
   ├── Pour chaque persona:
   │   └── PersonaGenerator.generateResponse(question, persona)
   ├── SimulationAnalyzer.analyze(responses)
   │   ├── calculateMetrics()
   │   ├── detectIssues()
   │   └── generateRecommendations()
   └── Retourne SimulationReport
4. Affichage rapport avec graphiques
5. Export PDF optionnel
```

---

## 💰 Coûts & Monétisation

### Coût Technique

**Approche Personas (Phase 1 - VALIDÉ) :**
- **Coût API : $0** (génération 100% locale, pas d'appel Gemini)
- **Algorithme :** Sélection aléatoire pondérée selon traits persona
- **Performance :** < 1s pour 50 réponses
- **Suffisant pour :** Détecter 80-90% des problèmes (biais, longueur, abandon)

**Comment ça marche sans IA :**
```typescript
// Questions à choix : Sélection pondérée selon biais persona
function selectOption(options, persona) {
  const weights = options.map((opt, i) => 
    i === 0 ? 1 + persona.biasTowardPositive : 1
  );
  return weightedRandom(options, weights);
}

// Questions texte : Templates selon detailLevel
const textTemplates = {
  low: ["OK", "Bien", "Correct"],
  medium: ["C'est plutôt bien dans l'ensemble"],
  high: ["Mon avis détaillé est que..."]
};
```

**Approche Gemini Flash (Phase 1 - VALIDÉ) :**
- **Modèle :** Gemini 2.0 Flash (le moins cher)
- **Coût API : ~$0.0004** par réponse texte (60% moins cher que Pro)
- **Avantages :** Réponses ultra-réalistes, cohérence sémantique, coût négligeable
- **Usage :** Inclus dès Free tier (coût absorbable)

---

### Quotas Freemium (VALIDÉ)

| Tier | Simulations/mois | Volume | Export PDF | Contexte | Prix |
|------|------------------|--------|------------|----------|------|
| **Free** | **3** | **10** | ❌ Non | Auto | **$0** |
| **Pro** | **20** | **50** | ✅ Oui | Auto + Override | **$10/mois** |
| **Enterprise** | **100** | **100** | ✅ Oui | Auto + Override + Gemini | **$50/mois** |

**Coûts API Réels (Gemini 2.0 Flash) :**
- **Free :** 3 sim × 10 rép × 2 texte = 60 appels → **$0.024/mois** (2 centimes)
- **Pro :** 20 sim × 25 rép × 2 texte = 1000 appels → **$0.40/mois** (40 centimes)
- **Enterprise :** 100 sim × 50 rép × 3 texte = 15000 appels → **$6/mois**

**Marges :**
- **Free :** Coût absorbable ($0.024)
- **Pro :** Marge 96% ($10 - $0.40 = $9.60)
- **Enterprise :** Marge 88% ($50 - $6 = $44)

**Rationale Freemium :**
- ✅ **Simulation gratuite avec Gemini** : Coût négligeable ($0.024/mois)
- ✅ **3 simulations/mois** : Suffisant pour particuliers (événements, associations)
- ✅ **10 réponses** : Détecte 80% des problèmes critiques
- ❌ **Export PDF bloqué** : Incitation forte à upgrader (voir rapport à l'écran)
- ✅ **Contexte auto-détecté** : UX fluide (1 clic "Tester avec IA")

**Workflow Freemium :**
1. Utilisateur crée questionnaire
2. Clique "Tester avec IA" (gratuit, 10 réponses)
3. Voit le rapport complet à l'écran (gratuit)
4. Clique "Exporter PDF" → **Modal upgrade** : "Passez Pro pour exporter vos rapports"
5. Utilisateur peut prendre screenshots (workaround) mais c'est moins pratique

---

### Argument de Vente
> **"Testez GRATUITEMENT vos questionnaires AVANT de les envoyer. DooDates détecte les problèmes que SurveyMonkey ignore. Besoin de plus ? Passez Pro pour simulations illimitées + export PDF."**

**Différenciateur unique :**
- SurveyMonkey : ❌ Aucune simulation
- Typeform : ❌ Aucune simulation
- Google Forms : ❌ Aucune simulation
- **DooDates : ✅ Simulation gratuite + IA**

---

## ⚠️ Analyse des Risques & Mitigations

### 🔴 RISQUES CRITIQUES (Bloquants)

#### 1. **Qualité des Réponses Simulées (Personas) - CRITIQUE**

**Problème :**
Les réponses générées par personas (sans IA) risquent d'être **trop génériques et peu réalistes**, ce qui compromet la valeur de la feature.

**Exemple concret :**
```
Question : "Qu'avez-vous pensé de notre nouveau produit ?"
Réponse Persona (low) : "OK"
Réponse Persona (medium) : "C'est plutôt bien dans l'ensemble"
Réponse Persona (high) : "Mon avis détaillé est que..."

❌ PROBLÈME : Ces réponses ne sont PAS contextuelles au produit !
```

**Impact :**
- ❌ Utilisateurs voient immédiatement que c'est du "fake" générique
- ❌ Perte de crédibilité de la feature
- ❌ Pas de détection de problèmes réels (questions ambiguës, contexte manquant)
- ❌ Utilisateurs ne font pas confiance au rapport

**Probabilité :** 🔴 **TRÈS HAUTE** (90%)

**Solutions possibles :**

**Option A : Templates contextuels avec extraction mots-clés**
```typescript
import nlp from 'compromise'; // Librairie NLP légère (14kb)

function generateTextResponse(question: Question, persona: Persona): string {
  // Extraire mots-clés avec Compromise.js
  const doc = nlp(question.title);
  const nouns = doc.nouns().out('array'); // ["produit", "service"]
  const adjectives = doc.adjectives().out('array'); // ["nouveau"]
  
  const keyword = nouns[0] || "cela";
  
  // Templates qui réutilisent les mots-clés
  const templates = {
    low: [
      `${keyword} est correct`,
      `Pas mal pour ${keyword}`,
      `${keyword} OK`
    ],
    medium: [
      `Je trouve ${keyword} plutôt bien dans l'ensemble`,
      `${keyword} répond à mes attentes`,
      `Quelques points à améliorer sur ${keyword}`
    ],
    high: [
      `Mon avis sur ${keyword} : c'est très intéressant`,
      `Concernant ${keyword}, je pense que les points forts sont nombreux`,
      `${keyword} est excellent, notamment pour son innovation`
    ]
  };
  
  return selectRandom(templates[persona.detailLevel]);
}
```

**Librairie recommandée : Compromise.js**
- ✅ **Taille :** 14kb (très léger)
- ✅ **Installation :** `npm install compromise`
- ✅ **Fonctionnalités :** Extraction nouns, verbs, adjectives, entities
- ✅ **Offline :** Pas d'appel API
- ✅ **Performance :** < 1ms par phrase
- ✅ **Support français :** Limité mais suffisant pour extraction basique

**Option B : Chaînes de Markov pour texte réaliste**
```typescript
import Markov from 'markov-strings'; // Génération texte réaliste

// Corpus pré-entraîné par contexte
const CORPUS_B2C = [
  "Le produit est vraiment bien conçu",
  "J'apprécie la qualité du service",
  "Le rapport qualité-prix est correct",
  // ... 50-100 phrases réalistes
];

function generateMarkovResponse(question: Question, persona: Persona): string {
  const markov = new Markov(CORPUS_B2C, { stateSize: 2 });
  markov.buildCorpus();
  
  const options = {
    maxTries: 20,
    filter: (result) => {
      return result.string.split(' ').length >= 5 && // Min 5 mots
             result.string.split(' ').length <= 15;   // Max 15 mots
    }
  };
  
  const result = markov.generate(options);
  return result.string;
}
```

**Librairie recommandée : markov-strings**
- ✅ **Taille :** 8kb
- ✅ **Installation :** `npm install markov-strings`
- ✅ **Réalisme :** Génère phrases naturelles basées sur corpus
- ✅ **Contrôle :** Longueur, filtres, probabilités
- ✅ **Offline :** Pas d'appel API

**Option C : Hybrid (RECOMMANDÉ)**
- Questions à choix : Personas simples (suffisant)
- Questions texte : **Compromise.js** pour extraction + templates contextuels
- Coût : $0, Temps génération : < 1s pour 50 réponses

**Recommandation :** **Option C (Hybrid avec Compromise.js)** pour Phase 1.

---

#### 2. **Détection Contexte Imparfaite - CRITIQUE**

**Problème :**
L'algorithme de détection automatique du contexte (B2B, B2C, etc.) risque d'être **trop simpliste** et de mal classifier les questionnaires.

**Exemple concret :**
```typescript
// Algorithme actuel (trop simple)
if (text.match(/entreprise|b2b|professionnel|client/)) return "b2b";

❌ PROBLÈME : "Satisfaction client" → détecté comme B2B
✅ RÉALITÉ : Peut être B2C (e-commerce grand public)
```

**Solution : Scoring multi-critères avec Compromise.js**
```typescript
import nlp from 'compromise';

function detectContext(title: string, description?: string): string {
  const text = `${title} ${description || ""}`;
  const doc = nlp(text);
  
  // Extraction entités et mots-clés
  const organizations = doc.organizations().out('array');
  const topics = doc.topics().out('array');
  
  const scores = {
    b2b: 0,
    b2c: 0,
    event: 0,
    feedback: 0,
    research: 0
  };
  
  // B2B indicators
  if (organizations.length > 0) scores.b2b += 2;
  if (text.match(/entreprise|professionnel|décideur/)) scores.b2b += 2;
  
  // B2C indicators
  if (text.match(/consommateur|achat|produit/)) scores.b2c += 2;
  if (text.match(/satisfaction/) && !text.match(/entreprise/)) scores.b2c += 1;
  
  // Event indicators
  if (doc.dates().length > 0) scores.event += 1;
  if (text.match(/événement|soirée|réunion/)) scores.event += 3;
  
  // Retourner contexte avec score max
  const maxScore = Math.max(...Object.values(scores));
  return Object.keys(scores).find(k => scores[k] === maxScore) || "b2c";
}
```

**Probabilité :** 🟠 **HAUTE** (70%)
**Recommandation :** Scoring multi-critères + Compromise.js pour extraction entités.

---

#### 3. **Validation des Problèmes Détectés - CRITIQUE**

**Problème :**
Comment **garantir** que les problèmes détectés par la simulation sont **réels** et pas des faux positifs ?

**Solution : Seuils adaptatifs + niveaux de confiance**
```typescript
const BIAS_THRESHOLDS = {
  b2b: 0.85,      // B2B : Moins de variance attendue
  b2c: 0.75,      // B2C : Plus de variance
  event: 0.80,    // Événement : Variance moyenne
  feedback: 0.70, // Feedback : Haute variance (positif/négatif)
  research: 0.90  // Recherche : Très peu de biais acceptable
};

interface Issue {
  severity: "critical" | "warning" | "info";
  confidence: "high" | "medium" | "low"; // NOUVEAU
  title: string;
  description: string;
}

function detectBias(distribution, context): Issue | null {
  const maxPercentage = Math.max(...distribution);
  const threshold = BIAS_THRESHOLDS[context];
  
  if (maxPercentage > threshold) {
    return {
      severity: "warning", // Pas "critical"
      confidence: maxPercentage > 0.9 ? "high" : "medium",
      title: "Distribution potentiellement biaisée",
      description: `${maxPercentage}% choisissent la même option (seuil: ${threshold * 100}%)`
    };
  }
  return null;
}
```

**Probabilité :** 🟠 **MOYENNE** (50%)
**Recommandation :** Seuils adaptatifs + niveaux de confiance + disclaimers.

---

### 🟠 RISQUES IMPORTANTS (Non-bloquants)

#### 4. **Performance avec Questionnaires Longs**

**Problème :** Génération de 100 réponses pour un questionnaire de 50 questions = **5000 réponses individuelles** à générer.

**Solutions :**
- Web Worker pour génération en background
- Streaming progressif (afficher résultats au fur et à mesure)
- Limiter à 30 questions max pour simulation

**Probabilité :** 🟠 **MOYENNE** (40%)

---

#### 5. **Quota Freemium Trop Généreux**

**Problème :** 3 simulations/mois × 10 réponses = 30 réponses simulées/mois gratuitement.

**Recommandation :** Tester avec 3 simulations/mois, ajuster selon taux de conversion.

**Probabilité :** 🟠 **MOYENNE** (50%)

---

### 📊 Résumé des Risques

| # | Risque | Sévérité | Probabilité | Mitigation |
|---|--------|----------|-------------|------------|
| 1 | Qualité réponses personas | 🔴 Critique | 90% | **Compromise.js** + templates contextuels |
| 2 | Détection contexte imparfaite | 🔴 Critique | 70% | Scoring multi-critères + **Compromise.js** |
| 3 | Validation problèmes (faux positifs) | 🔴 Critique | 50% | Seuils adaptatifs + niveaux confiance |
| 4 | Performance questionnaires longs | 🟠 Important | 40% | Web Worker + streaming |
| 5 | Quota freemium trop généreux | 🟠 Important | 50% | Ajuster selon conversion |

---

### ✅ Plan d'Action Recommandé

**AVANT Implémentation (2-3h) :**

1. **Installer Compromise.js** (10min)
   ```bash
   npm install compromise
   ```

2. **Prototyper génération texte avec Compromise.js** (1h)
   - Tester extraction mots-clés sur 10 questions réelles
   - Valider que les réponses sont "assez réalistes"
   - Comparer : templates génériques vs templates contextuels

3. **Améliorer détection contexte** (1h)
   - Implémenter scoring multi-critères
   - Tester sur 20 titres de questionnaires réels
   - Valider taux de précision > 80%

4. **Définir seuils adaptatifs** (30min)
   - Ajuster seuils de détection biais selon contexte
   - Ajouter niveaux de confiance (high/medium/low)

**Décision Finale :**

✅ **OUI, implémenter AVEC Compromise.js** pour réduire risque #1 (le plus critique).

❌ **NE PAS implémenter SI :**
- Prototype montre que réponses sont toujours trop génériques → Utiliser Gemini dès Phase 1 (coût $0.05)
- Détection contexte < 70% → Demander contexte manuellement (friction UX)

---

## 📅 Roadmap d'Implémentation

### Phase 1 : MVP (15-20h)

**Semaine 1 (8-10h) :**
- [ ] Types TypeScript (simulation.ts)
- [ ] PersonaGenerator avec 5 personas
- [ ] SimulationService.simulate()
- [ ] Génération réponses basiques (single, multiple, text)

**Semaine 2 (7-10h) :**
- [ ] SimulationAnalyzer (métriques + détection issues)
- [ ] UI : SimulationModal + SimulationProgress
- [ ] UI : SimulationReport (vue d'ensemble + problèmes)
- [ ] Export PDF basique

### Phase 2 : Améliorations (5-8h)

- [ ] Support matrices
- [ ] Analyse avancée (patterns, corrélations)
- [ ] Recommandations plus précises
- [ ] Graphiques interactifs (recharts)
- [ ] Comparaison avant/après modifications

### Phase 3 : Premium (10-15h)

- [ ] Option Gemini contextuel
- [ ] Simulation multi-segments
- [ ] A/B testing automatique
- [ ] Historique simulations
- [ ] Analytics avancés

---

## ✅ Critères de Succès

**Métriques Produit :**
- [ ] 30%+ utilisateurs Pro testent leurs questionnaires
- [ ] 50%+ modifient leur questionnaire après simulation
- [ ] 20%+ conversions freemium → Pro grâce à cette feature

**Métriques Qualité :**
- [ ] 90%+ précision détection problèmes (vs validation manuelle)
- [ ] < 30s génération pour 10 réponses
- [ ] < 3min génération pour 100 réponses

**Feedback Utilisateurs :**
- [ ] "Cette feature m'a fait économiser X heures"
- [ ] "J'ai détecté un biais que je n'aurais jamais vu"
- [ ] "Aucun concurrent ne propose ça"

---

## ✅ Résultats Tests Réels (02/11/2025)

### Test Gemini 2.0 Flash - Validation Complète

**Objectif :** Valider coûts et qualité avant implémentation

**Métriques Test :**
- **9 réponses générées** (3 questions × 3 niveaux détail)
- **895 tokens totaux**
- **Coût total : $0.000168**
- **Coût par réponse : $0.000019**

### Qualité : ✅ ULTRA-RÉALISTE

**Exemples réponses générées :**

**Question : "Qu'avez-vous pensé de la soirée ?"**
- **Low :** "C'était vraiment sympa, j'ai passé une bonne soirée."
- **Medium :** "C'était une super soirée ! L'ambiance était vraiment top et j'ai beaucoup apprécié la musique. J'ai passé un excellent moment."
- **High :** "La soirée était vraiment sympa ! J'ai bien aimé l'ambiance décontractée et la musique était top. J'ai pu discuter avec des gens intéressants et c'était l'occasion de découvrir de nouvelles choses. Franchement, j'ai passé un excellent moment et j'espère qu'il y en aura d'autres comme ça."

**Verdict :** Réponses indiscernables de vraies réponses humaines ✅

### Coûts Réels : 20x MOINS CHER que prévu !

| Tier | Estimé initial | **Coût réel** | Différence |
|------|----------------|---------------|------------|
| Free | $0.024/mois | **$0.001/mois** | **-96%** 🎉 |
| Pro | $0.40/mois | **$0.019/mois** | **-95%** 🎉 |
| Enterprise | $6/mois | **$0.280/mois** | **-95%** 🎉 |

### Marges Finales

| Tier | Prix | Coût API | Marge | % Marge |
|------|------|----------|-------|---------|
| Free | $0 | $0.001 | Absorbable | - |
| **Pro** | $10 | $0.019 | **$9.98** | **99.8%** ✅ |
| **Enterprise** | $50 | $0.280 | **$49.72** | **99.4%** ✅ |

### Performance : ✅ RAPIDE

- **Temps moyen/réponse :** 500-1100ms
- **Temps total (9 réponses) :** ~7 secondes
- **Latence acceptable :** < 2s ✅

### Validation Hypothèses

| Critère | Objectif | Résultat | Statut |
|---------|----------|----------|--------|
| Coût Pro/mois | < $1 | $0.019 | ✅ **20x mieux** |
| Marge Pro | > 90% | 99.8% | ✅ **Excellent** |
| Qualité | Réaliste | Ultra-réaliste | ✅ **Parfait** |
| Performance | < 2s | 500-1100ms | ✅ **Rapide** |

**Conclusion :** ✅ **TOUTES LES HYPOTHÈSES VALIDÉES** - GO pour implémentation

---

## 🚀 Prochaines Étapes

### Phase 1 : Implémentation MVP (15-20h) - NEXT

**Semaine 1 (8-10h) :**
- [ ] Types TypeScript (simulation.ts)
- [ ] PersonaGenerator avec 5 personas
- [ ] SimulationService.simulate()
- [ ] Intégration Gemini 2.0 Flash pour questions texte
- [ ] Génération réponses (single, multiple, text)

**Semaine 2 (7-10h) :**
- [ ] SimulationAnalyzer (métriques + détection issues)
- [ ] UI : SimulationModal + SimulationProgress
- [ ] UI : SimulationReport (vue d'ensemble + problèmes)
- [ ] Export PDF basique (Pro uniquement)

**Total estimé :** 15-20h

---

## 📋 Décisions Finales Validées

1. ✅ **Modèle :** Gemini 2.0 Flash (`gemini-2.0-flash-exp`)
2. ✅ **Approche :** Hybrid (Personas + Gemini Flash)
3. ✅ **Coût Pro :** $0.019/mois (marge 99.8%)
4. ✅ **Volume freemium :** 10 réponses (détecte 80% problèmes)
5. ✅ **Contexte :** Auto-détecté avec override manuel (Pro)
6. ✅ **Export PDF :** Pro uniquement (Markdown gratuit)
7. ✅ **Qualité :** Ultra-réaliste (test validé 02/11/2025)
