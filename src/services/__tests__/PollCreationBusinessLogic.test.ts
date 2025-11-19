import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { PollCreationBusinessLogic, type PollCreationState, type PollEditData, type TimeSlot } from "../PollCreationBusinessLogic";

// Mocks
vi.mock("../../lib/error-handling", () => ({
  logError: vi.fn(),
  ErrorFactory: {
    validation: vi.fn().mockReturnValue({
      code: "validation",
      message: "Validation error",
      userMessage: "Erreur de validation"
    }),
    storage: vi.fn().mockReturnValue({
      code: "storage",
      message: "Storage error",
      userMessage: "Erreur de stockage"
    }),
  },
}));

const { logError, ErrorFactory } = await import("../../lib/error-handling");

// Mocks pour localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};

Object.defineProperty(window, "localStorage", {
  value: localStorageMock,
  writable: true,
});

// Helpers pour créer des données de test
const createMockPollEditData = (overrides: Partial<PollEditData> = {}): PollEditData => ({
  id: "poll-123",
  title: "Test Poll",
  settings: {
    selectedDates: ["2025-12-01", "2025-12-02"],
    showTimeSlots: true,
    participantEmails: "test@example.com, user@example.com",
    timeGranularity: 30,
    expirationDays: 30,
  },
  options: [
    { option_date: "2025-12-01" },
    { option_date: "2025-12-02" },
  ],
  ...overrides,
});

const createMockState = (overrides: Partial<PollCreationState> = {}): PollCreationState => ({
  selectedDates: ["2025-12-01"],
  currentMonth: new Date(),
  calendarConnected: false,
  pollTitle: "Test Poll",
  participantEmails: "test@example.com",
  showTimeSlots: false,
  timeSlots: [],
  notificationsEnabled: false,
  userEmail: "",
  showCalendarConnect: false,
  showShare: false,
  showDescription: false,
  emailErrors: [],
  showExtendedHours: false,
  timeGranularity: 30,
  showGranularitySettings: false,
  showCalendarConnection: false,
  pollLinkCopied: false,
  expirationDays: 30,
  showExpirationSettings: false,
  showSettingsPanel: false,
  ...overrides,
});

describe("PollCreationBusinessLogic", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.getItem.mockReset();
    localStorageMock.setItem.mockReset();
    localStorageMock.removeItem.mockReset();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("getInitialState", () => {
    it("retourne l'état initial par défaut", () => {
      const state = PollCreationBusinessLogic.getInitialState();

      expect(state).toEqual({
        selectedDates: [],
        currentMonth: expect.any(Date),
        calendarConnected: false,
        pollTitle: "",
        participantEmails: "",
        showTimeSlots: false,
        timeSlots: [],
        notificationsEnabled: false,
        userEmail: "",
        showCalendarConnect: false,
        showShare: false,
        showDescription: false,
        emailErrors: [],
        showExtendedHours: false,
        timeGranularity: 30,
        showGranularitySettings: false,
        showCalendarConnection: false,
        pollLinkCopied: false,
        expirationDays: 30,
        showExpirationSettings: false,
        showSettingsPanel: false,
      });
    });
  });

  describe("loadPollData", () => {
    it("charge les données d'un sondage existant", async () => {
      const mockPollData = createMockPollEditData();
      localStorageMock.getItem.mockReturnValue(JSON.stringify([mockPollData]));

      const result = await PollCreationBusinessLogic.loadPollData("poll-123");

      expect(result).toEqual({
        ...PollCreationBusinessLogic.getInitialState(),
        pollTitle: "Test Poll",
        selectedDates: ["2025-12-01", "2025-12-02"],
        currentMonth: new Date("2025-12-01"),
        showTimeSlots: true,
        participantEmails: "test@example.com, user@example.com",
        timeGranularity: 30,
        expirationDays: 30,
      });
    });

    it("retourne null quand le sondage n'existe pas", async () => {
      localStorageMock.getItem.mockReturnValue(JSON.stringify([]));

      const result = await PollCreationBusinessLogic.loadPollData("nonexistent");

      expect(result).toBeNull();
      expect(logError).toHaveBeenCalledWith(
        expect.any(Object),
        expect.objectContaining({
          component: "PollCreationBusinessLogic",
          operation: "loadPollData",
          metadata: { editPollId: "nonexistent" },
        })
      );
    });

    it("gère les erreurs de parsing JSON", async () => {
      localStorageMock.getItem.mockReturnValue("invalid json");

      const result = await PollCreationBusinessLogic.loadPollData("poll-123");

      expect(result).toBeNull();
      expect(logError).toHaveBeenCalledWith(
        expect.any(Object),
        expect.objectContaining({
          component: "PollCreationBusinessLogic",
          operation: "loadPollData",
        })
      );
    });

    it("extrait les dates depuis les options quand settings.selectedDates est vide", async () => {
      const mockPollData = createMockPollEditData({
        settings: { ...createMockPollEditData().settings, selectedDates: undefined },
      });
      localStorageMock.getItem.mockReturnValue(JSON.stringify([mockPollData]));

      const result = await PollCreationBusinessLogic.loadPollData("poll-123");

      expect(result?.selectedDates).toEqual(["2025-12-01", "2025-12-02"]);
    });
  });

  describe("extractDatesFromPoll", () => {
    it("extrait les dates depuis settings.selectedDates", () => {
      const pollData = createMockPollEditData();

      const result = (PollCreationBusinessLogic as any).extractDatesFromPoll(pollData);

      expect(result).toEqual(["2025-12-01", "2025-12-02"]);
    });

    it("extrait les dates depuis les options quand settings.selectedDates est vide", () => {
      const pollData = createMockPollEditData({
        settings: { ...createMockPollEditData().settings, selectedDates: undefined },
      });

      const result = (PollCreationBusinessLogic as any).extractDatesFromPoll(pollData);

      expect(result).toEqual(["2025-12-01", "2025-12-02"]);
    });

    it("génère des dates par défaut quand aucune date n'est trouvée", () => {
      const pollData = createMockPollEditData({
        settings: { ...createMockPollEditData().settings, selectedDates: undefined },
        options: [],
      });

      const result = (PollCreationBusinessLogic as any).extractDatesFromPoll(pollData);

      expect(result).toHaveLength(3);
      expect(result[0]).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });
  });

  describe("generateDefaultTimeSlots", () => {
    it("génère les créneaux par défaut (9h-17h)", () => {
      const result = PollCreationBusinessLogic.generateDefaultTimeSlots();

      expect(result).toHaveLength(18); // 9 heures * 2 slots = 18

      // Vérifier les premiers slots
      expect(result[0]).toEqual({ hour: 9, minute: 0, enabled: false });
      expect(result[1]).toEqual({ hour: 9, minute: 30, enabled: false });

      // Vérifier les derniers slots
      expect(result[16]).toEqual({ hour: 17, minute: 0, enabled: false });
      expect(result[17]).toEqual({ hour: 17, minute: 30, enabled: false });
    });
  });

  describe("generateExtendedTimeSlots", () => {
    it("génère les créneaux étendus (8h-19h)", () => {
      const result = PollCreationBusinessLogic.generateExtendedTimeSlots();

      expect(result).toHaveLength(24); // 12 heures * 2 slots = 24

      // Vérifier les premiers slots
      expect(result[0]).toEqual({ hour: 8, minute: 0, enabled: false });
      expect(result[1]).toEqual({ hour: 8, minute: 30, enabled: false });

      // Vérifier les derniers slots
      expect(result[22]).toEqual({ hour: 19, minute: 0, enabled: false });
      expect(result[23]).toEqual({ hour: 19, minute: 30, enabled: false });
    });
  });

  describe("validateParticipantEmails", () => {
    it("valide une liste d'emails valides", () => {
      const result = PollCreationBusinessLogic.validateParticipantEmails(
        "test@example.com, user@example.com"
      );

      expect(result).toEqual({
        validEmails: ["test@example.com", "user@example.com"],
        errors: [],
        isValid: true,
      });
    });

    it("détecte les emails invalides", () => {
      const result = PollCreationBusinessLogic.validateParticipantEmails(
        "valid@example.com, invalid, another-valid@example.com"
      );

      expect(result).toEqual({
        validEmails: ["valid@example.com", "another-valid@example.com"],
        errors: ["Email 2 invalide: invalid"],
        isValid: false,
      });
    });

    it("retourne valide pour une chaîne vide", () => {
      const result = PollCreationBusinessLogic.validateParticipantEmails("");

      expect(result).toEqual({
        validEmails: [],
        errors: [],
        isValid: true,
      });
    });

    it("ignore les espaces et emails vides", () => {
      const result = PollCreationBusinessLogic.validateParticipantEmails(
        "  test@example.com  ,  ,  user@example.com  "
      );

      expect(result).toEqual({
        validEmails: ["test@example.com", "user@example.com"],
        errors: [],
        isValid: true,
      });
    });
  });

  describe("canFinalize", () => {
    it("retourne true quand tous les critères sont remplis", () => {
      const state = createMockState({
        pollTitle: "Valid Title",
        selectedDates: ["2025-12-01"],
        participantEmails: "test@example.com",
      });

      const result = PollCreationBusinessLogic.canFinalize(state);

      expect(result).toBe(true);
    });

    it("retourne false quand le titre est vide", () => {
      const state = createMockState({
        pollTitle: "",
        selectedDates: ["2025-12-01"],
        participantEmails: "test@example.com",
      });

      const result = PollCreationBusinessLogic.canFinalize(state);

      expect(result).toBe(false);
    });

    it("retourne false quand aucune date n'est sélectionnée", () => {
      const state = createMockState({
        pollTitle: "Valid Title",
        selectedDates: [],
        participantEmails: "test@example.com",
      });

      const result = PollCreationBusinessLogic.canFinalize(state);

      expect(result).toBe(false);
    });

    it("retourne false quand les emails sont invalides", () => {
      const state = createMockState({
        pollTitle: "Valid Title",
        selectedDates: ["2025-12-01"],
        participantEmails: "invalid-email",
      });

      const result = PollCreationBusinessLogic.canFinalize(state);

      expect(result).toBe(false);
    });
  });

  describe("saveDraft", () => {
    it("sauvegarde l'état en brouillon quand il y a du contenu", () => {
      const state = createMockState({
        pollTitle: "Draft Title",
        selectedDates: ["2025-12-01"],
      });

      PollCreationBusinessLogic.saveDraft(state);

      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        "doodates-draft",
        expect.stringContaining('"pollTitle":"Draft Title"')
      );
    });

    it("ne sauvegarde pas quand l'état est vide", () => {
      const state = createMockState({
        pollTitle: "",
        selectedDates: [],
      });

      PollCreationBusinessLogic.saveDraft(state);

      expect(localStorageMock.setItem).not.toHaveBeenCalled();
    });

    it("gère les erreurs de sauvegarde", () => {
      localStorageMock.setItem.mockImplementation(() => {
        throw new Error("Storage error");
      });

      const state = createMockState({
        pollTitle: "Test",
      });

      PollCreationBusinessLogic.saveDraft(state);

      expect(logError).toHaveBeenCalledWith(
        expect.any(Object),
        expect.objectContaining({
          component: "PollCreationBusinessLogic",
          operation: "saveDraft",
        })
      );
    });
  });

  describe("loadDraft", () => {
    it("charge un brouillon valide", () => {
      const draftData = {
        pollTitle: "Draft Title",
        selectedDates: ["2025-12-01"],
        participantEmails: "test@example.com",
        showTimeSlots: true,
        timeGranularity: 60,
        expirationDays: 7,
        savedAt: new Date().toISOString(),
      };
      localStorageMock.getItem.mockReturnValue(JSON.stringify(draftData));

      const result = PollCreationBusinessLogic.loadDraft();

      expect(result).toEqual({
        pollTitle: "Draft Title",
        selectedDates: ["2025-12-01"],
        participantEmails: "test@example.com",
        showTimeSlots: true,
        timeGranularity: 60,
        expirationDays: 7,
      });
    });

    it("retourne null quand aucun brouillon n'existe", () => {
      localStorageMock.getItem.mockReturnValue(null);

      const result = PollCreationBusinessLogic.loadDraft();

      expect(result).toBeNull();
    });

    it("supprime et retourne null pour un brouillon trop ancien", () => {
      const oldDate = new Date();
      oldDate.setDate(oldDate.getDate() - 2); // 2 jours dans le passé

      const draftData = {
        pollTitle: "Old Draft",
        savedAt: oldDate.toISOString(),
      };
      localStorageMock.getItem.mockReturnValue(JSON.stringify(draftData));

      const result = PollCreationBusinessLogic.loadDraft();

      expect(result).toBeNull();
      expect(localStorageMock.removeItem).toHaveBeenCalledWith("doodates-draft");
    });

    it("gère les erreurs de parsing", () => {
      localStorageMock.getItem.mockReturnValue("invalid json");

      const result = PollCreationBusinessLogic.loadDraft();

      expect(result).toBeNull();
      expect(logError).toHaveBeenCalledWith(
        expect.any(Object),
        expect.objectContaining({
          component: "PollCreationBusinessLogic",
          operation: "loadDraft",
        })
      );
    });
  });

  describe("cleanup", () => {
    it("supprime le brouillon du localStorage", () => {
      PollCreationBusinessLogic.cleanup();

      expect(localStorageMock.removeItem).toHaveBeenCalledWith("doodates-draft");
    });

    it("gère les erreurs lors du nettoyage", () => {
      localStorageMock.removeItem.mockImplementation(() => {
        throw new Error("Storage error");
      });

      PollCreationBusinessLogic.cleanup();

      expect(logError).toHaveBeenCalledWith(
        expect.any(Object),
        expect.objectContaining({
          component: "PollCreationBusinessLogic",
          operation: "cleanup",
        })
      );
    });
  });
});
