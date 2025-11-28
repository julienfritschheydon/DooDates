// Test de Chrono-node directement
const chrono = require("chrono-node");

function testChronoNode() {
  console.log("🧪 Test Chrono-node avec 'Organise une réunion le 7 mars 2026'");

  const input = "Organise une réunion le 7 mars 2026";
  const refDate = new Date();

  console.log("📅 Input:", input);
  console.log("📅 RefDate:", refDate.toISOString());

  // Parser avec Chrono-node
  const results = chrono.parse(input, refDate, { forwardDate: true });

  console.log("\n✅ Résultats Chrono-node:");
  console.log("- Nombre de résultats:", results.length);

  results.forEach((result, index) => {
    console.log(`\nRésultat ${index + 1}:`);
    console.log("- Text:", result.text);
    console.log("- Start date:", result.start.date().toISOString());
    console.log("- Start date (YYYY-MM-DD):", result.start.date().toISOString().split("T")[0]);
    console.log("- Known values:", result.start.knownValues);
  });

  // Vérifier si c'est une date spécifique
  if (results.length === 1) {
    const parsedText = results[0].text.trim();
    const isSpecificDate =
      !/^(lundi|mardi|mercredi|jeudi|vendredi|samedi|dimanche|monday|tuesday|wednesday|thursday|friday|saturday|sunday)$/i.test(
        parsedText,
      );

    console.log("\n🎯 Analyse:");
    console.log("- Parsed text:", parsedText);
    console.log("- Est une date spécifique:", isSpecificDate);
    console.log(
      "- Contient '7 mars 2026':",
      parsedText.includes("7") && parsedText.includes("mars") && parsedText.includes("2026"),
    );
  }
}

testChronoNode();
