# Guide UX Polish - DooDates

## 📋 Vue d'ensemble

Ce document décrit le système de design cohérent implémenté pour améliorer l'expérience utilisateur de DooDates.

**Date de création :** 1er novembre 2025  
**Durée d'implémentation :** 2h30  
**Statut :** ✅ Terminé

---

## 🎨 Composants créés

### 1. Design Tokens (`src/lib/design-tokens.ts`)

Système centralisé de tokens de design pour garantir la cohérence visuelle.

#### Espacement cohérent

```typescript
spacing = {
  xs: "1", // 4px - Espacement minimal
  sm: "2", // 8px - Éléments liés
  md: "3", // 12px - Espacement standard
  lg: "4", // 16px - Entre sections
  xl: "6", // 24px - Groupes majeurs
  "2xl": "8", // 32px - Sections principales
  "3xl": "12", // 48px - Espacement très large
};
```

#### Gaps pour flexbox/grid

```typescript
gaps = {
  xs: "gap-1", // 4px - Badges, chips
  sm: "gap-2", // 8px - Icône + texte
  md: "gap-3", // 12px - Éléments dans un groupe
  lg: "gap-4", // 16px - Sections
  xl: "gap-6", // 24px - Groupes majeurs
};
```

#### Transitions

```typescript
transitions = {
  fast: "duration-150", // Hover, focus
  normal: "duration-200", // Standard
  slow: "duration-300", // Animations complexes
  slower: "duration-500", // Modals, slides
};
```

#### Helpers utilitaires

- `getCardClasses()` - Classes pour cards (default, elevated, outlined)
- `getContainerSpacing()` - Espacement de conteneurs
- `getGroupSpacing()` - Espacement de groupes

---

### 2. Toasts améliorés (`src/components/ui/toast.tsx` + `toaster.tsx`)

#### Nouvelles variantes

- `default` - Gris (notifications générales)
- `success` - Vert (actions réussies)
- `warning` - Orange (avertissements)
- `error` - Rouge (erreurs)
- `info` - Bleu (informations)

#### Icônes automatiques

- ✅ `CheckCircle2` pour success
- ❌ `AlertCircle` pour error
- ⚠️ `AlertTriangle` pour warning
- ℹ️ `Info` pour info
- 🔔 `Bell` pour default

#### Utilisation

```typescript
import { useToast } from "@/hooks/use-toast";

const { toast } = useToast();

// Toast de succès
toast({
  variant: "success",
  title: "Succès !",
  description: "Votre vote a été enregistré",
});

// Toast d'erreur
toast({
  variant: "error",
  title: "Erreur",
  description: "Une erreur est survenue",
});
```

---

### 3. Loading Spinners (`src/components/ui/loading-spinner.tsx`)

#### Composants disponibles

**LoadingSpinner** - Spinner principal

```typescript
<LoadingSpinner
  size="md"           // sm | md | lg | xl
  text="Chargement..."
  centered={true}     // Centrer dans le conteneur
/>
```

**ButtonSpinner** - Pour les boutons

```typescript
<button disabled={isLoading}>
  {isLoading && <ButtonSpinner />}
  {isLoading ? "Envoi..." : "Envoyer"}
</button>
```

**LoadingOverlay** - Overlay plein écran

```typescript
<LoadingOverlay text="Sauvegarde en cours..." />
```

---

### 4. Messages d'erreur (`src/components/ui/error-message.tsx`)

#### ErrorMessage - Message complet

```typescript
<ErrorMessage
  variant="error"     // error | warning | info | success
  title="Erreur de validation"
  message="Veuillez vérifier les champs"
  action={<Button>Réessayer</Button>}
/>
```

#### InlineError - Erreur inline

```typescript
<InlineError message="Ce champ est requis" />
```

#### FieldError - Erreur de champ de formulaire

```typescript
<input {...props} />
<FieldError message={errors.email} />
```

---

### 5. Variants Framer Motion (`src/lib/motion-variants.ts`)

Animations réutilisables pour Framer Motion.

#### Animations de base

```typescript
import { fadeIn, slideUp, scaleIn } from "@/lib/motion-variants";

<motion.div {...fadeIn}>Contenu</motion.div>
<motion.div {...slideUp}>Contenu</motion.div>
<motion.div {...scaleIn}>Contenu</motion.div>
```

#### Animations disponibles

- **fadeIn** - Fade in simple
- **slideUp** - Slide depuis le bas
- **slideDown** - Slide depuis le haut
- **slideRight** - Slide depuis la droite
- **slideLeft** - Slide depuis la gauche
- **scaleIn** - Zoom in
- **scaleSpring** - Zoom avec effet spring
- **rotateFade** - Rotation + fade (icônes)
- **collapse** - Collapse/Expand (accordéons)
- **shake** - Shake (erreurs)
- **pulse** - Pulse (attirer l'attention)
- **bounce** - Bounce (succès)

#### Animations pour listes

```typescript
import { staggerContainer, staggerItem } from "@/lib/motion-variants";

<motion.div {...staggerContainer}>
  {items.map(item => (
    <motion.div key={item.id} {...staggerItem}>
      {item.content}
    </motion.div>
  ))}
</motion.div>
```

#### Animations pour modals

```typescript
import { backdropFade, modalContent } from "@/lib/motion-variants";

<motion.div {...backdropFade} className="backdrop">
  <motion.div {...modalContent} className="modal">
    Contenu du modal
  </motion.div>
</motion.div>
```

#### Animations pour drawers

```typescript
import { drawerRight, drawerLeft } from "@/lib/motion-variants";

<motion.div {...drawerRight}>Drawer depuis la droite</motion.div>
<motion.div {...drawerLeft}>Drawer depuis la gauche</motion.div>
```

---

## 🎯 Bonnes pratiques

### Espacement

✅ **À FAIRE**

- Utiliser les tokens de `design-tokens.ts`
- `gap-2` pour icône + texte
- `gap-4` entre sections
- `space-y-4` pour listes verticales

❌ **À ÉVITER**

- Valeurs arbitraires (`gap-[13px]`)
- Espacement incohérent
- Mélanger gap et space-y

### Feedback visuel

✅ **À FAIRE**

- Toast pour confirmations d'actions
- Loading spinner pendant les requêtes
- Messages d'erreur clairs avec icônes
- Transitions fluides (200-300ms)

❌ **À ÉVITER**

- Actions silencieuses
- Pas de feedback de chargement
- Messages d'erreur techniques
- Animations trop longues (>500ms)

### Messages d'erreur

✅ **À FAIRE**

- Utiliser `FieldError` pour les champs
- Utiliser `ErrorMessage` pour les erreurs globales
- Messages clairs et actionnables
- Icônes selon le type d'erreur

❌ **À ÉVITER**

- Messages techniques (stack traces)
- Pas d'indication visuelle
- Messages trop longs
- Pas d'action proposée

### Animations

✅ **À FAIRE**

- Utiliser les variants de `motion-variants.ts`
- Animations cohérentes (même durée, même easing)
- Stagger pour les listes
- Animations subtiles

❌ **À ÉVITER**

- Animations différentes pour même action
- Trop d'animations simultanées
- Animations trop rapides (<150ms)
- Animations distrayantes

---

## 📊 Checklist d'intégration

Pour intégrer ces améliorations dans un composant existant :

### 1. Espacement

- [ ] Remplacer les valeurs arbitraires par les tokens
- [ ] Utiliser `gaps` pour flexbox/grid
- [ ] Utiliser `padding` et `margin` cohérents

### 2. Feedback visuel

- [ ] Ajouter toasts pour les actions importantes
- [ ] Ajouter loading spinner pendant les requêtes
- [ ] Utiliser `ButtonSpinner` dans les boutons

### 3. Messages d'erreur

- [ ] Remplacer les `<p className="text-red-...">` par `<FieldError>`
- [ ] Utiliser `<ErrorMessage>` pour les erreurs globales
- [ ] Ajouter des icônes aux messages

### 4. Transitions

- [ ] Importer les variants de `motion-variants.ts`
- [ ] Appliquer `slideUp` aux éléments qui apparaissent
- [ ] Utiliser `staggerContainer` pour les listes
- [ ] Ajouter `fadeIn` aux modals

---

## 🔄 Prochaines étapes

### Court terme (1-2h)

- [ ] Appliquer aux composants de vote (VoterForm, VotingInterface)
- [ ] Appliquer aux formulaires de création (PollCreator, FormPollCreator)
- [ ] Tester sur mobile

### Moyen terme (2-3h)

- [ ] Créer un Storybook pour documenter les composants
- [ ] Ajouter des tests visuels (Chromatic)
- [ ] Audit complet de l'espacement

### Long terme (4-5h)

- [ ] Système de thèmes (light/dark)
- [ ] Animations avancées (micro-interactions)
- [ ] Accessibilité (ARIA, focus management)

---

## 📚 Ressources

- [Tailwind CSS - Spacing](https://tailwindcss.com/docs/customizing-spacing)
- [Framer Motion - Variants](https://www.framer.com/motion/animation/)
- [Radix UI - Toast](https://www.radix-ui.com/docs/primitives/components/toast)
- [Lucide Icons](https://lucide.dev/)

---

## ✅ Résumé

**Fichiers créés :**

1. `src/lib/design-tokens.ts` - Tokens de design
2. `src/lib/motion-variants.ts` - Variants Framer Motion
3. `src/components/ui/loading-spinner.tsx` - Spinners de chargement
4. `src/components/ui/error-message.tsx` - Messages d'erreur

**Fichiers modifiés :**

1. `src/components/ui/toast.tsx` - Nouvelles variantes
2. `src/components/ui/toaster.tsx` - Icônes automatiques

**Bénéfices :**

- ✅ Espacement cohérent à travers l'app
- ✅ Feedback visuel amélioré (toasts, loading, erreurs)
- ✅ Transitions fluides et cohérentes
- ✅ Messages d'erreur clairs et actionnables
- ✅ Système réutilisable et maintenable

**Temps total :** 2h30 (vs 3h estimé)
