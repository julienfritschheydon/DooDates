import "@testing-library/jest-dom/vitest";
import { QueryClient } from "@tanstack/react-query";
import React from "react";
export declare const createTestQueryClient: () => QueryClient;
export declare const TestWrapper: ({
  children,
}: {
  children: React.ReactNode;
}) => React.FunctionComponentElement<import("@tanstack/react-query").QueryClientProviderProps>;
