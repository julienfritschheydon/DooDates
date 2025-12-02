import { describe, it, expect } from "@jest/globals";

// Test uniquement des types et exports structurels
describe("Structure - Architecture Multi-Produits", () => {
  it("devrait avoir la bonne structure de dossiers", () => {
    // Vérifier que les fichiers existent
    const fs = require("fs");
    const path = require("path");
    
    const basePath = path.join(__dirname, "../");
    
    expect(fs.existsSync(path.join(basePath, "date-polls/index.ts"))).toBe(true);
    expect(fs.existsSync(path.join(basePath, "form-polls/index.ts"))).toBe(true);
    expect(fs.existsSync(path.join(basePath, "quizz/index.ts"))).toBe(true);
    expect(fs.existsSync(path.join(basePath, "index.ts"))).toBe(true);
  });

  it("devrait exporter les bonnes fonctions dans les index", () => {
    const fs = require("fs");
    const path = require("path");
    
    // Vérifier le contenu des fichiers index
    const datePollsIndex = fs.readFileSync(path.join(__dirname, "../date-polls/index.ts"), "utf8");
    const formPollsIndex = fs.readFileSync(path.join(__dirname, "../form-polls/index.ts"), "utf8");
    
    expect(datePollsIndex).toContain("export {");
    expect(datePollsIndex).toContain("getDatePolls as getPolls");
    expect(formPollsIndex).toContain("export {");
    expect(formPollsIndex).toContain("getFormPolls as getPolls");
  });

  it("devrait avoir l interface unifiée", () => {
    const fs = require("fs");
    const path = require("path");
    
    const mainIndex = fs.readFileSync(path.join(__dirname, "../index.ts"), "utf8");
    
    expect(mainIndex).toContain("getPollType");
    expect(mainIndex).toContain("createPollService");
    expect(mainIndex).toContain("export * from");
  });
});
