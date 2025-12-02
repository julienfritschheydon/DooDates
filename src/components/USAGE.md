# Guide d Utilisation - Architecture Frontend Multi-Produits

## 🚀 Démarrage Rapide

### 1. Importer les composants
```typescript
import { ProductList, DatePollCreate } from "@/components/products";
import { ProductProvider, FeatureFlagsProvider } from "@/contexts";
```

### 2. Configurer les providers
```typescript
function App() {
  return (
    <ProductProvider>
      <FeatureFlagsProvider>
        <ProductList />
      </FeatureFlagsProvider>
    </ProductProvider>
  );
}
```

### 3. Utiliser les hooks
```typescript
import { useProductContext } from "@/contexts/ProductContext";
import { useFeatureFlags } from "@/contexts/FeatureFlagsContext";

function MyComponent() {
  const { state, actions } = useProductContext();
  const { isEnabled } = useFeatureFlags();
  
  return <div>{state.products.length} produits</div>;
}
```

## 📁 Structure Complète

```
src/
├── components/
│   ├── shared/           # Composants réutilisables
│   │   ├── ProductLayout.tsx
│   │   ├── ProductCard.tsx
│   │   └── ProductForm.tsx
│   └── products/         # Composants spécifiques
│       ├── date-polls/
│       ├── form-polls/
│       └── quizz/
├── contexts/             # Contextes React
│   ├── ProductContext.tsx
│   ├── FeatureFlagsContext.tsx
│   └── AnalyticsContext.tsx
├── lib/hooks/            # Hooks personnalisés
│   ├── useProduct.ts
│   ├── useProductAPI.ts
│   └── useProductValidation.ts
└── app/                  # Routes et layout
    └── ProductApp.tsx
```

## 🔄 Workflow Développement

### Créer un nouveau composant de produit
1. Créer dans `src/components/products/[type]/`
2. Exporter dans `index.ts`
3. Ajouter les tests dans `__tests__/`
4. Documenter les props

### Ajouter une nouvelle fonctionnalité
1. Créer le hook dans `lib/hooks/`
2. Ajouter le contexte si nécessaire
3. Créer les composants partagés
4. Ajouter les tests

## 🎯 Bonnes Pratiques

- Utiliser les hooks partagés pour la logique
- Préférer les composants partagés pour l UI
- Documenter tous les exports
- Tester les composants critiques
- Utiliser les feature flags pour les nouvelles fonctionnalités
