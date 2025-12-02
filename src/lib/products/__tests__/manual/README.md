# Tests Edge Cases - Séparation Produits

Ces tests couvrent les cas limites pour la nouvelle architecture multi-produits.

## Tests disponibles

### 1. Données corrompues dans localStorage
- Gestion des JSON invalides
- Données manquantes
- Récupération après corruption

### 2. Conflits de mise à jour concurrente
- Modifications simultanées
- Race conditions
- Intégrité des données

### 3. Taille maximale des données
- Grands volumes de données
- Performance avec beaucoup de questions
- Gestion mémoire

### 4. Récupération après erreur
- Restauration des données
- Rollback en cas d erreur
- Maintien de la cohérence

## Exécution

Pour lancer ces tests manuellement:

```bash
npx jest src/lib/products/__tests__/manual/edge-cases.test.ts --no-coverage
```

## Note

Ces tests nécessitent un environnement jsdom pour localStorage et sont donc isolés pour ne pas bloquer les CI/CD.
