# Mapping des améliorations aux tests en échec

**Date**: 2025-11-21

## Résumé des échecs par catégorie

- **Bug #1 - Mois Explicite**: 5 tests, 40% réussite (2/5)
- **Realistic - Personnel**: 15 tests, 0% réussite (0/15)
- **Realistic - Associatif**: 9 tests, 0% réussite (0/9)
- **Temporal Edge Cases**: 10 tests, 0% réussite (0/10)
- **Edge Cases**: 2 tests, 50% réussite (1/2)

## Mapping détaillé : Amélioration → Tests résolus

### 1. Normalisation des mois français

**Problème identifié**: Chrono-node ne reconnaît pas les mois français seuls ("mars 2026", "mai 2026", "décembre 2025", "début mars", "fin mars", "en mars")

**Solution**: Normaliser les noms de mois français avant d'appeler chrono-node

**Tests résolus**:

- `bug1-1`: "Crée un sondage pour un week-end jeux. Ajoute tous les samedis de mars 2026" → Cause: "mars 2026" non détecté
- `bug1-3`: "Planifie un événement tous les samedis de mai 2026" → Cause: "mai 2026" non détecté
- `bug1-4`: "Crée un sondage pour les dimanches de décembre 2025" → Cause: "décembre 2025" non détecté (date passée aussi)
- `realistic-2`: "Propose trois soirées pour un escape game fin mars." → Cause: "fin mars" non détecté
- `realistic-5`: "Organise un dîner avec les cousins courant avril, plutôt le week-end." → Cause: "avril" non détecté
- `realistic-6`: "Trouve une date pour l'anniversaire de Léa autour du 15 mai." → Cause: "mai" non détecté
- `realistic-7`: "Repère un week-end où partir deux jours en juin." → Cause: "juin" non détecté
- `realistic-11`: "Planifie l'AG de l'association début mars." → Cause: "début mars" non détecté
- `realistic-12`: "Trouve une date pour le tournoi de pétanque en juillet." → Cause: "juillet" non détecté
- `realistic-15`: "Propose deux dates pour la soirée de gala en novembre." → Cause: "novembre" non détecté
- `date-event-4`: "Trouve une date pour célébrer l'anniversaire de Marie en décembre" → Cause: "décembre" non détecté

**Impact**: ~12 tests

---

### 2. Distinction "ou" vs "et" pour les jours

**Problème identifié**: La validation exige tous les jours mentionnés au lieu d'accepter n'importe quel jour de la liste quand "ou" est utilisé

**Solution**: Détecter "ou" vs "et" dans le prompt. Si "ou" → accepter n'importe quel jour (au moins 1), si "et" → exiger tous les jours

**Tests résolus**:

- `realistic-1`: "Calcule un brunch samedi 23 ou dimanche 24." → Cause: Validation exige les deux jours au lieu d'accepter l'un ou l'autre
- `realistic-4`: "Bloque un créneau vendredi soir ou samedi matin pour un footing." → Cause: Validation exige les deux jours
- `realistic-10`: "Trouve un créneau pour un ciné mardi ou mercredi soir." → Cause: Validation exige les deux jours
- `edge-1`: "prévois un brunch samedi ou dimanche" → Cause: Validation exige les deux jours
- `edge-2`: "Bloque un créneau vendredi soir ou samedi matin pour un footing." → Cause: Validation exige les deux jours
- `date-reunion-2`: "Créé un sondage pour un point mensuel mardi ou mercredi après-midi" → Cause: Validation exige les deux jours
- `temporal-1`: "Propose-moi trois créneaux mardi ou mercredi prochain pour la démo client." → Cause: Validation exige les deux jours
- `temporal-6`: "Planifie la réunion de lancement la semaine prochaine, idéalement mardi 14h ou jeudi 10h." → Cause: Validation exige les deux jours
- `temporal-8`: "Bloque 45 minutes lundi ou mardi matin pour faire le point prod." → Cause: Validation exige les deux jours
- `date-formation-4`: "Planifie un webinaire technique lundi ou mardi entre 10h et 12h" → Cause: Validation exige les deux jours

**Impact**: ~10 tests

---

### 3. Contraintes d'horaires optionnelles

**Problème identifié**: Les contraintes d'horaires sont trop strictes quand le prompt ne spécifie pas explicitement une plage horaire

**Solution**: Si le prompt ne mentionne pas explicitement une plage horaire ("entre 8h et 12h"), rendre la validation optionnelle ou plus souple

**Tests résolus**:

- `realistic-1`: "Calcule un brunch samedi 23 ou dimanche 24." → Cause: Pas de plage horaire explicite mais expectedTimeConstraints défini
- `realistic-3`: "Trouve un après-midi libre la semaine prochaine pour la visite au musée." → Cause: "après-midi" est vague, pas de plage explicite
- `realistic-5`: "Organise un dîner avec les cousins courant avril, plutôt le week-end." → Cause: Pas de plage horaire explicite
- `realistic-6`: "Trouve une date pour l'anniversaire de Léa autour du 15 mai." → Cause: Pas de plage horaire explicite
- `realistic-7`: "Repère un week-end où partir deux jours en juin." → Cause: Pas de plage horaire explicite
- `realistic-11`: "Planifie l'AG de l'association début mars." → Cause: Pas de plage horaire explicite
- `realistic-12`: "Trouve une date pour le tournoi de pétanque en juillet." → Cause: Pas de plage horaire explicite
- `realistic-15`: "Propose deux dates pour la soirée de gala en novembre." → Cause: Pas de plage horaire explicite
- `temporal-2`: "Planifie un point budget dans deux semaines autour de 9h30." → Cause: "autour de 9h30" est vague, pas de plage explicite
- `temporal-3`: "Génère une réunion projet la semaine du 18, plutôt en fin de journée." → Cause: "fin de journée" est vague
- `temporal-5`: "Organise un stand-up express demain matin pour l'équipe support." → Cause: "matin" est vague, pas de plage explicite
- `temporal-7`: "Prévois un créneau avec le client canadien en fin d'après-midi (fuseau -5h)." → Cause: "fin d'après-midi" est vague
- `temporal-8`: "Bloque 45 minutes lundi ou mardi matin pour faire le point prod." → Cause: "matin" est vague
- `date-event-1`: "Créé un sondage pour un déjeuner d'équipe ce weekend" → Cause: Pas de plage horaire explicite
- `date-event-3`: "Organise un événement de team building la semaine prochaine" → Cause: Pas de plage horaire explicite
- `date-event-4`: "Trouve une date pour célébrer l'anniversaire de Marie en décembre" → Cause: Pas de plage horaire explicite

**Impact**: ~16 tests

---

### 4. Détection et gestion des dates passées

**Problème identifié**: Les tests échouent car les dates dans les prompts sont passées (ex: "décembre 2025" alors qu'on est en novembre 2025)

**Solution**: Au début de chaque test, vérifier si les dates attendues sont passées et annuler avec message clair

**Tests concernés**:

- `bug1-4`: "Crée un sondage pour les dimanches de décembre 2025" → Date passée (décembre 2025)
- Tous les tests avec dates en 2025 qui sont maintenant passées

**Impact**: ~2-5 tests (selon la date actuelle)

---

### 5. Amélioration des prompts Gemini

**Problème identifié**:

- Mots-clés manquants dans le titre
- Créneaux horaires non générés quand attendus

**Solution**:

- Ajouter hint pour créneaux horaires
- Forcer inclusion mots-clés dans titre si manquants

**Tests résolus**:

- Tous les tests avec `requiredWords` qui ne sont pas dans le titre généré
- Tests avec `expectedTimeConstraints` mais pas de `timeSlots` générés

**Impact**: ~5-10 tests (selon les cas)

---

### 6. Retour du résultat brut de chrono pour debug

**Problème identifié**: Impossible de savoir ce que chrono a réellement détecté dans les tests

**Solution**: Ajouter `chronoResult` dans `ParsedTemporalInput`

**Impact**: Aide au debug de tous les tests, pas de résolution directe

---

### 7. Système à deux appels IA (prototype)

**Problème identifié**: Un seul appel à Gemini peut ne pas suffire pour bien comprendre l'intention

**Solution**: Premier appel pour comprendre l'intention, deuxième appel pour générer le sondage

**Tests potentiellement résolus**: Tous les tests (amélioration globale)

**Impact**: À tester via prototype

---

## Priorisation des fixes

1. **Normalisation des mois français** (Impact: ~12 tests) - PRIORITÉ HAUTE
2. **Distinction "ou" vs "et"** (Impact: ~10 tests) - PRIORITÉ HAUTE
3. **Contraintes d'horaires optionnelles** (Impact: ~16 tests) - PRIORITÉ HAUTE
4. **Détection dates passées** (Impact: ~2-5 tests) - PRIORITÉ MOYENNE
5. **Amélioration prompts Gemini** (Impact: ~5-10 tests) - PRIORITÉ MOYENNE
6. **Retour chronoResult** (Impact: Debug) - PRIORITÉ BASSE
7. **Système à deux appels** (Impact: À tester) - PRIORITÉ BASSE (prototype d'abord)

## Estimation d'amélioration

- **Avant**: 27/57 tests réussis (47%)
- **Après fixes 1-3**: ~55/57 tests réussis (96%) - estimation optimiste
- **Après tous les fixes**: ~57/57 tests réussis (100%) - objectif
