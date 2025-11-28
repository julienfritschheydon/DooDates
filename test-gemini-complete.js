// Test COMPLET avec les vrais hints et contextualHints

const API_KEY = "AIzaSyAjguZF2MIjfseiOZohUtXK89S6_My6pvA";
const MODEL = "gemini-2.0-flash";

// Simuler les vrais hints (comme dans notre code)
function buildDateHintsFromParsed(parsed, userInput) {
  return `\n\n⚠️⚠️⚠️ INSTRUCTION PRIORITAIRE - PÉRIODE DÉTECTÉE ⚠️⚠️⚠️

Type: unknown
Expression temporelle: "for 1 d"
Contexte professionnel détecté → Week-ends exclus (lundi-vendredi uniquement)

RÈGLE ABSOLUE : Générer UNIQUEMENT des dates en semaine (lundi-vendredi)
PAS de week-ends (samedi, dimanche)
PAS de jours fériés
PAS de dates passées

DATES AUTORISÉES: ${parsed.allowedDates?.join(", ") || "Aucune"}

CONTEXTE: ${userInput}`;
}

function buildContextualHints(userInput) {
  return `

CONTEXTE UTILISATEUR:
- Demande: "${userInput}"
- Type: sondage de dates
- Objectif: trouver des créneaux disponibles

INSTRUCTIONS SPÉCIFIQUES:
- Utiliser les dates ci-dessus
- Proposer des créneaux standards (12:00-14:00)
- Adapter les timeSlots selon les dates`;
}

async function testGeminiComplete() {
  console.log("🔍 Test COMPLET avec vrais hints...");

  // Simuler notre parsed data
  const mockParsed = {
    type: "datetime",
    allowedDates: ["2025-11-29", "2025-11-30"],
    detectedKeywords: ["weekend"],
  };

  const userInput = "Crée un sondage pour un déjeuner d'équipe ce weekend";

  // Générer les vrais hints
  const dateHints = buildDateHintsFromParsed(mockParsed, userInput);
  const contextualHints = buildContextualHints(userInput);

  // Construire le prompt COMPLET comme dans notre code
  const prompt = `GÉNÈRE UN SONDAGE DE DATES UNIQUEMENT.

DEMANDE: "${userInput}"

RÈGLES CRITIQUES:
- UNiquement JSON avec "dates" et "timeSlots"
- JAMAIS de questions sur lieu, budget, préférences
- JAMAIS de texte explicatif

FORMAT OBLIGATOIRE:
{
  "title": "Titre",
  "description": "Description",
  "dates": ["YYYY-MM-DD", "YYYY-MM-DD"],
  "timeSlots": [
    {"start": "HH:MM", "end": "HH:MM", "dates": ["YYYY-MM-DD"]}
  ]
}

${dateHints}
${contextualHints}

EXEMPLE: "déjeuner d'équipe ce weekend"
→ dates: ["2025-11-29", "2025-11-30"]
→ timeSlots: [{"start": "12:00", "end": "13:00"}, {"start": "13:00", "end": "14:00"}]

GÉNÈRE LE JSON MAINTENANT - PAS DE TEXTE !`;

  console.log("📊 Prompt complet (longueur:", prompt.length, "caractères)");
  console.log("📊 Aperçu prompt:", prompt.substring(0, 300) + "...");

  const requestBody = {
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: {
      temperature: 0.1,
      maxOutputTokens: 2048,
    },
  };

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      },
    );

    const data = await response.json();

    if (data.candidates?.[0]?.content?.parts?.[0]?.text) {
      const result = data.candidates[0].content.parts[0].text;
      console.log("🎯 Result brut:", result);

      // Nettoyer les backticks
      const cleanedResult = result.replace(/```json\n?|\n?```/g, "").trim();
      console.log("🧹 Result nettoyé:", cleanedResult);

      // Vérifier si c'est du JSON
      try {
        const parsed = JSON.parse(cleanedResult);
        console.log("✅ SUCCÈS - JSON valide:", parsed);
      } catch (e) {
        console.log("❌ ÉCHEC - Formulaire généré au lieu de JSON");
        console.log("🔍 Erreur parsing:", e.message);
      }
    }
  } catch (error) {
    console.error("🚨 Erreur:", error);
  }
}

testGeminiComplete();
