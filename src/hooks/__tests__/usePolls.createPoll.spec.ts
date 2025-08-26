import { describe, it, expect, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { usePolls } from "../usePolls";

// Unit tests for createPoll():
// - ensures selectedDates and timeSlotsByDate are persisted in settings (dev/localStorage path)
// - rejects creation if selectedDates is empty

describe("usePolls.createPoll", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("persists selectedDates and timeSlotsByDate into poll.settings (dev mode)", async () => {
    const { result } = renderHook(() => usePolls());

    const pollData: any = {
      title: "Réunion produit",
      description: "",
      selectedDates: ["2025-09-01", "2025-09-02"],
      timeSlotsByDate: {
        "2025-09-01": [
          { hour: 9, minute: 0, enabled: true },
          { hour: 10, minute: 0, enabled: false },
        ],
        "2025-09-02": [],
      },
      participantEmails: [],
      settings: {
        timeGranularity: 30,
        allowAnonymousVotes: true,
        allowMaybeVotes: true,
        sendNotifications: false,
        expiresAt: new Date().toISOString(),
      },
    };

    const res = await act(async () => await result.current.createPoll(pollData));

    expect(res.error).toBeUndefined();
    expect(res.poll).toBeTruthy();

    const stored = JSON.parse(localStorage.getItem("dev-polls") || "[]");
    expect(Array.isArray(stored)).toBe(true);
    expect(stored.length).toBe(1);

    const created = stored[0];
    expect(created.settings).toBeTruthy();
    expect(created.settings.selectedDates).toEqual(pollData.selectedDates);
    expect(created.settings.timeSlotsByDate).toEqual(pollData.timeSlotsByDate);
  });

  it("rejects creation when selectedDates is empty", async () => {
    const { result } = renderHook(() => usePolls());

    const res = await act(async () =>
      await result.current.createPoll({
        title: "Sans dates",
        description: "",
        selectedDates: [],
        timeSlotsByDate: {},
        participantEmails: [],
        settings: {
          timeGranularity: 30,
          allowAnonymousVotes: true,
          allowMaybeVotes: true,
          sendNotifications: false,
          expiresAt: new Date().toISOString(),
        },
      } as any),
    );

    expect(res.error).toBeTruthy();
  });
});
