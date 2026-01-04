# Tests de Charge - DooDates

## 📊 Objectif

Vérifier que l'application supporte la charge attendue avec des tests de charge automatisés.

## 🛠️ Prérequis

### Installation k6

**Windows (PowerShell) :**

```powershell
# Via Chocolatey
choco install k6

# Ou télécharger depuis https://k6.io/docs/getting-started/installation/
```

**MacOS :**

```bash
brew install k6
```

**Linux :**

```bash
# Ubuntu/Debian
sudo gpg -k
sudo gpg --no-default-keyring --keyring /usr/share/keyrings/k6-archive-keyring.gpg --keyserver hkp://keyserver.ubuntu.com:80 --recv-keys C5AD17C747E3415A3642D57D77C6C491D6AC1D69
echo "deb [signed-by=/usr/share/keyrings/k6-archive-keyring.gpg] https://dl.k6.io/deb stable main" | sudo tee /etc/apt/sources.list.d/k6.list
sudo apt-get update
sudo apt-get install k6
```

## 🚀 Utilisation

### Test de charge Edge Function quota-tracking

**1. Obtenir un JWT Token :**

- Se connecter à l'application
- Console navigateur (F12) → Exécuter le script JavaScript fourni dans la documentation Phase 3

**2. Exécuter le test :**

```bash
# Avec variables d'environnement
export JWT_TOKEN="votre_token_jwt"
export SUPABASE_URL="https://outmbbisrrdiumlweira.supabase.co"
k6 run quota-tracking-load-test.js

# Ou directement en ligne de commande
k6 run --env JWT_TOKEN="votre_token" --env SUPABASE_URL="https://outmbbisrrdiumlweira.supabase.co" quota-tracking-load-test.js
```

**3. Résultats :**

- Affichage en temps réel dans le terminal
- Résumé à la fin avec métriques clés
- Export JSON dans `load-test-results.json`

## 📈 Scénarios de Test

### Scénario par défaut (quota-tracking-load-test.js)

- **Montée progressive** : 0 → 10 utilisateurs (30s)
- **Charge normale** : 50 utilisateurs simultanés (1min)
- **Pic de charge** : 100 utilisateurs (30s)
- **Retour normal** : 50 utilisateurs (1min)
- **Descente** : 50 → 0 utilisateurs (30s)

### Seuils de performance

- ✅ 95% des requêtes < 2s
- ✅ < 1% d'erreurs
- ✅ 80% des checkQuota < 500ms
- ✅ 80% des consumeCredits < 500ms

## 📊 Interprétation des Résultats

### Métriques importantes

**Temps de réponse (http_req_duration) :**

- **p50 (médiane)** : Temps de réponse pour 50% des requêtes
- **p95** : Temps de réponse pour 95% des requêtes (objectif < 2s)
- **p99** : Temps de réponse pour 99% des requêtes

**Taux d'erreur (http_req_failed) :**

- Doit être < 1% (< 0.01)
- Si > 1%, vérifier les logs Supabase

**Throughput (http_reqs) :**

- Nombre de requêtes par seconde
- Indique la capacité du système

### Exemple de résultats réussis

```
⏱️  Temps de réponse:
  - Moyenne: 180ms
  - Médiane (p50): 150ms
  - p95: 450ms ✅ (< 2s)
  - p99: 800ms ✅ (< 2s)

❌ Taux d'erreur: 0.00% ✅

📈 Throughput:
  - Total requêtes: 5000
  - Requêtes/seconde: 83.33

✅ Seuils:
  ✅ http_req_duration: p(95)<2000
  ✅ http_req_failed: rate<0.01
```

## 🔧 Personnalisation

### Modifier le scénario de charge

Éditer `quota-tracking-load-test.js` :

```javascript
export const options = {
  stages: [
    { duration: "1m", target: 100 }, // 100 utilisateurs pendant 1 minute
    { duration: "2m", target: 200 }, // Pic à 200 utilisateurs
    { duration: "1m", target: 0 }, // Descente
  ],
  // ...
};
```

### Ajouter d'autres endpoints

```javascript
// Test getJournal
const journalRes = http.post(
  edgeFunctionUrl,
  JSON.stringify({
    endpoint: "getJournal",
    limit: 10,
  }),
  { headers },
);
```

## 🚨 Dépannage

### Erreur "JWT_TOKEN manquant"

- Vérifier que le token est bien passé en variable d'environnement
- Le token expire après 1 heure, en obtenir un nouveau si nécessaire

### Taux d'erreur élevé (> 1%)

- Vérifier les logs Supabase Edge Functions
- Vérifier que le token JWT est valide
- Vérifier la disponibilité de Supabase

### Temps de réponse élevé (> 2s)

- Vérifier la charge actuelle sur Supabase
- Vérifier les logs pour identifier les requêtes lentes
- Considérer l'optimisation des requêtes SQL

## 📚 Ressources

- [Documentation k6](https://k6.io/docs/)
- [k6 Examples](https://k6.io/docs/examples/)
- [Architecture Phase 3](Docs/ARCHITECTURE/2025-11-12-PHASE3-QUOTA-MIGRATION.md)
