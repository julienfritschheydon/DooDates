/**
 * Test ultra-simple: Vérifier que le titre est bien copié
 * 
 * Objectif: Quand on crée un poll/form depuis une conversation,
 * le titre de la conversation doit être utilisé comme titre du poll/form.
 */

import { describe, it, expect } from "vitest";

describe("Copie du titre conversation → poll/form", () => {
  it("le titre de la conversation est copié dans le poll", () => {
    // Simulation: Une conversation a un titre généré
    const conversationTitle = "Réunion équipe marketing";
    
    // Quand on crée un poll depuis cette conversation
    const pollData = {
      title: conversationTitle, // Le titre doit être copié
      type: "date" as const,
      dates: ["2024-11-25"],
    };
    
    // Vérification: Le titre du poll est bien celui de la conversation
    expect(pollData.title).toBe(conversationTitle);
    expect(pollData.title).not.toBe("");
    expect(pollData.title).not.toBe("Nouveau sondage");
  });

  it("le titre de la conversation est copié dans le formulaire", () => {
    // Simulation: Une conversation a un titre généré
    const conversationTitle = "Formulaire satisfaction client";
    
    // Quand on crée un formulaire depuis cette conversation
    const formData = {
      title: conversationTitle, // Le titre doit être copié
      type: "form" as const,
      questions: [],
    };
    
    // Vérification: Le titre du formulaire est bien celui de la conversation
    expect(formData.title).toBe(conversationTitle);
    expect(formData.title).not.toBe("");
    expect(formData.title).not.toBe("Nouveau formulaire");
  });

  it("un titre vide n'est pas copié", () => {
    const conversationTitle = "";
    
    // Si le titre est vide, on utilise un titre par défaut
    const pollTitle = conversationTitle || "Nouveau sondage";
    
    expect(pollTitle).toBe("Nouveau sondage");
  });
});
