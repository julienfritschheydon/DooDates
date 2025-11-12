# Analyse des Requêtes Lentes Supabase

**Date:** 2025-11-06  
**Source:** Rapport Supabase Slow Queries

## Résumé Exécutif

Sur un total de **95.1 secondes** de temps de requête analysé :

- **70.8%** provient de requêtes système Supabase (dashboard, métadonnées)
- **27%** provient de `pg_timezone_names` (problème identifié)
- **2.2%** provient des requêtes applicatives (INSERT conversations, sessions)

## Problèmes Identifiés

### 🔴 Critique : Requête `pg_timezone_names` (27% du temps total)

```sql
SELECT name FROM pg_timezone_names
```

**Métriques :**
- **115 appels**
- **223ms** en moyenne (52ms - 894ms)
- **0% cache hit rate** ⚠️
- **137,310 lignes lues** à chaque appel
- **25.7 secondes** de temps total

**Problème :** Cette requête n'est jamais mise en cache et lit systématiquement toutes les timezones PostgreSQL.

**Impact :** 
- Cette requête est probablement appelée par Supabase Dashboard ou des fonctionnalités système
- Pas directement contrôlable par l'application
- Impact sur les performances globales de la base

**Recommandations :**

1. **Vérifier l'origine** : Cette requête est probablement appelée par :
   - Le dashboard Supabase (inspecteur de schéma)
   - Des migrations automatiques
   - Des fonctions système Supabase

2. **Action Supabase** : Contacter le support Supabase pour :
   - Activer le cache pour cette vue système
   - Optimiser la requête si possible
   - Comprendre pourquoi elle est appelée si fréquemment

3. **Monitoring** : Surveiller si cette requête est appelée depuis l'application
   ```sql
   -- Vérifier les appels depuis l'application
   SELECT * FROM pg_stat_statements 
   WHERE query LIKE '%pg_timezone_names%';
   ```

### 🟡 Modéré : Requêtes Dashboard Supabase (43.8% du temps total)

**Requête principale :** Requête complexe sur `pg_proc` (fonctions PostgreSQL)

**Métriques :**
- **234 appels**
- **178ms** en moyenne (67ms - 797ms)
- **100% cache hit rate** ✅
- **41.7 secondes** de temps total

**Analyse :**
- Ces requêtes sont générées par le dashboard Supabase
- Cache hit rate excellent (100%)
- Temps moyen acceptable pour des requêtes système complexes
- Pas d'action requise côté application

**Autres requêtes dashboard :**
- Requêtes `pg_get_tabledef` : ~950-1000ms chacune, mais seulement 1 appel chacune
- Requêtes sur tables/colonnes : 17ms en moyenne, cache hit rate 100%

### ✅ Bon : Requêtes Applicatives

**INSERT conversations :**
- **1084 appels**
- **0.9ms** en moyenne
- **100% cache hit rate**
- Performance excellente ✅

**INSERT refresh_tokens / sessions :**
- **~1500 appels chacun**
- **~1ms** en moyenne
- Performance excellente ✅

## Recommandations par Priorité

### Priorité 1 : Requête `pg_timezone_names`

1. **Investigation immédiate** :
   - Vérifier si cette requête est appelée depuis l'application
   - Identifier le composant/service qui l'appelle
   - Vérifier les logs Supabase pour l'origine

2. **Actions possibles** :
   - Si appelée depuis l'application : supprimer ou mettre en cache côté client
   - Si appelée par Supabase : contacter le support pour optimisation
   - Mettre en place un cache applicatif si nécessaire

3. **Monitoring** :
   - Surveiller la fréquence d'appel
   - Alerter si > 100 appels/heure

### Priorité 2 : Optimisation générale

1. **Cache applicatif** :
   - Les timezones changent rarement
   - Mettre en cache côté client si nécessaire
   - Utiliser `Intl.DateTimeFormat().resolvedOptions().timeZone` côté navigateur

2. **Vérification des requêtes applicatives** :
   - Toutes les requêtes applicatives sont performantes (< 1ms)
   - Continuer à surveiller les INSERT/UPDATE

### Priorité 3 : Requêtes Dashboard

- **Aucune action requise** : Ces requêtes sont normales pour le dashboard Supabase
- Monitoring passif recommandé pour détecter d'éventuelles dégradations

## Plan d'Action

### Court terme (Cette semaine)

- [ ] Vérifier l'origine de `pg_timezone_names` dans les logs Supabase
- [ ] Identifier si cette requête est appelée depuis l'application
- [ ] Contacter le support Supabase si nécessaire

### Moyen terme (Ce mois)

- [ ] Mettre en place un monitoring des requêtes lentes
- [ ] Documenter les patterns de requêtes applicatives
- [ ] Optimiser si des requêtes applicatives deviennent lentes

### Long terme (Continuité)

- [ ] Surveillance continue des performances
- [ ] Revue trimestrielle des requêtes lentes
- [ ] Optimisation proactive basée sur les métriques

## Métriques de Succès

- **Objectif** : Réduire le temps total de `pg_timezone_names` de 50%
- **Cible** : Cache hit rate > 80% pour les requêtes système fréquentes
- **Monitoring** : Alertes si temps moyen > 500ms pour requêtes applicatives

## Notes Techniques

### Pourquoi `pg_timezone_names` est lent ?

La vue `pg_timezone_names` contient toutes les timezones supportées par PostgreSQL (environ 600+ entrées). Sans cache, chaque requête doit :
1. Scanner les catalogues système
2. Construire la liste complète
3. Retourner toutes les entrées

### Pourquoi le cache ne fonctionne pas ?

Plusieurs possibilités :
- La requête est appelée avec des paramètres différents
- Le cache PostgreSQL n'est pas activé pour cette vue
- La requête est appelée depuis différents contextes (dashboard vs application)

## Références

- [PostgreSQL pg_timezone_names](https://www.postgresql.org/docs/current/view-pg-timezone-names.html)
- [Supabase Performance Tuning](https://supabase.com/docs/guides/platform/performance)
- [PostgreSQL Query Performance](https://www.postgresql.org/docs/current/performance-tips.html)

