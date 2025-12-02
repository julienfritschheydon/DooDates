import React from "react";
import { ProductForm } from "@/components/shared/ProductForm";
import { useNavigate } from "react-router-dom";
import { useProductContext } from "@/contexts/ProductContext";
import { useToast } from "@/hooks/use-toast";

interface DatePollCreateProps {
  id?: string;
}

export const DatePollCreate: React.FC<DatePollCreateProps> = ({ id }) => {
  const navigate = useNavigate();
  const { actions } = useProductContext();
  const { toast } = useToast();

  const handleSubmit = async (data: any) => {
    try {
      if (id) {
        await actions.updateProduct(id, data);
        toast({ title: "Sondage mis à jour" });
      } else {
        await actions.createProduct({ ...data, type: "date" });
        toast({ title: "Sondage créé" });
      }
      navigate("/products/date");
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de créer le sondage",
        variant: "destructive",
      });
    }
  };

  return (
    <ProductForm
      initialData={{ type: "date" }}
      onSubmit={handleSubmit}
      onCancel={() => navigate("/products/date")}
      submitText={id ? "Mettre à jour" : "Créer le sondage"}
    />
  );
};
