# Tests automatisés - Génération de sondages

## 🎯 Objectif
Document de référence pour tester automatiquement les prompts de génération de sondages.

Les tests sont exécutés par `src/test/prompts-generation.test.ts`.

## 📋 Format de test

Chaque test suit ce format :
```yaml
id: identifiant-unique
prompt: "le prompt à tester"
expected:
  dates_count: nombre_attendu
  slots_count: nombre_attendu
category: "catégorie"
priority: "CRITIQUE|HAUTE|MOYENNE|BASSE"
```

---
