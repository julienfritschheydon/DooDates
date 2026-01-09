import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { BrowserRouter } from "react-router-dom";
import LandingPage from "../LandingPage";

describe("LandingPage (Component Test)", () => {
  it("displays the main navigation links correctly", () => {
    render(
      <BrowserRouter>
        <LandingPage />
      </BrowserRouter>,
    );

    // Check for "Créer un sondage" link (use getAllByRole since there are multiple)
    const datePollLinks = screen.getAllByRole("link", { name: /Créer un sondage/i });
    const datePollLink = datePollLinks.find(
      (link) => link.getAttribute("href") === "/date/workspace/date",
    );
    expect(datePollLink).toBeInTheDocument();
    expect(datePollLink).toHaveAttribute("href", "/date/workspace/date");

    // Check for "Créer un formulaire" link
    const formPollLinks = screen.getAllByRole("link", { name: /Créer un formulaire/i });
    const formPollLink = formPollLinks.find(
      (link) => link.getAttribute("href") === "/form/workspace/form",
    );
    expect(formPollLink).toBeInTheDocument();
    expect(formPollLink).toHaveAttribute("href", "/form/workspace/form");

    // Check for "Créer une disponibilité" link
    const availabilityPollLinks = screen.getAllByRole("link", { name: /Créer une disponibilité/i });
    const availabilityPollLink = availabilityPollLinks.find(
      (link) => link.getAttribute("href") === "/availability/workspace/availability",
    );
    expect(availabilityPollLink).toBeInTheDocument();
    expect(availabilityPollLink).toHaveAttribute("href", "/availability/workspace/availability");
  });
});
