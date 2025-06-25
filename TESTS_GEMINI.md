# 🧪 Plan de Tests - Intégration Gemini 2.5

## Objectif
Valider la génération intelligente de sondages par l'IA dans différents contextes d'usage.

---

## ✅ Test 1 : Réunion d'équipe urgente
**Prompt :** `"Réunion d'équipe urgente cette semaine en fin de journée"`

**Attendu :**
- 3-5 dates (lundi-vendredi de cette semaine)
- Créneaux horaires : 16h-18h ou 17h-19h
- Titre : "Réunion d'équipe urgente"
- Type : datetime

---

## ✅ Test 2 : Événement social long terme  
**Prompt :** `"Organiser un barbecue entre amis cet été"`

**Attendu :**
- 8-12 dates (week-ends de juin-août)
- Aucun créneau horaire spécifique
- Titre : "Barbecue entre amis - Été"
- Type : date

---

## ✅ Test 3 : Formation professionnelle
**Prompt :** `"Formation Excel les mardis matin pendant 6 semaines"`

**Attendu :**
- 6 dates (tous les mardis)
- Créneaux horaires : 9h-12h
- Titre : "Formation Excel - 6 semaines"
- Type : datetime

---

## ✅ Test 4 : Rendez-vous médical
**Prompt :** `"Rendez-vous médecin la semaine prochaine"`

**Attendu :**
- 3-5 dates (semaine prochaine)
- Créneaux horaires : 9h-17h (heures bureau)
- Titre : "Rendez-vous médical"
- Type : datetime

---

## ✅ Test 5 : Anniversaire avec contrainte
**Prompt :** `"Fête d'anniversaire samedi 15 ou dimanche 16 février"`

**Attendu :**
- 2 dates précises (15-16 février)
- Aucun créneau (toute la journée)
- Titre : "Fête d'anniversaire"
- Type : date

---

## ✅ Test 6 : Réunion client internationale
**Prompt :** `"Call client américain entre 14h et 16h cette semaine"`

**Attendu :**
- 3-5 dates (cette semaine)
- Créneaux précis : 14h-16h
- Titre : "Call client américain"
- Type : datetime

---

## ✅ Test 7 : Cours de sport récurrent
**Prompt :** `"Cours de yoga tous les jeudis soir pendant 2 mois"`

**Attendu :**
- 8-9 dates (tous les jeudis)
- Créneaux horaires : 18h-20h
- Titre : "Cours de yoga - 2 mois"
- Type : datetime

---

## ✅ Test 8 : Déménagement avec flexibilité
**Prompt :** `"Aide pour déménagement un week-end de mars ou avril"`

**Attendu :**
- 8-10 dates (week-ends mars-avril)
- Aucun créneau spécifique
- Titre : "Aide déménagement"
- Type : date

---

## ✅ Test 9 : Entretien d'embauche
**Prompt :** `"Entretiens candidats mardi 10h-12h ou jeudi 14h-16h"`

**Attendu :**
- 2 dates (mardi et jeudi proches)
- Créneaux précis : 10h-12h et 14h-16h
- Titre : "Entretiens candidats"
- Type : datetime

---

## ✅ Test 10 : Voyage de groupe
**Prompt :** `"Week-end ski entre potes en janvier ou février"`

**Attendu :**
- 6-8 dates (week-ends janvier-février)
- Aucun créneau horaire
- Titre : "Week-end ski entre potes"
- Type : date

---

## 📊 Critères de validation

### Pour chaque test, vérifier :

#### **Génération IA**
- [ ] Réponse JSON valide
- [ ] Titre approprié sans formatage
- [ ] Nombre de dates logique
- [ ] Dates futures uniquement
- [ ] Type correct (date/datetime)

#### **Affichage Chat**
- [ ] Message "Voici votre sondage :"
- [ ] Titre affiché correctement
- [ ] Grille de dates lisible
- [ ] Créneaux horaires (si applicable)
- [ ] Bouton "Éditer ce sondage"

#### **Pré-chargement PollCreator**
- [ ] Titre pré-rempli
- [ ] Dates sélectionnées dans le calendrier
- [ ] Créneaux horaires activés (si applicable)
- [ ] Aucune erreur console

#### **Cohérence contextuelle**
- [ ] Dates appropriées au contexte
- [ ] Horaires logiques (bureau/soirée/week-end)
- [ ] Nombre d'options raisonnable
- [ ] Titre descriptif et court

---

## 🎯 Objectifs de performance

- **Temps de réponse** : < 3 secondes
- **Taux de succès** : 100% des tests passent
- **Précision contextuelle** : dates et horaires appropriés
- **UX fluide** : passage IA → Édition sans friction

---

## 📝 Notes pour les tests

1. **Tester dans l'ordre** pour valider la progression
2. **Vérifier la console** pour les logs de débogage
3. **Noter les anomalies** dans les générations
4. **Valider le pré-chargement** à chaque fois
5. **Tester sur mobile** si possible

---

*Tests créés le : `date +%Y-%m-%d`*
*Version DooDates : v2.4.8 + Gemini 2.5* 