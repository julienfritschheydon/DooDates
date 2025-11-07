interface AuthModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultMode?: "signin" | "signup";
}
export declare function AuthModal({
  open,
  onOpenChange,
  defaultMode,
}: AuthModalProps): import("react/jsx-runtime").JSX.Element;
export {};
