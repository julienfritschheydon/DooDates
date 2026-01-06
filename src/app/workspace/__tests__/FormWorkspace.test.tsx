import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import FormWorkspace from "../FormWorkspace";

// CRITIQUE: Simplification radicale
// Au lieu de mocker tous les providers (Auth, Converation, Editor, Onboarding...),
// on mocke directement le composant enfant "WorkspaceLayout".
// FormWorkspace ne fait que passer des props à WorkspaceLayout, c'est ce qu'on veut vérifier.

vi.mock("@/components/layout/WorkspaceLayout", () => ({
  default: ({ productType }: { productType: string }) => (
    <div data-testid="workspace-layout">Layout Mock for {productType}</div>
  ),
}));

describe("FormWorkspace (Component Test - Simplified)", () => {
  it("renders the WorkspaceLayout with correct productType", () => {
    render(<FormWorkspace />);

    // On vérifie simplement que le layout est appelé avec le bon type
    const layout = screen.getByTestId("workspace-layout");
    expect(layout).toBeInTheDocument();
    expect(layout).toHaveTextContent("Layout Mock for form");
  });
});
