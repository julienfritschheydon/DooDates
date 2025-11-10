# Exemples d'utilisation - Composants UX

Ce document fournit des exemples concrets d'utilisation des composants UX créés.

---

## 🎯 Toasts

### Toast de succès
```typescript
import { useToast } from "@/hooks/use-toast";

function MyComponent() {
  const { toast } = useToast();

  const handleSuccess = () => {
    toast({
      variant: "success",
      title: "Vote enregistré !",
      description: "Votre vote a été enregistré avec succès",
    });
  };

  return <button onClick={handleSuccess}>Voter</button>;
}
```

### Toast d'erreur
```typescript
const handleError = () => {
  toast({
    variant: "error",
    title: "Erreur",
    description: "Impossible d'enregistrer votre vote. Veuillez réessayer.",
  });
};
```

### Toast avec action
```typescript
const handleUndo = () => {
  toast({
    variant: "warning",
    title: "Sondage supprimé",
    description: "Le sondage a été supprimé",
    action: (
      <Button variant="outline" size="sm" onClick={restore}>
        Annuler
      </Button>
    ),
  });
};
```

---

## ⏳ Loading States

### Bouton avec loading
```typescript
function SubmitButton() {
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async () => {
    setIsLoading(true);
    try {
      await submitVote();
      toast({ variant: "success", title: "Succès !" });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button 
      onClick={handleSubmit}
      disabled={isLoading}
      className="flex items-center gap-2"
    >
      {isLoading && <ButtonSpinner />}
      {isLoading ? "Envoi..." : "Envoyer"}
    </button>
  );
}
```

### Page avec loading
```typescript
function PollPage() {
  const { data: poll, isLoading } = usePoll(pollId);

  if (isLoading) {
    return <LoadingSpinner size="lg" text="Chargement du sondage..." centered />;
  }

  return <div>{/* Contenu */}</div>;
}
```

### Overlay de chargement
```typescript
function SaveModal() {
  const [isSaving, setIsSaving] = useState(false);

  return (
    <>
      {isSaving && <LoadingOverlay text="Sauvegarde en cours..." />}
      {/* Contenu du modal */}
    </>
  );
}
```

---

## ❌ Messages d'erreur

### Erreur de champ de formulaire
```typescript
function VoterForm() {
  const [errors, setErrors] = useState<Record<string, string>>({});

  return (
    <div>
      <label>Nom *</label>
      <input
        type="text"
        className={errors.name ? "border-red-500" : "border-gray-300"}
      />
      <FieldError message={errors.name} />
    </div>
  );
}
```

### Message d'erreur global
```typescript
function PollCreator() {
  const [error, setError] = useState<string | null>(null);

  if (error) {
    return (
      <ErrorMessage
        variant="error"
        title="Impossible de créer le sondage"
        message={error}
        action={
          <Button onClick={() => setError(null)}>
            Réessayer
          </Button>
        }
      />
    );
  }

  return <div>{/* Formulaire */}</div>;
}
```

### Erreur inline
```typescript
function QuestionCard() {
  const hasError = options.length === 0;

  return (
    <div>
      <h3>Options</h3>
      {hasError && (
        <InlineError message="Ajoutez au moins une option" />
      )}
    </div>
  );
}
```

---

## 🎬 Animations

### Fade in simple
```typescript
import { motion } from "framer-motion";
import { fadeIn } from "@/lib/motion-variants";

function Card() {
  return (
    <motion.div {...fadeIn} className="card">
      Contenu
    </motion.div>
  );
}
```

### Slide up
```typescript
import { slideUp } from "@/lib/motion-variants";

function VoteOption() {
  return (
    <motion.div {...slideUp}>
      Option de vote
    </motion.div>
  );
}
```

### Liste avec stagger
```typescript
import { staggerContainer, staggerItem } from "@/lib/motion-variants";

function PollList({ polls }) {
  return (
    <motion.div {...staggerContainer}>
      {polls.map(poll => (
        <motion.div key={poll.id} {...staggerItem}>
          <PollCard poll={poll} />
        </motion.div>
      ))}
    </motion.div>
  );
}
```

### Modal avec backdrop
```typescript
import { backdropFade, modalContent } from "@/lib/motion-variants";
import { AnimatePresence } from "framer-motion";

function Modal({ isOpen, onClose }) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div 
            {...backdropFade}
            onClick={onClose}
            className="fixed inset-0 bg-black/50"
          />
          <motion.div {...modalContent} className="modal">
            Contenu du modal
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
```

### Animation shake pour erreur
```typescript
import { shake } from "@/lib/motion-variants";

function LoginForm() {
  const [hasError, setHasError] = useState(false);

  return (
    <motion.div animate={hasError ? shake.animate : {}}>
      <input type="password" />
    </motion.div>
  );
}
```

---

## 📐 Espacement cohérent

### Utiliser les gaps
```typescript
import { gaps } from "@/lib/design-tokens";

function Header() {
  return (
    <div className={`flex items-center ${gaps.sm}`}>
      <Icon />
      <span>Titre</span>
    </div>
  );
}
```

### Utiliser les padding
```typescript
import { padding } from "@/lib/design-tokens";

function Card() {
  return (
    <div className={padding.md}>
      Contenu
    </div>
  );
}
```

### Utiliser getCardClasses
```typescript
import { getCardClasses } from "@/lib/design-tokens";

function PollCard() {
  return (
    <div className={getCardClasses("elevated")}>
      Contenu
    </div>
  );
}
```

---

## 🎨 Exemple complet : Formulaire de vote

```typescript
import { useState } from "react";
import { motion } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
import { FieldError } from "@/components/ui/error-message";
import { ButtonSpinner } from "@/components/ui/loading-spinner";
import { slideUp } from "@/lib/motion-variants";
import { gaps, padding } from "@/lib/design-tokens";

function VoteForm() {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formData, setFormData] = useState({ name: "", email: "" });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    const newErrors: Record<string, string> = {};
    if (!formData.name) newErrors.name = "Le nom est requis";
    if (!formData.email) newErrors.email = "L'email est requis";
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsSubmitting(true);
    try {
      await submitVote(formData);
      toast({
        variant: "success",
        title: "Vote enregistré !",
        description: "Merci pour votre participation",
      });
    } catch (error) {
      toast({
        variant: "error",
        title: "Erreur",
        description: "Impossible d'enregistrer votre vote",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <motion.form 
      {...slideUp}
      onSubmit={handleSubmit}
      className={`space-y-${gaps.lg}`}
    >
      <div>
        <label className="block text-sm font-medium mb-2">
          Nom *
        </label>
        <input
          type="text"
          value={formData.name}
          onChange={(e) => {
            setFormData({ ...formData, name: e.target.value });
            if (errors.name) setErrors({ ...errors, name: "" });
          }}
          className={`w-full ${padding.md} border rounded-lg ${
            errors.name ? "border-red-500" : "border-gray-300"
          }`}
        />
        <FieldError message={errors.name} />
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">
          Email *
        </label>
        <input
          type="email"
          value={formData.email}
          onChange={(e) => {
            setFormData({ ...formData, email: e.target.value });
            if (errors.email) setErrors({ ...errors, email: "" });
          }}
          className={`w-full ${padding.md} border rounded-lg ${
            errors.email ? "border-red-500" : "border-gray-300"
          }`}
        />
        <FieldError message={errors.email} />
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className={`w-full ${padding.md} bg-blue-500 text-white rounded-lg 
          hover:bg-blue-600 disabled:bg-gray-400 flex items-center 
          justify-center ${gaps.sm}`}
      >
        {isSubmitting && <ButtonSpinner className="text-white" />}
        {isSubmitting ? "Envoi..." : "Envoyer mon vote"}
      </button>
    </motion.form>
  );
}
```

---

## 📱 Responsive

### Mobile-first avec breakpoints
```typescript
function Card() {
  return (
    <div className={`
      ${padding.sm}      // Mobile: padding petit
      md:${padding.md}   // Tablet: padding moyen
      lg:${padding.lg}   // Desktop: padding large
      ${gaps.sm}         // Mobile: gap petit
      md:${gaps.md}      // Tablet: gap moyen
    `}>
      Contenu
    </div>
  );
}
```

---

## ♿ Accessibilité

### Focus management
```typescript
function Modal({ isOpen }) {
  const firstInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      firstInputRef.current?.focus();
    }
  }, [isOpen]);

  return (
    <div>
      <input ref={firstInputRef} />
    </div>
  );
}
```

### ARIA labels
```typescript
function ErrorField({ error }) {
  return (
    <>
      <input
        aria-invalid={!!error}
        aria-describedby={error ? "error-message" : undefined}
      />
      {error && (
        <FieldError message={error} id="error-message" />
      )}
    </>
  );
}
```
