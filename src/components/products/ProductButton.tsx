import React from "react";
import { Button, type ButtonProps } from "@/components/ui/button";
import type { ProductType } from "@/config/products.config";
import { cn } from "@/lib/utils";

export interface ProductButtonProps extends ButtonProps {
  product: ProductType;
  variantRole?: "primary" | "secondary" | "ghost";
}

export const ProductButton: React.FC<ProductButtonProps> = ({
  product,
  variantRole = "primary",
  className,
  ...props
}) => {
  const roleClasses =
    variantRole === "primary"
      ? "text-base font-medium rounded-xl shadow-lg transition-all duration-300"
      : variantRole === "secondary"
        ? "text-sm text-gray-400 hover:text-white transition-colors flex items-center gap-2"
        : "text-sm text-gray-400 hover:text-white transition-colors";

  return <Button className={cn(roleClasses, className)} {...props} />;
};
