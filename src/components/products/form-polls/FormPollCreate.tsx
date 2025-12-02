import React from "react";
import { ProductForm } from "@/components/shared/ProductForm";
import { useNavigate } from "react-router-dom";
import { useProductContext } from "@/contexts/ProductContext";
import { useToast } from "@/hooks/use-toast";

interface FormPollCreateProps {
  id?: string;
}

export const FormPollCreate: React.FC<FormPollCreateProps> = ({ id }) => {
  const navigate = useNavigate();
  const { actions } = useProductContext();
  const { toast } = useToast();

  const handleSubmit = async (data: any) => {
    try {
      if (id) {
        await actions.updateProduct(id, data);
        toast({ title: "Formulaire mis à jour" });
      } else {
        await actions.createProduct({ ...data, type: "form" });
        toast({ title: "Formulaire créé" });
      }
      navigate("/products/form");
    } catch (error) {
      toast({ 
        title: "Erreur", 
        description: "Impossible de créer le formulaire",
        variant: "destructive" 
      });
    }
  };

  return (
    <ProductForm
      initialData={{ type: "form" }}
      onSubmit={handleSubmit}
      onCancel={() => navigate("/products/form")}
      submitText={id ? "Mettre à jour" : "Créer le formulaire"}
    />
  );
};
