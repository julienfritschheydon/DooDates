import { X } from "lucide-react";
import * as React from "react";

interface CloseButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** Visually hidden label for screen readers */
  ariaLabel?: string;
  /** If true, positions the button absolutely at top-right */
  absoluteTopRight?: boolean;
  /** Icon size in tailwind units (default 5 => w-5 h-5) */
  iconSize?: 4 | 5 | 6;
}

export function CloseButton({
  ariaLabel = "Fermer",
  absoluteTopRight = false,
  iconSize = 5,
  className,
  ...props
}: CloseButtonProps) {
  const sizeClass = iconSize === 6 ? "w-6 h-6" : iconSize === 4 ? "w-4 h-4" : "w-5 h-5";
  const positionClass = absoluteTopRight ? "absolute right-4 top-4" : "";
  return (
    <button
      type="button"
      aria-label={ariaLabel}
      className={[
        positionClass,
        "rounded-sm p-2 opacity-70 ring-offset-background transition-opacity",
        "hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
        "disabled:pointer-events-none",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      {...props}
    >
      <X className={sizeClass} />
      <span className="sr-only">{ariaLabel}</span>
    </button>
  );
}

export default CloseButton;
