import React from "react";
import { ProductCreatorLayout } from "./ProductCreatorLayout";

interface DooDates2CreatorLayoutProps {
  children: React.ReactNode;
}

export function DooDates2CreatorLayout({ children }: DooDates2CreatorLayoutProps) {
  return <ProductCreatorLayout productType="form">{children}</ProductCreatorLayout>;
}
