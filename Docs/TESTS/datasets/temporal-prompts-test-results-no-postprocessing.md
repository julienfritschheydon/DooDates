# Résultats des tests réels - Prompts temporels PARTIEL/NOK

**Date** : 2025-12-05
**Tests exécutés** : 18
**Tests réussis** : 9/18

## Résultats détaillés

### Propose-moi trois créneaux mardi ou mercredi prochain pour la démo client.

**ID** : demo-client-mardi-mercredi
**Score** : 0.90/1.0 - ❌ ÉCHEC

**Résultat** :
- Dates générées : 2
- Créneaux générés : 6

**Créneaux détaillés** :
1. 09:00-10:00 (60min) sur 2025-12-09
2. 10:00-11:00 (60min) sur 2025-12-09
3. 11:00-12:00 (60min) sur 2025-12-09
4. 09:00-10:00 (60min) sur 2025-12-10
5. 10:00-11:00 (60min) sur 2025-12-10
6. 11:00-12:00 (60min) sur 2025-12-10

**Violations** :
- ❌ Trop de créneaux: 6 > 3

**💡 Avis** :
⚠️ **À améliorer** : Le post-processor n'a pas complètement résolu le problème. Violations détectées : Trop de créneaux: 6 > 3.

---

### Planifie une séance photo familiale un dimanche matin en décembre (avant fin décembre).

**ID** : seance-photo-decembre
**Score** : 1.00/1.0 - ✅ RÉUSSI

**Résultat** :
- Dates générées : 2
- Créneaux générés : 2

**Créneaux détaillés** :
1. 09:00-12:00 (180min) sur 2025-12-21
2. 09:00-12:00 (180min) sur 2025-12-28

**💡 Avis** :
✅ **Amélioration confirmée** : Le post-processor a résolu le problème initial. Le prompt était marqué "NOK" car nok – gemini reste bloqué sur novembre et n'ajoute pas les créneaux matinaux attendus.. Le résultat est maintenant directement utilisable.

---

### Cale la réunion parents-profs entre mardi et jeudi prochains.

**ID** : reunion-parents-profs
**Score** : 1.00/1.0 - ✅ RÉUSSI

**Résultat** :
- Dates générées : 2
- Créneaux générés : 2

**Créneaux détaillés** :
1. 18:30-20:00 (90min) sur 2025-12-09
2. 18:30-20:00 (90min) sur 2025-12-11

**💡 Avis** :
✅ **Amélioration confirmée** : Le post-processor a résolu le problème initial. Le prompt était marqué "PARTIEL" car partiel – dates correctes dans la fenêtre cible, mais absence des créneaux soirée attendus.. Le résultat est maintenant directement utilisable.

---

### Propose un créneau samedi 10h pour la réunion de préparation kermesse.

**ID** : kermesse-samedi-10h
**Score** : 1.00/1.0 - ✅ RÉUSSI

**Résultat** :
- Dates générées : 1
- Créneaux générés : 1

**Créneaux détaillés** :
1. 10:00-11:00 (60min) sur 2025-12-06

**💡 Avis** :
✅ **Amélioration confirmée** : Le post-processor a résolu le problème initial. Le prompt était marqué "NOK" car nok – ignore la contrainte du samedi 10h et ne fournit aucun créneau.. Le résultat est maintenant directement utilisable.

---

### Cherche une disponibilité mercredi ou vendredi pour l'aide aux devoirs.

**ID** : aide-devoirs-mercredi-vendredi
**Score** : 1.00/1.0 - ✅ RÉUSSI

**Résultat** :
- Dates générées : 2
- Créneaux générés : 2

**Créneaux détaillés** :
1. 17:00-18:00 (60min) sur 2025-12-10
2. 18:00-19:00 (60min) sur 2025-12-12

**💡 Avis** :
✅ **Amélioration confirmée** : Le post-processor a résolu le problème initial. Le prompt était marqué "NOK" car nok – jours valides mais aucun créneau précis n'est fourni.. Le résultat est maintenant directement utilisable.

---

### Planifie une répétition chorale samedi matin ou dimanche après-midi.

**ID** : repetition-chorale
**Score** : 1.00/1.0 - ✅ RÉUSSI

**Résultat** :
- Dates générées : 2
- Créneaux générés : 2

**Créneaux détaillés** :
1. 10:00-12:00 (120min) sur 2025-12-06
2. 15:00-17:00 (120min) sur 2025-12-07

**💡 Avis** :
✅ **Amélioration confirmée** : Le post-processor a résolu le problème initial. Le prompt était marqué "PARTIEL" car partiel – jours pertinents mais absence des créneaux matin/après-midi attendus.. Le résultat est maintenant directement utilisable.

---

### Cherche un créneau entre 11h et 13h mercredi pour un déjeuner partenariats.

**ID** : dejeuner-partenariats-mercredi
**Score** : 0.00/1.0 - ❌ ÉCHEC

**Résultat** :
- Dates générées : 0
- Créneaux générés : 0

**Violations** :
- ❌ Échec génération: Impossible de générer le sondage à partir de votre demande

**💡 Avis** :
⚠️ **À améliorer** : Le post-processor n'a pas complètement résolu le problème. Violations détectées : Échec génération: Impossible de générer le sondage à partir de votre demande.

---

### Calcule un brunch samedi 23 ou dimanche 24.

**ID** : brunch-samedi-23-dimanche-24
**Score** : 1.00/1.0 - ✅ RÉUSSI

**Résultat** :
- Dates générées : 2
- Créneaux générés : 2

**Créneaux détaillés** :
1. 11:30-13:00 (90min) sur 2025-12-27
2. 11:30-13:00 (90min) sur 2025-12-21

**💡 Avis** :
✅ **Amélioration confirmée** : Le post-processor a résolu le problème initial. Le prompt était marqué "PARTIEL" car partiel – deux créneaux conformes mais positionnés mi-novembre au lieu du week-end 23/24 visé.. Le résultat est maintenant directement utilisable.

---

### Propose trois soirées pour un escape game fin mars.

**ID** : escape-game-fin-mars
**Score** : 1.00/1.0 - ✅ RÉUSSI

**Résultat** :
- Dates générées : 3
- Créneaux générés : 3

**Créneaux détaillés** :
1. 19:00-21:00 (120min) sur 2026-03-27, 2026-03-28, 2026-03-29

**💡 Avis** :
✅ **Amélioration confirmée** : Le post-processor a résolu le problème initial. Le prompt était marqué "PARTIEL" car partiel – horaires cohérents, mais positionnés sur mi-novembre au lieu de la fin mars demandée.. Le résultat est maintenant directement utilisable.

---

### Organise un dîner avec les cousins courant avril, plutôt le week-end.

**ID** : diner-cousins-avril
**Score** : 0.90/1.0 - ❌ ÉCHEC

**Résultat** :
- Dates générées : 8
- Créneaux générés : 8

**Créneaux détaillés** :
1. 19:00-21:00 (120min) sur 2026-04-04, 2026-04-05, 2026-04-11, 2026-04-12, 2026-04-18, 2026-04-19, 2026-04-25, 2026-04-26

**Violations** :
- ❌ Trop de créneaux: 8 > 4

**💡 Avis** :
⚠️ **À améliorer** : Le post-processor n'a pas complètement résolu le problème. Violations détectées : Trop de créneaux: 8 > 4.

---

### Trouve une date pour l'anniversaire de Léa autour du 15 mai.

**ID** : anniversaire-lea-15-mai
**Score** : 0.50/1.0 - ❌ ÉCHEC

**Résultat** :
- Dates générées : 5
- Créneaux générés : 0

**Violations** :
- ❌ Absence de créneaux horaires
- ❌ Trop peu de créneaux: 0 < 2

**💡 Avis** :
⚠️ **À améliorer** : Le post-processor n'a pas complètement résolu le problème. Violations détectées : Absence de créneaux horaires, Trop peu de créneaux: 0 < 2.

---

### Cherche une soirée disponible entre amis pour un apéro d'ici trois semaines.

**ID** : apero-amis-trois-semaines
**Score** : 0.90/1.0 - ❌ ÉCHEC

**Résultat** :
- Dates générées : 4
- Créneaux générés : 7

**Créneaux détaillés** :
1. 18:30-21:00 (150min) sur 2025-12-02, 2025-12-03, 2025-12-04, 2025-12-05, 2025-12-06, 2025-12-07, 2025-12-08

**Violations** :
- ❌ Trop de créneaux: 7 > 5

**💡 Avis** :
⚠️ **À améliorer** : Le post-processor n'a pas complètement résolu le problème. Violations détectées : Trop de créneaux: 7 > 5.

---

### Trouve un après-midi libre la semaine prochaine pour la visite au musée.

**ID** : visite-musee-semaine-prochaine
**Score** : 0.90/1.0 - ❌ ÉCHEC

**Résultat** :
- Dates générées : 5
- Créneaux générés : 21

**Créneaux détaillés** :
1. 14:00-16:00 (120min) sur 2025-12-03, 2025-12-04, 2025-12-05, 2025-12-06, 2025-12-07, 2025-12-08, 2025-12-09
2. 14:30-16:30 (120min) sur 2025-12-03, 2025-12-04, 2025-12-05, 2025-12-06, 2025-12-07, 2025-12-08, 2025-12-09
3. 15:00-17:00 (120min) sur 2025-12-03, 2025-12-04, 2025-12-05, 2025-12-06, 2025-12-07, 2025-12-08, 2025-12-09

**Violations** :
- ❌ Trop de créneaux: 21 > 3

**💡 Avis** :
⚠️ **À améliorer** : Le post-processor n'a pas complètement résolu le problème. Violations détectées : Trop de créneaux: 21 > 3.

---

### Bloque un créneau vendredi soir ou samedi matin pour un footing.

**ID** : footing-vendredi-samedi
**Score** : 1.00/1.0 - ✅ RÉUSSI

**Résultat** :
- Dates générées : 2
- Créneaux générés : 2

**Créneaux détaillés** :
1. 18:00-19:00 (60min) sur 2025-12-05
2. 08:00-09:00 (60min) sur 2025-12-06

**💡 Avis** :
✅ **Amélioration confirmée** : Le post-processor a résolu le problème initial. Le prompt était marqué "PARTIEL" car partiel – couvre les bonnes journées et plages globales, mais ajoute trop de créneaux étendus.. Le résultat est maintenant directement utilisable.

---

### Organise deux dates en soirée pour l'atelier bénévoles, semaine du 12.

**ID** : atelier-benevoles-semaine-12
**Score** : 0.90/1.0 - ❌ ÉCHEC

**Résultat** :
- Dates générées : 7
- Créneaux générés : 35

**Créneaux détaillés** :
1. 18:30-19:00 (30min) sur 2025-12-08, 2025-12-09, 2025-12-10, 2025-12-11, 2025-12-12, 2025-12-13, 2025-12-14
2. 19:00-19:30 (30min) sur 2025-12-08, 2025-12-09, 2025-12-10, 2025-12-11, 2025-12-12, 2025-12-13, 2025-12-14
3. 19:30-20:00 (30min) sur 2025-12-08, 2025-12-09, 2025-12-10, 2025-12-11, 2025-12-12, 2025-12-13, 2025-12-14
4. 20:00-20:30 (30min) sur 2025-12-08, 2025-12-09, 2025-12-10, 2025-12-11, 2025-12-12, 2025-12-13, 2025-12-14
5. 20:30-21:00 (30min) sur 2025-12-08, 2025-12-09, 2025-12-10, 2025-12-11, 2025-12-12, 2025-12-13, 2025-12-14

**Violations** :
- ❌ Trop de créneaux: 35 > 2

**💡 Avis** :
⚠️ **À améliorer** : Le post-processor n'a pas complètement résolu le problème. Violations détectées : Trop de créneaux: 35 > 2.

---

### Planifie la distribution de flyers sur un week-end fin avril.

**ID** : distribution-flyers-fin-avril
**Score** : 1.00/1.0 - ✅ RÉUSSI

**Résultat** :
- Dates générées : 2
- Créneaux générés : 2

**Créneaux détaillés** :
1. 09:00-11:00 (120min) sur 2026-04-25
2. 14:00-16:00 (120min) sur 2026-04-26

**💡 Avis** :
✅ **Amélioration confirmée** : Le post-processor a résolu le problème initial. Le prompt était marqué "PARTIEL" car partiel – bon format week-end mais ne différencie pas matin/après-midi.. Le résultat est maintenant directement utilisable.

---

### Planifie une réunion d'équipe éducative avant les vacances, matinée uniquement.

**ID** : reunion-equipe-educative
**Score** : 0.90/1.0 - ❌ ÉCHEC

**Résultat** :
- Dates générées : 3
- Créneaux générés : 30

**Créneaux détaillés** :
1. 09:00-09:30 (30min) sur 2025-12-03, 2025-12-04, 2025-12-05, 2025-12-08, 2025-12-09
2. 09:30-10:00 (30min) sur 2025-12-03, 2025-12-04, 2025-12-05, 2025-12-08, 2025-12-09
3. 10:00-10:30 (30min) sur 2025-12-03, 2025-12-04, 2025-12-05, 2025-12-08, 2025-12-09
4. 10:30-11:00 (30min) sur 2025-12-03, 2025-12-04, 2025-12-05, 2025-12-08, 2025-12-09
5. 11:00-11:30 (30min) sur 2025-12-03, 2025-12-04, 2025-12-05, 2025-12-08, 2025-12-09
6. 11:30-12:00 (30min) sur 2025-12-03, 2025-12-04, 2025-12-05, 2025-12-08, 2025-12-09

**Violations** :
- ❌ Trop de créneaux: 30 > 4

**💡 Avis** :
⚠️ **À améliorer** : Le post-processor n'a pas complètement résolu le problème. Violations détectées : Trop de créneaux: 30 > 4.

---

### Prévois le comité de quartier dans quinze jours, plutôt en début de soirée.

**ID** : comite-quartier-quinze-jours
**Score** : 0.90/1.0 - ❌ ÉCHEC

**Résultat** :
- Dates générées : 4
- Créneaux générés : 35

**Créneaux détaillés** :
1. 18:30-19:00 (30min) sur 2025-12-02, 2025-12-03, 2025-12-04, 2025-12-05, 2025-12-06, 2025-12-07, 2025-12-08
2. 19:00-19:30 (30min) sur 2025-12-02, 2025-12-03, 2025-12-04, 2025-12-05, 2025-12-06, 2025-12-07, 2025-12-08
3. 19:30-20:00 (30min) sur 2025-12-02, 2025-12-03, 2025-12-04, 2025-12-05, 2025-12-06, 2025-12-07, 2025-12-08
4. 20:00-20:30 (30min) sur 2025-12-02, 2025-12-03, 2025-12-04, 2025-12-05, 2025-12-06, 2025-12-07, 2025-12-08
5. 20:30-21:00 (30min) sur 2025-12-02, 2025-12-03, 2025-12-04, 2025-12-05, 2025-12-06, 2025-12-07, 2025-12-08

**Violations** :
- ❌ Trop de créneaux: 35 > 3

**💡 Avis** :
⚠️ **À améliorer** : Le post-processor n'a pas complètement résolu le problème. Violations détectées : Trop de créneaux: 35 > 3.

---

