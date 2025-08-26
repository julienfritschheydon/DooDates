import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import type { Poll } from "@/lib/pollStorage";
import { PollActions } from "@/components/polls/PollActions";

// Mock useToast to avoid real UI side effects
vi.mock("@/hooks/use-toast", () => ({
  useToast: () => ({ toast: vi.fn() }),
}));

// Mock pollStorage functions used internally by PollActions (defined inside factory to avoid hoisting issues)
vi.mock("@/lib/pollStorage", async (importOriginal) => {
  const mod = await importOriginal<any>();
  return {
    ...mod,
    duplicatePoll: vi.fn(
      (p: Poll) =>
        ({
          ...p,
          id: "dup",
          slug: `${p.slug}-copy-1`,
          title: `${p.title} (Copie)`,
          created_at: new Date().toISOString(),
        }) as Poll,
    ),
    deletePollById: vi.fn(),
    copyToClipboard: vi.fn().mockResolvedValue(undefined),
    buildPublicLink: vi.fn((slug: string) => `http://localhost/poll/${slug}`),
  };
});

// After mocks are set up, import the mocked functions to assert calls
import {
  duplicatePoll,
  deletePollById,
  copyToClipboard,
  buildPublicLink,
} from "@/lib/pollStorage";

// Mock react-router navigate to avoid actual navigation
const navigateMock = vi.fn();
vi.mock("react-router-dom", async (importOriginal) => {
  const mod = await importOriginal<any>();
  return { ...mod, useNavigate: () => navigateMock };
});

const basePoll: Poll = {
  id: "p1",
  title: "Réunion",
  slug: "reunion",
  created_at: new Date(2020, 0, 1).toISOString(),
  status: "active",
};

describe("PollActions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("calls onAfterDuplicate after duplicate", async () => {
    const onAfterDuplicate = vi.fn();

    render(
      <PollActions
        poll={basePoll}
        showVoteButton={false}
        variant="compact"
        onAfterDuplicate={onAfterDuplicate}
      />,
    );

    fireEvent.click(screen.getByTestId("poll-action-duplicate"));

    expect(duplicatePoll).toHaveBeenCalledWith(basePoll);
    expect(onAfterDuplicate).toHaveBeenCalled();
  });

  it("calls onAfterDelete after delete with confirmation", async () => {
    const onAfterDelete = vi.fn();

    // Confirm dialog -> accept
    const confirmSpy = vi.spyOn(window, "confirm").mockReturnValue(true);

    render(
      <PollActions
        poll={basePoll}
        showVoteButton={false}
        variant="compact"
        onAfterDelete={onAfterDelete}
      />,
    );

    fireEvent.click(screen.getByTestId("poll-action-delete"));

    expect(confirmSpy).toHaveBeenCalled();
    expect(deletePollById).toHaveBeenCalledWith("p1");
    expect(onAfterDelete).toHaveBeenCalled();
  });

  it("navigates to edit when clicking edit if no onEdit provided", async () => {
    render(
      <PollActions poll={basePoll} showVoteButton={false} variant="compact" />,
    );

    fireEvent.click(screen.getByTestId("poll-action-edit"));

    expect(navigateMock).toHaveBeenCalledWith(`/create?edit=${basePoll.id}`);
  });

  it("uses custom onEdit when provided", async () => {
    const onEdit = vi.fn();

    render(
      <PollActions
        poll={basePoll}
        showVoteButton={false}
        variant="compact"
        onEdit={onEdit}
      />,
    );

    fireEvent.click(screen.getByTestId("poll-action-edit"));

    expect(onEdit).toHaveBeenCalledWith(basePoll.id);
    expect(navigateMock).not.toHaveBeenCalled();
  });

  it("copies the poll link on copy action", async () => {
    render(
      <PollActions poll={basePoll} showVoteButton={false} variant="compact" />,
    );

    fireEvent.click(screen.getByTestId("poll-action-copy-link"));

    expect(buildPublicLink).toHaveBeenCalledWith("reunion");
    expect(copyToClipboard).toHaveBeenCalledWith(
      "http://localhost/poll/reunion",
    );
  });
});
