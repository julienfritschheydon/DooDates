# Tests Automatisés Gemini - Guide Complet

## 🎯 Vue d'Ensemble

Ce système de tests automatisés valide la qualité de l'IA Gemini avec **15 cas de tests** spécifiques, des **métriques de qualité** avancées et des **rapports automatiques**.

### Objectifs

- ✅ **Score minimum** : 42/60 points requis
- ✅ **Couverture** : 15 cas de tests (réunions, événements, formations)
- ✅ **Monitoring** : Exécution hebdomadaire automatique
- ✅ **Alertes** : Détection des régressions

---

## 🚀 Installation et Configuration

### 1. Installation des dépendances

```bash
npm install
```

Les dépendances Jest sont automatiquement installées via `package.json`.

### 2. Configuration des variables d'environnement

Assurez-vous que `VITE_GEMINI_API_KEY` est configurée dans votre `.env.local` :

```bash
VITE_GEMINI_API_KEY=your_api_key_here
```

### 3. Première exécution

```bash
# Tests Gemini uniquement
npm run test:gemini

# Tous les tests
npm test

# Mode watch pour développement
npm run test:watch
```

---

## 📋 Structure des Tests

### Les 15 Cas de Tests

| ID    | Catégorie      | Type de Test            | Exemple                       |
| ----- | -------------- | ----------------------- | ----------------------------- |
| 1-5   | **Réunions**   | Contraintes temporelles | "Réunion équipe lundi matin"  |
| 6-10  | **Événements** | Planification flexible  | "Déjeuner équipe ce weekend"  |
| 11-15 | **Formations** | Sessions formatées      | "Formation sécurité 2h mardi" |

### Validation Multi-Critères

Chaque test vérifie :

- **Type de sondage** (date/datetime) - 1 point
- **Contraintes de jours** (lundi, weekend, etc.) - 1 point
- **Contraintes horaires** (matin, après-midi, soir) - 1 point
- **Mots-clés requis** (dans le titre) - 1 point

**Score maximum par test** : 4 points  
**Score total maximum** : 60 points

---

## 📊 Métriques de Qualité

### Seuils de Qualité

- **54-60/60** : ✅ **EXCELLENT** - Prêt pour production
- **48-53/60** : 🟢 **TRÈS BON** - Qualité optimale
- **42-47/60** : 🟡 **BON** - Améliorations mineures
- **< 42/60** : 🔴 **INSUFFISANT** - Action requise

### Alertes Automatiques

| Type         | Condition     | Action                 |
| ------------ | ------------- | ---------------------- |
| **Critique** | Score < 42/60 | 🚨 Issue GitHub créée  |
| **Warning**  | Score < 48/60 | ⚠️ Notification équipe |
| **Info**     | Score ≥ 54/60 | 📊 Rapport positif     |

---

## 🔄 Workflow GitHub Actions

### Exécution Automatique

- **Hebdomadaire** : Tous les lundis à 11h (Paris)
- **Sur Push** : Modifications des fichiers Gemini
- **Manuel** : Via l'interface GitHub

### Configuration

Le workflow `gemini-tests.yml` :

1. Installe les dépendances
2. Lance les tests avec l'API key
3. Génère les rapports
4. Upload les artefacts
5. Crée des issues en cas d'échec

### Secrets Requis

```bash
# Dans les secrets GitHub du repo
VITE_GEMINI_API_KEY=your_gemini_api_key
```

---

## 📈 Rapports et Suivi

### Rapports Générés

1. **`gemini-test-report.md`** : Résultats détaillés des tests
2. **`quality-report.md`** : Analyse de qualité complète
3. **`metrics-history.json`** : Historique des scores

### Analyse de Régression

Le système track automatiquement :

- **Évolution des scores** (amélioration/dégradation)
- **Tendances par catégorie**
- **Alertes de régression**

### Exemple de Rapport

```markdown
# 📊 Rapport de Qualité Tests Gemini

## 🎯 Score Global

**52/60** (87%)

✅ **EXCELLENT** - Prêt pour production

**Taux de réussite:** 14/15 (93%)

## 📈 Analyse de Tendance

📈 **Tendance:** improving
**Évolution:** +3 points
**Score précédent:** 49

## 📋 Scores par Catégorie

✅ **Réunions:** 85%
✅ **Événements:** 90%
🟡 **Formations:** 75%
```

---

## 🛠️ Commandes Utiles

### Tests de Base

```bash
# Tests Gemini uniquement
npm run test:gemini

# Tests avec coverage
npm run test:ci

# Tests en mode watch
npm run test:watch
```

### Scripts Avancés

```bash
# Lancer le runner complet avec rapports
node tests/run-tests.ts

# Voir l'historique des métriques
cat tests/reports/metrics-history.json | jq '.latest'

# Tests spécifiques par pattern
npx jest --testNamePattern="Réunions"
```

### Debug et Développement

```bash
# Tests avec logs détaillés
DEBUG=1 npm run test:gemini

# Tests d'un seul cas
npx jest --testNamePattern="Test 1"

# Génération de rapport uniquement
node -e "
import('./tests/quality-metrics.js').then(m => {
  const tracker = new m.QualityTracker();
  // ... générer rapport
});
"
```

---

## 🔧 Personnalisation

### Ajouter de Nouveaux Tests

1. **Éditer** `tests/gemini-automated.test.ts`
2. **Ajouter** un nouveau cas dans `testCases[]`
3. **Spécifier** les critères de validation
4. **Tester** avec `npm run test:gemini`

### Modifier les Seuils

Dans `tests/quality-metrics.ts` :

```typescript
private readonly CRITICAL_THRESHOLD = 42; // Minimum requis
private readonly WARNING_THRESHOLD = 48;   // Seuil d'alerte
private readonly EXCELLENT_THRESHOLD = 54; // Excellence
```

### Personnaliser les Rapports

Modifier `generateQualityReport()` dans `quality-metrics.ts` pour :

- Changer le format Markdown
- Ajouter des métriques
- Personnaliser les recommandations

---

## 🚨 Troubleshooting

### Problèmes Courants

**Tests qui échouent** :

```bash
# Vérifier l'API key
echo $VITE_GEMINI_API_KEY

# Tester la connexion Gemini
node -e "console.log('API Key:', process.env.VITE_GEMINI_API_KEY)"
```

**Quotas API dépassés** :

```bash
# Attendre et réessayer
sleep 60 && npm run test:gemini
```

**Rapports non générés** :

```bash
# Créer le dossier manuellement
mkdir -p tests/reports

# Permissions
chmod +w tests/reports
```

### Logs de Debug

Activer les logs détaillés :

```bash
NODE_ENV=development npm run test:gemini
```

---

## 📞 Support

### Contacts

- **Développeur principal** : Voir `package.json`
- **Issues GitHub** : Créer une issue avec le tag `tests`
- **Documentation** : Ce README + commentaires inline

### Ressources

- [Documentation Jest](https://jestjs.io/docs/getting-started)
- [API Gemini](https://ai.google.dev/docs)
- [GitHub Actions](https://docs.github.com/en/actions)

---

**Dernière mise à jour** : Juin 2025  
**Version** : 1.0.0  
**Status** : ✅ Opérationnel
