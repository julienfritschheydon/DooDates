import { renderHook } from "@testing-library/react";
import { useFeatureFlags } from "@/contexts/FeatureFlagsContext";

describe("FeatureFlags Hook", () => {
  it("should provide default flags", () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <FeatureFlagsProvider>{children}</FeatureFlagsProvider>
    );

    const { result } = renderHook(() => useFeatureFlags(), { wrapper });

    expect(result.current.isEnabled("enableDatePolls")).toBe(true);
    expect(result.current.isEnabled("enableQuizz")).toBe(false);
  });
});
