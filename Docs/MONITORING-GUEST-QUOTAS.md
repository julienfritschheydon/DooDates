# Guide de Monitoring - Guest Quotas

## Vue d'ensemble

Ce guide explique comment surveiller et analyser l'utilisation des quotas guests via la table `guest_quota_journal` et `guest_quotas`.

## Scripts de monitoring disponibles

### 1. Monitoring rapide (`monitor-guest-quotas-quick.sql`)
**Usage quotidien** - Vue d'ensemble en quelques secondes
- Statistiques globales
- Alertes critiques
- Top 10 consommateurs
- Activité récente

### 2. Monitoring complet (`monitor-guest-quotas.sql`)
**Analyse approfondie** - 12 requêtes détaillées
- Activité récente (24h)
- Top consommateurs
- Détection d'abus
- Statistiques par type d'action
- Évolution temporelle
- Recherche par fingerprint
- Guests proches de la limite
- Activité par fuseau horaire
- Historique des resets admin
- Statistiques globales
- Alertes potentielles
- Export CSV

## Cas d'usage courants

### Vérifier un guest spécifique (support)
```sql
-- Rechercher par fingerprint
SELECT * FROM guest_quota_journal 
WHERE fingerprint = 'FINGERPRINT_A_RECHERCHER'
ORDER BY created_at DESC;
```

### Identifier les abus potentiels
```sql
-- Guests avec activité suspecte (plus de 10 actions en moins d'1h)
SELECT fingerprint, COUNT(*) as actions
FROM guest_quota_journal
WHERE created_at >= NOW() - INTERVAL '1 hour'
GROUP BY fingerprint
HAVING COUNT(*) > 10;
```

### Voir les guests proches de la limite
```sql
SELECT fingerprint, total_credits_consumed
FROM guest_quotas
WHERE total_credits_consumed >= 40
ORDER BY total_credits_consumed DESC;
```

### Statistiques quotidiennes
```sql
SELECT 
  DATE(created_at) as date,
  COUNT(*) as actions,
  SUM(credits) as total_credits
FROM guest_quota_journal
WHERE created_at >= NOW() - INTERVAL '7 days'
GROUP BY DATE(created_at)
ORDER BY date DESC;
```

## Alertes à surveiller

### 🔴 Critique
- Plus de 10 actions en moins de 10 minutes
- Total crédits >= 45/50
- Même fingerprint avec plusieurs user_agent différents (collision)

### 🟠 Suspect
- Plus de 5 actions en moins de 5 minutes
- Total crédits >= 40/50
- Activité continue pendant plusieurs heures

### 🟡 Attention
- Total crédits >= 30/50
- Activité élevée mais normale

## Actions recommandées

### Pour les abus détectés
1. Vérifier le journal complet du fingerprint suspect
2. Analyser les métadonnées (user_agent, timezone, etc.)
3. Si abus confirmé : utiliser `admin_reset_guest_quota()` pour reset
4. Documenter dans le journal avec `action = 'admin_reset'`

### Pour les guests proches de la limite
1. C'est normal - le système fonctionne comme prévu
2. Les guests seront bloqués automatiquement à 50 crédits
3. Ils peuvent s'authentifier pour obtenir plus de crédits

## Requêtes utiles pour le support

### Trouver un guest par métadonnées
```sql
SELECT * FROM guest_quotas
WHERE user_agent LIKE '%Chrome%'
  AND timezone = 'Europe/Paris'
ORDER BY last_activity_at DESC;
```

### Voir l'historique complet d'un guest
```sql
SELECT 
  j.*,
  q.total_credits_consumed,
  q.ai_messages,
  q.conversations_created
FROM guest_quota_journal j
JOIN guest_quotas q ON j.guest_quota_id = q.id
WHERE j.fingerprint = 'FINGERPRINT'
ORDER BY j.created_at DESC;
```

### Reset un guest (admin seulement)
```sql
-- Nécessite service_role
SELECT admin_reset_guest_quota('FINGERPRINT_A_RESET');
```

## Fréquence de monitoring recommandée

- **Quotidien** : Monitoring rapide (5 min)
- **Hebdomadaire** : Monitoring complet (30 min)
- **Mensuel** : Analyse approfondie + export CSV

## Métriques clés à suivre

1. **Taux d'utilisation** : Total crédits / Nombre de guests
2. **Guests actifs** : Nombre de guests avec activité dans les 24h
3. **Taux de limite atteinte** : % de guests >= 40 crédits
4. **Patterns d'abus** : Nombre d'alertes critiques par semaine
5. **Efficacité du système** : Réduction des contournements de quota

