# Exemples conversationnels réalistes

Ton recherché : requêtes brèves, naturelles, 1 à 2 contraintes max. Mélanger professionnel / perso / associatif.

### Réponses satisfaisantes (OK)

- "Planifie un point budget dans deux semaines autour de 9h30."
  - ✅ Réponse attendue : 2-3 suggestions datées à 09h30 ±15 min sur la semaine ciblée.
  - 📩 Réponse Gemini (11/11/2025) : dates proposées 2025-11-22 à 2025-11-28, créneaux 09h00-10h00, 09h30-10h30 et 10h00-11h00 sur l'ensemble de la semaine.
  - ⚖️ Analyse : OK – plages horaires centrées sur 9h30 avec marge ±30 min, semaine correcte.

- "Génère une réunion projet la semaine du 18, plutôt en fin de journée."
  - ✅ Réponse attendue : plage de 3-4 créneaux entre 16h30-18h durant la semaine concernée.
  - 📩 Réponse Gemini (11/11/2025) : dates proposées 2025-11-18, 2025-11-19, 2025-11-20, 2025-11-21 avec créneaux quotidiens 17h00-18h00, 17h30-18h30 et 18h00-19h00.
  - ⚖️ Analyse : OK – ciblage fin de journée respecté avec plusieurs options.

- "Trouve un créneau avant vendredi midi pour passer en revue les slides."
  - ✅ Réponse attendue : options ≤12h sur les jours ouvrés restants avant vendredi.
  - 📩 Réponse Gemini (11/11/2025) : dates proposées 2025-11-11 à 2025-11-14, créneaux toutes les 30 minutes de 08h00 à 12h00 (28 variantes couvrant 08h00-09h00 jusqu'à 11h30-12h30).
  - ⚖️ Analyse : OK – nombreux créneaux entre 08h00 et 12h00 jusqu’à vendredi.

- "Planifie la réunion de lancement la semaine prochaine, idéalement mardi 14h ou jeudi 10h."
  - ✅ Réponse attendue : proposer ces deux créneaux + alternative si indispo.
  - 📩 Réponse Gemini (11/11/2025) : dates proposées 2025-11-17 à 2025-11-21 avec deux créneaux mis en avant (mardi 14h00-15h00 et jeudi 10h00-11h00).
  - ⚖️ Analyse : OK – inclut les créneaux souhaités, plus d’autres jours.

- "Prévois un créneau avec le client canadien en fin d'après-midi (fuseau -5h)."
  - ✅ Réponse attendue : créneaux 17h-19h heure locale correspondant à 12h-14h au Québec, avec mention du fuseau.
  - 📩 Réponse Gemini (11/11/2025) : dates proposées 2025-11-11 à 2025-11-14, créneaux 14h00-17h00 (variantes toutes les 30 min) adaptés au fuseau -5h.
  - ⚖️ Analyse : OK – large éventail 14h-17h locale (19h-22h FR), cohérent pour un client -5h.

- "Bloque 45 minutes lundi ou mardi matin pour faire le point prod."
  - ✅ Réponse attendue : 2-3 créneaux entre 08h30-11h sur les deux jours, durée 45 min.
  - 📩 Réponse Gemini (11/11/2025) : dates proposées 2025-11-17 et 2025-11-18, créneaux 45 minutes de 08h00 à 12h15 (08h00-08h45 jusqu'à 11h30-12h15).
  - ⚖️ Analyse : OK – multiples créneaux 45 min sur la plage matinale demandée.

- "Propose deux dates dans quinze jours pour répéter la présentation."
  - ✅ Réponse attendue : deux dates espacées dans la fenêtre J+14 ±2 jours.
  - 📩 Réponse Gemini (11/11/2025) : dates retenues 2025-11-26 et 2025-11-27 (pas de créneau horaire renvoyé).
  - ⚖️ Analyse : OK – deux dates dans la fenêtre attendue, pas besoin d’horaires.

- "Repère un week-end où partir deux jours en juin."
  - ✅ Réponse attendue : proposer 2 week-ends (ex. 8-9 juin, 22-23 juin).
  - 📩 Réponse Gemini (12/11/2025) : week-ends proposés 2026-06-06/07, 06-13/14, 06-20/21, 06-27/28, sans horaires.
  - ⚖️ Analyse : OK – quatre week-ends cohérents couvrant tout le mois, suffisants pour planifier un départ de deux jours.

- "Prévois le comité de quartier dans quinze jours, plutôt en début de soirée."
  - ✅ Réponse attendue : 2 slots 18h30-20h semaine concernée.
  - 📩 Réponse Gemini (12/11/2025) : soirées proposées du 13 au 15 novembre avec créneaux 18h00-21h00 toutes les heures.
  - ⚖️ Analyse : OK 

### Réponses partielles (à améliorer)

#### 1. Dates sans horaires
- "Propose-moi trois créneaux mardi ou mercredi prochain pour la démo client."
  - ✅ Réponse attendue : 3 créneaux datés (ex. mardi 19/11 09h, mardi 19/11 11h, mercredi 20/11 14h) avec rappel du contexte démo.
  - 📩 Réponse Gemini (11/11/2025) : dates proposées 2025-11-17, 2025-11-18, 2025-11-19, 2025-11-20, 2025-11-21 (pas de créneaux horaires retournés).
  - ⚖️ Analyse : PARTIEL – bonnes dates dans la fenêtre, mais absence totale d’horaires précis pour la démo.
  - Nouvelle réponse:
    Voici votre sondage de disponibilité :
    lundi 17 novembre 2025
    mardi 18 novembre 2025
    mercredi 19 novembre 2025
    jeudi 20 novembre 2025
    vendredi 21 novembre 2025
  - 🔍 Commentaire 12/11 : Toujours aucun créneau enrichi ; vérifier que le post-traitement injecte bien trois horaires précis au lieu de simples dates.

- "Organise un stand-up express demain matin pour l'équipe support."
  - ✅ Réponse attendue : 2-3 créneaux entre 08h00-10h00 le lendemain, durée courte (15-30 min).
  - 📩 Réponse Gemini (11/11/2025) : dates proposées 2025-11-12, 2025-11-13, 2025-11-14 (aucun créneau horaire explicite renvoyé).
  - ⚖️ Analyse : PARTIEL – bonnes dates mais aucune plage horaire, donc inutilisable en l’état.
  - Nouvelle réponse:
    jeudi 13 novembre 2025
    09:00 - 12:00
    vendredi 14 novembre 2025
    09:00 - 12:00
  - 🔍 Commentaire 12/11 : Les créneaux générés sont trop larges (3 h) et dupliqués sur deux jours ; attendre 15-30 min sur un seul matin.

- "Planifie une séance photo familiale un dimanche matin en décembre (avant fin décembre)."
  - ✅ Réponse attendue : 2 à 3 dimanches matin 09h-12h en décembre.
  - 📩 Réponse Gemini (12/11/2025) : propose uniquement le 2025-11-16 (aucun créneau horaire retourné).
  - ⚖️ Analyse : NOK – Gemini reste bloqué sur novembre et n'ajoute pas les créneaux matinaux attendus.
  - Nouvelle réponse:
    dimanche 16 novembre 2025
    09:00 - 12:00
  - 🔍 Commentaire 12/11 : Toujours bloqué sur novembre ; ajouter un forcing calendrier pour pointer sur les dimanches de décembre.

- "Cale la réunion parents-profs entre mardi et jeudi prochains."
  - ✅ Réponse attendue : 2 créneaux (ex. mardi 18h, jeudi 19h) dans la fenêtre.
  - 📩 Réponse Gemini (12/11/2025) : dates proposées 2025-11-18, 2025-11-19, 2025-11-20 (aucun créneau horaire).
  - ⚖️ Analyse : PARTIEL – dates correctes dans la fenêtre cible, mais absence des créneaux soirée attendus.
  - Nouvelle réponse:
    Voici votre sondage de disponibilité :
    mardi 18 novembre 2025
    mercredi 19 novembre 2025
    jeudi 20 novembre 2025
  - 🔍 Commentaire 12/11 : Encore aucune plage soirée ; vérifier le mapping « début de soirée » vers 18h30-20h.

- "Propose un créneau samedi 10h pour la réunion de préparation kermesse."
  - ✅ Réponse attendue : samedi 10h-11h + alternative proche si indisponible.
  - 📩 Réponse Gemini (12/11/2025) : propose les 2025-11-12, 2025-11-13, 2025-11-14, 2025-11-17, 2025-11-18 sans horaires.
  - ⚖️ Analyse : NOK – ignore la contrainte du samedi 10h et ne fournit aucun créneau.
- Nouvelle réponse:
  Voici votre sondage de disponibilité :
  mercredi 12 novembre 2025
  jeudi 13 novembre 2025
  vendredi 14 novembre 2025
  lundi 17 novembre 2025
  mardi 18 novembre 2025
  - 🔍 Commentaire 12/11 : Toujours aucun samedi proposé ; renforcer le filtre pour n’accepter que les samedis 10h.

- "Cherche une disponibilité mercredi ou vendredi pour l'aide aux devoirs."
  - ✅ Réponse attendue : 2 créneaux (mercredi 17h, vendredi 18h30).
  - 📩 Réponse Gemini (12/11/2025) : propose les dates 2025-11-19 et 2025-11-21, sans précision horaire.
  - ⚖️ Analyse : NOK – jours valides mais aucun créneau précis n’est fourni.
- Nouvelle réponse:
Voici votre sondage de disponibilité :
samedi 22 novembre 2025
dimanche 16 novembre 2025
  - 🔍 Commentaire 12/11 : Régression – répond désormais avec un week-end ; reprendre la détection des mentions mercredi/vendredi.
  
- "Planifie une répétition chorale samedi matin ou dimanche après-midi."
  - ✅ Réponse attendue : proposer samedi 10h-12h et dimanche 15h-17h.
  - 📩 Réponse Gemini (12/11/2025) : dates proposées 2025-11-15 et 2025-11-16 sans horaires associés.
  - ⚖️ Analyse : PARTIEL – jours pertinents mais absence des créneaux matin/après-midi attendus.
- Nouvelle réponse:
  samedi 15 novembre 2025
  09:00 - 12:00
  dimanche 16 novembre 2025
  09:00 - 12:00
  - 🔍 Commentaire 12/11 : Toujours deux matinées ; appliquer la règle « dimanche après-midi » (15h-17h).

#### 2. Fenêtre temporelle incorrecte
- "Cherche un créneau entre 11h et 13h mercredi pour un déjeuner partenariats."
  - ✅ Réponse attendue : 2 créneaux (ex. 11h30-12h30, 12h00-13h00) le mercredi visé.
  - 📩 Réponse Gemini (11/11/2025) : dates proposées 2025-11-12 à 2025-11-15, créneaux 11h00-13h30 avec pas de 30 minutes (16 variantes).
  - ⚖️ Analyse : PARTIEL – nombreux créneaux conformes, mais Gemini propose aussi jeudi/vendredi/samedi (hors mercredi).

- "Calcule un brunch samedi 23 ou dimanche 24."
  - ✅ Réponse attendue : proposer samedi 23 11h30-13h et dimanche 24 même plage. Formulation "calcule" reste interprétable → OK.
  - 📩 Réponse Gemini (12/11/2025) : brunchs proposés les 2025-11-15 et 2025-11-16 avec créneaux 10h00-11h00.
  - ⚖️ Analyse : PARTIEL – deux créneaux conformes mais positionnés mi-novembre au lieu du week-end 23/24 visé.

- "Propose trois soirées pour un escape game fin mars."
  - ✅ Réponse attendue : 3 dates soirée (19h-21h) sur la dernière quinzaine de mars.
  - 📩 Réponse Gemini (11/11/2025) : dates proposées 2025-11-12, 2025-11-13, 2025-11-14, 2025-11-15 avec créneaux 18h-19h, 19h-20h, 20h-21h pour chaque date.
  - ⚖️ Analyse : PARTIEL – horaires cohérents, mais positionnés sur mi-novembre (proches de la fenêtre actuelle) au lieu de la fin mars demandée.

- "Organise un dîner avec les cousins courant avril, plutôt le week-end."
  - ✅ Réponse attendue : 2 week-ends en avril (sam soir ou dim midi).
  - 📩 Réponse Gemini (12/11/2025) : week-ends proposés 2026-04-04/05, 04-11/12, 04-18/19, 04-25/26 avec créneau unique 19h-20h à chaque fois.
  - ⚖️ Analyse : PARTIEL – bon mois et cadence week-end, mais Gemini bascule sur avril 2026 et ne varie pas les horaires (repas midi manquant).

- "Trouve une date pour l'anniversaire de Léa autour du 15 mai."
  - ✅ Réponse attendue : 2 créneaux le week-end avant/après le 15 mai.
  - 📩 Réponse Gemini (12/11/2025) : dates proposées du 2026-05-12 au 2026-05-18 (7 dates consécutives), aucun créneau horaire.
  - ⚖️ Analyse : PARTIEL – couvre bien la fenêtre autour du 15 mai mais ne se limite pas aux week-ends et oublie les horaires festifs.

- "Planifie une séance photo familiale un dimanche matin en décembre (avant fin décembre)."
  - ✅ Réponse attendue : 2 à 3 dimanches matin 09h-12h en décembre.
  - 📩 Réponse Gemini (12/11/2025) : propose uniquement le 2025-11-16 (aucun créneau horaire retourné).
  - ⚖️ Analyse : NOK – Gemini reste bloqué sur novembre et n'ajoute pas les créneaux matinaux attendus.

#### 3. Trop de variantes ou granularité excessive
- "Cherche une soirée disponible entre amis pour un apéro d'ici trois semaines."
  - ✅ Réponse attendue : 3 dates en semaine 18h30-20h dans fenêtre 21 jours.
  - 📩 Réponse Gemini (12/11/2025) : dates proposées 2025-11-12 à 2025-11-15 avec créneaux 18h-19h, 19h-20h, 20h-21h chaque soir.
  - ⚖️ Analyse : PARTIEL – bonnes plages horaires, mais Gemini se limite à quatre dates consécutives au lieu de suggérer des options dispersées sur trois semaines.

- "Trouve un après-midi libre la semaine prochaine pour la visite au musée."
  - ✅ Réponse attendue : 2-3 créneaux 14h-17h sur la semaine suivante.
  - 📩 Réponse Gemini (12/11/2025) : dates proposées 2025-11-13, 2025-11-14, 2025-11-15 avec plages successives 14h00-17h30 par pas de 30 min.
  - ⚖️ Analyse : PARTIEL – bonnes dates et couverture complète de l’après-midi, mais Gemini ajoute des créneaux dépassant 17h (16h30-17h30) et répète trop de variantes.

- "Bloque un créneau vendredi soir ou samedi matin pour un footing."
  - ✅ Réponse attendue : un slot vendredi 18h-19h + samedi 08h-09h.
  - 📩 Réponse Gemini (12/11/2025) : dates proposées 2025-11-14 et 2025-11-15 avec créneaux en cascade (vendredi 18h-21h par demi-heures, samedi 08h-12h).
  - ⚖️ Analyse : PARTIEL – couvre les bonnes journées et plages globales, mais ajoute trop de créneaux étendus (samedi jusqu’à 12h, vendredi jusqu’à 21h).

- "Trouve-nous un créneau en visio après 18h pour le point trésorerie."
  - ✅ Réponse attendue : J’aurais attendu quelque chose comme « mercredi 12/11 18h30-19h30 » et « jeudi 13/11 19h00-20h00 » : deux créneaux ciblés dans la fenêtre plutôt qu’une grille complète.
  - 📩 Réponse Gemini (12/11/2025) : créneaux proposés 18h00-21h00 toutes les 30 min du 12 au 15 novembre 2025.
  - ⚖️ Analyse : PARTIEL – bonnes plages après 18h mais quantité excessive de créneaux.

- "Organise deux dates en soirée pour l'atelier bénévoles, semaine du 12."
  - ✅ Réponse attendue : 2 soirées (ex. mardi 12 19h, jeudi 14 20h30).
  - 📩 Réponse Gemini (12/11/2025) : soirées proposées du 12 au 15 novembre 2025 avec créneaux 18h00-21h00 toutes les 30 min.
  - ⚖️ Analyse : PARTIEL – bonnes plages horaires mais trop d’options (y compris samedi) au lieu de deux soirées ciblées.

#### 4. Presque OK mais à affiner
- "Planifie la distribution de flyers sur un week-end fin avril."
  - ✅ Réponse attendue : proposer samedi 26/04 matin + dimanche 27/04 après-midi.
  - 📩 Réponse Gemini (12/11/2025) : dates proposées 2026-04-25 et 2026-04-26 sans horaires.
  - ⚖️ Analyse : PARTIEL – bon format week-end mais ne différencie pas matin/après-midi.

- "Planifie une réunion d'équipe éducative avant les vacances, matinée uniquement."
  - ✅ Réponse attendue : 2 dates matin (09h) avant date limite.
  - 📩 Réponse Gemini (12/11/2025) : plages 08h00-12h00 toutes les 30 min les 12, 13 et 14 novembre 2025.
  - ⚖️ Analyse : PARTIEL – respect des matinées avec plusieurs options cohérentes, mais slots de 30 minutes un peu courts (1h préférable).

- "Prévois le comité de quartier dans quinze jours, plutôt en début de soirée."
  - ✅ Réponse attendue : 2 slots 18h30-20h semaine concernée.
  - 📩 Réponse Gemini (12/11/2025) : soirées proposées du 13 au 15 novembre avec créneaux 18h00-21h00 toutes les heures.
  - ⚖️ Analyse : PARTIEL – bonnes plages mais trois soirées consécutives au lieu de deux options ciblées.

## Professionnel

## Personnel / Social

## Associatif / Scolaire




## Actions d'amélioration

1. **Dates sans horaires** *(implémenté le 12/11 via `GeminiSuggestionPostProcessor`)* : le time slot builder enrichit désormais les dates « nues » en se basant sur les indices sémantiques (matin, déjeuner, soirée, visio…). Vérifier sur les prompts PARTIEL que chaque date obtient bien des créneaux cohérents.
2. **Fenêtre temporelle** *(implémenté)* : les hints Gemini et le post-traitement bloquent les dates hors fenêtre. À valider en relançant les prompts qui dépassaient la fenêtre autorisée.
3. **Variantes excessives** *(implémenté)* : la réduction des variantes tronque les cascades de créneaux et garde les options prioritaires. Confirmer que les prompts « Partiel – trop de slots » repassent en OK.
4. **Règles métiers** *(implémenté partiellement, à retester)* :
   - Réunions d’équipe ≥ 60 min.
   - Ateliers / stand-up « express » ≤ 30 min.
   - Événements week-end : exactement 1 proposition samedi + 1 dimanche.
   - Visios personnelles ou associatives : 2 slots max entre 18h00 et 20h00.
   - Matin / après-midi : hints précisés (09h‑12h et 15h‑18h) + complétion automatique.

🔁 **Prochaine étape** : rejouer l’ensemble des prompts PARTIEL/NOK pour qualifier les améliorations et documenter les nouveaux résultats.

