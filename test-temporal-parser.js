// Test du temporalParser avec "Organise une réunion le 7 mars 2026"
const { parseTemporalInput } = require("./src/lib/temporalParser.ts");

async function testTemporalParser() {
  console.log("🧪 Test du temporalParser avec 'Organise une réunion le 7 mars 2026'");

  try {
    const userInput = "Organise une réunion le 7 mars 2026";
    const refDate = new Date(); // Date actuelle comme référence

    console.log("📅 Input:", userInput);
    console.log("📅 RefDate:", refDate.toISOString());

    const result = await parseTemporalInput(userInput, "fr", refDate);

    console.log("\n✅ Résultat du parsing:");
    console.log("- Type:", result.type);
    console.log("- AllowedDates count:", result.allowedDates.length);
    console.log("- AllowedDates:", result.allowedDates);
    console.log("- TargetDates count:", result.targetDates.length);
    console.log(
      "- TargetDates:",
      result.targetDates.map((d) => d.toISOString()),
    );
    console.log("- DetectedKeywords:", result.detectedKeywords);
    console.log("- ChronoResult:", result.chronoResult);

    // Vérifications clés
    const hasMarch7_2026 = result.allowedDates.includes("2026-03-07");
    console.log("\n🎯 Vérifications:");
    console.log("- Type === 'specific_date':", result.type === "specific_date");
    console.log("- Contient 2026-03-07:", hasMarch7_2026);
    console.log("- Nombre de dates <= 5 (spécifique):", result.allowedDates.length <= 5);

    if (result.type === "specific_date" && hasMarch7_2026) {
      console.log("\n🎉 SUCCÈS: La date spécifique est correctement détectée !");
    } else {
      console.log("\n❌ ÉCHEC: La date n'est pas détectée comme spécifique");
    }
  } catch (error) {
    console.error("❌ Erreur lors du test:", error.message);
    console.error(error.stack);
  }
}

testTemporalParser();
