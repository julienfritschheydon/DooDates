#!/usr/bin/env node
/**
 * Script rapide pour vérifier l'état des workflows
 * Usage: node scripts/check-workflow-status.js
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const STATUS_FILE = path.join(process.cwd(), "Docs", "monitoring", "workflow-status.json");
const REPORT_FILE = path.join(process.cwd(), "Docs", "monitoring", "workflow-failures-report.md");

function checkStatus() {
  console.log("📊 Vérification de l'état des workflows...\n");

  // Lire le statut rapide
  if (!fs.existsSync(STATUS_FILE)) {
    console.log(
      "⚠️  Fichier de statut non trouvé. Le monitoring n'a peut-être pas encore été exécuté.",
    );
    console.log(
      '💡 Exécutez le workflow "8️⃣ Workflow Monitoring & Health Report" pour générer le rapport.\n',
    );
    return;
  }

  const status = JSON.parse(fs.readFileSync(STATUS_FILE, "utf-8"));
  const lastUpdate = new Date(status.lastUpdate);
  const now = new Date();
  const hoursSinceUpdate = (now - lastUpdate) / (1000 * 60 * 60);

  console.log(
    `📅 Dernière mise à jour: ${lastUpdate.toLocaleString("fr-FR", { timeZone: "Europe/Paris" })}`,
  );
  console.log(`   (il y a ${Math.round(hoursSinceUpdate * 10) / 10} heures)\n`);

  // Afficher le résumé
  if (status.hasFailures) {
    console.log("❌ ÉTAT: ÉCHECS DÉTECTÉS\n");
    console.log(`   - Échecs (24h): ${status.totalFailures24h}`);
    console.log(`   - Échecs (7 jours): ${status.totalFailures7d}`);
    console.log(`\n📋 Consultez le rapport détaillé: ${REPORT_FILE}\n`);

    // Afficher un extrait du rapport si disponible
    if (fs.existsSync(REPORT_FILE)) {
      const report = fs.readFileSync(REPORT_FILE, "utf-8");
      const summaryMatch = report.match(/## 📈 Résumé Global[\s\S]*?(?=##|$)/);
      if (summaryMatch) {
        console.log("📊 Résumé Global:");
        console.log(summaryMatch[0].replace(/^##.*$/m, "").trim());
        console.log("");
      }
    }
  } else {
    console.log("✅ ÉTAT: TOUT EST OK\n");
    console.log(`   - Aucun échec dans les 24 dernières heures`);
    console.log(`   - Workflows monitorés: ${status.workflowsMonitored}\n`);
  }

  // Avertissement si le rapport est ancien
  if (hoursSinceUpdate > 2) {
    console.log(
      "⚠️  Le rapport est ancien (>2h). Le monitoring devrait s'exécuter toutes les heures.",
    );
    console.log("💡 Vérifiez que le workflow de monitoring est actif.\n");
  }
}

checkStatus();
