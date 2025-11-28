// Test avec le PROMPT EXACT que notre app envoie

const API_KEY = "AIzaSyAjguZF2MIjfseiOZohUtXK89S6_My6pvA";
const MODEL = "gemini-2.0-flash";

async function testPromptExact() {
  console.log("🔍 Test avec le prompt EXACT de notre app...");

  // Prompt EXACT que notre app envoie (copié des logs)
  const prompt = `GÉNÈRE UN SONDAGE DE DATES UNIQUEMENT.

DEMANDE: "Crée un sondage pour un déjeuner d'équipe ce weekend"

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


CONTEXTE UTILISATEUR:
- Demande: "Crée un sondage pour un déjeuner d'équipe ce weekend"
- Type: sondage de dates
- Objectif: trouver des créneaux disponibles

INSTRUCTIONS SPÉCIFIQUES:
- Utiliser les dates ci-dessus
- Proposer des créneaux standards (12:00-14:00)
- Adapter les timeSlots selon les dates

EXEMPLE: "déjeuner d'équipe ce weekend"
→ dates: ["2025-11-29", "2025-11-30"]
→ timeSlots: [{"start": "12:00", "end": "13:00"}, {"start": "13:00", "end": "14:00"}]

GÉNÈRE LE JSON MAINTENANT - PAS DE TEXTE !`;

  console.log("📊 Prompt longueur:", prompt.length);
  console.log("📊 Prompt exact:", prompt);

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
        console.log("❌ ÉCHEC - Formulaire généré");
        console.log("🔍 Erreur parsing:", e.message);
      }
    }
  } catch (error) {
    console.error("🚨 Erreur:", error);
  }
}

testPromptExact();
