import { describe, it, expect } from "vitest";
import { groupConsecutiveDates } from "../date-utils";

/**
 * Test unitaire simple pour le regroupement des week-ends
 *
 * Teste uniquement la fonction groupConsecutiveDates avec allowWeekendGrouping=true
 * pour vérifier que les samedis-dimanches sont correctement groupés.
 */
describe("groupConsecutiveDates - Weekend Grouping", () => {
  it("✅ CAS PRINCIPAL : devrait grouper un samedi-dimanche en week-end", () => {
    // Samedi 6 décembre 2025 + Dimanche 7 décembre 2025
    const dates = ["2025-12-06", "2025-12-07"];

    const result = groupConsecutiveDates(dates, true);

    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      dates: ["2025-12-06", "2025-12-07"],
      type: "weekend",
      label: expect.stringContaining("Week-end"),
    });
  });

  it("devrait grouper plusieurs week-ends séparés", () => {
    // Week-end 1: 6-7 décembre + Week-end 2: 13-14 décembre
    const dates = [
      "2025-12-06",
      "2025-12-07", // Samedi-Dimanche
      "2025-12-13",
      "2025-12-14", // Samedi-Dimanche
    ];

    const result = groupConsecutiveDates(dates, true);

    expect(result).toHaveLength(2);
    expect(result[0]).toMatchObject({
      dates: ["2025-12-06", "2025-12-07"],
      type: "weekend",
    });
    expect(result[1]).toMatchObject({
      dates: ["2025-12-13", "2025-12-14"],
      type: "weekend",
    });
  });

  it("devrait correctement formater le label du week-end", () => {
    // Samedi 6 + Dimanche 7 décembre 2025
    const dates = ["2025-12-06", "2025-12-07"];

    const result = groupConsecutiveDates(dates, true);

    expect(result[0].label).toMatch(/Week-end du \d+-\d+ décembre/);
  });

  it("ne devrait PAS grouper en week-end si allowWeekendGrouping=false", () => {
    // Samedi 6 décembre 2025 + Dimanche 7 décembre 2025
    const dates = ["2025-12-06", "2025-12-07"];

    const result = groupConsecutiveDates(dates, false);

    // Sans allowWeekendGrouping, ne devrait PAS être de type "weekend"
    expect(result[0].type).not.toBe("weekend");
  });

  it("devrait gérer un tableau vide", () => {
    const dates: string[] = [];

    const result = groupConsecutiveDates(dates, true);

    expect(result).toEqual([]);
  });
});
