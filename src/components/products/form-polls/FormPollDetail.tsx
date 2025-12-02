import React from "react";
import { ProductLayout } from "@/components/shared/ProductLayout";
import { useProduct } from "@/lib/hooks/useProduct";

interface FormPollDetailProps {
  id?: string;
}

export const FormPollDetail: React.FC<FormPollDetailProps> = ({ id }) => {
  const { product, loading, error } = useProduct(id);

  if (loading) {
    return (
      <ProductLayout title="Chargement...">
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </ProductLayout>
    );
  }

  if (error || !product) {
    return (
      <ProductLayout title="Erreur">
        <div className="text-center py-8">
          <h2 className="text-2xl font-semibold text-red-600 mb-4">
            Formulaire non trouvé
          </h2>
        </div>
      </ProductLayout>
    );
  }

  return (
    <ProductLayout title={product.title}>
      <div className="space-y-6">
        <p>Détails du formulaire...</p>
      </div>
    </ProductLayout>
  );
};
