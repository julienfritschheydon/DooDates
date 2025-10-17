import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Lire le fichier markdown
const markdownPath = path.join(__dirname, '../crews/Questionnaires 2025/Questionnaire-Participants.md');
const markdown = fs.readFileSync(markdownPath, 'utf-8');

console.log('📄 Fichier lu:', markdownPath);
console.log('📏 Taille:', markdown.length, 'caractères\n');

// Nettoyer les commentaires HTML
let cleaned = markdown.replace(/<!--[\s\S]*?-->/g, "");
cleaned = cleaned.replace(/\n{3,}/g, "\n\n").trim();

// Extraire titre principal
const titleMatch = cleaned.match(/^#\s+(.+?)$/m);
if (!titleMatch) {
  console.error('❌ Pas de titre trouvé');
  process.exit(1);
}
const title = titleMatch[1].trim();
console.log('📋 Titre:', title, '\n');

// Extraire sections (EXACTEMENT 2 #, pas 3)
// Capturer TOUT le contenu de la section jusqu'à la prochaine section ou fin
const sectionRegex = /^##\s+(?!#)(.+?)\n([\s\S]+?)(?=^##\s+(?!#)|$)/gm;
const sectionMatches = [...cleaned.matchAll(sectionRegex)];

console.log(`📂 ${sectionMatches.length} sections détectées\n`);

for (let i = 0; i < sectionMatches.length; i++) {
  const match = sectionMatches[i];
  const sectionTitle = match[1].trim();
  const sectionContent = match[2]; // Le contenu APRÈS le titre
  
  console.log(`\n${'='.repeat(80)}`);
  console.log(`📦 Section ${i + 1}: "${sectionTitle}"`);
  console.log(`${'='.repeat(80)}`);
  console.log(`📄 Contenu de la section (300 premiers chars):`);
  console.log(sectionContent.substring(0, 300));
  console.log('...\n');
  
  // Extraire questions de cette section
  const questionRegex = /###\s*Q\d+[a-z]*\.\s*([\s\S]+?)(?=###|##|$)/g;
  const questionMatches = [...sectionContent.matchAll(questionRegex)];
  
  console.log(`🔍 ${questionMatches.length} questions trouvées\n`);
  
  for (let j = 0; j < questionMatches.length; j++) {
    const qMatch = questionMatches[j];
    const questionBlock = qMatch[0];
    const questionTitle = qMatch[1].split('\n')[0].trim();
    
    console.log(`  📋 Question ${j + 1}: "${questionTitle}"`);
    console.log(`  📦 Longueur du bloc: ${questionBlock.length} chars`);
    
    // Détecter type
    const lowerBlock = questionBlock.toLowerCase();
    let type = "single";
    let maxChoices = undefined;
    
    if (lowerBlock.includes("réponse libre") || 
        lowerBlock.includes("votre réponse") || 
        lowerBlock.includes("_votre réponse")) {
      type = "text";
    } else {
      const maxMatch = lowerBlock.match(/max (\d+)|\((\d+) max\)/);
      if (maxMatch) {
        type = "multiple";
        maxChoices = parseInt(maxMatch[1] || maxMatch[2]);
      } else if (lowerBlock.includes("1 seule réponse") || 
                 lowerBlock.includes("une seule réponse")) {
        type = "single";
      }
    }
    
    console.log(`  🏷️  Type: ${type}${maxChoices ? ` (max ${maxChoices})` : ''}`);
    
    // Extraire options
    if (type !== "text") {
      const optionRegex = /^\s*-\s*[☐□\[\]\s]*\s*(.+)$/gm;
      const options = [];
      let optionMatch;
      
      while ((optionMatch = optionRegex.exec(questionBlock)) !== null) {
        const option = optionMatch[1].trim();
        const cleanOption = option.replace(/^\[\s*\]\s*/, "").trim();
        if (cleanOption && !cleanOption.startsWith("Autre :")) {
          options.push(cleanOption);
        }
      }
      
      console.log(`  ✅ ${options.length} options extraites:`);
      options.forEach((opt, idx) => {
        console.log(`     ${idx + 1}. "${opt}"`);
      });
    } else {
      console.log(`  ✍️  Champ texte libre`);
    }
    
    console.log('');
  }
}

console.log('\n' + '='.repeat(80));
console.log('✅ Test terminé');
console.log('='.repeat(80));
