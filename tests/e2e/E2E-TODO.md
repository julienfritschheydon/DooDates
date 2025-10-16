# Tests E2E DooDates - Ce qu'il Reste à Faire

**Date** : 16 octobre 2025  
**Status Actuel** : 29/37 tests actifs (78%) ✅

---

## 🎯 Tests Restants à Activer (8 tests)

### **Phase 3 : Ultra-Simple (1 test) ⏸️**

**Fichier** : `ultra-simple.spec.ts`  
**Status** : 1 test skipped  

**Actions nécessaires** :
2. Adapter le workflow complet au vrai système DooDates

---

### **Phase 4 : Security (6 tests) ⏸️**

**Fichier** : `security-isolation.spec.ts`  
**Status** : 6 tests skipped (2 tests actifs passent déjà)  

**Tests à activer** :
1. ❌ `should isolate guest user data between sessions`
2. ❌ `should prevent XSS attacks in message content`
3. ❌ `should protect against localStorage manipulation`
4. ❌ `should isolate authenticated user data`
5. ❌ `should prevent session fixation attacks`
6. ❌ `should handle data validation and type safety`

**Actions nécessaires** :
1. Adapter les tests pour utiliser l'interface chat réelle : `textarea[placeholder*="Décrivez"]`
2. Simplifier les assertions pour tester la résilience plutôt que des workflows complets
3. Retirer `.skip()` de chaque test
4. Tester individuellement chaque test activé