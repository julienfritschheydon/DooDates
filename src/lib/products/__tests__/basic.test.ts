import { describe, it, expect } from "@jest/globals";

// Tests simples sans dépendances externes
describe("Tests Basiques - Architecture Multi-Produits", () => {
  it("devrait importer les wrappers sans erreur", async () => {
    // Test que les modules peuvent être importés
    const datePollsModule = await import("../date-polls");
    const formPollsModule = await import("../form-polls");
    const productsModule = await import("..");
    
    expect(datePollsModule).toBeDefined();
    expect(formPollsModule).toBeDefined();
    expect(productsModule).toBeDefined();
  });

  it("devrait exporter les helpers de détection", async () => {
    const { getPollType } = await import("..");
    const { isDatePoll } = await import("../date-polls");
    const { isFormPoll } = await import("../form-polls");
    
    expect(typeof getPollType).toBe("function");
    expect(typeof isDatePoll).toBe("function");
    expect(typeof isFormPoll).toBe("function");
    
    // Test basique de détection
    const datePoll = { type: "date" };
    const formPoll = { type: "form" };
    
    expect(getPollType(datePoll)).toBe("date");
    expect(getPollType(formPoll)).toBe("form");
    expect(isDatePoll(datePoll)).toBe(true);
    expect(isFormPoll(formPoll)).toBe(true);
  });

  it("devrait avoir les exports rétrocompatibles", async () => {
    const datePolls = await import("../date-polls");
    const formPolls = await import("../form-polls");
    
    // Vérifier que les fonctions existent (sans les appeler)
    expect(typeof datePolls.getPolls).toBe("function");
    expect(typeof datePolls.addPoll).toBe("function");
    expect(typeof formPolls.getPolls).toBe("function");
    expect(typeof formPolls.addPoll).toBe("function");
  });
});
