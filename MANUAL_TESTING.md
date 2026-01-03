# Tests Manuels Gemini

Voici les prompts qui échouent encore. Vous pouvez les tester directement dans Google AI Studio ou via l'interface DooDates pour voir si c'est le modèle qui est têtu.

## 1. Dîner avec les cousins (Pas de dates générées)

**Input :**
"Organise un dîner avec les cousins courant avril, plutôt le week-end."

**Attendu :**

- Plusieurs dates (samedis/dimanches d'avril).
- Créneaux horaires appropriés (19h-21h).

**Actuel :**

- 0 créneaux. Gemini semble ne pas oser "inventer" des dates précises pour "courant avril" malgré l'instruction.

## 2. Choix "Ou" - Brunch (1 option au lieu de 2)

**Input :**
"Calcule un brunch samedi 23 ou dimanche 24."

**Attendu :**

- 2 créneaux : un le samedi 23, un le dimanche 24.

**Actuel :**

- 1 seul créneau. Gemini "choisit" pour l'utilisateur.
- _Note : J'ai ajouté une instruction "EXCEPTION" pour forcer les choix multiples, mais ça résiste._

## 3. Choix "Ou" - Footing

**Input :**
"Bloque un créneau vendredi soir ou samedi matin pour un footing."

**Attendu :**

- 2 options : Vendredi soir ET Samedi matin.

**Actuel :**

- 1 seule option (soit vendredi, soit samedi).

## 4. Parsing Error (Déjeuner Partenariats)

**Input :**
"Cherche un créneau entre 11h et 13h mercredi pour un déjeuner partenariats."

**Problème :**

- Erreur technique "Failed to parse Gemini response".
- _J'ai renforcé le parsing JSON. Ce test devrait passer maintenant._
