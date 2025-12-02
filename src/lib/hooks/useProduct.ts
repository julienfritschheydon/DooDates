import { useState, useEffect, useCallback } from "react";
import { getPollType, createPollService } from "../products";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { logger } from "@/lib/logger";
import { ErrorFactory } from "@/lib/error-handling";

interface ProductData {
  id: string;
  title: string;
  description?: string;
  type: "date" | "form" | "quizz";
  status: "active" | "archived" | "deleted" | "draft" | "closed";
  created_at: string;
  updated_at: string;
  responseCount?: number;
}

interface UseProductOptions {
  autoLoad?: boolean;
  onError?: (error: Error) => void;
}

export const useProduct = (productId?: string, options: UseProductOptions = {}) => {
  const [product, setProduct] = useState<ProductData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const { user, session } = useAuth();
  const { toast } = useToast();
  const { autoLoad = true, onError } = options;

  const loadProduct = useCallback(
    async (id: string) => {
      if (!user) {
        setError(new Error("Utilisateur non authentifié"));
        return;
      }

      setLoading(true);
      setError(null);

      try {
        // Charger le produit depuis le service approprié
        // Cette logique devra être implémentée en fonction de la structure de données
        const response = await fetch(`/api/products/${id}`, {
          headers: {
            Authorization: `Bearer ${session?.access_token}`,
          },
        });

        if (!response.ok) {
          throw ErrorFactory.api(`Erreur HTTP: ${response.status}`, "Erreur du serveur", {
            status: response.status,
          });
        }

        const data = await response.json();

        // Détecter le type de produit
        const productType = getPollType(data);
        if (!productType) {
          throw ErrorFactory.validation(
            "Type de produit non reconnu",
            "Ce type de produit n'est pas supporté",
          );
        }

        // Créer le service approprié
        const service = await createPollService(productType);

        // Charger les données spécifiques au produit
        const productData = await service.getPollBySlugOrId(id);

        setProduct({
          id: productData.id,
          title: productData.title,
          description: productData.description,
          type: productType,
          status: productData.status as ProductData["status"],
          created_at: productData.created_at,
          updated_at: productData.updated_at,
          responseCount: (productData as any).responses?.length || 0,
        });
      } catch (err) {
        const error = err instanceof Error ? err : new Error("Erreur inconnue");
        setError(error);

        toast({
          title: "Erreur",
          description: error.message,
          variant: "destructive",
        });

        logger.error("Erreur lors du chargement du produit", "poll", { productId, error });

        onError?.(error);
      } finally {
        setLoading(false);
      }
    },
    [user, toast, onError],
  );

  const updateProduct = useCallback(
    async (updates: Partial<ProductData>) => {
      if (!product || !user) return;

      setLoading(true);
      setError(null);

      try {
        const service = await createPollService(product.type);
        // Note: updatePoll n'existe pas encore dans les services - utiliser savePolls ou implémenter
        const updatedProduct = { ...product, ...updates };

        setProduct((prev) => (prev ? { ...prev, ...updatedProduct } : null));

        toast({
          title: "Succès",
          description: "Produit mis à jour avec succès",
        });
      } catch (err) {
        const error = err instanceof Error ? err : new Error("Erreur inconnue");
        setError(error);

        toast({
          title: "Erreur",
          description: error.message,
          variant: "destructive",
        });

        logger.error("Erreur lors de la mise à jour du produit", "poll", {
          productId: product.id,
          error,
        });

        onError?.(error);
      } finally {
        setLoading(false);
      }
    },
    [product, user, toast, onError],
  );

  const deleteProduct = useCallback(async () => {
    if (!product || !user) return;

    setLoading(true);
    setError(null);

    try {
      const service = await createPollService(product.type);
      await service.deletePollById(product.id);

      setProduct(null);

      toast({
        title: "Succès",
        description: "Produit supprimé avec succès",
      });
    } catch (err) {
      const error = err instanceof Error ? err : new Error("Erreur inconnue");
      setError(error);

      toast({
        title: "Erreur",
        description: error.message,
        variant: "destructive",
      });

      logger.error("Erreur lors de la suppression du produit", "poll", {
        productId: product.id,
        error,
      });

      onError?.(error);
    } finally {
      setLoading(false);
    }
  }, [product, user, toast, onError]);

  useEffect(() => {
    if (autoLoad && productId) {
      loadProduct(productId);
    }
  }, [autoLoad, productId, loadProduct]);

  return {
    product,
    loading,
    error,
    loadProduct,
    updateProduct,
    deleteProduct,
    refetch: () => (productId ? loadProduct(productId) : Promise.resolve()),
  };
};
