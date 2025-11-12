# Résultats des tests réels - Prompts temporels PARTIEL/NOK

**Date** : 2025-11-12
**Tests exécutés** : 19
**Tests réussis** : 10/19

## Résultats détaillés

### Propose-moi trois créneaux mardi ou mercredi prochain pour la démo client.

**ID** : demo-client-mardi-mercredi
**Score** : 1.00/1.0 - ✅ RÉUSSI

**Résultat** :
- Dates générées : 3
- Créneaux générés : 3

**Créneaux détaillés** :
1. 09:00-10:00 (60min) sur 2025-11-17, 2025-11-18, 2025-11-19
2. 11:00-12:00 (60min) sur 2025-11-17, 2025-11-18, 2025-11-19
3. 14:00-15:00 (60min) sur 2025-11-17, 2025-11-18, 2025-11-19

**💡 Avis** :
✅ **Amélioration confirmée** : Le post-processor a résolu le problème initial. Le prompt était marqué "PARTIEL" car partiel – bonnes dates dans la fenêtre, mais absence totale d'horaires précis pour la démo.. Le résultat est maintenant directement utilisable.

---

### Planifie une séance photo familiale un dimanche matin en décembre (avant fin décembre).

**ID** : seance-photo-decembre
**Score** : 0.80/1.0 - ❌ ÉCHEC

**Résultat** :
- Dates générées : 2
- Créneaux générés : 1

**Créneaux détaillés** :
1. 09:00-12:00 (180min) sur 2025-11-16

**Violations** :
- ❌ Trop peu de créneaux: 1 < 2

**💡 Avis** :
⚠️ **À améliorer** : Le post-processor n'a pas complètement résolu le problème. Violations détectées : Trop peu de créneaux: 1 < 2.

---

### Cale la réunion parents-profs entre mardi et jeudi prochains.

**ID** : reunion-parents-profs
**Score** : 1.00/1.0 - ✅ RÉUSSI

**Résultat** :
- Dates générées : 3
- Créneaux générés : 2

**Créneaux détaillés** :
1. 18:30-20:00 (90min) sur 2025-11-18
2. 18:30-20:00 (90min) sur 2025-11-20

**💡 Avis** :
✅ **Amélioration confirmée** : Le post-processor a résolu le problème initial. Le prompt était marqué "PARTIEL" car partiel – dates correctes dans la fenêtre cible, mais absence des créneaux soirée attendus.. Le résultat est maintenant directement utilisable.

---

### Propose un créneau samedi 10h pour la réunion de préparation kermesse.

**ID** : kermesse-samedi-10h
**Score** : 1.00/1.0 - ✅ RÉUSSI

**Résultat** :
- Dates générées : 5
- Créneaux générés : 1

**Créneaux détaillés** :
1. 10:00-11:00 (60min) sur 2025-11-12

**💡 Avis** :
✅ **Amélioration confirmée** : Le post-processor a résolu le problème initial. Le prompt était marqué "NOK" car nok – ignore la contrainte du samedi 10h et ne fournit aucun créneau.. Le résultat est maintenant directement utilisable.

---

### Cherche une disponibilité mercredi ou vendredi pour l'aide aux devoirs.

**ID** : aide-devoirs-mercredi-vendredi
**Score** : 1.00/1.0 - ✅ RÉUSSI

**Résultat** :
- Dates générées : 7
- Créneaux générés : 2

**Créneaux détaillés** :
1. 17:00-18:00 (60min) sur 2025-11-19
2. 18:00-19:00 (60min) sur 2025-11-21

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
1. 10:00-12:00 (120min) sur 2025-11-15
2. 15:00-17:00 (120min) sur 2025-11-16

**💡 Avis** :
✅ **Amélioration confirmée** : Le post-processor a résolu le problème initial. Le prompt était marqué "PARTIEL" car partiel – jours pertinents mais absence des créneaux matin/après-midi attendus.. Le résultat est maintenant directement utilisable.

---

### Cherche un créneau entre 11h et 13h mercredi pour un déjeuner partenariats.

**ID** : dejeuner-partenariats-mercredi
**Score** : 1.00/1.0 - ✅ RÉUSSI

**Résultat** :
- Dates générées : 1
- Créneaux générés : 3

**Créneaux détaillés** :
1. 11:00-12:00 (60min) sur 2025-11-13
2. 11:30-12:30 (60min) sur 2025-11-13
3. 12:00-13:00 (60min) sur 2025-11-13

**💡 Avis** :
✅ **Amélioration confirmée** : Le post-processor a résolu le problème initial. Le prompt était marqué "PARTIEL" car partiel – nombreux créneaux conformes, mais gemini propose aussi jeudi/vendredi/samedi (hors mercredi).. Le résultat est maintenant directement utilisable.

---

### Calcule un brunch samedi 23 ou dimanche 24.

**ID** : brunch-samedi-23-dimanche-24
**Score** : 0.80/1.0 - ❌ ÉCHEC

**Résultat** :
- Dates générées : 2
- Créneaux générés : 2

**Créneaux détaillés** :
1. 10:00-11:00 (60min) sur 2025-11-15
2. 10:00-11:00 (60min) sur 2025-11-16

**Violations** :
- ❌ Plage horaire incorrecte (attendu: 11:30-13:00)

**💡 Avis** :
⚠️ **À améliorer** : Le post-processor n'a pas complètement résolu le problème. Violations détectées : Plage horaire incorrecte (attendu: 11:30-13:00).

---

### Propose trois soirées pour un escape game fin mars.

**ID** : escape-game-fin-mars
**Score** : 0.90/1.0 - ❌ ÉCHEC

**Résultat** :
- Dates générées : 4
- Créneaux générés : 12

**Créneaux détaillés** :
1. 18:00-19:00 (60min) sur 2025-11-13
2. 19:00-20:00 (60min) sur 2025-11-13
3. 20:00-21:00 (60min) sur 2025-11-13
4. 18:00-19:00 (60min) sur 2025-11-14
5. 19:00-20:00 (60min) sur 2025-11-14
6. 20:00-21:00 (60min) sur 2025-11-14
7. 18:00-19:00 (60min) sur 2025-11-15
8. 19:00-20:00 (60min) sur 2025-11-15
9. 20:00-21:00 (60min) sur 2025-11-15
10. 18:00-19:00 (60min) sur 2025-11-16
11. 19:00-20:00 (60min) sur 2025-11-16
12. 20:00-21:00 (60min) sur 2025-11-16

**Violations** :
- ❌ Trop de créneaux: 12 > 3

**💡 Avis** :
⚠️ **À améliorer** : Le post-processor n'a pas complètement résolu le problème. Violations détectées : Trop de créneaux: 12 > 3.

---

### Organise un dîner avec les cousins courant avril, plutôt le week-end.

**ID** : diner-cousins-avril
**Score** : 1.00/1.0 - ✅ RÉUSSI

**Résultat** :
- Dates générées : 2
- Créneaux générés : 2

**Créneaux détaillés** :
1. 19:00-20:00 (60min) sur 2026-04-04
2. 19:00-20:00 (60min) sur 2026-04-05

**💡 Avis** :
✅ **Amélioration confirmée** : Le post-processor a résolu le problème initial. Le prompt était marqué "PARTIEL" car partiel – bon mois et cadence week-end, mais gemini bascule sur avril 2026 et ne varie pas les horaires.. Le résultat est maintenant directement utilisable.

---

### Trouve une date pour l'anniversaire de Léa autour du 15 mai.

**ID** : anniversaire-lea-15-mai
**Score** : 1.00/1.0 - ✅ RÉUSSI

**Résultat** :
- Dates générées : 7
- Créneaux générés : 3

**Créneaux détaillés** :
1. 09:00-10:00 (60min) sur 2026-05-12, 2026-05-13, 2026-05-14, 2026-05-15, 2026-05-16, 2026-05-17, 2026-05-18
2. 11:00-12:00 (60min) sur 2026-05-12, 2026-05-13, 2026-05-14, 2026-05-15, 2026-05-16, 2026-05-17, 2026-05-18
3. 14:00-15:00 (60min) sur 2026-05-12, 2026-05-13, 2026-05-14, 2026-05-15, 2026-05-16, 2026-05-17, 2026-05-18

**💡 Avis** :
✅ **Amélioration confirmée** : Le post-processor a résolu le problème initial. Le prompt était marqué "PARTIEL" car partiel – couvre bien la fenêtre autour du 15 mai mais ne se limite pas aux week-ends et oublie les horaires festifs.. Le résultat est maintenant directement utilisable.

---

### Cherche une soirée disponible entre amis pour un apéro d'ici trois semaines.

**ID** : apero-amis-trois-semaines
**Score** : 1.00/1.0 - ✅ RÉUSSI

**Résultat** :
- Dates générées : 4
- Créneaux générés : 4

**Créneaux détaillés** :
1. 18:00-20:00 (120min) sur 2025-11-13
2. 18:00-20:00 (120min) sur 2025-11-14
3. 18:00-20:00 (120min) sur 2025-11-15
4. 18:00-20:00 (120min) sur 2025-11-16

**💡 Avis** :
✅ **Amélioration confirmée** : Le post-processor a résolu le problème initial. Le prompt était marqué "PARTIEL" car partiel – bonnes plages horaires, mais gemini se limite à quatre dates consécutives au lieu de suggérer des options dispersées sur trois semaines.. Le résultat est maintenant directement utilisable.

---

### Trouve un après-midi libre la semaine prochaine pour la visite au musée.

**ID** : visite-musee-semaine-prochaine
**Score** : 0.90/1.0 - ❌ ÉCHEC

**Résultat** :
- Dates générées : 4
- Créneaux générés : 44

**Créneaux détaillés** :
1. 12:00-13:00 (60min) sur 2025-11-13
2. 12:30-13:30 (60min) sur 2025-11-13
3. 13:00-14:00 (60min) sur 2025-11-13
4. 13:30-14:30 (60min) sur 2025-11-13
5. 14:00-15:00 (60min) sur 2025-11-13
6. 14:30-15:30 (60min) sur 2025-11-13
7. 15:00-16:00 (60min) sur 2025-11-13
8. 15:30-16:30 (60min) sur 2025-11-13
9. 16:00-17:00 (60min) sur 2025-11-13
10. 16:30-17:30 (60min) sur 2025-11-13
11. 17:00-18:00 (60min) sur 2025-11-13
12. 12:00-13:00 (60min) sur 2025-11-14
13. 12:30-13:30 (60min) sur 2025-11-14
14. 13:00-14:00 (60min) sur 2025-11-14
15. 13:30-14:30 (60min) sur 2025-11-14
16. 14:00-15:00 (60min) sur 2025-11-14
17. 14:30-15:30 (60min) sur 2025-11-14
18. 15:00-16:00 (60min) sur 2025-11-14
19. 15:30-16:30 (60min) sur 2025-11-14
20. 16:00-17:00 (60min) sur 2025-11-14
21. 16:30-17:30 (60min) sur 2025-11-14
22. 17:00-18:00 (60min) sur 2025-11-14
23. 12:00-13:00 (60min) sur 2025-11-15
24. 12:30-13:30 (60min) sur 2025-11-15
25. 13:00-14:00 (60min) sur 2025-11-15
26. 13:30-14:30 (60min) sur 2025-11-15
27. 14:00-15:00 (60min) sur 2025-11-15
28. 14:30-15:30 (60min) sur 2025-11-15
29. 15:00-16:00 (60min) sur 2025-11-15
30. 15:30-16:30 (60min) sur 2025-11-15
31. 16:00-17:00 (60min) sur 2025-11-15
32. 16:30-17:30 (60min) sur 2025-11-15
33. 17:00-18:00 (60min) sur 2025-11-15
34. 12:00-13:00 (60min) sur 2025-11-16
35. 12:30-13:30 (60min) sur 2025-11-16
36. 13:00-14:00 (60min) sur 2025-11-16
37. 13:30-14:30 (60min) sur 2025-11-16
38. 14:00-15:00 (60min) sur 2025-11-16
39. 14:30-15:30 (60min) sur 2025-11-16
40. 15:00-16:00 (60min) sur 2025-11-16
41. 15:30-16:30 (60min) sur 2025-11-16
42. 16:00-17:00 (60min) sur 2025-11-16
43. 16:30-17:30 (60min) sur 2025-11-16
44. 17:00-18:00 (60min) sur 2025-11-16

**Violations** :
- ❌ Trop de créneaux: 44 > 3

**💡 Avis** :
⚠️ **À améliorer** : Le post-processor n'a pas complètement résolu le problème. Violations détectées : Trop de créneaux: 44 > 3.

---

### Bloque un créneau vendredi soir ou samedi matin pour un footing.

**ID** : footing-vendredi-samedi
**Score** : 0.90/1.0 - ❌ ÉCHEC

**Résultat** :
- Dates générées : 2
- Créneaux générés : 12

**Créneaux détaillés** :
1. 18:00-19:00 (60min) sur 2025-11-14
2. 18:30-19:30 (60min) sur 2025-11-14
3. 19:00-20:00 (60min) sur 2025-11-14
4. 19:30-20:30 (60min) sur 2025-11-14
5. 20:00-21:00 (60min) sur 2025-11-14
6. 08:00-09:00 (60min) sur 2025-11-15
7. 08:30-09:30 (60min) sur 2025-11-15
8. 09:00-10:00 (60min) sur 2025-11-15
9. 09:30-10:30 (60min) sur 2025-11-15
10. 10:00-11:00 (60min) sur 2025-11-15
11. 10:30-11:30 (60min) sur 2025-11-15
12. 11:00-12:00 (60min) sur 2025-11-15

**Violations** :
- ❌ Trop de créneaux: 12 > 3

**💡 Avis** :
⚠️ **À améliorer** : Le post-processor n'a pas complètement résolu le problème. Violations détectées : Trop de créneaux: 12 > 3.

---

### Trouve-nous un créneau en visio après 18h pour le point trésorerie.

**ID** : visio-tresorerie-apres-18h
**Score** : 1.00/1.0 - ✅ RÉUSSI

**Résultat** :
- Dates générées : 5
- Créneaux générés : 2

**Créneaux détaillés** :
1. 18:00-19:00 (60min) sur 2025-11-12
2. 18:30-19:30 (60min) sur 2025-11-12

**💡 Avis** :
✅ **Amélioration confirmée** : Le post-processor a résolu le problème initial. Le prompt était marqué "PARTIEL" car partiel – bonnes plages après 18h mais quantité excessive de créneaux.. Le résultat est maintenant directement utilisable.

---

### Organise deux dates en soirée pour l'atelier bénévoles, semaine du 12.

**ID** : atelier-benevoles-semaine-12
**Score** : 0.90/1.0 - ❌ ÉCHEC

**Résultat** :
- Dates générées : 5
- Créneaux générés : 25

**Créneaux détaillés** :
1. 18:00-19:00 (60min) sur 2025-11-12
2. 18:30-19:30 (60min) sur 2025-11-12
3. 19:00-20:00 (60min) sur 2025-11-12
4. 19:30-20:30 (60min) sur 2025-11-12
5. 20:00-21:00 (60min) sur 2025-11-12
6. 18:00-19:00 (60min) sur 2025-11-13
7. 18:30-19:30 (60min) sur 2025-11-13
8. 19:00-20:00 (60min) sur 2025-11-13
9. 19:30-20:30 (60min) sur 2025-11-13
10. 20:00-21:00 (60min) sur 2025-11-13
11. 18:00-19:00 (60min) sur 2025-11-14
12. 18:30-19:30 (60min) sur 2025-11-14
13. 19:00-20:00 (60min) sur 2025-11-14
14. 19:30-20:30 (60min) sur 2025-11-14
15. 20:00-21:00 (60min) sur 2025-11-14
16. 18:00-19:00 (60min) sur 2025-11-15
17. 18:30-19:30 (60min) sur 2025-11-15
18. 19:00-20:00 (60min) sur 2025-11-15
19. 19:30-20:30 (60min) sur 2025-11-15
20. 20:00-21:00 (60min) sur 2025-11-15
21. 18:00-19:00 (60min) sur 2025-11-16
22. 18:30-19:30 (60min) sur 2025-11-16
23. 19:00-20:00 (60min) sur 2025-11-16
24. 19:30-20:30 (60min) sur 2025-11-16
25. 20:00-21:00 (60min) sur 2025-11-16

**Violations** :
- ❌ Trop de créneaux: 25 > 2

**💡 Avis** :
⚠️ **À améliorer** : Le post-processor n'a pas complètement résolu le problème. Violations détectées : Trop de créneaux: 25 > 2.

---

### Planifie la distribution de flyers sur un week-end fin avril.

**ID** : distribution-flyers-fin-avril
**Score** : 0.90/1.0 - ❌ ÉCHEC

**Résultat** :
- Dates générées : 2
- Créneaux générés : 3

**Créneaux détaillés** :
1. 09:00-10:00 (60min) sur 2026-04-25, 2026-04-26
2. 11:00-12:00 (60min) sur 2026-04-25, 2026-04-26
3. 14:00-15:00 (60min) sur 2026-04-25, 2026-04-26

**Violations** :
- ❌ Trop de créneaux: 3 > 2

**💡 Avis** :
⚠️ **À améliorer** : Le post-processor n'a pas complètement résolu le problème. Violations détectées : Trop de créneaux: 3 > 2.

---

### Planifie une réunion d'équipe éducative avant les vacances, matinée uniquement.

**ID** : reunion-equipe-educative
**Score** : 0.90/1.0 - ❌ ÉCHEC

**Résultat** :
- Dates générées : 3
- Créneaux générés : 24

**Créneaux détaillés** :
1. 08:00-09:00 (60min) sur 2025-11-12
2. 08:30-09:30 (60min) sur 2025-11-12
3. 09:00-10:00 (60min) sur 2025-11-12
4. 09:30-10:30 (60min) sur 2025-11-12
5. 10:00-11:00 (60min) sur 2025-11-12
6. 10:30-11:30 (60min) sur 2025-11-12
7. 11:00-12:00 (60min) sur 2025-11-12
8. 11:30-12:30 (60min) sur 2025-11-12
9. 08:00-09:00 (60min) sur 2025-11-13
10. 08:30-09:30 (60min) sur 2025-11-13
11. 09:00-10:00 (60min) sur 2025-11-13
12. 09:30-10:30 (60min) sur 2025-11-13
13. 10:00-11:00 (60min) sur 2025-11-13
14. 10:30-11:30 (60min) sur 2025-11-13
15. 11:00-12:00 (60min) sur 2025-11-13
16. 11:30-12:30 (60min) sur 2025-11-13
17. 08:00-09:00 (60min) sur 2025-11-14
18. 08:30-09:30 (60min) sur 2025-11-14
19. 09:00-10:00 (60min) sur 2025-11-14
20. 09:30-10:30 (60min) sur 2025-11-14
21. 10:00-11:00 (60min) sur 2025-11-14
22. 10:30-11:30 (60min) sur 2025-11-14
23. 11:00-12:00 (60min) sur 2025-11-14
24. 11:30-12:30 (60min) sur 2025-11-14

**Violations** :
- ❌ Trop de créneaux: 24 > 3

**💡 Avis** :
⚠️ **À améliorer** : Le post-processor n'a pas complètement résolu le problème. Violations détectées : Trop de créneaux: 24 > 3.

---

### Prévois le comité de quartier dans quinze jours, plutôt en début de soirée.

**ID** : comite-quartier-quinze-jours
**Score** : 0.90/1.0 - ❌ ÉCHEC

**Résultat** :
- Dates générées : 4
- Créneaux générés : 20

**Créneaux détaillés** :
1. 18:00-19:00 (60min) sur 2025-11-13
2. 18:30-19:30 (60min) sur 2025-11-13
3. 19:00-20:00 (60min) sur 2025-11-13
4. 19:30-20:30 (60min) sur 2025-11-13
5. 20:00-21:00 (60min) sur 2025-11-13
6. 18:00-19:00 (60min) sur 2025-11-14
7. 18:30-19:30 (60min) sur 2025-11-14
8. 19:00-20:00 (60min) sur 2025-11-14
9. 19:30-20:30 (60min) sur 2025-11-14
10. 20:00-21:00 (60min) sur 2025-11-14
11. 18:00-19:00 (60min) sur 2025-11-15
12. 18:30-19:30 (60min) sur 2025-11-15
13. 19:00-20:00 (60min) sur 2025-11-15
14. 19:30-20:30 (60min) sur 2025-11-15
15. 20:00-21:00 (60min) sur 2025-11-15
16. 18:00-19:00 (60min) sur 2025-11-16
17. 18:30-19:30 (60min) sur 2025-11-16
18. 19:00-20:00 (60min) sur 2025-11-16
19. 19:30-20:30 (60min) sur 2025-11-16
20. 20:00-21:00 (60min) sur 2025-11-16

**Violations** :
- ❌ Trop de créneaux: 20 > 2

**💡 Avis** :
⚠️ **À améliorer** : Le post-processor n'a pas complètement résolu le problème. Violations détectées : Trop de créneaux: 20 > 2.

---

