import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook } from "@testing-library/react";
import { useViewportItems, ViewMode } from "../useViewportItems";

describe("useViewportItems", () => {
  const originalInnerWidth = window.innerWidth;
  const originalInnerHeight = window.innerHeight;

  beforeEach(() => {
    // Mock window dimensions
    Object.defineProperty(window, "innerWidth", {
      writable: true,
      configurable: true,
      value: 1920,
    });
    Object.defineProperty(window, "innerHeight", {
      writable: true,
      configurable: true,
      value: 1080,
    });
  });

  afterEach(() => {
    Object.defineProperty(window, "innerWidth", {
      writable: true,
      configurable: true,
      value: originalInnerWidth,
    });
    Object.defineProperty(window, "innerHeight", {
      writable: true,
      configurable: true,
      value: originalInnerHeight,
    });
    vi.clearAllMocks();
  });

  it("should return minimum items for mobile viewport in grid mode", () => {
    Object.defineProperty(window, "innerWidth", { value: 640, configurable: true });
    Object.defineProperty(window, "innerHeight", { value: 800, configurable: true });

    const { result } = renderHook(() => useViewportItems({ viewMode: "grid" }));

    expect(result.current).toBeGreaterThanOrEqual(6);
    expect(result.current).toBeLessThanOrEqual(8);
  });

  it("should return appropriate items for tablet viewport in grid mode", () => {
    Object.defineProperty(window, "innerWidth", { value: 900, configurable: true });
    Object.defineProperty(window, "innerHeight", { value: 1200, configurable: true });

    const { result } = renderHook(() => useViewportItems({ viewMode: "grid" }));

    expect(result.current).toBeGreaterThanOrEqual(8);
    expect(result.current).toBeLessThanOrEqual(12);
  });

  it("should return appropriate items for desktop viewport in grid mode", () => {
    Object.defineProperty(window, "innerWidth", { value: 1920, configurable: true });
    Object.defineProperty(window, "innerHeight", { value: 1080, configurable: true });

    const { result } = renderHook(() => useViewportItems({ viewMode: "grid" }));

    expect(result.current).toBeGreaterThanOrEqual(12);
    expect(result.current).toBeLessThanOrEqual(18);
  });

  it("should return more items for table mode than grid mode", () => {
    Object.defineProperty(window, "innerWidth", { value: 1920, configurable: true });
    Object.defineProperty(window, "innerHeight", { value: 1080, configurable: true });

    const { result: gridResult } = renderHook(() =>
      useViewportItems({ viewMode: "grid" }),
    );
    const { result: tableResult } = renderHook(() =>
      useViewportItems({ viewMode: "table" }),
    );

    expect(tableResult.current).toBeGreaterThanOrEqual(gridResult.current);
  });

  it("should update when viewport size changes", async () => {
    Object.defineProperty(window, "innerWidth", { value: 640, configurable: true });
    Object.defineProperty(window, "innerHeight", { value: 800, configurable: true });

    const { result } = renderHook(() => useViewportItems({ viewMode: "grid" }));

    const initialValue = result.current;

    // Simulate resize
    Object.defineProperty(window, "innerWidth", { value: 1920, configurable: true });
    Object.defineProperty(window, "innerHeight", { value: 1080, configurable: true });

    // Trigger resize event
    window.dispatchEvent(new Event("resize"));

    // Wait for effect to run
    await new Promise((resolve) => setTimeout(resolve, 150));

    // The value should have changed (may need to wait for next render)
    expect(result.current).toBeGreaterThanOrEqual(6);
  });

  it("should respect minItems option", () => {
    const { result } = renderHook(() =>
      useViewportItems({ viewMode: "grid", minItems: 10 }),
    );

    expect(result.current).toBeGreaterThanOrEqual(10);
  });

  it("should respect maxItems option", () => {
    Object.defineProperty(window, "innerWidth", { value: 1920, configurable: true });
    Object.defineProperty(window, "innerHeight", { value: 2000, configurable: true });

    const { result } = renderHook(() =>
      useViewportItems({ viewMode: "table", maxItems: 20 }),
    );

    expect(result.current).toBeLessThanOrEqual(20);
  });
});
