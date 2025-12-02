import React from "react";
import { ProductForm } from "@/components/shared/ProductForm";
import { useNavigate } from "react-router-dom";
import { useProductContext } from "@/contexts/ProductContext";
import { useToast } from "@/hooks/use-toast";

interface QuizzCreateProps {
  id?: string;
}

export const QuizzCreate: React.FC<QuizzCreateProps> = ({ id }) => {
  const navigate = useNavigate();
  const { actions } = useProductContext();
  const { toast } = useToast();

  const handleSubmit = async (data: any) => {
    try {
      if (id) {
        await actions.updateProduct(id, data);
        toast({ title: "Quiz mis à jour" });
      } else {
        await actions.createProduct({ ...data, type: "quizz" });
        toast({ title: "Quiz créé" });
      }
      navigate("/products/quizz");
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de créer le quiz",
        variant: "destructive",
      });
    }
  };

  return (
    <ProductForm
      initialData={{ type: "quizz" }}
      onSubmit={handleSubmit}
      onCancel={() => navigate("/products/quizz")}
      submitText={id ? "Mettre à jour" : "Créer le quiz"}
    />
  );
};
