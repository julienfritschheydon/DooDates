import React from "react";
import { ProductCreatorLayout } from "./ProductCreatorLayout";

interface DooDates1CreatorLayoutProps {
  children: React.ReactNode;
}

/**
 * Layout for DooDates1 (Date Polls) creator pages
 * Blue theme, only date poll creation options
 */
export function DooDates1CreatorLayout({ children }: DooDates1CreatorLayoutProps) {
  return <ProductCreatorLayout productType="date">{children}</ProductCreatorLayout>;
}
