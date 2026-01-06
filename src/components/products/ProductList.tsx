/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState } from "react";
import { ProductLayout, ProductCard } from "../shared";
import { useProductContext } from "@/contexts/ProductContext";
import { logError } from "@/lib/error-handling";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Search, Filter, Star } from "lucide-react";
import { useNavigate } from "react-router-dom";

export const ProductList: React.FC = () => {
  const navigate = useNavigate();
  const { state, actions } = useProductContext();
  const [showFilters, setShowFilters] = useState(false);

  const handleCreateProduct = () => {
    navigate("/products/create");
  };

  const handleEditProduct = (productId: string) => {
    navigate(`/products/${productId}/edit`);
  };

  const handleViewProduct = (productId: string) => {
    navigate(`/products/${productId}`);
  };

  const handleDeleteProduct = async (productId: string) => {
    if (window.confirm("Êtes-vous sûr de vouloir supprimer ce produit ?")) {
      try {
        await actions.deleteProduct(productId);
      } catch (error) {
        logError(error instanceof Error ? error : new Error(String(error)), {
          component: "ProductList",
          operation: "deleteProduct",
          pollId: productId,
        } as const);
      }
    }
  };

  const filteredProducts = state.products.filter((product) => {
    if (
      state.filters.search &&
      !product.title.toLowerCase().includes(state.filters.search.toLowerCase())
    ) {
      return false;
    }
    if (state.filters.type && product.type !== state.filters.type) {
      return false;
    }
    if (state.filters.status && product.status !== state.filters.status) {
      return false;
    }
    if (state.filters.status && product.status !== state.filters.status) {
      return false;
    }
    if (state.filters.favorites && !product.is_favorite) {
      return false;
    }
    return true;
  });

  return (
    <ProductLayout title="Mes Produits" subtitle="Gérez tous vos sondages, formulaires et quiz">
      {/* Actions et Filtres */}
      <div className="mb-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Rechercher un produit..."
                value={state.filters.search || ""}
                onChange={(e) => actions.setFilters({ search: e.target.value })}
                className="pl-10 w-64"
              />
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
              data-testid="productlist-button"
            >
              <Filter className="h-4 w-4 mr-2" />
              Filtres
            </Button>

            <Button
              variant={state.filters.favorites ? "secondary" : "outline"}
              size="sm"
              onClick={() => actions.setFilters({ favorites: !state.filters.favorites })}
              className={
                state.filters.favorites
                  ? "bg-yellow-100 hover:bg-yellow-200 text-yellow-800 border-yellow-200"
                  : ""
              }
              data-testid="productlist-button"
            >
              <Star className={`h-4 w-4 mr-2 ${state.filters.favorites ? "fill-current" : ""}`} />
              Favoris
            </Button>
          </div>

          <Button onClick={handleCreateProduct} data-testid="productlist-button">
            <Plus className="h-4 w-4 mr-2" />
            Créer un produit
          </Button>
        </div>

        {/* Filtres étendus */}
        {showFilters && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Filtres</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Type de produit
                  </label>
                  <Select
                    value={state.filters.type || ""}
                    onValueChange={(value) =>
                      actions.setFilters({ type: (value as any) || undefined })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Tous les types" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Tous les types</SelectItem>
                      <SelectItem value="date">Sondage de dates</SelectItem>
                      <SelectItem value="form">Formulaire</SelectItem>
                      <SelectItem value="quizz">Quiz</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Statut</label>
                  <Select
                    value={state.filters.status || ""}
                    onValueChange={(value) =>
                      actions.setFilters({ status: (value as any) || undefined })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Tous les statuts" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Tous les statuts</SelectItem>
                      <SelectItem value="active">Actif</SelectItem>
                      <SelectItem value="archived">Archivé</SelectItem>
                      <SelectItem value="deleted">Supprimé</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Liste des produits */}
      {state.loading ? (
        <div className="text-center py-8">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="mt-2 text-gray-600">Chargement des produits...</p>
        </div>
      ) : state.error ? (
        <Card>
          <CardContent className="py-8">
            <div className="text-center text-red-600">
              <p>Erreur lors du chargement des produits</p>
              <Button
                variant="outline"
                className="mt-2"
                onClick={actions.refreshProducts}
                data-testid="productlist-button"
              >
                Réessayer
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : filteredProducts.length === 0 ? (
        <Card>
          <CardContent className="py-8">
            <div className="text-center text-gray-600">
              <p className="text-lg font-medium mb-2">
                {state.filters.search || state.filters.type || state.filters.status
                  ? "Aucun produit trouvé"
                  : "Aucun produit créé"}
              </p>
              <p className="mb-4">
                {state.filters.search || state.filters.type || state.filters.status
                  ? "Essayez de modifier vos filtres"
                  : "Créez votre premier produit pour commencer"}
              </p>
              {!state.filters.search && !state.filters.type && !state.filters.status && (
                <Button onClick={handleCreateProduct} data-testid="productlist-button">
                  <Plus className="h-4 w-4 mr-2" />
                  Créer un produit
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProducts.map((product) => (
            <ProductCard
              key={product.id}
              id={product.id}
              title={product.title}
              description={product.description}
              type={product.type}
              status={product.status}
              createdAt={product.created_at}
              updatedAt={product.updated_at}
              responseCount={product.responseCount}
              isFavorite={product.is_favorite}
              onView={() => handleViewProduct(product.id)}
              onEdit={() => handleEditProduct(product.id)}
              onDelete={() => handleDeleteProduct(product.id)}
              onToggleFavorite={() => actions.toggleFavorite(product.id, !product.is_favorite)}
            />
          ))}
        </div>
      )}

      {/* Pagination */}
      {filteredProducts.length > 0 && state.pagination.total > state.pagination.limit && (
        <div className="mt-8 flex items-center justify-between">
          <p className="text-sm text-gray-600">
            Affichage de {(state.pagination.page - 1) * state.pagination.limit + 1} à{" "}
            {Math.min(state.pagination.page * state.pagination.limit, filteredProducts.length)} sur{" "}
            {state.pagination.total} produits
          </p>

          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              disabled={state.pagination.page === 1}
              onClick={() => actions.setPagination({ page: state.pagination.page - 1 })}
              data-testid="productlist-prcdent"
            >
              Précédent
            </Button>

            <span className="px-3 py-1 text-sm">Page {state.pagination.page}</span>

            <Button
              variant="outline"
              size="sm"
              disabled={state.pagination.page * state.pagination.limit >= state.pagination.total}
              onClick={() => actions.setPagination({ page: state.pagination.page + 1 })}
              data-testid="productlist-suivant"
            >
              Suivant
            </Button>
          </div>
        </div>
      )}
    </ProductLayout>
  );
};
