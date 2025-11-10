# Plan de Restructuration - 2. Planning.md

## Structure Actuelle (Problèmes)

1. ❌ Sections "POST BETA" (ligne 682) et "APRES LANCEMENT" (ligne 1548) séparées
2. ❌ Quotas/Pricing en 5 endroits:
   - Ligne 1090: 💰 NOUVEAU SYSTÈME QUOTAS & PRICING
   - Ligne 1092: 🔒 SÉCURISATION QUOTAS
   - Ligne 1261: Phase 3: Système Crédits Unifiés
   - Ligne 1314: Phase 4: UI Pricing & Conversion
   - Ligne 1346: Phase 5: Programme Beta Testeurs

3. ❌ Tests en 4 endroits:
   - Ligne 497: Tests d'intégration Supabase (Semaine 2)
   - Ligne 684: Tests Gemini Phase 2 (POST BETA)
   - Ligne 1550: Tests Gemini Phase 3 (APRES LANCEMENT)
   - Ligne 1558: Phase 3.5: Tests Performance

4. ❌ Phases (3, 3.5, 4, 5, 6) mélangées avec sections thématiques

## Nouvelle Structure (Proposée)

```
# DooDates - Development Planning

[Intro actuelle - lignes 1-10]

## 🚨 BÊTA (Nov 2025)
[Contenu actuel - lignes 11-660]

## 💰 QUOTAS & PRICING (POST BÊTA)
### 🔒 Sécurisation Quotas & Protection Anti-Abus
[Fusion de lignes 1092-1259]

### Système Crédits Unifiés
[Contenu ligne 1261-1312]

### UI Pricing & Conversion
[Contenu ligne 1314-1344]

### Programme Beta Testeurs
[Contenu ligne 1346-1427]

## 🧪 TESTS AVANCÉS (POST BÊTA)
### Tests Intégration Supabase
[Contenu ligne 497-583]

### Tests Gemini Automatisés
#### Phase 2: Enhanced Gemini (Temporal Parsing)
[Contenu ligne 684-689]

#### Phase 3: Simulation IA
[Contenu ligne 1550-1555]

### Tests Performance Automatisés
[Contenu ligne 1558-1630]

## 🚀 POST-BÊTA & LANCEMENT
### Différenciateurs IA
[Contenu ligne 800-1088]

### Différenciateurs Visuels
[Contenu ligne 748-799]

### UI/UX Premium
[Contenu ligne 691-747, 820-874]

## 🌍 LANCEMENT PUBLIC & ROADMAP

### PRE-LANCEMENT
[Contenu ligne 1429-1532]

### LAUNCH
[Contenu ligne 1534-1547]

### 📅 ROADMAP PAR PHASES

#### Phase 4 (Mois 6-9): Monétisation
[Contenu ligne 1632-1785]
→ Voir section "QUOTAS & PRICING" ci-dessus pour implémentation

#### Phase 5 (Mois 9-12): Scale International
[Contenu ligne 1786-1818]
→ Voir INTERNATIONAL-LAUNCH-STRATEGY.md

#### Phase 6 (Mois 12+): UX Premium
[Contenu ligne 1819-1850]

## 📦 BACKLOG
[Contenu ligne 1851-1863]
```

## Actions à Faire

1. ✅ Créer backup (2. Planning.md.backup)
2. [ ] Créer nouvelle structure dans l'ordre
3. [ ] Vérifier que tout le contenu est présent
4. [ ] Supprimer sections dupliquées
5. [ ] Tester les liens internes
6. [ ] Valider avec l'utilisateur

