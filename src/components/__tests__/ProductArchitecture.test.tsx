import { render, screen } from "@testing-library/react";
import { ProductProvider } from "@/contexts/ProductContext";
import { FeatureFlagsProvider } from "@/contexts/FeatureFlagsContext";
import { AnalyticsProvider } from "@/contexts/AnalyticsContext";
import { ProductList } from "@/components/products/ProductList";

// Mock the components that are not yet implemented
jest.mock("@/components/shared/ProductLayout", () => ({
  ProductLayout: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="product-layout">{children}</div>
  ),
}));

jest.mock("@/components/shared/ProductCard", () => ({
  ProductCard: ({ title }: { title: string }) => (
    <div data-testid="product-card">{title}</div>
  ),
}));

describe("Product Architecture Integration", () => {
  it("should render ProductList with all providers", () => {
    render(
      <AnalyticsProvider>
        <FeatureFlagsProvider>
          <ProductProvider>
            <ProductList />
          </ProductProvider>
        </FeatureFlagsProvider>
      </AnalyticsProvider>
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
