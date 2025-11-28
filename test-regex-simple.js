import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Lire le fichier markdown
const markdownPath = path.join(
  __dirname,
  "../crews/Questionnaires 2025/Questionnaire-Participants.md",
);
const markdown = fs.readFileSync(markdownPath, "utf-8");

console.log("📄 Fichier lu, taille:", markdown.length, "caractères\n");

// Nettoyer
let cleaned = markdown.replace(/<!--[\s\S]*?-->/g, "");
cleaned = cleaned.replace(/\n{3,}/g, "\n\n").trim();

// Test 1: Trouver tous les ##
console.log("🔍 Test 1: Tous les ## (sections niveau 2)");
const test1 = cleaned.match(/^##\s+.+$/gm);
console.log("Trouvés:", test1 ? test1.length : 0);
if (test1) {
  test1.forEach((line, i) => console.log(`  ${i + 1}. ${line}`));
}

// Test 2: Trouver tous les ### (questions)
console.log("\n🔍 Test 2: Tous les ### (questions niveau 3)");
const test2 = cleaned.match(/^###\s+.+$/gm);
console.log("Trouvés:", test2 ? test2.length : 0);
if (test2) {
  test2.slice(0, 5).forEach((line, i) => console.log(`  ${i + 1}. ${line}`));
  if (test2.length > 5) console.log(`  ... et ${test2.length - 5} autres`);
}

// Test 3: Extraire sections avec contenu
console.log("\n🔍 Test 3: Extraire sections ##");
// Split par ## mais garder le délimiteur
const parts = cleaned.split(/(?=^##\s+)/gm);
console.log("Parts trouvées:", parts.length);

const sections = parts.filter((part) => part.startsWith("##") && !part.startsWith("###"));
console.log("Sections niveau 2:", sections.length);

sections.forEach((section, i) => {
  const lines = section.split("\n");
  const title = lines[0].replace(/^##\s+/, "").trim();
  console.log(`\n  📦 Section ${i + 1}: "${title}"`);
  console.log(`     Taille: ${section.length} chars`);

  // Chercher les ###
  const questions = section.match(/^###\s+.+$/gm);
  console.log(`     Questions trouvées: ${questions ? questions.length : 0}`);
  if (questions) {
    questions.slice(0, 3).forEach((q, j) => {
      console.log(`       - ${q.substring(0, 60)}...`);
    });
  }
});
