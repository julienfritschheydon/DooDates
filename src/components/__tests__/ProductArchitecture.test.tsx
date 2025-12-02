import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import React from "react";
import { ProductProvider } from "@/contexts/ProductContext";
import { FeatureFlagsProvider } from "@/contexts/FeatureFlagsContext";
import { AnalyticsProvider } from "@/contexts/AnalyticsContext";
import { ProductList } from "@/components/products/ProductList";

// Mock the components that are not yet implemented
vi.mock("@/components/shared/ProductLayout", () => ({
  ProductLayout: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="product-layout">{children}</div>
  ),
}));

vi.mock("@/components/shared/ProductCard", () => ({
  ProductCard: ({ title }: { title: string }) => <div data-testid="product-card">{title}</div>,
}));

// Ces tests nécessitent AuthProvider qui a des dépendances complexes (Supabase)
// Ils sont skippés en CI et doivent être exécutés manuellement avec un environnement complet
describe.skip("Product Architecture Integration", () => {
  it("should render ProductList with all providers", () => {
    render(
      <AnalyticsProvider>
        <FeatureFlagsProvider>
          <ProductProvider>
            <ProductList />
          </ProductProvider>
        </FeatureFlagsProvider>
      </AnalyticsProvider>,
    );

    expect(screen.getByTestId("product-layout")).toBeInTheDocument();
  });

  it("should have proper context providers hierarchy", () => {
    const TestComponent = () => {
      return (
        <AnalyticsProvider>
          <FeatureFlagsProvider>
            <ProductProvider>
              <div data-testid="test-component">Test</div>
            </ProductProvider>
          </FeatureFlagsProvider>
        </AnalyticsProvider>
      );
    };

    render(<TestComponent />);
    expect(screen.getByTestId("test-component")).toBeInTheDocument();
  });
});
