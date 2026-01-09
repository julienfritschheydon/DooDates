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

    // Check for "Créer un sondage" link
    const datePollLink = screen.getByRole("link", { name: /Créer un sondage/i });
    expect(datePollLink).toBeInTheDocument();
    expect(datePollLink).toHaveAttribute("href", "/date/workspace/date");

    // Check for "Créer un formulaire" link
    const formPollLink = screen.getByRole("link", { name: /Créer un formulaire/i });
    expect(formPollLink).toBeInTheDocument();
    expect(formPollLink).toHaveAttribute("href", "/form/workspace/form");

    // Check for "Créer une disponibilité" link
    const availabilityPollLink = screen.getByRole("link", { name: /Créer une disponibilité/i });
    expect(availabilityPollLink).toBeInTheDocument();
    expect(availabilityPollLink).toHaveAttribute("href", "/availability/workspace/availability");
  });
});
