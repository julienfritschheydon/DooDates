import React from "react";
import { ProductCreatorLayout } from "./ProductCreatorLayout";

interface DooDates3CreatorLayoutProps {
  children: React.ReactNode;
}

export function DooDates3CreatorLayout({ children }: DooDates3CreatorLayoutProps) {
  return <ProductCreatorLayout productType="availability">{children}</ProductCreatorLayout>;
}
