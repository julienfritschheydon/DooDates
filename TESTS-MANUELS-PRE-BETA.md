# 🧪 Tests Manuels Pré-Bêta - DooDates

**Date :** 30 octobre 2025  
**Durée estimée :** 4h30  
**Objectif :** Valider l'expérience utilisateur complète avant lancement bêta

**Livrable :** Liste exhaustive des bugs/problèmes UX dans `BUGS-PRE-BETA.md`

---

## 📋 Préparation (15min)

### Matériel nécessaire :
- [ ] PC/Mac (navigateur principal)
- [ ] Smartphone (tests mobile réels)
- [ ] Tablette (optionnel mais recommandé)
- [ ] Navigateur privé (pour tester en tant que votant)

### Outils :
- [ ] Fichier `BUGS-PRE-BETA.md` ouvert pour noter les problèmes
- [ ] Bloc-notes pour observations UX
- [ ] Screenshots si besoin

### Environnement :
- [ ] App lancée en local : `npm run dev`
- [ ] Console navigateur ouverte (F12) pour voir les erreurs
- [ ] Network tab ouverte pour voir les requêtes

---

## 🎯 Scénario 1 : Sondage de Dates (1h)

### Objectif : Tester le flow complet création → vote → résultats

### 1.1 Création via IA (15min)

**Actions :**
1. [ ] Ouvrir l'app (page d'accueil)
2. [ ] Vérifier que le chat IA est visible
3. [ ] Taper : "Organise une réunion lundi, mardi et mercredi de 14h à 17h"
4. [ ] Attendre la réponse de l'IA
5. [ ] Vérifier que le sondage est généré correctement

**À vérifier :**
- [ ] Les 3 dates sont présentes (lundi, mardi, mercredi)
- [ ] Les créneaux horaires sont corrects (14h-17h)
- [ ] Le preview s'affiche correctement
- [ ] Le titre est visible (pas caché par la top barre) ⚠️
- [ ] La croix de fermeture est présente ⚠️

**Bugs à noter :**
- Si le bouton "Créer avec IA" ne fonctionne pas → Bug #1
- Si la croix est absente → Bug #2
- Si le titre est caché → Bug #3
- Tout autre problème → Ajouter dans BUGS-PRE-BETA.md

---

### 1.2 Finalisation & Partage (10min)

**Actions :**
1. [ ] Cliquer sur "Finaliser" ou équivalent
2. [ ] Vérifier que le sondage est sauvegardé
3. [ ] Copier le lien de partage
4. [ ] Vérifier que le lien est bien copié (toast de confirmation)

**À vérifier :**
- [ ] Le sondage apparaît dans le dashboard
- [ ] Le lien de partage est valide (format correct)
- [ ] Un message de succès s'affiche

**Bugs à noter :**
- Si le lien ne se copie pas → Nouveau bug
- Si le sondage n'apparaît pas dans le dashboard → Nouveau bug

---

### 1.3 Vote Desktop (15min)

**Actions :**
1. [ ] Ouvrir le lien dans un **navigateur privé** (pour simuler un autre utilisateur)
2. [ ] Vérifier que le sondage s'affiche correctement
3. [ ] Entrer un nom : "Alice"
4. [ ] Sélectionner des disponibilités (au moins 2 dates)
5. [ ] Soumettre le vote
6. [ ] Vérifier le message de confirmation

**À vérifier :**
- [ ] Le sondage se charge rapidement (< 3s)
- [ ] Les dates sont lisibles
- [ ] La sélection fonctionne (clic ou swipe)
- [ ] Le bouton "Voter" est actif après sélection
- [ ] Message de confirmation après vote

**Bugs à noter :**
- Si le sondage ne se charge pas → Nouveau bug critique
- Si la sélection ne fonctionne pas → Nouveau bug critique
- Si le vote ne se soumet pas → Nouveau bug critique

---

### 1.4 Vote Mobile (15min)

**Actions :**
1. [ ] Ouvrir le lien sur **smartphone**
2. [ ] Entrer un nom : "Bob"
3. [ ] Tester le swipe pour sélectionner
4. [ ] Voter sur au moins 2 dates
5. [ ] Soumettre

**À vérifier :**
- [ ] L'interface est responsive (pas de débordement)
- [ ] Le swipe fonctionne correctement
- [ ] Les boutons sont assez grands pour le tactile
- [ ] Le clavier mobile ne cache pas les éléments importants
- [ ] La croix de fermeture est accessible ⚠️

**Bugs à noter :**
- Si le swipe ne fonctionne pas → Nouveau bug critique
- Si l'interface est cassée → Nouveau bug critique
- Si la croix est absente → Confirmer Bug #2

---

### 1.5 Résultats (10min)

**Actions :**
1. [ ] Retourner au dashboard (sur PC)
2. [ ] Cliquer sur le sondage créé
3. [ ] Vérifier que les 2 votes (Alice + Bob) sont affichés
4. [ ] Vérifier les disponibilités par date
5. [ ] Tester l'export CSV

**À vérifier :**
- [ ] Les 2 votes sont visibles
- [ ] Les noms (Alice, Bob) sont affichés
- [ ] Les disponibilités sont correctes
- [ ] L'export CSV fonctionne
- [ ] Le fichier CSV est lisible (ouvrir dans Excel/Sheets)

**Bugs à noter :**
- Si les votes ne s'affichent pas → Nouveau bug critique
- Si l'export ne fonctionne pas → Nouveau bug majeur

---

## 📝 Scénario 2 : Questionnaire (1h)

### Objectif : Tester les Form Polls

### 2.1 Création via IA (15min)

**Actions :**
1. [ ] Nouvelle conversation IA
2. [ ] Taper : "Crée un sondage de satisfaction client avec 5 questions"
3. [ ] Vérifier que l'IA génère un questionnaire (pas un sondage de dates)
4. [ ] Vérifier les questions générées

**À vérifier :**
- [ ] L'IA détecte bien qu'il s'agit d'un questionnaire
- [ ] Au moins 5 questions sont générées
- [ ] Les types de questions sont variés (choix unique, multiple, texte)
- [ ] Le preview s'affiche correctement

**Bugs à noter :**
- Si l'IA génère un sondage de dates → Nouveau bug
- Si les questions sont incohérentes → Nouveau bug

---

### 2.2 Vote sur Questionnaire (20min)

**Actions :**
1. [ ] Finaliser et copier le lien
2. [ ] Ouvrir dans navigateur privé
3. [ ] Répondre à toutes les questions
4. [ ] Tester différents types de réponses (choix unique, multiple, texte)
5. [ ] Soumettre

**À vérifier :**
- [ ] Toutes les questions s'affichent
- [ ] Les choix multiples fonctionnent (checkboxes)
- [ ] Les choix uniques fonctionnent (radio buttons)
- [ ] Les champs texte fonctionnent
- [ ] La validation fonctionne (questions requises)

**Bugs à noter :**
- Si un type de question ne fonctionne pas → Nouveau bug critique

---

### 2.3 Résultats Questionnaire (15min)

**Actions :**
1. [ ] Retourner au dashboard
2. [ ] Voir les résultats du questionnaire
3. [ ] Vérifier les réponses par question
4. [ ] Tester export PDF

**À vérifier :**
- [ ] Les réponses sont affichées correctement
- [ ] Les pourcentages sont corrects (pour choix multiples)
- [ ] Les réponses texte sont lisibles
- [ ] L'export PDF fonctionne

**Bugs à noter :**
- Si les résultats ne s'affichent pas → Nouveau bug critique

---

### 2.4 Questions Conditionnelles (10min)

**Actions :**
1. [ ] Créer un questionnaire avec règle conditionnelle via IA
2. [ ] Exemple : "Question 2 visible seulement si réponse Oui à Question 1"
3. [ ] Voter en testant les deux cas (Oui et Non)

**À vérifier :**
- [ ] La question conditionnelle est cachée par défaut
- [ ] Elle apparaît après avoir répondu "Oui"
- [ ] Elle reste cachée si réponse "Non"

**Bugs à noter :**
- Si les conditionnelles ne fonctionnent pas → Nouveau bug majeur

---

## 📊 Scénario 3 : Dashboard (30min)

### Objectif : Tester la navigation et les actions

### 3.1 Création de Plusieurs Sondages (10min)

**Actions :**
1. [ ] Créer 5-6 sondages différents (dates + questionnaires)
2. [ ] Varier les titres et types

**À vérifier :**
- [ ] Tous les sondages apparaissent dans le dashboard
- [ ] Les titres sont corrects
- [ ] Les types sont identifiables (date vs form)

---

### 3.2 Filtres & Recherche (10min)

**Actions :**
1. [ ] Tester le filtre "Actifs" ⚠️
2. [ ] Tester le filtre "Archivés" ⚠️
3. [ ] Tester la recherche par titre
4. [ ] Tester le tri (par date, par nom)

**À vérifier :**
- [ ] Les filtres fonctionnent correctement
- [ ] La recherche trouve les bons sondages
- [ ] Le tri change l'ordre d'affichage

**Bugs à noter :**
- Si les filtres ne fonctionnent pas → Confirmer Bug #4
- Si la recherche ne fonctionne pas → Nouveau bug

---

### 3.3 Actions sur Sondages (10min)

**Actions essentielles à tester :**
1. [ ] **Dupliquer sondage** (2h dev estimé)
   - Créer une copie du sondage avec nouveau slug
   - Vérifier que toutes les questions/dates sont copiées
   - Vérifier que les réponses ne sont PAS copiées
   
2. [ ] **Archiver sondage** (1h dev estimé)
   - Marquer le sondage comme archivé
   - Vérifier qu'il disparaît de la liste "Actifs"
   - Vérifier qu'il apparaît dans "Archivés"
   
3. [ ] **Supprimer sondage** (1h dev estimé)
   - Demander confirmation avant suppression
   - Vérifier que le sondage est bien supprimé
   - Vérifier que les réponses sont aussi supprimées
   
4. [ ] **Reprendre conversation** (30min dev estimé)
   - Ouvrir le chat avec le contexte du sondage
   - Vérifier que l'historique est chargé
   - Pouvoir modifier le sondage via IA

**À vérifier :**
- [ ] La suppression fonctionne (avec confirmation)
- [ ] L'archivage fonctionne
- [ ] La duplication fonctionne
- [ ] La reprise de conversation fonctionne

**Bugs à noter :**
- Si une action ne fonctionne pas → Nouveau bug
- Si une action manque → Ajouter dans Features manquantes (temps dev estimé indiqué ci-dessus)

---

## 📱 Scénario 4 : Mobile Complet (1h)

### Objectif : Tester l'expérience mobile de bout en bout

### 4.1 Création Mobile (20min)

**Actions :**
1. [ ] Ouvrir l'app sur smartphone
2. [ ] Créer un sondage via IA (clavier mobile)
3. [ ] Vérifier le preview mobile
4. [ ] Finaliser

**À vérifier :**
- [ ] Le clavier ne cache pas le chat
- [ ] Le preview est responsive
- [ ] Les boutons sont accessibles
- [ ] La navigation est fluide

**Bugs à noter :**
- Tout problème d'affichage mobile → Nouveau bug

---

### 4.2 Vote Mobile (20min)

**Actions :**
1. [ ] Voter sur plusieurs sondages depuis mobile
2. [ ] Tester swipe, tap, scroll
3. [ ] Tester avec différentes orientations (portrait/paysage)

**À vérifier :**
- [ ] Le swipe est fluide
- [ ] Les zones tactiles sont assez grandes
- [ ] Pas de problème de scroll
- [ ] L'orientation paysage fonctionne

---

### 4.3 Dashboard Mobile (20min)

**Actions :**
1. [ ] Naviguer dans le dashboard sur mobile
2. [ ] Tester les filtres
3. [ ] Tester les actions (supprimer, etc.)
4. [ ] Voir les résultats

**À vérifier :**
- [ ] La liste est lisible
- [ ] Les actions sont accessibles
- [ ] Les résultats s'affichent correctement

---

## 🔒 Scénario 5 : Freemium (30min)

### Objectif : Tester les limites et incentives d'authentification

### 5.1 Limites Conversations (10min)

**Actions :**
1. [ ] Créer plusieurs conversations successives
2. [ ] Atteindre la limite de 20 messages par conversation
3. [ ] Vérifier le message d'alerte
4. [ ] Tester la création d'une nouvelle conversation après limite

**À vérifier :**
- [ ] Message clair quand limite approchée (ex: "Plus que 5 messages")
- [ ] Blocage effectif à 20 messages
- [ ] Proposition de s'authentifier pour continuer
- [ ] Possibilité de créer nouvelle conversation

**Bugs à noter :**
- Si pas de message d'alerte → Nouveau bug
- Si limite non respectée → Nouveau bug

---

### 5.2 Limites Sondages (10min)

**Actions :**
1. [ ] Créer 3 sondages dans la même conversation
2. [ ] Tenter de créer un 4ème sondage
3. [ ] Vérifier le message de limite atteinte
4. [ ] Vérifier l'incentive d'authentification

**À vérifier :**
- [ ] Limite de 3 polls/conversation respectée
- [ ] Message clair expliquant la limite
- [ ] CTA "S'authentifier" visible et fonctionnel
- [ ] Avantages de l'authentification expliqués

**Bugs à noter :**
- Si limite non respectée → Nouveau bug
- Si pas d'incentive auth → Nouveau bug UX

---

### 5.3 Auth Incentive (10min)

**Actions :**
1. [ ] Utiliser l'app en mode guest
2. [ ] Noter tous les endroits où l'auth est proposée
3. [ ] Vérifier que les avantages sont clairs
4. [ ] Tester le flow d'authentification

**À vérifier :**
- [ ] Incentive visible mais non intrusif
- [ ] Avantages clairs (conversations illimitées, historique, etc.)
- [ ] Flow d'auth simple et rapide
- [ ] Pas de perte de données après auth

**Bugs à noter :**
- Si auth trop intrusive → Nouveau bug UX
- Si avantages pas clairs → Nouveau bug UX
- Si perte de données après auth → Nouveau bug critique

---

## 📊 Synthèse des Tests

### Checklist Finale

**Fonctionnalités Critiques :**
- [ ] Création sondage dates (IA) ✅
- [ ] Création questionnaire (IA) ✅
- [ ] Vote desktop ✅
- [ ] Vote mobile ✅
- [ ] Résultats dates ✅
- [ ] Résultats questionnaires ✅
- [ ] Export CSV ✅
- [ ] Dashboard liste ✅
- [ ] Suppression sondage ✅
- [ ] Limites freemium (20 messages, 3 polls) ✅
- [ ] Auth incentive ✅

**Bugs Identifiés :**
- [ ] Tous les bugs sont notés dans `BUGS-PRE-BETA.md`
- [ ] Chaque bug a une priorité (MUST/SHOULD/CAN)
- [ ] Chaque bug a un temps estimé

**Décision Bêta :**
- [ ] Si 0 bugs MUST FIX → Bêta possible ✅
- [ ] Si < 3 bugs MUST FIX → Corriger puis bêta
- [ ] Si > 3 bugs MUST FIX → Corriger priorités puis re-tester

---

## 📝 Rapport de Tests

### Template à remplir après les tests :

**Date des tests :** [Date]  
**Durée réelle :** [Temps]  
**Testeur :** [Nom]

**Résumé :**
- Scénarios testés : X/4
- Bugs trouvés : X
- Bugs MUST FIX : X
- Bugs SHOULD FIX : X
- Bugs CAN WAIT : X

**Conclusion :**
- [ ] ✅ Prêt pour bêta (0 bugs MUST FIX)
- [ ] ⚠️ Corrections nécessaires (liste dans BUGS-PRE-BETA.md)
- [ ] ❌ Problèmes majeurs (re-test complet nécessaire)

**Prochaines étapes :**
1. [Action 1]
2. [Action 2]
3. [Action 3]

---

**Bon courage pour les tests ! 🚀**
