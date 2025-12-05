import React, { createContext, useContext, useReducer, useEffect, ReactNode } from "react";
import { useAuth } from "./AuthContext";
import { useProductAPI } from "@/lib/hooks/useProductAPI";
import { logger } from "@/lib/logger";
import { ErrorFactory, logError } from "@/lib/error-handling";

interface Product {
  id: string;
  title: string;
  description?: string;
  type: "date" | "form" | "quizz";
  status: "active" | "archived" | "deleted";
  created_at: string;
  updated_at: string;
  responseCount?: number;
  is_favorite?: boolean;
}

interface ProductState {
  products: Product[];
  loading: boolean;
  error: Error | null;
  selectedProduct: Product | null;
  filters: {
    type?: "date" | "form" | "quizz";
    status?: "active" | "archived" | "deleted";
    search?: string;
    favorites?: boolean;
  };
  pagination: {
    page: number;
    limit: number;
    total: number;
  };
}

type ProductAction =
  | { type: "SET_LOADING"; payload: boolean }
  | { type: "SET_ERROR"; payload: Error | null }
  | { type: "SET_PRODUCTS"; payload: Product[] }
  | { type: "ADD_PRODUCT"; payload: Product }
  | { type: "UPDATE_PRODUCT"; payload: { id: string; updates: Partial<Product> } }
  | { type: "DELETE_PRODUCT"; payload: string }
  | { type: "SET_SELECTED_PRODUCT"; payload: Product | null }
  | { type: "SET_FILTERS"; payload: Partial<ProductState["filters"]> }
  | { type: "SET_PAGINATION"; payload: Partial<ProductState["pagination"]> }
  | { type: "TOGGLE_FAVORITE"; payload: { id: string; is_favorite: boolean } }
  | { type: "RESET_STATE" };

const initialState: ProductState = {
  products: [],
  loading: false,
  error: null,
  selectedProduct: null,
  filters: {},
  pagination: {
    page: 1,
    limit: 20,
    total: 0,
  },
};

function productReducer(state: ProductState, action: ProductAction): ProductState {
  switch (action.type) {
    case "SET_LOADING":
      return { ...state, loading: action.payload };

    case "SET_ERROR":
      return { ...state, error: action.payload, loading: false };

    case "SET_PRODUCTS":
      return { ...state, products: action.payload, loading: false };

    case "ADD_PRODUCT":
      return {
        ...state,
        products: [action.payload, ...state.products],
        loading: false,
      };

    case "UPDATE_PRODUCT":
      return {
        ...state,
        products: state.products.map((product) =>
          product.id === action.payload.id ? { ...product, ...action.payload.updates } : product,
        ),
        selectedProduct:
          state.selectedProduct?.id === action.payload.id
            ? { ...state.selectedProduct, ...action.payload.updates }
            : state.selectedProduct,
        loading: false,
      };

    case "DELETE_PRODUCT":
      return {
        ...state,
        products: state.products.filter((product) => product.id !== action.payload),
        selectedProduct:
          state.selectedProduct?.id === action.payload ? null : state.selectedProduct,
        loading: false,
      };

    case "SET_SELECTED_PRODUCT":
      return { ...state, selectedProduct: action.payload };

    case "SET_FILTERS":
      return { ...state, filters: { ...state.filters, ...action.payload } };

    case "SET_PAGINATION":
      return { ...state, pagination: { ...state.pagination, ...action.payload } };

    case "TOGGLE_FAVORITE":
      return {
        ...state,
        products: state.products.map((product) =>
          product.id === action.payload.id
            ? { ...product, is_favorite: action.payload.is_favorite }
            : product,
        ),
        selectedProduct:
          state.selectedProduct?.id === action.payload.id
            ? { ...state.selectedProduct, is_favorite: action.payload.is_favorite }
            : state.selectedProduct,
      };

    case "RESET_STATE":
      return initialState;

    default:
      return state;
  }
}

interface ProductContextType {
  state: ProductState;
  actions: {
    loadProducts: () => Promise<void>;
    createProduct: (data: Omit<Product, "id" | "created_at" | "updated_at">) => Promise<Product>;
    updateProduct: (id: string, updates: Partial<Product>) => Promise<void>;
    deleteProduct: (id: string) => Promise<void>;
    selectProduct: (product: Product | null) => void;
    setFilters: (filters: Partial<ProductState["filters"]>) => void;
    setPagination: (pagination: Partial<ProductState["pagination"]>) => void;
    refreshProducts: () => Promise<void>;
    toggleFavorite: (id: string, isFavorite: boolean) => Promise<void>;
  };
}

const ProductContext = createContext<ProductContextType | undefined>(undefined);

interface ProductProviderProps {
  children: ReactNode;
}

export const ProductProvider: React.FC<ProductProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(productReducer, initialState);
  const { user } = useAuth();
  const api = useProductAPI();

  const loadProducts = async () => {
    if (!user) return;

    dispatch({ type: "SET_LOADING", payload: true });
    dispatch({ type: "SET_ERROR", payload: null });

    try {
      const params = new URLSearchParams();

      if (state.filters.type) params.append("type", state.filters.type);
      if (state.filters.status) params.append("status", state.filters.status);
      if (state.filters.search) params.append("search", state.filters.search);
      if (state.filters.favorites) params.append("is_favorite", "true");

      params.append("page", state.pagination.page.toString());
      params.append("limit", state.pagination.limit.toString());

      const response = await api.get<{
        products: Product[];
        total: number;
      }>(`/products?${params}`);

      dispatch({ type: "SET_PRODUCTS", payload: response.products });
      dispatch({ type: "SET_PAGINATION", payload: { total: response.total } });
    } catch (error) {
      dispatch({
        type: "SET_ERROR",
        payload: error instanceof Error ? error : new Error("Erreur inconnue"),
      });
      logError(error instanceof Error ? error : new Error(String(error)), {
        component: "ProductContext",
        operation: "loadProducts",
      });
    }
  };

  const createProduct = async (data: Omit<Product, "id" | "created_at" | "updated_at">) => {
    if (!user)
      throw ErrorFactory.auth(
        "Utilisateur non authentifié",
        "Vous devez être connecté pour créer un produit",
      );

    try {
      const product = await api.post<Product>("/products", data);
      dispatch({ type: "ADD_PRODUCT", payload: product });
      return product;
    } catch (error) {
      dispatch({
        type: "SET_ERROR",
        payload: error instanceof Error ? error : new Error("Erreur inconnue"),
      });
      logError(error instanceof Error ? error : new Error(String(error)), {
        component: "ProductContext",
        operation: "createProduct",
      });
      throw error;
    }
  };

  const updateProduct = async (id: string, updates: Partial<Product>) => {
    if (!user) return;

    try {
      await api.patch(`/products/${id}`, updates);
      dispatch({ type: "UPDATE_PRODUCT", payload: { id, updates } });
    } catch (error) {
      dispatch({
        type: "SET_ERROR",
        payload: error instanceof Error ? error : new Error("Erreur inconnue"),
      });
      logError(error instanceof Error ? error : new Error(String(error)), {
        component: "ProductContext",
        operation: "updateProduct",
      });
      throw error;
    }
  };

  const deleteProduct = async (id: string) => {
    if (!user) return;

    try {
      await api.delete(`/products/${id}`);
      dispatch({ type: "DELETE_PRODUCT", payload: id });
    } catch (error) {
      dispatch({
        type: "SET_ERROR",
        payload: error instanceof Error ? error : new Error("Erreur inconnue"),
      });
      logError(error instanceof Error ? error : new Error(String(error)), {
        component: "ProductContext",
        operation: "deleteProduct",
      });
      throw error;
    }
  };

  const selectProduct = (product: Product | null) => {
    dispatch({ type: "SET_SELECTED_PRODUCT", payload: product });
  };

  const setFilters = (filters: Partial<ProductState["filters"]>) => {
    dispatch({ type: "SET_FILTERS", payload: filters });
    dispatch({ type: "SET_PAGINATION", payload: { page: 1 } }); // Reset to first page
  };

  const setPagination = (pagination: Partial<ProductState["pagination"]>) => {
    dispatch({ type: "SET_PAGINATION", payload: pagination });
  };

  const refreshProducts = async () => {
    await loadProducts();
  };

  const toggleFavorite = async (id: string, isFavorite: boolean) => {
    if (!user) return;

    // Optimistic update
    dispatch({ type: "TOGGLE_FAVORITE", payload: { id, is_favorite: isFavorite } });

    try {
      // Using direct Supabase update via API wrapper if possible, or fallback to patch
      // Since we don't have a specific endpoint for toggle, we use patch
      await api.patch(`/products/${id}`, { is_favorite: isFavorite });
    } catch (error) {
      // Revert on error
      dispatch({ type: "TOGGLE_FAVORITE", payload: { id, is_favorite: !isFavorite } });

      dispatch({
        type: "SET_ERROR",
        payload: error instanceof Error ? error : new Error("Erreur inconnue"),
      });
      logError(error instanceof Error ? error : new Error(String(error)), {
        component: "ProductContext",
        operation: "toggleFavorite",
      });
    }
  };

  // Charger les produits au montage et quand les filtres changent
  useEffect(() => {
    if (user) {
      loadProducts();
    }
  }, [user, state.filters, state.pagination.page, state.pagination.limit]);

  const value: ProductContextType = {
    state,
    actions: {
      loadProducts,
      createProduct,
      updateProduct,
      deleteProduct,
      selectProduct,
      setFilters,
      setPagination,
      refreshProducts,
      toggleFavorite,
    },
  };

  return <ProductContext.Provider value={value}>{children}</ProductContext.Provider>;
};

export const useProductContext = (): ProductContextType => {
  const context = useContext(ProductContext);
  if (context === undefined) {
    throw ErrorFactory.validation(
      "useProductContext must be used within a ProductProvider",
      "Erreur de configuration du contexte",
    );
  }
  return context;
};
