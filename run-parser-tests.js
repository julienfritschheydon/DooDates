import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Couleurs pour la console
const colors = {
  green: "\x1b[32m",
  red: "\x1b[31m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  reset: "\x1b[0m",
  bold: "\x1b[1m",
};

function log(msg, color = "reset") {
  console.log(`${colors[color]}${msg}${colors.reset}`);
}

function parseQuestionnaire(markdown) {
  // Nettoyer
  let cleaned = markdown.replace(/<!--[\s\S]*?-->/g, "");
  cleaned = cleaned.replace(/\n{3,}/g, "\n\n").trim();

  // Extraire titre
  const titleMatch = cleaned.match(/^#\s+(.+?)$/m);
  const title = titleMatch ? titleMatch[1].trim() : null;

  // Extraire sections avec split() (méthode robuste)
  const parts = cleaned.split(/(?=^##\s+)/gm);
  const sections = parts.filter((part) => part.startsWith("##") && !part.startsWith("###"));

  let totalQuestions = 0;
  let questionsWithOptions = 0;
  let textQuestions = 0;
  const sectionDetails = [];

  for (const sectionContent of sections) {
    const lines = sectionContent.split("\n");
    const sectionTitle = lines[0].replace(/^##\s+/, "").trim();

    // Extraire questions avec split() (plus robuste que regex)
    const questionParts = sectionContent.split(/(?=^###\s)/gm);
    const questionBlocks = questionParts.filter((part) => part.trim().startsWith("###"));

    let sectionQuestionCount = 0;
    const questions = [];

    for (const questionBlock of questionBlocks) {
      // Extraire juste le titre (première ligne sans les ###)
      const firstLine = questionBlock.split("\n")[0];
      const questionTitle = firstLine
        .replace(/^###\s*(?:Q\d+[a-z]*\.|Q\d+[a-z]*|Question\s*\d+:?|\d+[\).]\s*)\s*/, "")
        .trim();

      // Debug: voir les 200 premiers chars du bloc
      if (totalQuestions === 0 && sectionDetails.length === 0) {
        log(`\n🔍 DEBUG - Premier questionBlock (200 chars):`, "yellow");
        log(questionBlock.substring(0, 200), "reset");
        log("...", "reset");
      }

      // Détecter type
      const lowerBlock = questionBlock.toLowerCase();
      let type = "single";
      let maxChoices = undefined;

      if (
        lowerBlock.includes("réponse libre") ||
        lowerBlock.includes("texte libre") ||
        lowerBlock.includes("votre réponse") ||
        lowerBlock.includes("_votre réponse") ||
        lowerBlock.includes("[réponse courte]") ||
        lowerBlock.includes("commentaires") ||
        lowerBlock.includes("expliquez") ||
        lowerBlock.includes("précisez") ||
        lowerBlock.includes("détailler")
      ) {
        type = "text";
        textQuestions++;
      } else {
        const maxMatch = lowerBlock.match(/max\s+(\d+)|(\d+)\s+max/);
        if (maxMatch) {
          type = "multiple";
          maxChoices = parseInt(maxMatch[1] || maxMatch[2]);
        } else if (
          lowerBlock.includes("1 seule réponse") ||
          lowerBlock.includes("une réponse") ||
          lowerBlock.includes("une seule")
        ) {
          type = "single";
        }
      }

      // Extraire options (support multiples formats)
      let options = [];
      if (type !== "text") {
        // Support: -, *, •, ○, ☐, □, ✓, [ ]
        // Le ^ en mode multiline match le début de chaque ligne
        const optionRegex = /^[\s]*[-*•○☐□✓]\s*(?:\[\s*\])?\s*(.+)$/gm;
        let optionMatch;

        while ((optionMatch = optionRegex.exec(questionBlock)) !== null) {
          let option = optionMatch[1].trim();
          // Nettoyer les symboles checkbox résiduels (☐, □, ✓, [ ])
          option = option.replace(/^[☐□✓\u2610\u25a1\u2713]\s*/, "");
          option = option.replace(/^\[\s*\]\s*/, "");
          option = option.trim();
          // Ignorer les sous-titres markdown et "Autre :"
          if (!option.startsWith("#") && !option.startsWith("Autre :") && option.length > 0) {
            options.push(option);
          }
        }
      }

      questions.push({
        title: questionTitle,
        type,
        maxChoices,
        optionsCount: options.length,
        options: options.slice(0, 3), // Garder 3 exemples
      });

      sectionQuestionCount++;
      totalQuestions++;
    }

    if (sectionQuestionCount > 0) {
      sectionDetails.push({
        title: sectionTitle,
        questionCount: sectionQuestionCount,
        questions,
      });
    }
  }

  return {
    title,
    sectionCount: sections.length,
    totalQuestions,
    questionsWithOptions,
    textQuestions,
    sectionDetails,
  };
}

// Lire le fichier de test
const testPath = path.join(__dirname, "test-questionnaires.md");
const markdown = fs.readFileSync(testPath, "utf-8");

log("\n" + "=".repeat(80), "bold");
log("🧪 TEST EXHAUSTIF DU PARSER MARKDOWN", "bold");
log("=".repeat(80) + "\n", "bold");

log(`📄 Fichier: test-questionnaires.md`, "blue");
log(`📏 Taille: ${markdown.length} caractères\n`, "blue");

const result = parseQuestionnaire(markdown);

log("📊 RÉSULTATS GLOBAUX:", "bold");
log(`  Titre: ${result.title}`, "yellow");
log(`  Sections détectées: ${result.sectionCount}`, "yellow");
log(`  Questions totales: ${result.totalQuestions}`, "yellow");
log(`  Questions avec options: ${result.questionsWithOptions}`, "yellow");
log(`  Questions texte libre: ${result.textQuestions}\n`, "yellow");

// Détails par section
log("📦 DÉTAILS PAR SECTION:\n", "bold");

result.sectionDetails.forEach((section, i) => {
  log(`  ${i + 1}. "${section.title}"`, "blue");
  log(`     └─ ${section.questionCount} question(s)\n`, "blue");

  section.questions.forEach((q, j) => {
    log(`     ${j + 1}. ${q.title.substring(0, 60)}${q.title.length > 60 ? "..." : ""}`, "reset");
    log(`        Type: ${q.type}${q.maxChoices ? ` (max ${q.maxChoices})` : ""}`, "reset");
    if (q.optionsCount > 0) {
      log(`        Options: ${q.optionsCount} détectées`, "green");
      q.options.forEach((opt) => log(`          • ${opt.substring(0, 50)}`, "reset"));
      if (q.optionsCount > 3) log(`          ... et ${q.optionsCount - 3} autres`, "reset");
    } else if (q.type !== "text") {
      log(`        ⚠️  AVERTISSEMENT: Aucune option détectée`, "yellow");
    }
    console.log("");
  });
});

// Score de réussite
log("\n" + "=".repeat(80), "bold");
log("🎯 SCORE DE RÉUSSITE", "bold");
log("=".repeat(80), "bold");

const expectedQuestions = 40; // Environ (à ajuster)
const detectionRate = Math.round((result.totalQuestions / expectedQuestions) * 100);
const optionsRate =
  result.questionsWithOptions > 0
    ? Math.round(
        (result.questionsWithOptions / (result.totalQuestions - result.textQuestions)) * 100,
      )
    : 0;

log(
  `\n📈 Taux de détection questions: ${detectionRate}%`,
  detectionRate >= 90 ? "green" : detectionRate >= 70 ? "yellow" : "red",
);
log(
  `📋 Taux d'extraction options: ${optionsRate}%`,
  optionsRate >= 90 ? "green" : optionsRate >= 70 ? "yellow" : "red",
);

if (detectionRate >= 90 && optionsRate >= 90) {
  log("\n✅ TEST RÉUSSI - Parser robuste et fiable !", "green");
} else if (detectionRate >= 70 && optionsRate >= 70) {
  log("\n⚠️  TEST PARTIEL - Améliorations nécessaires", "yellow");
} else {
  log("\n❌ TEST ÉCHOUÉ - Parser doit être amélioré", "red");
}

log("\n" + "=".repeat(80) + "\n", "bold");
